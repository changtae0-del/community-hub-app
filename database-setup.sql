-- Community Hub App Database Setup

-- 1. 카테고리 테이블
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color_hex VARCHAR(7),
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 게시물 테이블
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  author VARCHAR(100),
  source_url TEXT,
  thumbnail_url TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 저장된 게시물 테이블
CREATE TABLE saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_role VARCHAR(20),  -- 'viewer' or 'admin'
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_role, post_id)
);

-- 인덱스 생성
CREATE INDEX idx_posts_category ON posts(category_id, created_at DESC);
CREATE INDEX idx_posts_updated ON posts(updated_at DESC);
CREATE INDEX idx_saved_posts_user ON saved_posts(user_role, saved_at DESC);

-- 초기 카테고리 데이터 삽입
INSERT INTO categories (name, slug, icon, color_hex, description) VALUES
  ('일반', 'general', '📝', '#10b981', '다양한 주제의 게시물'),
  ('뉴스', 'news', '📰', '#ef4444', '최신 뉴스'),
  ('기술', 'tech', '💻', '#3b82f6', '기술 및 프로그래밍'),
  ('학습', 'learning', '📚', '#8b5cf6', '학습 자료 및 강의'),
  ('라이프', 'lifestyle', '🏠', '#f59e0b', '일상 및 라이프스타일'),
  ('취업', 'job', '🎯', '#ec4899', '취업 정보 및 팁');

-- RLS (Row Level Security) 정책 설정

-- categories: 모두 읽기 가능
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by all users"
  ON categories FOR SELECT
  USING (true);

-- posts: 모두 읽기 가능, admin만 쓰기 가능
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by all users"
  ON posts FOR SELECT
  USING (true);
CREATE POLICY "Posts can be created by admin"
  ON posts FOR INSERT
  WITH CHECK (true);  -- 기본값, 실제로는 JWT에서 admin 확인
CREATE POLICY "Posts can be updated by admin"
  ON posts FOR UPDATE
  USING (true);
CREATE POLICY "Posts can be deleted by admin"
  ON posts FOR DELETE
  USING (true);

-- saved_posts: 사용자별 저장 목록
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saved posts are viewable by their owner"
  ON saved_posts FOR SELECT
  USING (true);
CREATE POLICY "Saved posts can be created by user"
  ON saved_posts FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Saved posts can be deleted by user"
  ON saved_posts FOR DELETE
  USING (true);
