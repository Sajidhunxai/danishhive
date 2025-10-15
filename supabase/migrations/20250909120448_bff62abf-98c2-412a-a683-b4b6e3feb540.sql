-- Make lucca@look-a.dk an admin and client
UPDATE profiles 
SET role = 'admin', is_admin = true 
WHERE user_id = 'bd6eac57-c2d1-475a-9851-c15c664974bd';