-- Select the database
USE prayer_tracker;

-- Update users with correct password hash
UPDATE users 
SET password_hash = '$2b$10$JPITMsMQG.2GCklpHtGpmuzQUCNwe03AyJ0y3rEMXmz5pbgq/A6sG' 
WHERE username IN ('admin', 'founder', 'member');

-- Verify the update
SELECT id, username, LEFT(password_hash, 20) as hash_preview, role_id 
FROM users 
WHERE username IN ('admin', 'founder', 'member');