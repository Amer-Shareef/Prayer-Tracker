-- Prayer Tracker Database Backup
-- Generated on: 2025-06-18T03:49:45.541Z
-- Database: db_fajr_app
-- Host: database-1.c74ma2eaeuks.eu-north-1.rds.amazonaws.com

SET foreign_key_checks = 0;

-- Table structure for announcements
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mosque_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `author_id` int NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_active` tinyint(1) DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcements_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table announcements
INSERT INTO `announcements` VALUES
(1, 1, 'Welcome to Prayer Tracker', 'Assalamu Alaikum! Welcome to our mosque prayer tracking system. Please make sure to mark your daily prayers to help us better serve our community.', 2, 'high', 1, NULL, '2025-06-10 06:23:41', '2025-06-10 06:23:41');

-- Table structure for daily_activities
DROP TABLE IF EXISTS `daily_activities`;
CREATE TABLE `daily_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_date` date NOT NULL,
  `activity_type` enum('zikr','quran') NOT NULL,
  `count_value` int DEFAULT '0',
  `minutes_value` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date_type` (`user_id`,`activity_date`,`activity_type`),
  KEY `idx_user_date` (`user_id`,`activity_date`),
  KEY `idx_activity_type` (`activity_type`),
  CONSTRAINT `daily_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table daily_activities
INSERT INTO `daily_activities` VALUES
(1, 1, '2025-06-16 18:30:00', 'zikr', 46, 0, '2025-06-17 16:54:35', '2025-06-17 16:54:35'),
(2, 1, '2025-06-16 18:30:00', 'quran', 0, 18, '2025-06-17 16:54:35', '2025-06-17 16:54:35'),
(3, 1, '2025-06-15 18:30:00', 'zikr', 74, 0, '2025-06-17 16:54:36', '2025-06-17 16:54:36'),
(4, 1, '2025-06-15 18:30:00', 'quran', 0, 72, '2025-06-17 16:54:36', '2025-06-17 16:54:36'),
(5, 1, '2025-06-14 18:30:00', 'zikr', 98, 0, '2025-06-17 16:54:36', '2025-06-17 16:54:36'),
(6, 1, '2025-06-14 18:30:00', 'quran', 0, 16, '2025-06-17 16:54:36', '2025-06-17 16:54:36'),
(7, 1, '2025-06-13 18:30:00', 'zikr', 118, 0, '2025-06-17 16:54:36', '2025-06-17 16:54:36'),
(8, 1, '2025-06-13 18:30:00', 'quran', 0, 55, '2025-06-17 16:54:37', '2025-06-17 16:54:37'),
(9, 1, '2025-06-12 18:30:00', 'zikr', 106, 0, '2025-06-17 16:54:37', '2025-06-17 16:54:37'),
(10, 1, '2025-06-12 18:30:00', 'quran', 0, 33, '2025-06-17 16:54:37', '2025-06-17 16:54:37'),
(11, 1, '2025-06-11 18:30:00', 'zikr', 91, 0, '2025-06-17 16:54:37', '2025-06-17 16:54:37'),
(12, 1, '2025-06-11 18:30:00', 'quran', 0, 56, '2025-06-17 16:54:37', '2025-06-17 16:54:37'),
(13, 1, '2025-06-10 18:30:00', 'zikr', 39, 0, '2025-06-17 16:54:38', '2025-06-17 16:54:38'),
(14, 1, '2025-06-10 18:30:00', 'quran', 0, 61, '2025-06-17 16:54:38', '2025-06-17 16:54:38'),
(15, 4, '2025-06-16 18:30:00', 'zikr', 58, 0, '2025-06-17 16:54:38', '2025-06-17 16:54:38'),
(16, 4, '2025-06-16 18:30:00', 'quran', 0, 54, '2025-06-17 16:54:38', '2025-06-17 16:54:38'),
(17, 4, '2025-06-15 18:30:00', 'zikr', 46, 0, '2025-06-17 16:54:38', '2025-06-17 16:54:38'),
(18, 4, '2025-06-15 18:30:00', 'quran', 0, 35, '2025-06-17 16:54:39', '2025-06-17 16:54:39'),
(19, 4, '2025-06-14 18:30:00', 'zikr', 33, 0, '2025-06-17 16:54:39', '2025-06-17 16:54:39'),
(20, 4, '2025-06-14 18:30:00', 'quran', 0, 33, '2025-06-17 16:54:39', '2025-06-17 16:54:39'),
(21, 4, '2025-06-13 18:30:00', 'zikr', 121, 0, '2025-06-17 16:54:39', '2025-06-17 16:54:39'),
(22, 4, '2025-06-13 18:30:00', 'quran', 0, 42, '2025-06-17 16:54:39', '2025-06-17 16:54:39'),
(23, 4, '2025-06-12 18:30:00', 'zikr', 36, 0, '2025-06-17 16:54:40', '2025-06-17 16:54:40'),
(24, 4, '2025-06-12 18:30:00', 'quran', 0, 28, '2025-06-17 16:54:40', '2025-06-17 16:54:40'),
(25, 4, '2025-06-11 18:30:00', 'zikr', 38, 0, '2025-06-17 16:54:40', '2025-06-17 16:54:40'),
(26, 4, '2025-06-11 18:30:00', 'quran', 0, 71, '2025-06-17 16:54:40', '2025-06-17 16:54:40'),
(27, 4, '2025-06-10 18:30:00', 'zikr', 122, 0, '2025-06-17 16:54:40', '2025-06-17 16:54:40'),
(28, 4, '2025-06-10 18:30:00', 'quran', 0, 26, '2025-06-17 16:54:41', '2025-06-17 16:54:41'),
(29, 7, '2025-06-16 18:30:00', 'zikr', 48, 0, '2025-06-17 16:54:41', '2025-06-17 16:54:41'),
(30, 7, '2025-06-16 18:30:00', 'quran', 0, 63, '2025-06-17 16:54:41', '2025-06-17 16:54:41'),
(31, 7, '2025-06-15 18:30:00', 'zikr', 90, 0, '2025-06-17 16:54:41', '2025-06-17 16:54:41'),
(32, 7, '2025-06-15 18:30:00', 'quran', 0, 54, '2025-06-17 16:54:41', '2025-06-17 16:54:41'),
(33, 7, '2025-06-14 18:30:00', 'zikr', 75, 0, '2025-06-17 16:54:42', '2025-06-17 16:54:42'),
(34, 7, '2025-06-14 18:30:00', 'quran', 0, 39, '2025-06-17 16:54:42', '2025-06-17 16:54:42'),
(35, 7, '2025-06-13 18:30:00', 'zikr', 86, 0, '2025-06-17 16:54:42', '2025-06-17 16:54:42'),
(36, 7, '2025-06-13 18:30:00', 'quran', 0, 71, '2025-06-17 16:54:42', '2025-06-17 16:54:42'),
(37, 7, '2025-06-12 18:30:00', 'zikr', 33, 0, '2025-06-17 16:54:43', '2025-06-17 16:54:43'),
(38, 7, '2025-06-12 18:30:00', 'quran', 0, 51, '2025-06-17 16:54:43', '2025-06-17 16:54:43'),
(39, 7, '2025-06-11 18:30:00', 'zikr', 108, 0, '2025-06-17 16:54:43', '2025-06-17 16:54:43'),
(40, 7, '2025-06-11 18:30:00', 'quran', 0, 74, '2025-06-17 16:54:43', '2025-06-17 16:54:43'),
(41, 7, '2025-06-10 18:30:00', 'zikr', 56, 0, '2025-06-17 16:54:43', '2025-06-17 16:54:43'),
(42, 7, '2025-06-10 18:30:00', 'quran', 0, 35, '2025-06-17 16:54:44', '2025-06-17 16:54:44'),
(43, 16, '2025-06-16 18:30:00', 'quran', 0, 140, '2025-06-17 17:16:09', '2025-06-17 17:34:41'),
(46, 16, '2025-06-16 18:30:00', 'zikr', 99, 0, '2025-06-17 17:16:20', '2025-06-17 18:06:28'),
(64, 16, '2025-06-17 18:30:00', 'zikr', 500, 0, '2025-06-17 17:35:55', '2025-06-17 18:06:39'),
(66, 16, '2025-06-18 18:30:00', 'zikr', 99, 0, '2025-06-17 17:36:28', '2025-06-17 17:36:28'),
(67, 16, '2025-06-18 18:30:00', 'quran', 0, 50, '2025-06-17 17:36:36', '2025-06-17 17:37:05'),
(70, 16, '2025-06-17 18:30:00', 'quran', 0, 100, '2025-06-17 17:43:04', '2025-06-17 18:07:06');

-- Table structure for mosques
DROP TABLE IF EXISTS `mosques`;
CREATE TABLE `mosques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `prayer_times` json DEFAULT NULL,
  `founder_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_founder_id` (`founder_id`),
  KEY `idx_name` (`name`),
  CONSTRAINT `mosques_ibfk_1` FOREIGN KEY (`founder_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table mosques
INSERT INTO `mosques` VALUES
(1, 'Al-Noor Mosque', '123 Main Street, City', '+1-234-567-8900', 'info@alnoor.com', [object Object], 2, '2025-06-10 06:20:57', '2025-06-10 06:23:22');

-- Table structure for pickup_requests
DROP TABLE IF EXISTS `pickup_requests`;
CREATE TABLE `pickup_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `mosque_id` int NOT NULL,
  `prayer_type` enum('Fajr') NOT NULL DEFAULT 'Fajr',
  `request_date` date NOT NULL,
  `pickup_location` text NOT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `driver_id` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_driver_name` varchar(100) DEFAULT NULL,
  `assigned_driver_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_prayer_type` (`prayer_type`),
  KEY `idx_request_date` (`request_date`),
  KEY `idx_status` (`status`),
  KEY `idx_driver_id` (`driver_id`),
  CONSTRAINT `pickup_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pickup_requests_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pickup_requests_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pickup_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table pickup_requests
INSERT INTO `pickup_requests` VALUES
(12, 16, 1, 'Fajr', '2025-06-18 18:30:00', 'kawdana road', 'pending', NULL, NULL, NULL, '2025-06-17 21:13:54', '2025-06-17 21:13:54', NULL, NULL);

-- Table structure for prayer_times
DROP TABLE IF EXISTS `prayer_times`;
CREATE TABLE `prayer_times` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mosque_id` int NOT NULL,
  `prayer_date` date NOT NULL,
  `fajr_time` time DEFAULT NULL,
  `dhuhr_time` time DEFAULT NULL,
  `asr_time` time DEFAULT NULL,
  `maghrib_time` time DEFAULT NULL,
  `isha_time` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mosque_date` (`mosque_id`,`prayer_date`),
  KEY `idx_mosque_date` (`mosque_id`,`prayer_date`),
  CONSTRAINT `prayer_times_ibfk_1` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table prayer_times
INSERT INTO `prayer_times` VALUES
(1, 1, '2025-06-11 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:55', '2025-06-11 20:01:55'),
(2, 1, '2025-06-12 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:55', '2025-06-11 20:01:55'),
(3, 1, '2025-06-13 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:56', '2025-06-11 20:01:56'),
(4, 1, '2025-06-14 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:56', '2025-06-11 20:01:56'),
(5, 1, '2025-06-15 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:56', '2025-06-11 20:01:56'),
(6, 1, '2025-06-16 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:56', '2025-06-11 20:01:56'),
(7, 1, '2025-06-17 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:56', '2025-06-11 20:01:56'),
(8, 1, '2025-06-18 18:30:00', '05:30:00', '12:30:00', '15:45:00', '18:20:00', '19:45:00', '2025-06-11 20:01:57', '2025-06-11 20:01:57');

-- Table structure for prayers
DROP TABLE IF EXISTS `prayers`;
CREATE TABLE `prayers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `mosque_id` int DEFAULT NULL,
  `prayer_type` enum('Fajr','Dhuhr','Asr','Maghrib','Isha') NOT NULL,
  `prayer_date` date NOT NULL,
  `prayer_time` time DEFAULT NULL,
  `status` enum('prayed','missed','upcoming') NOT NULL DEFAULT 'upcoming',
  `location` enum('mosque','home','other') DEFAULT 'mosque',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `zikr_count` int DEFAULT '0',
  `quran_minutes` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_prayer_date` (`user_id`,`prayer_type`,`prayer_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_prayer_date` (`prayer_date`),
  KEY `idx_prayer_type` (`prayer_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `prayers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prayers_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table prayers
INSERT INTO `prayers` VALUES
(1, 1, 1, 'Fajr', '2025-06-09 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:25', '2025-06-10 15:51:48', 0, 0),
(2, 1, 1, 'Dhuhr', '2025-06-09 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:26', '2025-06-11 21:25:57', 0, 0),
(3, 1, 1, 'Asr', '2025-06-09 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:26', '2025-06-10 15:23:16', 0, 0),
(4, 1, 1, 'Maghrib', '2025-06-09 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:26', '2025-06-10 15:23:18', 0, 0),
(5, 1, 1, 'Isha', '2025-06-09 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:26', '2025-06-10 16:18:39', 0, 0),
(6, 1, 1, 'Fajr', '2025-06-08 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:26', '2025-06-10 06:23:26', 0, 0),
(7, 1, 1, 'Dhuhr', '2025-06-08 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:27', '2025-06-10 06:23:27', 0, 0),
(8, 1, 1, 'Asr', '2025-06-08 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:27', '2025-06-10 06:23:27', 0, 0),
(9, 1, 1, 'Maghrib', '2025-06-08 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:27', '2025-06-10 06:23:27', 0, 0),
(10, 1, 1, 'Isha', '2025-06-08 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:28', '2025-06-10 06:23:28', 0, 0),
(11, 1, 1, 'Fajr', '2025-06-07 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:28', '2025-06-10 06:23:28', 0, 0),
(12, 1, 1, 'Dhuhr', '2025-06-07 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:28', '2025-06-10 06:23:28', 0, 0),
(13, 1, 1, 'Asr', '2025-06-07 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:28', '2025-06-10 06:23:28', 0, 0),
(14, 1, 1, 'Maghrib', '2025-06-07 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:29', '2025-06-10 06:23:29', 0, 0),
(15, 1, 1, 'Isha', '2025-06-07 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:30', '2025-06-10 06:23:30', 0, 0),
(16, 1, 1, 'Fajr', '2025-06-06 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:30', '2025-06-10 06:23:30', 0, 0),
(17, 1, 1, 'Dhuhr', '2025-06-06 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:31', '2025-06-10 06:23:31', 0, 0),
(18, 1, 1, 'Asr', '2025-06-06 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:31', '2025-06-10 06:23:31', 0, 0),
(19, 1, 1, 'Maghrib', '2025-06-06 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:31', '2025-06-10 06:23:31', 0, 0),
(20, 1, 1, 'Isha', '2025-06-06 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:32', '2025-06-10 06:23:32', 0, 0),
(21, 1, 1, 'Fajr', '2025-06-05 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:32', '2025-06-10 06:23:32', 0, 0),
(22, 1, 1, 'Dhuhr', '2025-06-05 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:32', '2025-06-10 06:23:32', 0, 0),
(23, 1, 1, 'Asr', '2025-06-05 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 06:23:32', '2025-06-10 06:23:32', 0, 0),
(24, 1, 1, 'Maghrib', '2025-06-05 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:32', '2025-06-10 06:23:32', 0, 0),
(25, 1, 1, 'Isha', '2025-06-05 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:33', '2025-06-10 06:23:33', 0, 0),
(26, 1, 1, 'Fajr', '2025-06-04 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:34', '2025-06-10 06:23:34', 0, 0),
(27, 1, 1, 'Dhuhr', '2025-06-04 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:34', '2025-06-10 06:23:34', 0, 0),
(28, 1, 1, 'Asr', '2025-06-04 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:35', '2025-06-10 06:23:35', 0, 0),
(29, 1, 1, 'Maghrib', '2025-06-04 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:35', '2025-06-10 06:23:35', 0, 0),
(30, 1, 1, 'Isha', '2025-06-04 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:36', '2025-06-10 06:23:36', 0, 0),
(31, 1, 1, 'Fajr', '2025-06-03 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:36', '2025-06-10 06:23:36', 0, 0),
(32, 1, 1, 'Dhuhr', '2025-06-03 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:36', '2025-06-10 06:23:36', 0, 0),
(33, 1, 1, 'Asr', '2025-06-03 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:36', '2025-06-10 06:23:36', 0, 0),
(34, 1, 1, 'Maghrib', '2025-06-03 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 06:23:37', '2025-06-10 06:23:37', 0, 0),
(35, 1, 1, 'Isha', '2025-06-03 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-10 06:23:38', '2025-06-10 06:23:38', 0, 0),
(42, 1, 1, 'Fajr', '2025-06-10 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 15:26:16', '2025-06-10 15:39:17', 0, 0),
(43, 1, 1, 'Dhuhr', '2025-06-10 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-10 15:26:23', '2025-06-10 15:39:20', 0, 0),
(44, 1, 1, 'Asr', '2025-06-10 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 15:26:25', '2025-06-11 21:11:17', 0, 0),
(45, 1, 1, 'Maghrib', '2025-06-10 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 15:26:27', '2025-06-10 15:39:24', 0, 0),
(46, 1, 1, 'Isha', '2025-06-10 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-10 15:26:30', '2025-06-10 15:39:25', 0, 0),
(55, 1, 1, 'Fajr', '2025-06-11 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-11 19:32:46', '2025-06-12 13:23:34', 0, 0),
(59, 1, 1, 'Dhuhr', '2025-06-11 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-11 19:32:51', '2025-06-11 20:42:47', 0, 0),
(61, 1, 1, 'Asr', '2025-06-11 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-11 19:32:58', '2025-06-11 19:32:59', 0, 0),
(63, 1, 1, 'Maghrib', '2025-06-11 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-11 19:33:03', '2025-06-11 20:27:40', 0, 0),
(64, 1, 1, 'Isha', '2025-06-11 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-11 19:33:05', '2025-06-11 19:33:05', 0, 0),
(68, 1, 1, 'Fajr', '2025-06-12 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-12 05:35:53', '2025-06-13 15:56:39', 0, 0),
(69, 1, 1, 'Dhuhr', '2025-06-12 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-12 05:35:58', '2025-06-13 15:56:43', 0, 0),
(70, 1, 1, 'Asr', '2025-06-12 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-12 13:22:32', '2025-06-13 15:56:52', 0, 0),
(71, 1, 1, 'Maghrib', '2025-06-12 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-12 13:22:39', '2025-06-13 15:56:56', 0, 0),
(72, 1, 1, 'Isha', '2025-06-12 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-12 13:22:43', '2025-06-13 16:02:16', 0, 0),
(73, 10, 1, 'Fajr', '2025-06-11 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-12 13:49:04', '2025-06-12 13:50:14', 0, 0),
(74, 10, 1, 'Dhuhr', '2025-06-11 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-12 13:49:08', '2025-06-12 13:49:08', 0, 0),
(75, 10, 1, 'Asr', '2025-06-11 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-12 13:49:10', '2025-06-12 13:49:10', 0, 0),
(76, 10, 1, 'Maghrib', '2025-06-11 18:30:00', NULL, 'prayed', 'home', NULL, '2025-06-12 13:49:13', '2025-06-12 13:49:13', 0, 0),
(77, 10, 1, 'Isha', '2025-06-11 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-12 13:49:17', '2025-06-12 13:49:17', 0, 0),
(78, 12, 1, 'Fajr', '2025-06-13 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-13 23:09:27', '2025-06-13 23:09:27', 0, 0),
(79, 12, 1, 'Dhuhr', '2025-06-13 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-13 23:09:30', '2025-06-13 23:09:30', 0, 0),
(80, 12, 1, 'Asr', '2025-06-13 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-13 23:09:32', '2025-06-13 23:09:32', 0, 0),
(81, 12, 1, 'Maghrib', '2025-06-13 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-13 23:09:33', '2025-06-13 23:09:33', 0, 0),
(82, 12, 1, 'Isha', '2025-06-13 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-13 23:09:34', '2025-06-13 23:09:34', 0, 0),
(83, 12, 1, 'Fajr', '2025-06-14 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-14 20:41:11', '2025-06-14 20:41:11', 0, 0),
(84, 1, 1, 'Fajr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', 'On time prayer', '2025-06-17 11:53:17', '2025-06-17 14:42:08', 0, 0),
(89, 2, 1, 'Fajr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 12:02:32', '2025-06-17 12:02:32', 0, 0),
(90, 2, 1, 'Dhuhr', '2025-06-16 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-17 12:02:33', '2025-06-17 12:02:33', 0, 0),
(91, 2, 1, 'Asr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 12:02:34', '2025-06-17 12:02:34', 0, 0),
(92, 2, 1, 'Maghrib', '2025-06-16 18:30:00', NULL, 'missed', 'mosque', NULL, '2025-06-17 12:02:34', '2025-06-17 12:02:34', 0, 0),
(93, 2, 1, 'Isha', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 12:02:36', '2025-06-17 12:02:36', 0, 0),
(95, 16, 1, 'Fajr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 16:11:31', '2025-06-17 17:27:28', 0, 0),
(96, 16, 1, 'Dhuhr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 17:27:36', '2025-06-17 17:27:36', 0, 0),
(97, 16, 1, 'Asr', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 17:27:38', '2025-06-17 17:27:40', 0, 0),
(98, 16, 1, 'Maghrib', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 17:27:42', '2025-06-17 17:27:42', 0, 0),
(99, 16, 1, 'Isha', '2025-06-16 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 17:27:44', '2025-06-17 17:27:44', 0, 0),
(100, 16, 1, 'Fajr', '2025-06-17 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 18:11:42', '2025-06-17 18:11:42', 0, 0),
(101, 16, 1, 'Dhuhr', '2025-06-17 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 18:11:45', '2025-06-17 18:11:45', 0, 0),
(102, 16, 1, 'Asr', '2025-06-17 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 18:11:46', '2025-06-17 18:11:46', 0, 0),
(103, 16, 1, 'Maghrib', '2025-06-17 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 18:11:51', '2025-06-17 18:11:51', 0, 0),
(104, 16, 1, 'Isha', '2025-06-17 18:30:00', NULL, 'prayed', 'mosque', NULL, '2025-06-17 18:11:53', '2025-06-17 18:20:07', 0, 0);

-- Table structure for users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Member','Founder','SuperAdmin') NOT NULL DEFAULT 'Member',
  `mosque_id` int DEFAULT NULL,
  `status` enum('active','inactive','pending') DEFAULT 'active',
  `joined_date` date DEFAULT (curdate()),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` timestamp NULL DEFAULT NULL,
  `otp_code` varchar(4) DEFAULT NULL,
  `otp_expires` timestamp NULL DEFAULT NULL,
  `otp_verified` tinyint(1) DEFAULT '0',
  `login_attempts` int DEFAULT '0',
  `account_locked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_status` (`status`),
  KEY `idx_reset_token` (`reset_token`),
  KEY `idx_otp_code` (`otp_code`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data for table users
INSERT INTO `users` VALUES
(1, 'testmember', 'member@prayertracker.com', '+94-77-123-4567', '$2b$10$xx9UbNta6xNxBslnW3YRZukK6V6vEcAnfJx8874tRF3O3gz9C3RqG', 'Member', 1, 'active', '2025-06-09 18:30:00', '2025-06-17 13:12:09', '2025-06-10 06:23:21', '2025-06-17 13:12:09', NULL, NULL, NULL, NULL, 0, 0, NULL),
(2, 'testfounder', 'founder@prayertracker.com', '+94-77-234-5678', '$2b$10$FArHAe9BWlpT61A/TccbueRdMAP6G85EpfUen1GMLlMxXrLBi8x4S', 'Founder', 1, 'active', '2025-06-09 18:30:00', '2025-06-17 15:49:43', '2025-06-10 06:23:21', '2025-06-17 15:49:43', NULL, NULL, NULL, NULL, 1, 0, NULL),
(3, 'testadmin', 'admin@prayertracker.com', '+94-77-345-6789', '$2b$10$FArHAe9BWlpT61A/TccbueRdMAP6G85EpfUen1GMLlMxXrLBi8x4S', 'SuperAdmin', NULL, 'active', '2025-06-09 18:30:00', '2025-06-16 12:14:00', '2025-06-10 06:23:22', '2025-06-16 12:14:00', NULL, NULL, NULL, NULL, 0, 0, NULL),
(4, 'insaf', 'insaf@gmail.com', '0771234567', '$2b$10$eSdX7BQ7VDKI5GGU5Yj7aeOyb6m6/raZNmC9d.ZG4LIek6BXcskIq', 'Member', 1, 'active', '2025-06-09 18:30:00', NULL, '2025-06-10 06:48:48', '2025-06-10 07:13:52', NULL, NULL, NULL, NULL, 0, 0, NULL),
(7, 'testuser123', 'testuser123@gmail.com', '0771234512', '$2b$10$zVXQgWufB35QVGsX1LUQbOsdWLByyxGVHniihm6eWZMd9i9pyYJ4W', 'Member', 1, 'active', '2025-06-09 18:30:00', NULL, '2025-06-10 07:38:49', '2025-06-10 07:38:49', NULL, NULL, NULL, NULL, 0, 0, NULL),
(10, 'thalib', 'thalib@gmail.com', '0772345678', '$2b$10$VDO7B5f4tO7VZ0ob0CokwOnufOpE3VGY/JG3hanLJOXVPEhY0P1T.', 'Member', 1, 'active', '2025-06-11 18:30:00', '2025-06-12 13:48:01', '2025-06-12 13:47:12', '2025-06-12 13:48:01', NULL, NULL, NULL, NULL, 0, 0, NULL),
(12, 'insaf01', 'inshaf0420@gmail.com', '0772648650', '$2b$10$/.3HiHkCXFOUUBzb.dMHzOSiJ/KnEjMQRDDc8ayY2KlzMSRrLlBLG', 'Member', 1, 'active', '2025-06-13 18:30:00', '2025-06-16 14:25:19', '2025-06-13 23:08:44', '2025-06-16 14:25:19', NULL, NULL, NULL, NULL, 0, 0, NULL),
(13, 'taalib', 'taalib@gmail.com', '0123456789', '$2b$10$BWeGWQDUfT5KZd2OyEJqK.SPFt5iM7qGYAYg027u52CFOQTk67FHm', 'Member', 1, 'active', '2025-06-15 18:30:00', '2025-06-17 14:57:20', '2025-06-16 13:32:44', '2025-06-17 14:57:20', NULL, NULL, NULL, NULL, 0, 0, NULL),
(16, 'abdullah', 'inshaf4online@gmail.com', '0772648650', '$2b$10$dI.cm/66xu2jJhObFxL4ku9Bm66qnlG6NpYNBmVRGacKs74HMTrCS', 'Member', 1, 'active', '2025-06-16 18:30:00', '2025-06-17 22:18:32', '2025-06-17 15:01:43', '2025-06-17 22:18:32', '263876ae86205fa9e5b06b873baee20d95e4ab22e42b489ae778d7baba7af26a', '2025-06-17 23:17:56', NULL, NULL, 1, 0, NULL),
(18, 'amer', 'amershareef@ambitiousdevelopers.com', '0765428567', '$2b$10$ZgZ8bAeCbdFGkXDMX2M3buPjLlMokZEp4BD85TvKaK7bB4x9v/LaG', 'Founder', 1, 'active', '2025-06-16 18:30:00', '2025-06-17 17:14:13', '2025-06-17 15:50:25', '2025-06-17 22:12:53', NULL, NULL, NULL, NULL, 1, 0, NULL);

SET foreign_key_checks = 1;
