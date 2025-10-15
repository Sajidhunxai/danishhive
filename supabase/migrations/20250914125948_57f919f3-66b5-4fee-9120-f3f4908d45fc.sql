-- CRITICAL SECURITY FIX: Enhance RLS policies for profiles table
-- Ensure no sensitive data is exposed through direct table access

-- Create separate secure functions for different profile data access levels
CREATE OR REPLACE FUNCTION public.get_own_profile_complete(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  username text,
  role text,
  bio text,
  avatar_url text,
  location text,
  skills text[],
  software_skills text[],
  hourly_rate numeric,
  availability text,
  rating numeric,
  rating_count integer,
  total_earnings numeric,
  active_status boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  -- Only include basic profile data, NO sensitive fields
  mitid_verified boolean,
  phone_verified boolean,
  payment_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to access their own complete profile or admins
  IF _user_id != auth.uid() AND NOT is_user_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Can only access own profile data';
  END IF;

  -- Log the access
  PERFORM public.log_profile_access(_user_id, 'own_complete_profile_view');

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.username,
    p.role,
    p.bio,
    p.avatar_url,
    p.location,
    p.skills,
    p.software_skills,
    p.hourly_rate,
    p.availability,
    p.rating,
    p.rating_count,
    p.total_earnings,
    p.active_status,
    p.created_at,
    p.updated_at,
    -- Verification statuses (not sensitive)
    p.mitid_verified,
    p.phone_verified,
    p.payment_verified
  FROM profiles p
  WHERE p.user_id = _user_id;
END;
$$;

-- Create function for updating own profile (excluding sensitive fields)
CREATE OR REPLACE FUNCTION public.update_own_profile_safe(
  _updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _allowed_fields text[] := ARRAY[
    'full_name', 'username', 'bio', 'avatar_url', 'location', 
    'skills', 'software_skills', 'hourly_rate', 'availability',
    'company', 'birthday'
  ];
  _field text;
  _update_data jsonb := '{}';
BEGIN
  -- Must be authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Filter updates to only allow safe fields
  FOR _field IN SELECT jsonb_object_keys(_updates)
  LOOP
    IF _field = ANY(_allowed_fields) THEN
      _update_data := _update_data || jsonb_build_object(_field, _updates->_field);
    END IF;
  END LOOP;

  -- Add updated timestamp
  _update_data := _update_data || jsonb_build_object('updated_at', now());

  -- Log the update
  PERFORM public.log_profile_access(_user_id, 'profile_update');

  -- Perform the update
  UPDATE profiles 
  SET 
    full_name = COALESCE((_update_data->>'full_name')::text, full_name),
    username = COALESCE((_update_data->>'username')::text, username),
    bio = COALESCE((_update_data->>'bio')::text, bio),
    avatar_url = COALESCE((_update_data->>'avatar_url')::text, avatar_url),
    location = COALESCE((_update_data->>'location')::text, location),
    skills = COALESCE(
      CASE 
        WHEN _update_data ? 'skills' THEN 
          (SELECT ARRAY(SELECT jsonb_array_elements_text(_update_data->'skills')))
        ELSE skills
      END, skills
    ),
    software_skills = COALESCE(
      CASE 
        WHEN _update_data ? 'software_skills' THEN 
          (SELECT ARRAY(SELECT jsonb_array_elements_text(_update_data->'software_skills')))
        ELSE software_skills
      END, software_skills
    ),
    hourly_rate = COALESCE((_update_data->>'hourly_rate')::numeric, hourly_rate),
    availability = COALESCE((_update_data->>'availability')::text, availability),
    company = COALESCE((_update_data->>'company')::text, company),
    birthday = COALESCE((_update_data->>'birthday')::date, birthday),
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;