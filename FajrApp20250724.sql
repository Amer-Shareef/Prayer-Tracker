-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: database-1.c74ma2eaeuks.eu-north-1.rds.amazonaws.com    Database: db_fajr_app
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `area_id` int NOT NULL AUTO_INCREMENT,
  `area_name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `coordinates` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`area_id`),
  UNIQUE KEY `area_name` (`area_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
INSERT INTO `areas` VALUES (1,'Kawdana Jummah Masjid','10 Kawdana Road, Dehiwala',NULL,'Close to nolimit head office','2025-07-23 04:50:07','2025-07-23 04:50:07'),(2,'Rathmalana Jummah Masjid','100 1st Lane, Rathmalana',NULL,NULL,'2025-07-23 05:01:59','2025-07-23 05:01:59');
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_center`
--

DROP TABLE IF EXISTS `call_center`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `call_center` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `prayer_type` enum('Fajr','Dhuhr','Asr','Maghrib','Isha') DEFAULT 'Fajr',
  `call_date` date NOT NULL,
  `call_time` time NOT NULL,
  `call_status` enum('accepted','declined','no_answer') DEFAULT 'no_answer',
  `response_time` timestamp NULL DEFAULT NULL,
  `mosque_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `mosque_id` (`mosque_id`),
  KEY `call_date` (`call_date`),
  KEY `call_status` (`call_status`),
  CONSTRAINT `call_center_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `call_center_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_center`
--

LOCK TABLES `call_center` WRITE;
/*!40000 ALTER TABLE `call_center` DISABLE KEYS */;
INSERT INTO `call_center` VALUES (1,1,'testmember','+94-77-123-4567','Fajr','2025-06-24','04:30:00','accepted','2025-06-24 04:31:00',1,'2025-06-24 02:20:26',NULL);
/*!40000 ALTER TABLE `call_center` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counselling_sessions`
--

