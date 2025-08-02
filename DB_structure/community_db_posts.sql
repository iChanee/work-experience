CREATE DATABASE  IF NOT EXISTS `community_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `community_db`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: community_db
-- ------------------------------------------------------
-- Server version	8.0.42

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

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `post_id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author` varchar(64) NOT NULL,
  `img_url` varchar(512) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `comments` int DEFAULT '0',
  PRIMARY KEY (`post_id`),
  UNIQUE KEY `uniq_posttype_postid` (`type`,`post_id`),
  KEY `idx_type_created_at` (`type`,`created_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (2,'board','asf','asdf','test1',NULL,'2025-07-28 01:23:01',2),(3,'board','s','s','test1',NULL,'2025-07-28 01:23:08',1),(4,'board','d','a','tewe',NULL,'2025-07-29 13:49:32',4),(16,'board','a','a','ㅂㅂ','/uploads/image-1753879911473.png','2025-07-30 21:51:53',0),(17,'board','s','a','ㅂㅂ','/uploads/image-1753880126691.png','2025-07-30 21:55:28',0),(18,'board','d','d','ㅂㅂ','/uploads/image-1753880164973.png','2025-07-30 21:56:06',0),(19,'board','d','d','ㅂㅂ','/uploads/image-1753880180908.jpg','2025-07-30 21:56:22',0),(20,'board','q','q','ㅂㅂ',NULL,'2025-07-30 22:03:12',0),(21,'board','d','d','ㅂㅂ',NULL,'2025-07-30 22:04:05',0),(22,'board','e','e','ㅂㅂ','/uploads/image-1753880652844.png','2025-07-30 22:04:15',0),(24,'webmagazine','CTI Webzine 06월호 VOL.247 유연한 전력, 정밀한 제어 DC Power Supply Asterion Series','웹매거진 6월호','test1','/uploads/ì¹ ë§¤ê±°ì§ 2-1754122548921.jpg','2025-08-02 17:16:07',0),(25,'webmagazine','CTI Webzine 07월호 VOL.248 전원 트러블 슈팅을 더욱 정확하고 간편하게! 전원품질 아날라이저 PQ3198','웹매거진 7월호','test1','/uploads/ì¹ ë§¤ê±°ì§ 1-1754122633900.jpg','2025-08-02 17:17:27',0),(26,'webmagazine','CTI Webzine 05월호 VOL.246 IP등급 테스트를 위한 BONAD Test Probe 시리즈로 IEC/EN 규격 완벽 대응!','웹매거진 5월호','test1','/uploads/ì¹ ë§¤ê±°ì§ 3-1754125581686.jpg','2025-08-02 18:06:31',0),(27,'webmagazine','CTI Webzine 04월호 VOL.245 버튼 하나로 쉽고 빠르게! 연소가스 분석 시스템 testo 350K','웹매거진 4월호','test1','/uploads/ì¹ ë§¤ê±°ì§ 4-1754125607617.jpg','2025-08-02 18:06:55',0),(28,'webmagazine','CTI Webzine 03월호 VOL.244 미세 절연 결함, 듀얼 모드로 완벽 탐지! 부분 방전 검출기 ST4200','웹매거진 3월호','test1','/uploads/ì¹ ë§¤ê±°ì§ 5-1754127402953.jpg','2025-08-02 18:36:56',0);
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-02 18:55:04
