/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rl_arquivo_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rl_arquivo_chamado` (
  `id_arquivo` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) NOT NULL,
  `ds_caminho_arquivo` longtext COLLATE utf8_bin,
  PRIMARY KEY (`id_arquivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rl_chamado_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rl_chamado_usuario` (
  `id_chamado` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_aceito` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rl_empresa_localizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rl_empresa_localizacao` (
  `id_empresa` int(11) DEFAULT NULL,
  `id_localizacao` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rl_usuario_empresa_localizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rl_usuario_empresa_localizacao` (
  `id_usuario` int(11) DEFAULT NULL,
  `id_empresa` int(11) DEFAULT NULL,
  `id_localizacao` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_chamados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_chamados` (
  `id_chamado` int(11) NOT NULL AUTO_INCREMENT,
  `ds_titulo` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `ds_descricao` longtext COLLATE utf8_bin,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_data_chamado` datetime DEFAULT NULL,
  `st_status` int(11) DEFAULT '0',
  `id_empresa` int(11) DEFAULT NULL,
  `id_localizacao` int(11) DEFAULT NULL,
  `id_tipo_chamado` int(11) DEFAULT NULL,
  `id_motivo_principal` int(11) DEFAULT NULL,
  `id_motivo_associado` int(11) DEFAULT NULL,
  `ds_patrimonio` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `st_grau` int(11) DEFAULT NULL,
  `dt_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id_chamado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_chamados_provisorio_wpp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_chamados_provisorio_wpp` (
  `id_chamado_wpp` int(11) NOT NULL AUTO_INCREMENT,
  `ds_numero` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `ds_titulo` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `ds_descricao` longtext COLLATE utf8_bin,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_data_chamado` datetime DEFAULT NULL,
  `st_status` int(11) DEFAULT '0',
  `id_empresa` int(11) DEFAULT NULL,
  `id_localizacao` int(11) DEFAULT NULL,
  `id_tipo_chamado` int(11) DEFAULT NULL,
  `id_motivo_principal` int(11) DEFAULT NULL,
  `id_motivo_associado` int(11) DEFAULT NULL,
  `ds_patrimonio` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `st_grau` int(11) DEFAULT NULL,
  `st_anexo` varchar(1) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id_chamado_wpp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_chat_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_chat_chamado` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `ds_mensagem` text COLLATE utf8mb4_unicode_ci,
  `ds_caminho_arquivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dt_envio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dt_leitura` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tb_chat_chamado_id_chamado_index` (`id_chamado`),
  KEY `tb_chat_chamado_id_usuario_index` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_chat_tecnico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_chat_tecnico` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `ds_mensagem` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ds_caminho_arquivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dt_envio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tb_chat_tecnico_id_usuario_index` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_comentario_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_comentario_chamado` (
  `id_comentario_chamado` int(11) NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) NOT NULL,
  `ds_comentario` longtext COLLATE utf8_bin,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_comentario` datetime DEFAULT NULL,
  PRIMARY KEY (`id_comentario_chamado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_empresa` (
  `id_empresa` int(11) NOT NULL AUTO_INCREMENT,
  `ds_empresa` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `nu_cnpj` int(11) DEFAULT NULL,
  `ds_endereco` longtext COLLATE utf8_bin,
  `nu_telefone` bigint(20) DEFAULT NULL,
  `ds_email` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  `ds_responsavel` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  `st_status` varchar(1) COLLATE utf8_bin DEFAULT 'A',
  PRIMARY KEY (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_historico_edicao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_historico_edicao` (
  `id_historico` int(11) NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id_historico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_historico_status_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_historico_status_chamado` (
  `id_historico` int(11) NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) NOT NULL,
  `st_status` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `dt_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id_historico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_historico_usuario_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_historico_usuario_chamado` (
  `id_historico` int(11) NOT NULL AUTO_INCREMENT,
  `id_chamado` int(11) NOT NULL,
  `id_usuario_adm` int(11) DEFAULT NULL,
  `id_usuario_desginado` int(11) DEFAULT NULL,
  `dt_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id_historico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_localizacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_localizacao` (
  `id_localizacao` int(11) NOT NULL AUTO_INCREMENT,
  `ds_localizacao` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `st_ativo` varchar(1) COLLATE utf8_bin DEFAULT 'A',
  PRIMARY KEY (`id_localizacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_motivo_associado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_motivo_associado` (
  `id_motivo_associado` int(11) NOT NULL AUTO_INCREMENT,
  `id_motivo_principal` int(11) NOT NULL,
  `ds_descricao_motivo` text COLLATE utf8_bin NOT NULL,
  `id_empresa` int(11) DEFAULT NULL,
  `st_ativo` varchar(1) COLLATE utf8_bin DEFAULT 'A',
  PRIMARY KEY (`id_motivo_associado`),
  KEY `id_motivo_principal` (`id_motivo_principal`),
  CONSTRAINT `tb_motivo_associado_ibfk_1` FOREIGN KEY (`id_motivo_principal`) REFERENCES `tb_motivo_principal` (`id_motivo_principal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_motivo_principal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_motivo_principal` (
  `id_motivo_principal` int(11) NOT NULL AUTO_INCREMENT,
  `ds_descricao` varchar(200) COLLATE utf8_bin NOT NULL,
  `id_tipo_chamado` tinyint(4) NOT NULL COMMENT '1 = Infra, 2 = Sistema',
  `st_ativo` varchar(1) COLLATE utf8_bin DEFAULT 'A',
  PRIMARY KEY (`id_motivo_principal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_patrimonio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_patrimonio` (
  `id_patrimonio` int(11) NOT NULL AUTO_INCREMENT,
  `ds_codigo` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `id_tipo_produto` int(11) NOT NULL,
  `ds_marca` varchar(500) COLLATE utf8_bin DEFAULT NULL,
  `ds_modelo` varchar(500) COLLATE utf8_bin DEFAULT NULL,
  `ds_num_serie` varchar(500) COLLATE utf8_bin DEFAULT NULL,
  `id_empresa` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_patrimonio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_perfil` (
  `id_perfil` int(11) NOT NULL,
  `ds_perfil` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_perfil`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_tipo_chamado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_tipo_chamado` (
  `id_tipo_chamado` int(11) NOT NULL AUTO_INCREMENT,
  `ds_tipo_chamado` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `st_ativo` varchar(1) COLLATE utf8_bin DEFAULT 'A',
  PRIMARY KEY (`id_tipo_chamado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_tipo_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_tipo_produto` (
  `id_tipo_produto` int(11) NOT NULL AUTO_INCREMENT,
  `ds_produto` longtext COLLATE utf8_bin,
  PRIMARY KEY (`id_tipo_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_usuario` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ds_usuario` varchar(45) DEFAULT NULL,
  `ds_nome` varchar(45) DEFAULT NULL,
  `ds_email` varchar(100) DEFAULT NULL,
  `ds_senha` varchar(255) DEFAULT NULL,
  `st_ativo` char(1) DEFAULT 'A',
  `id_perfil` int(11) DEFAULT NULL,
  `nu_telefone` bigint(20) DEFAULT NULL,
  `nu_cep` int(11) DEFAULT NULL,
  `ds_endereco` longtext,
  `st_reset_senha` int(11) DEFAULT '0',
  `dt_update` datetime DEFAULT NULL,
  `dt_insert` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tb_usuario_laravel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_usuario_laravel` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ds_usuario` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `ds_nome` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `ds_email` varchar(100) CHARACTER SET utf8 DEFAULT NULL,
  `ds_foto` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `ds_senha` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `st_ativo` char(1) CHARACTER SET utf8 DEFAULT 'A',
  `id_perfil` int(11) DEFAULT NULL,
  `nu_telefone` bigint(20) DEFAULT NULL,
  `nu_cep` int(11) DEFAULT NULL,
  `ds_endereco` longtext CHARACTER SET utf8,
  `st_reset_senha` int(11) DEFAULT '0',
  `dt_update` datetime DEFAULT NULL,
  `dt_insert` datetime DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8_bin DEFAULT NULL,
  `preferencias` json DEFAULT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `preferencias` json DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2026_02_13_164726_add_preferencias_to_users_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2026_02_23_111851_create_notifications_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2026_02_23_134105_add_ds_foto_to_users_table',3);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2026_02_23_172740_create_tb_chat_chamado_table',4);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2026_02_24_165454_add_dt_leitura_to_tb_chat_chamado_table',5);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2026_02_24_201413_create_tb_chat_tecnico_table',6);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2026_02_13_164726_add_preferencias_to_users_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2026_02_23_111851_create_notifications_table',2);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2026_02_23_134105_add_ds_foto_to_users_table',3);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2026_02_23_172740_create_tb_chat_chamado_table',4);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2026_02_24_165454_add_dt_leitura_to_tb_chat_chamado_table',5);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2026_02_24_201413_create_tb_chat_tecnico_table',6);