DROP TABLE IF EXISTS `counselling_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counselling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `counsellor_id` int NOT NULL,
  `mosque_id` int NOT NULL,
  `member_name` varchar(100) NOT NULL,
  `member_phone` varchar(20) DEFAULT NULL,
  `member_email` varchar(100) DEFAULT NULL,
  `attendance_rate` decimal(5,2) DEFAULT NULL,
  `total_prayers` int DEFAULT '0',
  `prayed_count` int DEFAULT '0',
  `scheduled_date` date NOT NULL,
  `scheduled_time` time NOT NULL,
  `actual_start_time` timestamp NULL DEFAULT NULL,
  `actual_end_time` timestamp NULL DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `status` enum('pending','scheduled','in_progress','completed','cancelled','no_show') DEFAULT 'pending',
  `session_type` enum('phone_call','in_person','video_call') DEFAULT 'phone_call',
  `pre_session_notes` text,
  `session_notes` text,
  `issues_identified` text,
  `action_items` text,
  `follow_up_required` tinyint(1) DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `member_response` enum('positive','neutral','negative','no_response') DEFAULT NULL,
  `commitment_made` text,
  `improvement_plan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_counsellor_id` (`counsellor_id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_scheduled_date` (`scheduled_date`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_attendance_rate` (`attendance_rate`),
  CONSTRAINT `counselling_sessions_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `counselling_sessions_ibfk_2` FOREIGN KEY (`counsellor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `counselling_sessions_ibfk_3` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counselling_sessions`
--

LOCK TABLES `counselling_sessions` WRITE;
/*!40000 ALTER TABLE `counselling_sessions` DISABLE KEYS */;
INSERT INTO `counselling_sessions` VALUES (2,1,18,1,'Member','+94-77-123-4567','member@prayertracker.com',100.00,8,8,'2024-12-25','15:00:00',NULL,NULL,'high','completed','phone_call','Member has very low attendance rate. Needs immediate counselling.','Done',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-06-27 03:07:22','2025-07-24 15:18:18'),(11,33,18,1,'Dhanish','0712345678','dhanish@gmail.com',NULL,0,0,'2025-07-20','04:00:00',NULL,NULL,'medium','completed','phone_call','Meeting scheduled for dhanish with mentor','ghsd',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-07-16 20:18:03','2025-07-16 21:19:14'),(12,16,2,1,'abdullah','0772648650','inshaf4online@gmail.com',NULL,0,0,'2025-07-31','03:50:00',NULL,NULL,'medium','completed','phone_call','Meeting scheduled for abdullah with mentor','done',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-07-16 20:19:54','2025-07-16 20:20:32'),(13,33,2,1,'Dhanish','0712345678','dhanish@gmail.com',NULL,0,0,'2025-07-22','02:11:00',NULL,NULL,'medium','scheduled','phone_call','Meeting scheduled for dhanish with mentor',NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-07-16 20:39:04','2025-07-16 20:39:04'),(15,12,2,1,'insaf01','0772648650','inshaf0420@gmail.com',NULL,0,0,'2025-07-25','02:52:00',NULL,NULL,'medium','completed','phone_call','Meeting scheduled for insaf01 with mentor','completeted successfully',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-07-16 21:22:26','2025-07-18 04:45:38'),(16,33,18,1,'Dhanish','0712345678','dhanish@gmail.com',NULL,0,0,'2025-07-31','03:05:00',NULL,NULL,'medium','scheduled','phone_call','Meeting scheduled for dhanish with mentor',NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-07-16 21:34:23','2025-07-16 21:34:23');
/*!40000 ALTER TABLE `counselling_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_activities`
--

DROP TABLE IF EXISTS `daily_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_activities`
--

LOCK TABLES `daily_activities` WRITE;
/*!40000 ALTER TABLE `daily_activities` DISABLE KEYS */;
INSERT INTO `daily_activities` VALUES (1,1,'2025-06-16','zikr',46,0,'2025-06-17 16:54:35','2025-06-17 16:54:35'),(2,1,'2025-06-16','quran',0,18,'2025-06-17 16:54:35','2025-06-17 16:54:35'),(3,1,'2025-06-15','zikr',74,0,'2025-06-17 16:54:36','2025-06-17 16:54:36'),(4,1,'2025-06-15','quran',0,72,'2025-06-17 16:54:36','2025-06-17 16:54:36'),(89,21,'2025-06-19','zikr',100,0,'2025-06-19 17:09:11','2025-06-20 04:40:44'),(90,21,'2025-06-19','quran',0,15,'2025-06-19 17:10:22','2025-06-20 04:40:48'),(103,1,'2025-06-21','zikr',99,0,'2025-06-21 22:35:52','2025-06-21 22:35:52'),(104,21,'2025-06-22','quran',0,15,'2025-06-22 08:31:54','2025-06-22 08:31:54'),(105,21,'2025-06-23','quran',0,15,'2025-06-23 07:54:43','2025-06-23 11:11:44'),(106,21,'2025-06-23','zikr',100,0,'2025-06-23 08:48:57','2025-06-23 11:26:39'),(153,21,'2025-06-24','quran',0,15,'2025-06-24 17:49:51','2025-06-24 17:49:51'),(154,21,'2025-06-24','zikr',100,0,'2025-06-24 17:49:52','2025-06-24 17:49:52'),(155,21,'2025-06-25','quran',0,15,'2025-06-24 19:45:59','2025-06-25 02:46:27'),(156,21,'2025-06-25','zikr',100,0,'2025-06-24 19:46:00','2025-06-24 19:46:00'),(158,23,'2025-06-27','quran',0,15,'2025-06-27 09:47:19','2025-06-27 09:47:19'),(159,23,'2025-06-27','zikr',100,0,'2025-06-27 09:47:20','2025-06-27 09:47:20'),(160,18,'2025-06-28','quran',0,15,'2025-06-28 13:51:13','2025-06-28 13:51:13'),(161,18,'2025-06-28','zikr',100,0,'2025-06-28 13:51:14','2025-06-28 13:51:14'),(162,21,'2025-06-28','zikr',100,0,'2025-06-28 15:25:15','2025-06-28 15:25:15'),(163,22,'2025-06-29','zikr',100,0,'2025-06-29 08:00:43','2025-06-29 08:00:43'),(164,21,'2025-07-03','quran',0,15,'2025-07-03 09:46:34','2025-07-03 09:46:34'),(165,36,'2025-07-08','quran',0,15,'2025-07-08 05:31:45','2025-07-08 05:31:45'),(166,36,'2025-07-08','zikr',0,0,'2025-07-08 05:32:20','2025-07-08 12:29:30'),(168,36,'2025-07-09','zikr',0,0,'2025-07-09 00:04:00','2025-07-09 00:04:02'),(170,22,'2025-07-10','zikr',100,0,'2025-07-10 12:41:12','2025-07-10 12:41:12'),(171,22,'2025-07-10','quran',0,15,'2025-07-10 12:41:13','2025-07-10 12:41:13'),(172,21,'2025-07-11','zikr',100,0,'2025-07-11 05:41:27','2025-07-11 08:28:27'),(181,22,'2025-07-12','zikr',100,0,'2025-07-12 05:12:41','2025-07-12 05:12:41'),(182,22,'2025-07-12','quran',0,15,'2025-07-12 05:12:41','2025-07-12 05:12:41'),(183,21,'2025-07-12','zikr',500,0,'2025-07-12 14:32:55','2025-07-12 17:28:51'),(187,21,'2025-07-13','quran',0,0,'2025-07-12 22:36:16','2025-07-13 01:11:37'),(188,21,'2025-07-13','zikr',0,0,'2025-07-12 22:37:53','2025-07-13 06:03:53'),(207,36,'2025-07-13','quran',0,15,'2025-07-13 11:29:00','2025-07-13 11:29:00'),(208,21,'2025-07-19','zikr',600,0,'2025-07-19 06:14:25','2025-07-19 06:16:48'),(210,21,'2025-07-19','quran',0,15,'2025-07-19 06:16:32','2025-07-19 06:16:39'),(213,21,'2025-07-21','zikr',100,0,'2025-07-21 14:22:10','2025-07-21 14:22:10'),(214,43,'2025-07-21','zikr',600,0,'2025-07-21 16:53:32','2025-07-21 16:53:35'),(218,46,'2025-07-21','quran',0,15,'2025-07-21 18:13:50','2025-07-21 18:13:50'),(219,46,'2025-07-21','zikr',100,0,'2025-07-21 18:13:53','2025-07-21 18:13:53'),(220,43,'2025-07-22','zikr',600,0,'2025-07-22 00:04:42','2025-07-22 00:04:47'),(226,71,'2025-07-22','zikr',600,0,'2025-07-22 00:18:00','2025-07-23 02:02:25'),(227,46,'2025-07-22','zikr',600,0,'2025-07-22 00:34:46','2025-07-22 15:52:54'),(230,46,'2025-07-22','quran',0,15,'2025-07-22 00:36:33','2025-07-23 23:15:24'),(234,54,'2025-07-22','zikr',600,0,'2025-07-22 00:52:19','2025-07-22 08:10:51'),(235,54,'2025-07-22','quran',0,15,'2025-07-22 00:52:20','2025-07-22 00:52:20'),(236,22,'2025-07-22','quran',0,0,'2025-07-22 03:00:20','2025-07-22 03:00:24'),(239,39,'2025-07-22','zikr',500,0,'2025-07-22 11:13:37','2025-07-22 11:13:37'),(240,39,'2025-07-22','quran',0,15,'2025-07-22 11:13:37','2025-07-22 11:13:37'),(241,75,'2025-07-22','quran',0,15,'2025-07-22 15:18:12','2025-07-22 15:18:12'),(242,75,'2025-07-22','zikr',600,0,'2025-07-22 15:18:13','2025-07-22 15:18:13'),(245,57,'2025-07-22','zikr',600,0,'2025-07-22 16:39:10','2025-07-22 16:39:13'),(247,57,'2025-07-22','quran',0,15,'2025-07-22 16:39:14','2025-07-22 16:39:14'),(248,57,'2025-07-23','quran',0,15,'2025-07-23 01:09:43','2025-07-23 01:09:43'),(249,57,'2025-07-23','zikr',600,0,'2025-07-23 01:09:44','2025-07-24 16:53:48'),(250,71,'2025-07-23','zikr',100,0,'2025-07-23 02:00:54','2025-07-23 02:00:54'),(254,46,'2025-07-24','zikr',100,0,'2025-07-23 23:19:28','2025-07-23 23:21:20'),(261,46,'2025-07-24','quran',0,0,'2025-07-23 23:21:21','2025-07-23 23:21:22'),(263,71,'2025-07-24','zikr',600,0,'2025-07-24 05:25:36','2025-07-24 05:25:37'),(265,39,'2025-07-24','zikr',500,0,'2025-07-24 14:52:26','2025-07-24 14:52:27'),(268,39,'2025-07-24','quran',0,15,'2025-07-24 14:52:28','2025-07-24 14:52:28'),(269,57,'2025-07-24','zikr',100,0,'2025-07-24 16:53:30','2025-07-24 16:53:30'),(270,57,'2025-07-24','quran',0,15,'2025-07-24 16:53:30','2025-07-24 16:53:30');
/*!40000 ALTER TABLE `daily_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feeds`
--

DROP TABLE IF EXISTS `feeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feeds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `priority` enum('normal','high','urgent') DEFAULT 'normal',
  `author_id` int NOT NULL,
  `mosque_id` int NOT NULL,
  `views` int DEFAULT '0',
  `send_notification` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mosque_id` (`mosque_id`),
  KEY `author_id` (`author_id`),
  KEY `priority` (`priority`),
  KEY `is_active` (`is_active`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `feeds_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feeds_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feeds`
--

LOCK TABLES `feeds` WRITE;
/*!40000 ALTER TABLE `feeds` DISABLE KEYS */;
INSERT INTO `feeds` VALUES (1,'Schedule Change for Isha Prayer','Please note that starting next week, the Isha prayer will be held at 8:00 PM instead of the 10 mins after Azan to accommodate the times with tharaweeh. Please update your schedules accordingly.',NULL,'normal',18,1,1,0,1,'2025-06-23 19:01:05','2025-06-24 00:26:11',NULL),(2,'Zakath','Inspire youth to serve others with faith, purpose, and Zakāh',NULL,'normal',18,1,0,1,1,'2025-06-23 19:43:59',NULL,'2026-07-15 00:00:00'),(3,'Seeds of Sadaqah','Plant the values of giving early. Teach youth the spirit of Zakāh, compassion, and building a just society through Islamic charity.',NULL,'normal',18,1,0,0,1,'2025-06-24 00:16:23',NULL,NULL),(4,'Faith Foundations: Islam 101 for Youth','An engaging introduction to core Islamic beliefs, practices, and values. Perfect for young Muslims beginning their journey in understanding Islam deeply and confidently.',NULL,'normal',18,1,0,0,1,'2025-06-24 00:25:09',NULL,NULL),(5,'New Reminder','This is a New Reminder',NULL,'normal',22,1,0,0,1,'2025-06-27 09:45:29',NULL,NULL),(6,'Testing','Testing',NULL,'normal',18,1,0,1,0,'2025-06-28 04:06:00','2025-06-28 04:06:11',NULL);
/*!40000 ALTER TABLE `feeds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_history`
--

DROP TABLE IF EXISTS `meeting_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `changed_by` int NOT NULL,
  `change_type` enum('created','scheduled','started','completed','cancelled','rescheduled','notes_updated') NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `meeting_history_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `counselling_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_history`
--

LOCK TABLES `meeting_history` WRITE;
/*!40000 ALTER TABLE `meeting_history` DISABLE KEYS */;
INSERT INTO `meeting_history` VALUES (2,2,18,'scheduled',NULL,'{\"session_type\": \"phone_call\", \"scheduled_date\": \"2024-12-25\", \"scheduled_time\": \"15:00\"}',NULL,'2025-06-27 03:07:22');
/*!40000 ALTER TABLE `meeting_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `location` varchar(255) DEFAULT NULL,
  `meeting_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `organizer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('scheduled','cancelled','completed') DEFAULT 'scheduled',
  `meeting_link` varchar(512) DEFAULT NULL,
  `is_virtual` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `organizer_id` (`organizer_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_activity_log`
--

DROP TABLE IF EXISTS `member_activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL,
  `activity_type` enum('login','prayer_recorded','profile_updated','donation','event_participation','volunteer_activity') NOT NULL,
  `activity_description` text,
  `activity_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `mosque_id` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_activity_date` (`activity_date`),
  KEY `created_by` (`created_by`),
  KEY `mosque_id` (`mosque_id`),
  CONSTRAINT `member_activity_log_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `member_activity_log_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `member_activity_log_ibfk_3` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_activity_log`
--

LOCK TABLES `member_activity_log` WRITE;
/*!40000 ALTER TABLE `member_activity_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_reports`
--

DROP TABLE IF EXISTS `member_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_type` enum('attendance','activity','contribution','comprehensive') NOT NULL,
  `member_id` int DEFAULT NULL,
  `mosque_id` int NOT NULL,
  `report_period_start` date NOT NULL,
  `report_period_end` date NOT NULL,
  `report_data` json NOT NULL,
  `generated_by` int NOT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_generated_at` (`generated_at`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `member_reports_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `member_reports_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `member_reports_ibfk_3` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_reports`
--

LOCK TABLES `member_reports` WRITE;
/*!40000 ALTER TABLE `member_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mosques`
--

DROP TABLE IF EXISTS `mosques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mosques`
--

LOCK TABLES `mosques` WRITE;
/*!40000 ALTER TABLE `mosques` DISABLE KEYS */;
INSERT INTO `mosques` VALUES (1,'Al-Noor Mosque','123 Main Street, City','+1-234-567-8900','info@alnoor.com','{\"asr\": \"15:45\", \"fajr\": \"05:30\", \"isha\": \"19:45\", \"dhuhr\": \"12:30\", \"maghrib\": \"18:20\"}',2,'2025-06-10 06:20:57','2025-06-10 06:23:22');
/*!40000 ALTER TABLE `mosques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pickup_request_history`
--

DROP TABLE IF EXISTS `pickup_request_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pickup_request_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pickup_request_id` int NOT NULL,
  `changed_by` int NOT NULL,
  `change_type` enum('created','status_changed','assigned','updated','cancelled') NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pickup_request_id` (`pickup_request_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `pickup_request_history_ibfk_1` FOREIGN KEY (`pickup_request_id`) REFERENCES `pickup_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pickup_request_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pickup_request_history`
--

LOCK TABLES `pickup_request_history` WRITE;
/*!40000 ALTER TABLE `pickup_request_history` DISABLE KEYS */;
INSERT INTO `pickup_request_history` VALUES (4,18,18,'created',NULL,'{\"days\": [\"monday\", \"tuesday\", \"wednesday\"], \"status\": \"pending\", \"prayers\": [\"fajr\"], \"pickup_location\": \"123 Main St, City\"}','Request created via mobile app','2025-06-24 16:58:37'),(7,21,22,'created',NULL,'{\"days\": [\"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\"], \"status\": \"pending\", \"prayers\": [\"fajr\"], \"pickup_location\": \"No 71,\"}','Request created via mobile app','2025-07-23 11:35:39'),(8,22,21,'created',NULL,'{\"days\": [\"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\"], \"status\": \"pending\", \"prayers\": [\"fajr\"], \"pickup_location\": \"16/2b park road dehiwala\"}','Request created via mobile app','2025-07-24 06:14:26');
/*!40000 ALTER TABLE `pickup_request_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pickup_requests`
--

DROP TABLE IF EXISTS `pickup_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pickup_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `mosque_id` int NOT NULL,
  `prayer_type` enum('Fajr') NOT NULL DEFAULT 'Fajr',
  `request_date` date NOT NULL,
  `pickup_location` text NOT NULL,
  `status` enum('pending','approved','assigned','in_progress','completed','cancelled','rejected') DEFAULT 'pending',
  `driver_id` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_driver_name` varchar(100) DEFAULT NULL,
  `assigned_driver_phone` varchar(20) DEFAULT NULL,
  `pickup_address_details` text COMMENT 'Detailed address with landmarks',
  `special_instructions` text COMMENT 'Special pickup instructions from user',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT 'Alternative contact number',
  `device_info` json DEFAULT NULL COMMENT 'Mobile device information',
  `app_version` varchar(20) DEFAULT NULL COMMENT 'Mobile app version',
  `location_coordinates` json DEFAULT NULL COMMENT 'GPS coordinates for pickup location',
  `scheduled_pickup_time` time DEFAULT NULL COMMENT 'Scheduled time for pickup',
  `actual_pickup_time` timestamp NULL DEFAULT NULL COMMENT 'Actual pickup completion time',
  `rejected_reason` text COMMENT 'Reason for rejection',
  `contact_number` varchar(20) DEFAULT NULL COMMENT 'Contact phone number',
  `days` json DEFAULT NULL COMMENT 'Array of selected days: [monday, tuesday, etc]',
  `prayers` json DEFAULT NULL COMMENT 'Array of selected prayers: [fajr, dhuhr, etc]',
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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pickup_requests`
--

LOCK TABLES `pickup_requests` WRITE;
/*!40000 ALTER TABLE `pickup_requests` DISABLE KEYS */;
INSERT INTO `pickup_requests` VALUES (14,1,1,'Fajr','2025-06-25','Sample Location - Mobile App Test','pending',NULL,NULL,NULL,'2025-06-24 15:43:36','2025-06-24 15:43:36',NULL,NULL,'Near the main bus stop, next to ABC Shop, House number 123','Please call when you arrive. I will be waiting at the front gate.','+94771234567','{\"model\": \"Samsung Galaxy\", \"platform\": \"Android\", \"os_version\": \"13.0\"}','1.0.0','{\"accuracy\": 10, \"latitude\": 6.9271, \"longitude\": 79.8612}',NULL,NULL,NULL,NULL,NULL,NULL),(18,18,1,'Fajr','0000-00-00','123 Main St, City','pending',NULL,NULL,NULL,'2025-06-24 16:58:37','2025-06-24 16:58:37',NULL,NULL,NULL,'Ring doorbell twice',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[\"monday\", \"tuesday\", \"wednesday\"]','[\"fajr\"]'),(21,22,1,'Fajr','0000-00-00','No 71,','pending',NULL,NULL,NULL,'2025-07-23 11:35:39','2025-07-23 11:35:39',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'777303384','[\"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\"]','[\"fajr\"]'),(22,21,1,'Fajr','0000-00-00','16/2b park road dehiwala','pending',NULL,NULL,NULL,'2025-07-24 06:14:26','2025-07-24 06:14:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'0765368956','[\"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\"]','[\"fajr\"]');
/*!40000 ALTER TABLE `pickup_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_post` (`user_id`,`post_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mosque_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `author_id` int NOT NULL,
  `priority` enum('Normal','High','Urgent') DEFAULT 'Normal',
  `is_active` tinyint(1) DEFAULT '1',
  `expires_at` timestamp NULL DEFAULT NULL,
  `send_notification` tinyint(1) DEFAULT '0',
  `view_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,1,'Ramadan Preparation Workshop','Join us for a special workshop to prepare for the holy month of Ramadan. Learn about spiritual practices, fasting guidelines, and community activities.',NULL,2,'High',1,'2025-05-12 18:29:59',0,71,'2025-06-19 15:03:56','2025-06-19 15:03:56'),(2,1,'Community Iftar Planning','We are organizing community iftars for the coming month. Please join us to discuss logistics and volunteer opportunities.',NULL,2,'Normal',1,'2025-05-15 18:29:59',0,136,'2025-06-19 15:03:56','2025-06-19 15:03:56'),(3,1,'Mosque Cleaning Day','Please join us for our monthly mosque cleaning day. Your participation helps maintain our beautiful place of worship.',NULL,2,'Normal',1,'2025-05-10 18:29:59',0,46,'2025-06-19 15:03:56','2025-06-19 15:03:56'),(4,1,'Schedule Change for Isha Prayer','Please note that starting next week, the Isha prayer time will be adjusted according to the new schedule.',NULL,2,'Urgent',1,'2025-05-14 18:29:59',0,135,'2025-06-19 15:03:56','2025-06-19 15:03:56');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prayer_calls`
--

DROP TABLE IF EXISTS `prayer_calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayer_calls` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `prayer_date` date NOT NULL,
  `prayer_type` enum('Fajr') NOT NULL DEFAULT 'Fajr',
  `call_time` timestamp NOT NULL,
  `response_status` enum('accepted','declined','no_response') DEFAULT 'no_response',
  `response_time` timestamp NULL DEFAULT NULL,
  `prayer_marked` tinyint(1) DEFAULT '0',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_prayer_date` (`prayer_date`),
  KEY `idx_response_status` (`response_status`),
  KEY `idx_call_time` (`call_time`),
  CONSTRAINT `prayer_calls_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_calls`
--

LOCK TABLES `prayer_calls` WRITE;
/*!40000 ALTER TABLE `prayer_calls` DISABLE KEYS */;
INSERT INTO `prayer_calls` VALUES (1,1,'testmember','+94-77-123-4567','2025-06-23','Fajr','2025-06-23 04:15:00','declined','2025-06-23 04:17:00',1,NULL,'2025-06-24 02:17:40','2025-06-24 02:17:40'),(2,1,'testmember','+94-77-123-4567','2025-06-24','Fajr','2025-06-24 04:15:00','accepted','2025-06-24 04:17:00',0,NULL,'2025-06-24 02:17:40','2025-06-24 02:17:40'),(9,12,'insaf01','0772648650','2025-06-23','Fajr','2025-06-23 04:15:00','declined','2025-06-23 04:17:00',0,NULL,'2025-06-24 02:17:41','2025-06-24 02:17:41'),(10,12,'insaf01','0772648650','2025-06-24','Fajr','2025-06-24 04:15:00','accepted','2025-06-24 04:17:00',0,NULL,'2025-06-24 02:17:42','2025-06-24 02:17:42');
/*!40000 ALTER TABLE `prayer_calls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prayer_times`
--

DROP TABLE IF EXISTS `prayer_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_times`
--

LOCK TABLES `prayer_times` WRITE;
/*!40000 ALTER TABLE `prayer_times` DISABLE KEYS */;
INSERT INTO `prayer_times` VALUES (1,1,'2025-06-11','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:55','2025-06-11 20:01:55'),(2,1,'2025-06-12','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:55','2025-06-11 20:01:55'),(3,1,'2025-06-13','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:56','2025-06-11 20:01:56'),(4,1,'2025-06-14','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:56','2025-06-11 20:01:56'),(5,1,'2025-06-15','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:56','2025-06-11 20:01:56'),(6,1,'2025-06-16','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:56','2025-06-11 20:01:56'),(7,1,'2025-06-17','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:56','2025-06-11 20:01:56'),(8,1,'2025-06-18','05:30:00','12:30:00','15:45:00','18:20:00','19:45:00','2025-06-11 20:01:57','2025-06-11 20:01:57');
/*!40000 ALTER TABLE `prayer_times` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prayers`
--

DROP TABLE IF EXISTS `prayers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=268 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayers`
--

LOCK TABLES `prayers` WRITE;
/*!40000 ALTER TABLE `prayers` DISABLE KEYS */;
INSERT INTO `prayers` VALUES (1,1,1,'Fajr','2025-06-09',NULL,'prayed','mosque',NULL,'2025-06-10 06:23:25','2025-06-10 15:51:48',0,0),(2,1,1,'Dhuhr','2025-06-09',NULL,'prayed','mosque',NULL,'2025-06-10 06:23:26','2025-06-11 21:25:57',0,0),(84,1,1,'Fajr','2025-06-16',NULL,'prayed','mosque','On time prayer','2025-06-17 11:53:17','2025-06-17 14:42:08',0,0),(118,21,1,'Fajr','2025-06-21',NULL,'prayed','mosque',NULL,'2025-06-21 15:46:14','2025-06-21 15:46:14',0,0),(119,1,1,'Fajr','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-21 22:15:15','2025-06-21 22:15:15',0,0),(120,1,1,'Dhuhr','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-21 22:15:21','2025-06-21 22:15:21',0,0),(121,1,1,'Asr','2025-06-22',NULL,'prayed','home',NULL,'2025-06-21 22:15:22','2025-06-21 22:15:22',0,0),(122,1,1,'Maghrib','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-21 22:15:24','2025-06-21 22:15:24',0,0),(123,1,1,'Isha','2025-06-22',NULL,'prayed','home',NULL,'2025-06-21 22:15:26','2025-06-21 22:15:26',0,0),(124,21,1,'Maghrib','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-22 00:25:50','2025-06-22 08:31:28',0,0),(125,21,1,'Asr','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-22 08:30:33','2025-06-22 08:30:33',0,0),(126,21,1,'Dhuhr','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-22 08:30:52','2025-06-22 08:30:52',0,0),(127,21,1,'Fajr','2025-06-22',NULL,'prayed','mosque',NULL,'2025-06-22 08:30:58','2025-06-22 08:30:58',0,0),(128,21,1,'Fajr','2025-06-23',NULL,'prayed','mosque',NULL,'2025-06-23 07:54:52','2025-06-23 10:13:34',0,0),(129,21,1,'Dhuhr','2025-06-23',NULL,'prayed','mosque',NULL,'2025-06-23 08:47:53','2025-06-23 08:49:04',0,0),(130,21,1,'Asr','2025-06-23',NULL,'prayed','mosque',NULL,'2025-06-23 09:02:09','2025-06-23 09:02:09',0,0),(131,21,1,'Maghrib','2025-06-23',NULL,'prayed','mosque',NULL,'2025-06-23 09:45:39','2025-06-23 09:45:39',0,0),(132,21,1,'Isha','2025-06-23',NULL,'missed','home',NULL,'2025-06-23 09:57:22','2025-06-23 11:39:04',0,0),(133,21,1,'Dhuhr','2025-06-24',NULL,'prayed','mosque',NULL,'2025-06-24 10:40:14','2025-06-24 17:49:59',0,0),(134,21,1,'Fajr','2025-06-24',NULL,'prayed','mosque',NULL,'2025-06-24 17:49:53','2025-06-24 17:49:53',0,0),(135,21,1,'Asr','2025-06-24',NULL,'prayed','mosque',NULL,'2025-06-24 17:50:07','2025-06-24 17:50:07',0,0),(136,21,1,'Fajr','2025-06-25',NULL,'prayed','mosque',NULL,'2025-06-24 19:45:31','2025-06-25 02:46:32',0,0),(137,21,1,'Maghrib','2025-06-27',NULL,'prayed','mosque',NULL,'2025-06-27 09:47:33','2025-07-23 11:52:10',0,0),(138,23,1,'Fajr','2025-06-27',NULL,'prayed','mosque',NULL,'2025-06-27 09:47:36','2025-06-27 09:47:36',0,0),(139,18,1,'Fajr','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 13:51:15','2025-06-28 13:51:15',0,0),(140,18,1,'Dhuhr','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 13:51:16','2025-06-28 13:51:16',0,0),(141,18,1,'Asr','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 13:51:17','2025-06-28 13:51:17',0,0),(142,18,1,'Maghrib','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 13:51:18','2025-06-28 13:51:18',0,0),(143,18,1,'Isha','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 13:51:18','2025-06-28 13:51:18',0,0),(144,21,1,'Fajr','2025-06-28',NULL,'prayed','mosque',NULL,'2025-06-28 15:25:08','2025-06-28 15:25:08',0,0),(145,22,1,'Fajr','2025-06-29',NULL,'prayed','mosque',NULL,'2025-06-29 08:00:22','2025-06-29 08:00:22',0,0),(146,21,1,'Fajr','2025-07-01',NULL,'prayed','mosque',NULL,'2025-07-01 11:11:30','2025-07-01 11:11:30',0,0),(147,21,1,'Dhuhr','2025-07-01',NULL,'prayed','mosque',NULL,'2025-07-01 11:11:40','2025-07-01 11:11:40',0,0),(148,21,1,'Asr','2025-07-01',NULL,'prayed','mosque',NULL,'2025-07-01 11:13:24','2025-07-01 11:13:24',0,0),(149,22,1,'Fajr','2025-07-01',NULL,'prayed','mosque',NULL,'2025-07-01 11:14:56','2025-07-01 11:14:56',0,0),(150,21,1,'Fajr','2025-07-03',NULL,'prayed','mosque',NULL,'2025-07-03 08:05:20','2025-07-03 08:05:20',0,0),(151,36,1,'Asr','2025-07-08',NULL,'prayed','mosque',NULL,'2025-07-08 05:09:04','2025-07-08 12:29:12',0,0),(152,36,1,'Fajr','2025-07-08',NULL,'prayed','mosque',NULL,'2025-07-08 05:12:09','2025-07-08 12:29:05',0,0),(153,36,1,'Dhuhr','2025-07-08',NULL,'prayed','mosque',NULL,'2025-07-08 05:32:27','2025-07-08 12:29:07',0,0),(154,36,1,'Isha','2025-07-08',NULL,'missed','home',NULL,'2025-07-08 05:32:32','2025-07-08 06:36:18',0,0),(155,36,1,'Maghrib','2025-07-08',NULL,'missed','home',NULL,'2025-07-08 05:32:53','2025-07-08 06:36:17',0,0),(156,22,1,'Fajr','2025-07-08',NULL,'prayed','mosque',NULL,'2025-07-08 08:46:39','2025-07-08 08:52:39',0,0),(157,21,1,'Asr','2025-07-08',NULL,'missed','home',NULL,'2025-07-08 08:46:49','2025-07-08 08:46:49',0,0),(158,21,1,'Fajr','2025-07-08',NULL,'prayed','mosque',NULL,'2025-07-08 08:52:38','2025-07-08 08:52:38',0,0),(159,36,1,'Fajr','2025-07-09',NULL,'prayed','mosque',NULL,'2025-07-08 23:22:02','2025-07-08 23:22:02',0,0),(160,36,1,'Dhuhr','2025-07-09',NULL,'missed','home',NULL,'2025-07-08 23:22:04','2025-07-08 23:22:05',0,0),(161,21,1,'Fajr','2025-07-09',NULL,'missed','home',NULL,'2025-07-09 17:15:05','2025-07-09 17:43:13',0,0),(162,21,1,'Dhuhr','2025-07-09',NULL,'missed','home',NULL,'2025-07-09 17:15:07','2025-07-09 17:41:02',0,0),(163,21,1,'Asr','2025-07-09',NULL,'prayed','mosque',NULL,'2025-07-09 17:15:28','2025-07-09 17:15:28',0,0),(164,21,1,'Maghrib','2025-07-09',NULL,'prayed','mosque',NULL,'2025-07-09 17:15:31','2025-07-09 17:15:31',0,0),(165,21,1,'Isha','2025-07-09',NULL,'prayed','mosque',NULL,'2025-07-09 17:40:58','2025-07-09 17:40:58',0,0),(166,22,1,'Fajr','2025-07-10',NULL,'prayed','mosque',NULL,'2025-07-10 03:33:57','2025-07-10 03:33:57',0,0),(167,22,1,'Dhuhr','2025-07-10',NULL,'prayed','mosque',NULL,'2025-07-10 06:23:10','2025-07-10 06:23:10',0,0),(168,22,1,'Asr','2025-07-10',NULL,'prayed','mosque',NULL,'2025-07-10 12:40:53','2025-07-10 12:40:53',0,0),(169,22,1,'Maghrib','2025-07-10',NULL,'prayed','mosque',NULL,'2025-07-10 12:40:59','2025-07-10 12:40:59',0,0),(170,21,1,'Fajr','2025-07-11',NULL,'prayed','mosque',NULL,'2025-07-11 05:27:26','2025-07-11 05:27:26',0,0),(171,22,1,'Fajr','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 05:12:33','2025-07-12 05:12:33',0,0),(172,21,1,'Fajr','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 13:51:09','2025-07-12 14:55:50',0,0),(173,21,1,'Dhuhr','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 13:51:33','2025-07-12 13:51:33',0,0),(174,21,1,'Asr','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 13:51:37','2025-07-12 13:51:37',0,0),(175,21,1,'Maghrib','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 13:51:39','2025-07-12 13:51:40',0,0),(176,21,1,'Isha','2025-07-12',NULL,'prayed','mosque',NULL,'2025-07-12 14:31:11','2025-07-12 14:53:12',0,0),(177,21,1,'Fajr','2025-07-13',NULL,'prayed','mosque',NULL,'2025-07-12 22:39:46','2025-07-13 01:49:26',0,0),(178,21,1,'Dhuhr','2025-07-13',NULL,'prayed','mosque',NULL,'2025-07-13 01:49:30','2025-07-13 01:49:30',0,0),(179,21,1,'Fajr','2025-07-14',NULL,'prayed','mosque',NULL,'2025-07-14 04:15:03','2025-07-14 04:15:03',0,0),(180,21,1,'Fajr','2025-06-17',NULL,'prayed','mosque','On time prayer','2025-07-19 05:50:16','2025-07-19 05:50:16',0,0),(181,21,1,'Fajr','2025-07-19',NULL,'prayed','mosque',NULL,'2025-07-19 06:01:02','2025-07-19 06:01:23',0,0),(182,21,1,'Dhuhr','2025-07-18',NULL,'prayed','mosque',NULL,'2025-07-19 06:17:15','2025-07-19 06:17:15',0,0),(183,21,1,'Asr','2025-07-18',NULL,'prayed','mosque',NULL,'2025-07-19 06:17:16','2025-07-19 06:17:16',0,0),(184,21,1,'Maghrib','2025-07-18',NULL,'prayed','mosque',NULL,'2025-07-19 06:17:17','2025-07-19 06:17:17',0,0),(185,16,1,'Fajr','2025-07-20',NULL,'prayed','mosque',NULL,'2025-07-20 01:32:12','2025-07-20 01:32:12',0,0),(186,16,1,'Asr','2025-07-20',NULL,'prayed','mosque',NULL,'2025-07-20 01:32:16','2025-07-20 01:32:16',0,0),(187,18,1,'Dhuhr','2025-07-20',NULL,'missed','mosque',NULL,'2025-07-20 01:35:06','2025-07-20 01:35:06',0,0),(188,18,1,'Maghrib','2025-07-20',NULL,'prayed','home',NULL,'2025-07-20 01:35:10','2025-07-20 01:35:35',0,0),(189,18,1,'Isha','2025-07-20',NULL,'missed','mosque',NULL,'2025-07-20 01:35:11','2025-07-20 01:35:11',0,0),(190,21,1,'Fajr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 11:45:32','2025-07-21 14:15:23',0,0),(191,22,1,'Maghrib','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 15:11:24','2025-07-21 15:11:24',0,0),(192,22,1,'Isha','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 15:11:26','2025-07-21 15:11:26',0,0),(193,40,1,'Isha','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 16:32:54','2025-07-21 16:32:54',0,0),(194,40,1,'Asr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 16:33:05','2025-07-21 16:33:05',0,0),(195,43,1,'Fajr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 16:53:37','2025-07-21 16:53:37',0,0),(196,46,1,'Fajr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 18:13:55','2025-07-21 18:13:55',0,0),(197,46,1,'Dhuhr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 18:13:58','2025-07-21 18:13:58',0,0),(198,46,1,'Asr','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 18:14:00','2025-07-21 18:14:00',0,0),(199,46,1,'Maghrib','2025-07-21',NULL,'prayed','mosque',NULL,'2025-07-21 18:14:02','2025-07-21 18:14:02',0,0),(200,36,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:39:59','2025-07-21 18:39:59',0,0),(201,36,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:40:01','2025-07-21 18:40:01',0,0),(202,36,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:40:03','2025-07-21 18:40:03',0,0),(203,36,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:40:05','2025-07-21 18:40:05',0,0),(204,36,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:40:06','2025-07-21 18:40:06',0,0),(205,57,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-21 18:48:02','2025-07-21 18:48:03',0,0),(206,43,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 00:04:48','2025-07-22 00:04:48',0,0),(207,71,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 00:17:42','2025-07-22 00:17:42',0,0),(208,54,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 00:52:19','2025-07-22 00:54:40',0,0),(209,22,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 03:00:08','2025-07-22 03:00:08',0,0),(210,39,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 06:13:05','2025-07-22 11:13:29',0,0),(211,54,1,'Dhuhr','2025-07-22',NULL,'missed','home',NULL,'2025-07-22 08:10:32','2025-07-22 08:10:32',0,0),(212,39,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 11:13:25','2025-07-22 11:13:26',0,0),(213,39,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 11:13:27','2025-07-22 11:13:27',0,0),(214,22,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 12:04:58','2025-07-22 12:04:59',0,0),(215,40,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 12:17:02','2025-07-22 12:17:02',0,0),(216,40,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 12:17:04','2025-07-22 12:17:04',0,0),(217,39,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 13:43:58','2025-07-22 13:43:59',0,0),(218,75,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:16:19','2025-07-22 15:16:19',0,0),(219,75,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:16:23','2025-07-22 15:16:24',0,0),(220,75,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:16:26','2025-07-22 15:16:26',0,0),(221,75,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:16:36','2025-07-22 15:16:37',0,0),(222,75,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:16:39','2025-07-22 15:16:39',0,0),(223,46,1,'Fajr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:52:42','2025-07-22 15:52:42',0,0),(224,46,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:52:45','2025-07-22 15:52:45',0,0),(225,46,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:52:46','2025-07-22 15:52:46',0,0),(226,46,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:52:49','2025-07-22 15:52:49',0,0),(227,46,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 15:52:51','2025-07-22 15:52:51',0,0),(228,39,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 16:17:45','2025-07-22 16:17:47',0,0),(229,57,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 16:39:17','2025-07-22 16:39:17',0,0),(230,57,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 16:39:18','2025-07-22 16:39:18',0,0),(231,57,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 16:39:20','2025-07-22 16:39:20',0,0),(232,57,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 16:39:24','2025-07-22 16:39:24',0,0),(233,71,1,'Dhuhr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 17:20:05','2025-07-22 17:20:06',0,0),(234,71,1,'Asr','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 17:20:11','2025-07-22 17:20:11',0,0),(235,71,1,'Maghrib','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 17:20:15','2025-07-22 17:20:15',0,0),(236,71,1,'Isha','2025-07-22',NULL,'prayed','mosque',NULL,'2025-07-22 17:20:22','2025-07-22 17:20:22',0,0),(237,57,1,'Fajr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 01:09:45','2025-07-23 01:09:45',0,0),(238,71,1,'Fajr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 02:00:44','2025-07-23 02:00:44',0,0),(239,55,1,'Fajr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 02:32:26','2025-07-23 02:32:26',0,0),(240,39,1,'Fajr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 09:14:36','2025-07-23 09:14:36',0,0),(241,39,1,'Dhuhr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 09:14:38','2025-07-23 09:14:39',0,0),(242,39,1,'Asr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 11:35:13','2025-07-23 11:35:13',0,0),(243,57,1,'Dhuhr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 11:41:55','2025-07-23 11:41:55',0,0),(244,57,1,'Asr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 11:41:57','2025-07-23 11:41:57',0,0),(245,71,1,'Dhuhr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 12:59:27','2025-07-23 12:59:28',0,0),(246,71,1,'Asr','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 12:59:31','2025-07-23 12:59:31',0,0),(247,39,1,'Maghrib','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 14:59:54','2025-07-23 14:59:55',0,0),(248,39,1,'Isha','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 14:59:56','2025-07-23 14:59:57',0,0),(249,57,1,'Maghrib','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 18:02:31','2025-07-23 18:02:32',0,0),(250,57,1,'Isha','2025-07-23',NULL,'prayed','mosque',NULL,'2025-07-23 18:02:33','2025-07-23 18:02:33',0,0),(251,46,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-23 23:19:46','2025-07-23 23:19:46',0,0),(252,71,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 05:25:36','2025-07-24 05:25:36',0,0),(253,39,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 07:44:50','2025-07-24 07:44:50',0,0),(254,39,1,'Dhuhr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 07:44:55','2025-07-24 07:44:55',0,0),(255,21,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 09:32:42','2025-07-24 09:32:42',0,0),(256,21,1,'Dhuhr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 09:32:45','2025-07-24 09:32:48',0,0),(257,76,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 10:40:47','2025-07-24 10:40:47',0,0),(258,71,1,'Dhuhr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 13:12:42','2025-07-24 13:12:42',0,0),(259,71,1,'Asr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 13:12:44','2025-07-24 13:12:44',0,0),(260,39,1,'Asr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 14:52:18','2025-07-24 14:52:19',0,0),(261,39,1,'Maghrib','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 14:52:20','2025-07-24 14:52:21',0,0),(262,39,1,'Isha','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 14:52:22','2025-07-24 14:52:22',0,0),(263,57,1,'Fajr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 16:53:19','2025-07-24 16:53:19',0,0),(264,57,1,'Dhuhr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 16:53:21','2025-07-24 16:53:21',0,0),(265,57,1,'Asr','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 16:53:23','2025-07-24 16:53:23',0,0),(266,57,1,'Maghrib','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 16:53:25','2025-07-24 16:53:25',0,0),(267,57,1,'Isha','2025-07-24',NULL,'prayed','mosque',NULL,'2025-07-24 16:53:27','2025-07-24 16:53:27',0,0);
/*!40000 ALTER TABLE `prayers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `full_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text,
  `area` varchar(100) DEFAULT NULL,
  `mobility` varchar(50) DEFAULT NULL,
  `living_on_rent` tinyint(1) DEFAULT '0',
  `zakath_eligible` tinyint(1) DEFAULT '0',
  `differently_abled` tinyint(1) DEFAULT '0',
  `muallafathil_quloob` tinyint(1) DEFAULT '0',
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
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testmember','member@prayertracker.com','+94-77-123-4567','$2b$10$xx9UbNta6xNxBslnW3YRZukK6V6vEcAnfJx8874tRF3O3gz9C3RqG','Member',1,'active','2025-06-09','2025-07-20 00:47:00','2025-06-10 06:23:21','2025-07-20 00:47:00',NULL,NULL,NULL,NULL,1,0,NULL,'Member','2000-12-12','625 ABC Street, Colombo',NULL,NULL,0,0,0,0),(2,'testfounder','founder@prayertracker.com','+94-77-234-5678','$2b$10$FArHAe9BWlpT61A/TccbueRdMAP6G85EpfUen1GMLlMxXrLBi8x4S','Founder',1,'active','2025-06-09','2025-06-17 22:48:43','2025-06-10 06:23:21','2025-07-23 05:36:54',NULL,NULL,'4538','2025-06-20 05:04:54',0,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(3,'testadmin','admin@prayertracker.com','+94-77-345-6789','$2b$10$FArHAe9BWlpT61A/TccbueRdMAP6G85EpfUen1GMLlMxXrLBi8x4S','SuperAdmin',NULL,'active','2025-06-09','2025-07-24 12:42:33','2025-06-10 06:23:22','2025-07-24 12:42:33',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(12,'insaf01','inshaf0420@gmail.com','0772648650','$2b$10$/.3HiHkCXFOUUBzb.dMHzOSiJ/KnEjMQRDDc8ayY2KlzMSRrLlBLG','Member',1,'active','2025-06-13','2025-06-16 14:25:19','2025-06-13 23:08:44','2025-06-16 14:25:19',NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(16,'abdullah','inshaf4online@gmail.com','0772648650','$2b$10$99wbgk2/0PA.4QJxY.vOIe9lxpgwZLFjpyFaUlcTFI26.1wokX97W','Member',1,'active','2025-06-16','2025-07-20 01:32:02','2025-06-17 15:01:43','2025-07-20 01:32:02',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(18,'amer','amershareef@ambitiousdevelopers.com','+1234567890','$2b$10$ZgZ8bAeCbdFGkXDMX2M3buPjLlMokZEp4BD85TvKaK7bB4x9v/LaG','Founder',1,'active','2025-06-16','2025-07-23 17:26:45','2025-06-17 15:50:25','2025-07-23 17:26:45',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0),(21,'taaalib','thalibaan25@gmail.com',NULL,'$2b$10$F4AKaBjMEnUEeNCJdwWXFuhdXk9EvllYNQlSPYZMVa6Wp./O/Bqce','Member',1,'active','2025-06-18','2025-07-24 04:49:20','2025-06-19 11:42:18','2025-07-24 04:49:20','cb1cd196d561830ec549ff71c68b1a26b29e913d4f22a2b5f1f61c0cf4c82eda','2025-06-19 18:14:10',NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(22,'fawaz','mfmjainudeen@gmail.com',NULL,'$2b$10$X63nmQK6lF4MxroG6zAIiuhSjt5BbEtIB7KAFIm7YrHa9lLGbx6q.','Founder',1,'active','2025-06-19','2025-07-24 05:44:33','2025-06-20 04:58:28','2025-07-24 05:44:33',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1988-05-04',NULL,NULL,'walking',0,0,0,0),(23,'testuser','fawaz@ambitiousdevelopers.com','0765368956','$2b$10$YlqAfNbaY9yGtfMmIkd3q.7pd3b5zb/J97MWXnAbFP1D.auptkid.','Member',1,'active','2025-06-19','2025-06-26 08:47:23','2025-06-20 05:03:18','2025-06-26 08:47:23',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(31,'amershareef','amershareef218@gmail.com','0771234567','$2b$10$VfpuaY4ATb7mOOzDhIPSme1J8xHi0f1ubLRuHgONQRv0dC416dATy','SuperAdmin',NULL,'active','2025-06-23','2025-07-24 12:51:58','2025-06-23 01:11:43','2025-07-24 12:51:58',NULL,NULL,NULL,NULL,1,0,NULL,'Amer Shareef','2002-12-18','69 Kawdana Road, Dehiwala, Sri Lanka','DEHIWALA [DE]','Walking',1,1,0,0),(33,'dhanish','dhanish@gmail.com','0712345678','$2b$10$2He29SvvfkTzd0dlWOGwgeABR6o5C6EYCI/Dlptyw/UPe0eDQ4Lqe','Member',1,'active','2025-06-25',NULL,'2025-06-25 22:48:26','2025-06-25 22:59:24',NULL,NULL,NULL,NULL,0,0,NULL,'Dhanish','2005-04-01','123 Kawdana Road','DEHIWALA [DE]','Car',1,1,1,1),(35,'ahamednaushad','ahamednaushad13901390@gmail.com','071236549','$2b$10$Q2M794wTKd7GiFoG62d7PeEV28D1NPXyqxzCbCbXFrkDKscXkrJWK','Member',1,'active','2025-06-27',NULL,'2025-06-27 16:48:56','2025-06-27 16:48:56',NULL,NULL,NULL,NULL,0,0,NULL,'Ahmed Naushad','2025-06-01','01 First Lane','RATMALANA [RT]','Walking',1,0,0,0),(36,'fajr','fajrcouncil123@gmail.com','0763222222','$2b$10$Q1We1wuLoMLNzMr8TPPc6uFBbVhA1kM0Wf0/fyyavp/oxYBuQV9oy','Founder',1,'active','2025-07-08','2025-07-08 05:08:37','2025-07-08 05:07:03','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,'fajr','1999-07-14','Raymond Road','NUGEGODA [NU]','Car',0,0,0,0),(37,'oldmember','oldmember@example.com','1234567890','$2b$10$i4T5y0oHm/DNwiZNGnQmrelJ8vOi/hF2iKCV/kM.rSf/iN.toPscG','Member',NULL,'active','2025-07-18',NULL,'2025-07-18 02:57:25','2025-07-18 13:44:44',NULL,NULL,'7881','2025-07-18 03:14:50',0,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(39,'Abdul','abdulhaaliq63@gmail.com','0742899875','$2b$10$AwhGtvhcs/dRNIiO7ImUS.YmuReaGdGX.1G6sgcKlIo2NqWrAmLQy','Founder',1,'active','2025-07-21','2025-07-21 23:02:14','2025-07-21 12:22:18','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,'2025-07-21 16:44:32',NULL,'2006-08-15','Gothatuwa ',NULL,'walking',0,0,0,0),(40,'Siraj','sirajshibly@gmail.com',NULL,'$2b$10$64d1PGililk/aA1fHvhajOab0XKet3Q/pZCeGXe3UCbeWjgr5w3mq','Founder',1,'active','2025-07-21','2025-07-21 16:21:05','2025-07-21 12:22:18','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,'392/8 b, Pathan Waththe, Gothatuwa.',NULL,NULL,0,0,0,0),(41,'Zaid','zaidmfaizel@gmail.com','721574798','$2b$10$d1i76s5VuwiaCp5OqQikb.Gt8.eUTzlBLVN9rVw692fMazkyA1BuO','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:19','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Zaid',NULL,'Dehiwala',NULL,NULL,0,0,0,0),(42,'Arkam','Arkamrizvi5@gmail.com','754493161','$2b$10$bGVmUyRXl5ByKH14NNEJMuY1O4cgHidYF16Rn5TVVk5WtCxL0ljnq','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:19','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Arkam',NULL,'Wattala',NULL,NULL,0,0,0,0),(43,'Rizny','fafarz@gmail.com','0778882722','$2b$10$wCLPoZ1KdCNvoioaL7kQFeQfdurI3YvrqivyvX39l0.yqEfraD4ZW','Founder',1,'active','2025-07-21','2025-07-21 16:51:43','2025-07-21 12:22:19','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1981-05-29','Gothatuwa ',NULL,'walking',0,0,0,0),(44,'Aazim','Azaaa4332@gmail.com','787221559','$2b$10$aEMDdGEA/MZAcAgHMlvQs.VLn93C0AxU8S0c5.BynWEI.pRJO5u3a','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:20','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Aazim',NULL,'Negombo',NULL,NULL,0,0,0,0),(45,'Wazni','wazni3809@gmail.com','720208411','$2b$10$kDggYEmvZ2mRgsayTEHDMuC1KeQ1gIkgIm.xMeqmhQk4g21s4hZcS','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:20','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Wazni ahmed',NULL,'Dehiwala',NULL,NULL,0,0,0,0),(46,'Nazeer','nazhalal@gmail.com','0773606960','$2b$10$1qTaYWVg0/DK5weOOi2./eX6.1/rWYktjYhi2ej0RIOA9mSh3KUh6','Founder',1,'active','2025-07-21','2025-07-21 18:11:00','2025-07-21 12:22:21','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1976-09-22',NULL,NULL,'motorcycle',1,0,0,0),(47,'Shafras','Seyedhshafraz@gmail.com','770453172','$2b$10$wOtaepTFYeoVVIN203PL6esf7NlRG53c/gpuzQWsLNKK7Jee8f5xq','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:21','2025-07-23 12:45:49',NULL,NULL,NULL,NULL,0,1,NULL,'Shafras Ibrahim',NULL,'Panadura',NULL,NULL,0,0,0,0),(48,'Umar','umar.azeez18@gmail.com','755528964','$2b$10$clGu6Yxsf.jKXMdovakQ..HcAalEEqc4G5XdKreqy0sMPxL1LdHda','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:21','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Umar Manigamulla',NULL,'Mount Lavinia',NULL,NULL,0,0,0,0),(49,'Seyed','seyedhazar@gmail.com','721767977','$2b$10$R.Ax7KKNHeqNnniMFlF6tOdj17Gka3hhiE4gDH/8lcCo56qGuc6ei','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:22','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Seyed',NULL,'Colombo',NULL,NULL,0,0,0,0),(50,'Azam','azham1983@gmail.com','782150336','$2b$10$968DTF9d5e9ElHunvC3nKO2Is74ZQiyD1fi2r.4Kywh34xQse6fyi','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:22','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Azam',NULL,'Moratuwa',NULL,NULL,0,0,0,0),(51,'Rifaz','coolrifaz8@gmail.com','780855646','$2b$10$lLiJkQgjFljcDF1WfZnaHO4SZJQFCjE.ZFb2P6xEehpRwDJFkBhG2','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:23','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Rifaz',NULL,'Wellampitiya',NULL,NULL,0,0,0,0),(52,'Irshad','irshad@glslogistics.com','783428462','$2b$10$YT40Pz4x17ws340f7A./yezk6zZjrCMfSayc2kMtwuL65jvQnRshG','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:23','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Irshad',NULL,'Panadura',NULL,NULL,0,0,0,0),(53,'Rilwan','smart.mobiles047@gmail.com','718514791','$2b$10$Z2BcorPQ4KdVzYZchaTj8uegUCJjPcvaEFeVPdr8kUYL6utW2gJ.m','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:24','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Rilwan',NULL,'Colombo',NULL,NULL,0,0,0,0),(54,'Atheek','atheek695@gmail.com',NULL,'$2b$10$NVgQpm3KWENKKtqd81wuM.MKcrtEZOZ.bORLwUZjjj6LLmCyJaHy6','Founder',1,'active','2025-07-21','2025-07-22 00:51:43','2025-07-21 12:22:24','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0),(55,'Athif','athifborham89@gmail.com','0773534021','$2b$10$RwoQ6LMHfxruUTTxGusSHuxJXu.SaF5i9cLebFDD39AsKKxdwqxai','Founder',1,'active','2025-07-21','2025-07-22 01:41:31','2025-07-21 12:22:24','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'2002-11-07','Gothatuwa',NULL,'motorcycle',0,0,0,0),(56,'Nazar','mnaza4u@gmail.com','716549669','$2b$10$qc.rukVNMiUhK9mdFDwXKevIp1Hj7czVS9RVig4HID4il2lVHr6/C','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:25','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Nazar',NULL,'Moratuwa',NULL,NULL,0,0,0,0),(57,'Minhaj','minhajmanzil.m2@gmail.com','0762548008','$2b$10$OLt3/hVPCgu.1G4hf.m7Au1Ppig.OLabXUUmiBaLsiw75otmfbpTm','Founder',1,'active','2025-07-21','2025-07-21 18:45:22','2025-07-21 12:22:25','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1997-08-23','Gothatuwa',NULL,'motorcycle',0,0,0,0),(58,'Rifakath','rifakathm@gmail.com','789211450','$2b$10$FY8C0QUKwcPVJlNgEpVoAuC9V0mbrMvkMpeq9.9LujhMS27wrC/yi','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:26','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Rifakath',NULL,'Moratuwa',NULL,NULL,0,0,0,0),(59,'Fazil','mohamedfazil454@gmail.com','789624642','$2b$10$VkAGvY3664LJYETRyBoKyeb4V0OaGw2nFd97a1SL8lAY5OPoo6GhW','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:26','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Fazil Rashad',NULL,'Negombo',NULL,NULL,0,0,0,0),(60,'Inham','inzaham@yahoo.com','720426131','$2b$10$hHyUWz8hZ2yRvyDyPcGRZ.CMQkt6P2nriHLaaD5GqdniVDuYL.e3G','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:27','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Inham',NULL,'Dehiwala',NULL,NULL,0,0,0,0),(61,'Aasim','aasimmuhaimin929@gmail.com','720802345','$2b$10$Y09ao3GTsRhZVNiriO2RMOasryKjLWp5pVObYWOdBYEUV.5KgEdua','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:28','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Aasim Mufthi',NULL,'Wellampitiya',NULL,NULL,0,0,0,0),(62,'Arshad','arshadhumaidi@gmail.com','777899587','$2b$10$Kzw/h.yLnQT/1XDMaoRKluv7NIuMMb5T.j.isZum0O7EJYjPRomc.','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:29','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Arshad Moulavi',NULL,'Wellampitiya',NULL,NULL,0,0,0,0),(64,'Sasi','sasi@glslogistics.com','750559120','$2b$10$.IsGAnRRXrYC.jqVNdUJHuqcgaSLbVxHK8Vl1l7CRr8ifNBeMZSYC','Founder',1,'active','2025-07-21',NULL,'2025-07-21 12:22:29','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Sasi',NULL,'Colombo',NULL,NULL,0,0,0,0),(68,'AbdulM','abdulmxlik25@gmail.com','713376086','$2b$10$YLpJLHZqyaRejEPS1wBbKOHu0VQP5YlJp86larQdUiMNm81kgVTH2','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:04:45','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Abdul Malik',NULL,'Moratuwa',NULL,NULL,0,0,0,0),(69,'Faizer','faizer1411@gmail.com','718133299','$2b$10$/8G0P7d/mhAT.Z2Ibm99y.eM/pZADVWb20Zra5UQ5ukfrilQUDy8W','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:07:01','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Faizer',NULL,'Panadura',NULL,NULL,0,0,0,0),(70,'Ahamed','ahamednashadahmednashad@gmail.com','759476753','$2b$10$hH3C31xKT9AQ8hha76ahw.NPvr1kUQ9YtPRmnAUYD7doNin/ecYj6','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:11:55','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Ahamed Nashad',NULL,'Dehiwala',NULL,NULL,0,0,0,0),(71,'Muhammed','muhammedumar4747@gmail.com','0776668547','$2b$10$Y9qqKfnb3QtNgpy/VESMc.hIQiKSEe8TyNMBioaI/IUZmASwZtyju','Founder',1,'active','2025-07-21','2025-07-22 00:14:44','2025-07-21 13:14:46','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1997-08-02','Wellampitiya',NULL,'walking',1,0,0,0),(72,'ShafrasS','shafrazshiyam0@gmail.com','07343323453','$2b$10$zGSCAluxkuu4aouZfaJi7OgkSdWceMimC6AAC.8dpbNK1KpeuIbcy','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:21:35','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Shafras Shiyam ',NULL,'Dehiwala',NULL,NULL,0,1,0,0),(73,'FazilH','trillionin1@gmail.com','0763453234','$2b$10$8edqEo5cen6XMf6IXYa1CeqpfGga8rPWefAw/hlntgYd9y0AuTMeK','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:22:53','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Fazil Hussain',NULL,'Colombo',NULL,NULL,0,0,0,0),(74,'MinhajA','minhajahaj@gmail.com','0764532347','$2b$10$ojv769MPyVeWXyH1VDVA2.OU/dxGJq88MiEqVCiSdcViWLyDNohlu','Founder',1,'active','2025-07-21',NULL,'2025-07-21 13:24:41','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,0,0,NULL,'Minhaj',NULL,'Panadura',NULL,NULL,0,1,0,0),(75,'AhmedN','ahmednaushad123@icloud.com',NULL,'$2b$10$Icmc28jvzHnydEBsQf6dLuSSwE4lhL7JDS3nmi0A8EhtVBNIvqPZG','Founder',1,'active','2025-07-21','2025-07-22 06:57:34','2025-07-21 13:27:07','2025-07-23 05:36:54',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1998-03-01','Colombo 02',NULL,'walking',0,0,0,0),(76,'Nabeel','mhmd_nabeel@yahoo.com','0777135531','$2b$10$1o1AwdoCjN2.2uox97nYI.iYZKHPhggSjODFgQR.G7e.lB7GvaxGu','Founder',1,'active','2025-07-22','2025-07-24 10:40:10','2025-07-22 07:40:22','2025-07-24 15:17:09',NULL,NULL,NULL,NULL,1,0,NULL,NULL,'1984-10-26','Maniggamulla',NULL,'car',0,0,0,0),(78,'altairibnlaahad','altair@fajrapp.com','0112345678','$2b$10$mR09ldMNzv2Z5XEyWKeQZ.bK3Y.g7VU1kl3Z3CFTe07qNtAgBGCe2','SuperAdmin',NULL,'active','2025-07-23',NULL,'2025-07-23 06:18:53','2025-07-23 06:18:53',NULL,NULL,NULL,NULL,0,0,NULL,'Altair Ibn La Ahad','2011-02-23','37 Eagle\'s Perch Lane','Rathmalana Jummah Masjid','Walking',1,0,0,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wake_up_calls`
--

DROP TABLE IF EXISTS `wake_up_calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wake_up_calls` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `call_response` enum('accepted','declined','no_answer') NOT NULL,
  `response_time` timestamp NOT NULL,
  `call_date` date NOT NULL,
  `call_time` time NOT NULL,
  `prayer_type` enum('Fajr','Dhuhr','Asr','Maghrib','Isha') DEFAULT 'Fajr',
  `member_id` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mosque_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_call_response` (`call_response`),
  KEY `idx_call_date` (`call_date`),
  KEY `idx_prayer_type` (`prayer_type`),
  KEY `idx_mosque_id` (`mosque_id`),
  KEY `idx_response_time` (`response_time`),
  CONSTRAINT `wake_up_calls_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wake_up_calls_ibfk_2` FOREIGN KEY (`mosque_id`) REFERENCES `mosques` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wake_up_calls`
--

LOCK TABLES `wake_up_calls` WRITE;
/*!40000 ALTER TABLE `wake_up_calls` DISABLE KEYS */;
INSERT INTO `wake_up_calls` VALUES (1,1,'testmember','accepted','2025-06-24 23:00:00','2025-06-24','04:30:00','Fajr','GE0001','+94-77-123-4567',1,'2025-06-24 20:27:14','2025-06-24 20:27:14'),(2,2,'testfounder','declined','2025-06-24 23:01:00','2025-06-24','04:30:00','Fajr','GE0002','+94-77-234-5678',1,'2025-06-24 20:27:14','2025-06-24 20:27:14'),(4,18,'amer','accepted','2024-01-15 04:31:00','2024-01-15','04:30:00','Fajr','GE0018','0765428567',1,'2025-06-24 20:32:00','2025-06-24 20:32:00'),(5,21,'taaalib','accepted','2025-06-25 02:01:56','2025-06-25','07:31:00','Fajr','GE0021',NULL,1,'2025-06-25 02:01:19','2025-06-25 02:01:55'),(6,21,'taaalib','accepted','2025-07-04 19:52:03','2025-07-04','01:21:00','Fajr','GE0021','0765368956',1,'2025-07-04 11:14:42','2025-07-04 19:52:02'),(7,21,'taaalib','declined','2025-07-24 05:20:24','2025-07-24','10:50:00','Fajr','GE0021',NULL,1,'2025-07-24 02:04:47','2025-07-24 05:20:24');
/*!40000 ALTER TABLE `wake_up_calls` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-24 22:46:32
