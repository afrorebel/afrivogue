-- AfriVogue MySQL Schema
-- Converted from PostgreSQL (Supabase) to MySQL 8.0+
-- Engine: InnoDB, Charset: utf8mb4

-- ============================================================================
-- 1. USERS TABLE - Custom authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  email_verified TINYINT(1) DEFAULT 0,
  raw_user_meta_data JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. USER_ROLES TABLE - User role assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'contributor', 'publisher', 'editor')),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PROFILES TABLE - User profile information
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CATEGORIES TABLE - Content categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE,
  parent_id CHAR(36),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. TRENDS TABLE - Main trends/articles content
-- ============================================================================
CREATE TABLE IF NOT EXISTS trends (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  headline TEXT NOT NULL,
  cultural_significance TEXT,
  geo_relevance TEXT,
  urgency VARCHAR(50),
  category VARCHAR(255),
  content_tier VARCHAR(50),
  image_hint TEXT,
  editorial_content JSON,
  published TINYINT(1) NOT NULL DEFAULT 0,
  featured_image_url TEXT,
  images JSON DEFAULT '[]',
  source_url TEXT,
  source_name VARCHAR(255),
  needs_review TINYINT(1) NOT NULL DEFAULT 1,
  original_source_content LONGTEXT,
  members_only TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_published (published),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at),
  INDEX idx_needs_review (needs_review),
  FULLTEXT INDEX ft_headline (headline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. FORECASTS TABLE - Future trend projections
-- ============================================================================
CREATE TABLE IF NOT EXISTS forecasts (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  title TEXT NOT NULL,
  projection TEXT,
  evidence TEXT,
  implications TEXT,
  domain VARCHAR(255),
  horizon VARCHAR(50),
  signal_strength VARCHAR(50),
  region VARCHAR(255),
  published TINYINT(1) NOT NULL DEFAULT 0,
  published_date DATE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_published (published),
  INDEX idx_domain (domain),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SITE_SETTINGS TABLE - Global site configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(255) NOT NULL PRIMARY KEY,
  value JSON NOT NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. NEWSLETTER_SUBSCRIBERS TABLE - Email subscribers
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  subscribed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  source VARCHAR(50) DEFAULT 'popup',
  status VARCHAR(50) DEFAULT 'active',
  unsubscribe_token CHAR(64) UNIQUE,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_subscribed_at (subscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. NEWSLETTER_CAMPAIGNS TABLE - Email campaigns
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  subject TEXT NOT NULL,
  body_html LONGTEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_at DATETIME(6),
  sent_at DATETIME(6),
  recipient_count INT DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_status (status),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. NEWSLETTER_SENDS TABLE - Individual campaign sends
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  campaign_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. ARTICLE_SUBMISSIONS TABLE - User-submitted articles
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_submissions (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  category TEXT,
  tags JSON DEFAULT '[]',
  images JSON DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  points_awarded INT DEFAULT 0,
  meta_description TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. MOODBOARD_ITEMS TABLE - Moodboard collection items
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodboard_items (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  image_url TEXT NOT NULL,
  caption VARCHAR(500) DEFAULT '',
  category VARCHAR(255),
  related_trend_id CHAR(36),
  submitted_by CHAR(36),
  approved TINYINT(1) NOT NULL DEFAULT 0,
  needs_review TINYINT(1) NOT NULL DEFAULT 0,
  source_url TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (related_trend_id) REFERENCES trends(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_approved (approved),
  INDEX idx_needs_review (needs_review),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. TRIVIA_QUESTIONS TABLE - Trivia quiz questions
-- ============================================================================
CREATE TABLE IF NOT EXISTS trivia_questions (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  question TEXT NOT NULL,
  options JSON DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  category VARCHAR(255),
  difficulty VARCHAR(50) DEFAULT 'medium',
  fun_fact TEXT,
  source_trend_id CHAR(36),
  published TINYINT(1) NOT NULL DEFAULT 1,
  needs_review TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (source_trend_id) REFERENCES trends(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_published (published),
  INDEX idx_difficulty (difficulty),
  INDEX idx_needs_review (needs_review)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. TRIVIA_SCORES TABLE - User trivia scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS trivia_scores (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  score INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  category VARCHAR(255) DEFAULT 'All',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_score_desc (score DESC),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. COMMENTS TABLE - Trend/article comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  trend_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_trend_id (trend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. SAVED_ARTICLES TABLE - User saved trends
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_articles (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  trend_id CHAR(36) NOT NULL,
  saved_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_trend (user_id, trend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_saved_at (saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. READING_HISTORY TABLE - User reading history
-- ============================================================================
CREATE TABLE IF NOT EXISTS reading_history (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  trend_id CHAR(36) NOT NULL,
  read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trend_id) REFERENCES trends(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_trend_id (trend_id),
  INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. USER_PREFERENCES TABLE - User content preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  categories JSON DEFAULT '[]',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 19. USER_POINTS TABLE - User points balance
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_points (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  points INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  total_withdrawn INT DEFAULT 0,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 20. POINTS_HISTORY TABLE - Points transaction history
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_history (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(255),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 21. WITHDRAWALS TABLE - Points withdrawal requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  points_amount INT NOT NULL,
  dollar_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  processed_at DATETIME(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 22. REFERRALS TABLE - User referrals
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  referrer_id CHAR(36) NOT NULL,
  referred_id CHAR(36) NOT NULL UNIQUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_referred_id (referred_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 23. FAVORITE_AUTHORS TABLE - User favorite authors
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorite_authors (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_author (user_id, author_id),
  INDEX idx_user_id (user_id),
  INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 24. PRODUCTS TABLE - Shop products
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  category VARCHAR(255) DEFAULT 'Fashion',
  product_type VARCHAR(255) DEFAULT 'custom',
  affiliate_url TEXT,
  images JSON DEFAULT '[]',
  stock INT DEFAULT 0,
  sizes JSON DEFAULT '[]',
  colors JSON DEFAULT '[]',
  tags JSON DEFAULT '[]',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 0,
  flash_sale TINYINT(1) NOT NULL DEFAULT 0,
  flash_sale_end DATETIME(6),
  flash_sale_price DECIMAL(10,2),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_category (category),
  INDEX idx_published (published),
  INDEX idx_featured (featured),
  INDEX idx_flash_sale (flash_sale),
  INDEX idx_created_at (created_at),
  FULLTEXT INDEX ft_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 25. ORDERS TABLE - Customer orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  items JSON DEFAULT '[]',
  total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  shipping_address JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 26. CART_ITEMS TABLE - Shopping cart items
-- ============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(50),
  color VARCHAR(50),
  reminder_sent_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 27. WISHLISTS TABLE - User product wishlists
-- ============================================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  notify_back_in_stock TINYINT(1) DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 28. DISCOUNT_CODES TABLE - Promotional discount codes
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(255) NOT NULL UNIQUE,
  discount_type VARCHAR(50) DEFAULT 'percentage',
  discount_value DECIMAL(10,2) DEFAULT 0,
  min_order DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  times_used INT DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_code (code),
  INDEX idx_active (active),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 29. PRODUCT_REVIEWS TABLE - Product reviews and ratings
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 30. PRODUCT_BUNDLES TABLE - Product bundle offers
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_bundles (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_percentage DECIMAL(5,2) DEFAULT 10,
  published TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_published (published),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 31. BUNDLE_ITEMS TABLE - Products in bundles
-- ============================================================================
CREATE TABLE IF NOT EXISTS bundle_items (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  bundle_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  FOREIGN KEY (bundle_id) REFERENCES product_bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bundle_product (bundle_id, product_id),
  INDEX idx_bundle_id (bundle_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 32. CROSS_SELL_RULES TABLE - Product cross-sell recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS cross_sell_rules (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  source_product_id CHAR(36) NOT NULL,
  recommended_product_id CHAR(36) NOT NULL,
  priority INT DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_source_recommended (source_product_id, recommended_product_id),
  INDEX idx_source_product_id (source_product_id),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 33. CUSTOMER_SEGMENTS TABLE - Customer segmentation
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_segments (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  criteria JSON DEFAULT '{}',
  color VARCHAR(20) DEFAULT '#D4A853',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 34. SEGMENT_MEMBERS TABLE - Users in customer segments
-- ============================================================================
CREATE TABLE IF NOT EXISTS segment_members (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  segment_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (segment_id) REFERENCES customer_segments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_segment_user (segment_id, user_id),
  INDEX idx_segment_id (segment_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 35. SAVED_MOODBOARD_ITEMS TABLE - User saved moodboard items
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_moodboard_items (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  moodboard_item_id CHAR(36) NOT NULL,
  saved_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (moodboard_item_id) REFERENCES moodboard_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (user_id, moodboard_item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_moodboard_item_id (moodboard_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 36. CRM_EMAIL_LOG TABLE - CRM email activity log
-- ============================================================================
CREATE TABLE IF NOT EXISTS crm_email_log (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  email VARCHAR(255) NOT NULL,
  template_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent',
  metadata JSON DEFAULT '{}',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_template_name (template_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 37. EMAIL_SEND_LOG TABLE - Transactional email send log
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_send_log (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  message_id VARCHAR(255),
  template_name VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  metadata JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_recipient_email (recipient_email),
  INDEX idx_status (status),
  INDEX idx_template_name (template_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 38. EMAIL_UNSUBSCRIBE_TOKENS TABLE - Unsubscribe link tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  token CHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  used_at DATETIME(6),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 39. SUPPRESSED_EMAILS TABLE - Suppressed email addresses
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppressed_emails (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(255),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA - Categories
-- ============================================================================
INSERT IGNORE INTO categories (id, name, parent_id, created_at) VALUES
  (UUID(), 'Fashion', NULL, NOW(6)),
  (UUID(), 'Beauty', NULL, NOW(6)),
  (UUID(), 'Luxury', NULL, NOW(6)),
  (UUID(), 'Art & Design', NULL, NOW(6)),
  (UUID(), 'Culture', NULL, NOW(6)),
  (UUID(), 'Business', NULL, NOW(6)),
  (UUID(), 'Entertainment', NULL, NOW(6)),
  (UUID(), 'Lifestyle', NULL, NOW(6));

-- ============================================================================
-- SEED DATA - Site Settings
-- ============================================================================
INSERT IGNORE INTO site_settings (setting_key, value, updated_at) VALUES
  ('hero', JSON_OBJECT('title', 'Welcome to AfriVogue', 'subtitle', 'Discover African Fashion & Culture', 'image_url', '/hero.jpg'), NOW(6)),
  ('footer', JSON_OBJECT('copyright', '2024 AfriVogue. All rights reserved.', 'links', JSON_ARRAY('Privacy', 'Terms', 'Contact')), NOW(6)),
  ('nav_links', JSON_ARRAY(JSON_OBJECT('label', 'Home', 'href', '/'), JSON_OBJECT('label', 'Trends', 'href', '/trends'), JSON_OBJECT('label', 'Shop', 'href', '/shop')), NOW(6));
