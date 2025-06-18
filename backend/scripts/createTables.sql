-- Drop existing tables if they exist (for fresh setup)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS pickup_requests;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS prayers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS mosques;
DROP TABLE IF EXISTS prayer_times;
SET FOREIGN_KEY_CHECKS = 1;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('Member', 'Founder', 'SuperAdmin') DEFAULT 'Member',
    mosque_id INT,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    joined_date DATE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create mosques table
CREATE TABLE IF NOT EXISTS mosques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    founder_id INT,
    prayer_times JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add prayer_times table for daily prayer schedules
CREATE TABLE IF NOT EXISTS prayer_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_id INT NOT NULL,
    prayer_date DATE NOT NULL,
    fajr_time TIME,
    dhuhr_time TIME,
    asr_time TIME,
    maghrib_time TIME,
    isha_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_mosque_date (mosque_id, prayer_date),
    INDEX idx_mosque_date (mosque_id, prayer_date),
    FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE
);

-- Create prayers table
CREATE TABLE IF NOT EXISTS prayers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mosque_id INT,
    prayer_type ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha') NOT NULL,
    prayer_date DATE NOT NULL,
    status ENUM('prayed', 'missed', 'upcoming') DEFAULT 'upcoming',
    location ENUM('mosque', 'home', 'work', 'travel') DEFAULT 'mosque',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_prayer_date (user_id, prayer_type, prayer_date),
    INDEX idx_user_date (user_id, prayer_date),
    INDEX idx_mosque_date (mosque_id, prayer_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE SET NULL
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mosque_active (mosque_id, is_active),
    INDEX idx_created_date (created_at),
    FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create pickup_requests table
CREATE TABLE IF NOT EXISTS pickup_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mosque_id INT NOT NULL,
    prayer_type ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha') NOT NULL,
    request_date DATE NOT NULL,
    pickup_location TEXT NOT NULL,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    driver_id INT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_date (user_id, request_date),
    INDEX idx_mosque_status (mosque_id, status),
    INDEX idx_driver (driver_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add foreign key constraints after all tables are created
ALTER TABLE users ADD FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE SET NULL;
ALTER TABLE mosques ADD FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE SET NULL;

-- Insert sample mosque
INSERT INTO mosques (name, address, phone, email, prayer_times) VALUES 
('Al-Noor Mosque', '123 Main Street, City', '+1-234-567-8900', 'info@alnoor.com', 
 JSON_OBJECT(
   'Fajr', '05:30',
   'Dhuhr', '12:30', 
   'Asr', '15:45',
   'Maghrib', '18:20',
   'Isha', '19:45'
 ));
