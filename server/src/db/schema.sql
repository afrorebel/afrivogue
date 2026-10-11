-- AfriVogue database schema (MySQL 8 / MariaDB 10.6+). Applied automatically on every start;
-- every statement is IF NOT EXISTS. Add new tables at the end and mirror them in registry.json.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `article_submissions` (
  `admin_notes` MEDIUMTEXT NULL,
  `category` VARCHAR(255) NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `images` JSON NULL,
  `meta_description` MEDIUMTEXT NULL,
  `points_awarded` INT NULL DEFAULT 0,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `tags` JSON NULL,
  `title` MEDIUMTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_article_submissions_category` (`category`),
  KEY `ix_article_submissions_created_at` (`created_at`),
  KEY `ix_article_submissions_status` (`status`),
  KEY `ix_article_submissions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bundle_items` (
  `bundle_id` CHAR(36) NOT NULL,
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_bundle_items_bundle_id` (`bundle_id`),
  KEY `ix_bundle_items_product_id` (`product_id`),
  UNIQUE KEY `uq_bundle_items_bundle_id_product_id` (`bundle_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `color` MEDIUMTEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `reminder_sent_at` DATETIME(3) NULL,
  `size` MEDIUMTEXT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_cart_items_created_at` (`created_at`),
  KEY `ix_cart_items_product_id` (`product_id`),
  KEY `ix_cart_items_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `parent_id` CHAR(36) NULL,
  PRIMARY KEY (`id`),
  KEY `ix_categories_created_at` (`created_at`),
  UNIQUE KEY `uq_categories_name` (`name`),
  KEY `ix_categories_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `content` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `trend_id` CHAR(36) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_comments_created_at` (`created_at`),
  KEY `ix_comments_trend_id` (`trend_id`),
  KEY `ix_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_email_log` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `email` VARCHAR(255) NOT NULL,
  `id` CHAR(36) NOT NULL,
  `metadata` JSON NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'sent',
  `template_name` MEDIUMTEXT NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_crm_email_log_created_at` (`created_at`),
  KEY `ix_crm_email_log_status` (`status`),
  KEY `ix_crm_email_log_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cross_sell_rules` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `priority` INT NOT NULL DEFAULT 0,
  `recommended_product_id` CHAR(36) NOT NULL,
  `source_product_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_cross_sell_rules_created_at` (`created_at`),
  KEY `ix_cross_sell_rules_recommended_product_id` (`recommended_product_id`),
  KEY `ix_cross_sell_rules_source_product_id` (`source_product_id`),
  UNIQUE KEY `uq_cross_sell_rules_source_product_id_recommended_product_id` (`source_product_id`, `recommended_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_segments` (
  `color` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `criteria` JSON NOT NULL,
  `description` MEDIUMTEXT NOT NULL,
  `id` CHAR(36) NOT NULL,
  `name` MEDIUMTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_customer_segments_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `discount_codes` (
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `code` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `discount_type` MEDIUMTEXT NOT NULL,
  `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `expires_at` DATETIME(3) NULL,
  `id` CHAR(36) NOT NULL,
  `max_uses` INT NULL,
  `min_order` DECIMAL(12,2) NULL DEFAULT 0,
  `times_used` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_discount_codes_code` (`code`),
  KEY `ix_discount_codes_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorite_authors` (
  `author_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_favorite_authors_author_id` (`author_id`),
  KEY `ix_favorite_authors_created_at` (`created_at`),
  KEY `ix_favorite_authors_user_id` (`user_id`),
  UNIQUE KEY `uq_favorite_authors_user_id_author_id` (`user_id`, `author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `forecasts` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `domain` VARCHAR(255) NOT NULL,
  `evidence` MEDIUMTEXT NOT NULL,
  `horizon` VARCHAR(255) NOT NULL,
  `id` CHAR(36) NOT NULL,
  `implications` MEDIUMTEXT NOT NULL,
  `projection` MEDIUMTEXT NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `published_date` DATE NOT NULL,
  `region` VARCHAR(255) NOT NULL,
  `signal_strength` MEDIUMTEXT NOT NULL,
  `title` MEDIUMTEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_forecasts_created_at` (`created_at`),
  KEY `ix_forecasts_published` (`published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `moodboard_items` (
  `approved` TINYINT(1) NOT NULL DEFAULT 0,
  `caption` MEDIUMTEXT NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `image_url` MEDIUMTEXT NOT NULL,
  `needs_review` TINYINT(1) NOT NULL DEFAULT 0,
  `related_trend_id` CHAR(36) NULL,
  `source_url` VARCHAR(512) NULL,
  `submitted_by` CHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_moodboard_items_approved` (`approved`),
  KEY `ix_moodboard_items_category` (`category`),
  KEY `ix_moodboard_items_created_at` (`created_at`),
  KEY `ix_moodboard_items_related_trend_id` (`related_trend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `email` VARCHAR(255) NOT NULL,
  `id` CHAR(36) NOT NULL,
  `source` MEDIUMTEXT NULL,
  `subscribed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_subscribers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `items` JSON NOT NULL,
  `shipping_address` JSON NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `stripe_session_id` CHAR(36) NULL,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_orders_created_at` (`created_at`),
  KEY `ix_orders_status` (`status`),
  KEY `ix_orders_stripe_session_id` (`stripe_session_id`),
  KEY `ix_orders_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `points_history` (
  `amount` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `reason` MEDIUMTEXT NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_points_history_created_at` (`created_at`),
  KEY `ix_points_history_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_bundles` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `description` MEDIUMTEXT NOT NULL,
  `discount_percentage` DECIMAL(12,2) NOT NULL DEFAULT 10,
  `id` CHAR(36) NOT NULL,
  `name` MEDIUMTEXT NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_product_bundles_created_at` (`created_at`),
  KEY `ix_product_bundles_published` (`published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_reviews` (
  `content` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `title` MEDIUMTEXT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_product_reviews_created_at` (`created_at`),
  KEY `ix_product_reviews_product_id` (`product_id`),
  KEY `ix_product_reviews_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `affiliate_url` MEDIUMTEXT NULL,
  `category` VARCHAR(255) NOT NULL DEFAULT 'Fashion',
  `colors` JSON NULL,
  `compare_at_price` DECIMAL(12,2) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `description` MEDIUMTEXT NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `flash_sale` TINYINT(1) NOT NULL DEFAULT 0,
  `flash_sale_end` DATETIME(3) NULL,
  `flash_sale_price` DECIMAL(12,2) NULL,
  `id` CHAR(36) NOT NULL,
  `images` JSON NOT NULL,
  `name` MEDIUMTEXT NOT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `product_type` VARCHAR(255) NOT NULL DEFAULT 'custom',
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `sizes` JSON NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `tags` JSON NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_products_category` (`category`),
  KEY `ix_products_created_at` (`created_at`),
  KEY `ix_products_published` (`published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `avatar_url` MEDIUMTEXT NULL,
  `bio` MEDIUMTEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `display_name` MEDIUMTEXT NULL,
  `id` CHAR(36) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_profiles_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reading_history` (
  `id` CHAR(36) NOT NULL,
  `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `trend_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_reading_history_trend_id` (`trend_id`),
  KEY `ix_reading_history_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `referrals` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `referred_id` CHAR(36) NOT NULL,
  `referrer_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_referrals_created_at` (`created_at`),
  UNIQUE KEY `uq_referrals_referred_id` (`referred_id`),
  KEY `ix_referrals_referrer_id` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_articles` (
  `id` CHAR(36) NOT NULL,
  `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `trend_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_saved_articles_trend_id` (`trend_id`),
  KEY `ix_saved_articles_user_id` (`user_id`),
  UNIQUE KEY `uq_saved_articles_user_id_trend_id` (`user_id`, `trend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_moodboard_items` (
  `id` CHAR(36) NOT NULL,
  `moodboard_item_id` CHAR(36) NOT NULL,
  `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_saved_moodboard_items_moodboard_item_id` (`moodboard_item_id`),
  KEY `ix_saved_moodboard_items_user_id` (`user_id`),
  UNIQUE KEY `uq_saved_moodboard_items_user_id_moodboard_item_id` (`user_id`, `moodboard_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `segment_members` (
  `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `segment_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_segment_members_segment_id` (`segment_id`),
  KEY `ix_segment_members_user_id` (`user_id`),
  UNIQUE KEY `uq_segment_members_segment_id_user_id` (`segment_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` VARCHAR(255) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `value` JSON NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trends` (
  `category` VARCHAR(255) NOT NULL,
  `content_tier` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cultural_significance` MEDIUMTEXT NOT NULL,
  `editorial_content` JSON NULL,
  `featured_image_url` MEDIUMTEXT NULL,
  `geo_relevance` VARCHAR(255) NOT NULL,
  `headline` MEDIUMTEXT NOT NULL,
  `id` CHAR(36) NOT NULL,
  `image_hint` MEDIUMTEXT NULL,
  `images` JSON NULL,
  `members_only` TINYINT(1) NOT NULL DEFAULT 0,
  `needs_review` TINYINT(1) NOT NULL DEFAULT 1,
  `original_source_content` MEDIUMTEXT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 0,
  `source_name` MEDIUMTEXT NULL,
  `source_url` VARCHAR(512) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `urgency` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_trends_category` (`category`),
  KEY `ix_trends_created_at` (`created_at`),
  KEY `ix_trends_published` (`published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trivia_questions` (
  `category` VARCHAR(255) NOT NULL,
  `correct_answer` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `difficulty` VARCHAR(255) NOT NULL DEFAULT 'medium',
  `explanation` MEDIUMTEXT NOT NULL,
  `fun_fact` MEDIUMTEXT NULL,
  `id` CHAR(36) NOT NULL,
  `needs_review` TINYINT(1) NOT NULL DEFAULT 0,
  `options` JSON NOT NULL,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `question` MEDIUMTEXT NOT NULL,
  `source_trend_id` CHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_trivia_questions_category` (`category`),
  KEY `ix_trivia_questions_created_at` (`created_at`),
  KEY `ix_trivia_questions_published` (`published`),
  KEY `ix_trivia_questions_source_trend_id` (`source_trend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trivia_scores` (
  `category` VARCHAR(255) NULL DEFAULT 'All',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `total_questions` INT NOT NULL DEFAULT 0,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_trivia_scores_category` (`category`),
  KEY `ix_trivia_scores_created_at` (`created_at`),
  KEY `ix_trivia_scores_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_points` (
  `points` INT NOT NULL DEFAULT 0,
  `total_earned` INT NOT NULL DEFAULT 0,
  `total_withdrawn` INT NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `ix_user_points_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `categories` JSON NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `ix_user_preferences_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_user_roles_user_id` (`user_id`),
  UNIQUE KEY `uq_user_roles_user_id_role` (`user_id`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlists` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `id` CHAR(36) NOT NULL,
  `notify_back_in_stock` TINYINT(1) NOT NULL DEFAULT 0,
  `product_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_wishlists_created_at` (`created_at`),
  KEY `ix_wishlists_product_id` (`product_id`),
  KEY `ix_wishlists_user_id` (`user_id`),
  UNIQUE KEY `uq_wishlists_user_id_product_id` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `withdrawals` (
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `dollar_amount` DECIMAL(12,2) NOT NULL,
  `id` CHAR(36) NOT NULL,
  `points_amount` INT NOT NULL,
  `processed_at` DATETIME(3) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `user_id` CHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_withdrawals_created_at` (`created_at`),
  KEY `ix_withdrawals_status` (`status`),
  KEY `ix_withdrawals_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email_confirmed_at` DATETIME(3) NULL,
  `user_metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_sign_in_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` CHAR(64) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_sessions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `token_hash` CHAR(64) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `purpose` VARCHAR(32) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  PRIMARY KEY (`token_hash`),
  KEY `ix_auth_tokens_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NULL,
  `message` MEDIUMTEXT NOT NULL,
  `handled` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_contact_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `concierge_usage` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `client_key` VARCHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_concierge_usage_client_key` (`client_key`),
  KEY `ix_concierge_usage_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_suppressions` (
  `email` VARCHAR(255) NOT NULL,
  `reason` VARCHAR(64) NOT NULL DEFAULT 'unsubscribe',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
