-- Create mosques table if it doesn't exist
CREATE TABLE IF NOT EXISTS mosques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  founder_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create members table with correct fields
DROP TABLE IF EXISTS members;
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  password VARCHAR(255) NOT NULL DEFAULT '$2b$10$3euPcmQFCiblsZeEu5s7p.9wvwWq.xRuDcT4m2KitWYyXjbO3J5HK',
  mosque_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mosque_id) REFERENCES mosques(id)
);

-- Insert default mosque if none exists
INSERT INTO mosques (name, address)
SELECT 'Default Mosque', '123 Main St'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM mosques LIMIT 1);

-- Add test user to test the process
INSERT INTO members (first_name, last_name, username, email, phone, address, status, mosque_id)
VALUES ('Test', 'User', 'testuser', 'test@example.com', '1234567890', '123 Test St', 'active', 1)
ON DUPLICATE KEY UPDATE email=email;
