-- Create function to handle invitation acceptance and conversation creation
CREATE OR REPLACE FUNCTION public.create_conversation_from_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  conversation_id uuid;
BEGIN
  -- Only create conversation when invitation is sent (status = 'pending')
  IF TG_OP = 'INSERT' THEN
    -- Create a new conversation
    INSERT INTO public.conversations (
      client_id,
      freelancer_id,
      invitation_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.client_id,
      NEW.freelancer_id,
      NEW.id,
      now(),
      now()
    ) RETURNING id INTO conversation_id;
    
    -- Create initial message if invitation has a message
    IF NEW.message IS NOT NULL AND NEW.message != '' THEN
      INSERT INTO public.messages (
        conversation_id,
        sender_id,
        content,
        created_at,
        updated_at
      ) VALUES (
        conversation_id,
        NEW.client_id,
        NEW.message,
        now(),
        now()
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger to automatically create conversations from invitations
CREATE TRIGGER create_conversation_from_invitation_trigger
AFTER INSERT ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.create_conversation_from_invitation();

-- Update conversations table to track last message timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the last_message_at timestamp in conversations
  UPDATE public.conversations 
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to update conversation timestamp when messages are added
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();