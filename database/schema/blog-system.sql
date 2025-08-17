-- Blog System Database Schema
-- Comprehensive blog system for SAAD Portfolio with categories, tags, and SEO

-- =============================================
-- BLOG CATEGORIES TABLE
-- =============================================
CREATE TABLE blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  color TEXT DEFAULT '#3b82f6', -- Hex color for category theming
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BLOG TAGS TABLE
-- =============================================
CREATE TABLE blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  usage_count INTEGER DEFAULT 0, -- Auto-updated count of posts using this tag
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BLOG POSTS TABLE
-- =============================================
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL, -- Short description for cards and SEO
  content TEXT NOT NULL, -- Full markdown/MDX content
  featured_image TEXT DEFAULT NULL, -- URL to featured image
  featured_image_alt TEXT DEFAULT NULL, -- Alt text for featured image
  
  -- SEO Fields
  meta_title TEXT DEFAULT NULL, -- Custom SEO title (falls back to title)
  meta_description TEXT DEFAULT NULL, -- Custom SEO description (falls back to excerpt)
  
  -- Author & Publishing
  author_name TEXT NOT NULL DEFAULT 'Mudabbirul Saad',
  author_bio TEXT DEFAULT 'AI Student & Developer at Swinburne University',
  author_avatar TEXT DEFAULT NULL,
  
  -- Status & Visibility
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false, -- Featured posts for homepage
  
  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- Estimated reading time in minutes
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Category relationship
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL
);

-- =============================================
-- BLOG POST TAGS (Many-to-Many)
-- =============================================
CREATE TABLE blog_post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique post-tag combinations
  UNIQUE(post_id, tag_id)
);

-- =============================================
-- BLOG VIEWS TRACKING
-- =============================================
CREATE TABLE blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
-- Blog Categories
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_published ON blog_categories(is_published);
CREATE INDEX idx_blog_categories_display_order ON blog_categories(display_order);

-- Blog Tags
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_published ON blog_tags(is_published);
CREATE INDEX idx_blog_tags_usage_count ON blog_tags(usage_count DESC);

-- Blog Posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX idx_blog_posts_view_count ON blog_posts(view_count DESC);

-- Blog Post Tags
CREATE INDEX idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- Blog Views
CREATE INDEX idx_blog_views_post_id ON blog_views(post_id);
CREATE INDEX idx_blog_views_viewed_at ON blog_views(viewed_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all blog tables
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_views ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published blog categories" ON blog_categories FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published blog tags" ON blog_tags FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read blog post tags for published posts" ON blog_post_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_post_tags.post_id AND blog_posts.status = 'published')
);

-- Public can insert blog views (for analytics)
CREATE POLICY "Anyone can insert blog views" ON blog_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read blog views" ON blog_views FOR SELECT USING (true);

-- Admin full access (authenticated users only)
CREATE POLICY "Authenticated users can manage blog categories" ON blog_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage blog tags" ON blog_tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage blog posts" ON blog_posts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage blog post tags" ON blog_post_tags FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage blog views" ON blog_views FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_tags_updated_at BEFORE UPDATE ON blog_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS FOR BLOG SYSTEM
-- =============================================

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage count for affected tags
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tag usage counts
CREATE TRIGGER update_tag_usage_count_trigger
  AFTER INSERT OR DELETE ON blog_post_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to calculate reading time (rough estimate: 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, ROUND(array_length(string_to_array(content_text, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update reading time when content changes
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time = calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate reading time
CREATE TRIGGER update_blog_posts_reading_time
  BEFORE INSERT OR UPDATE OF content ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_reading_time();

-- Function to auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to published and published_at is null, set it
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  
  -- If status is changing from published to something else, keep published_at
  -- (This preserves the original publication date)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set published_at
CREATE TRIGGER set_blog_posts_published_at
  BEFORE INSERT OR UPDATE OF status ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_published_at();
