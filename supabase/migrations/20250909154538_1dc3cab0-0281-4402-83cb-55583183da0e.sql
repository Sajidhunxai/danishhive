-- Clean up duplicate phone number 91940042
-- Remove phone number from the "Danish Hive" test account and keep it with the admin user
UPDATE profiles 
SET phone = NULL, phone_verified = false 
WHERE user_id = 'a269a163-1959-4aed-b1da-e8db05f0bab4' 
AND full_name = 'Danish Hive';