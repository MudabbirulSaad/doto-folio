-- Blog System Database Functions
-- Functions to maintain data consistency for blog system

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_tags 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage(tag_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_tags 
  SET usage_count = GREATEST(usage_count - 1, 0),
      updated_at = NOW()
  WHERE id = tag_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count(category_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_categories 
  SET post_count = (
    SELECT COUNT(*) 
    FROM blog_posts 
    WHERE blog_posts.category_id = update_category_post_count.category_id
    AND status = 'published'
  ),
  updated_at = NOW()
  WHERE id = category_id;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all tag usage counts
CREATE OR REPLACE FUNCTION recalculate_tag_usage()
RETURNS void AS $$
BEGIN
  UPDATE blog_tags 
  SET usage_count = (
    SELECT COUNT(*) 
    FROM blog_post_tags 
    WHERE blog_post_tags.tag_id = blog_tags.id
  ),
  updated_at = NOW()
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all category post counts
CREATE OR REPLACE FUNCTION recalculate_category_post_counts()
RETURNS void AS $$
BEGIN
  UPDATE blog_categories 
  SET post_count = (
    SELECT COUNT(*) 
    FROM blog_posts 
    WHERE blog_posts.category_id = blog_categories.id
    AND status = 'published'
  ),
  updated_at = NOW()
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update tag usage when post_tags change
CREATE OR REPLACE FUNCTION update_tag_usage_on_post_tag_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment usage count for the new tag
    PERFORM increment_tag_usage(NEW.tag_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement usage count for the removed tag
    PERFORM decrement_tag_usage(OLD.tag_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update category post count when posts change
CREATE OR REPLACE FUNCTION update_category_count_on_post_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update count for new category
    IF NEW.category_id IS NOT NULL THEN
      PERFORM update_category_post_count(NEW.category_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update count for old category if it changed
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL THEN
        PERFORM update_category_post_count(OLD.category_id);
      END IF;
      IF NEW.category_id IS NOT NULL THEN
        PERFORM update_category_post_count(NEW.category_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update count for removed category
    IF OLD.category_id IS NOT NULL THEN
      PERFORM update_category_post_count(OLD.category_id);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON blog_post_tags;
CREATE TRIGGER trigger_update_tag_usage
  AFTER INSERT OR DELETE ON blog_post_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_on_post_tag_change();

DROP TRIGGER IF EXISTS trigger_update_category_count ON blog_posts;
CREATE TRIGGER trigger_update_category_count
  AFTER INSERT OR UPDATE OR DELETE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_category_count_on_post_change();

-- Initialize counts for existing data
SELECT recalculate_tag_usage();
SELECT recalculate_category_post_counts();
