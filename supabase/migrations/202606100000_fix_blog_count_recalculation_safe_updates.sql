-- Make global blog count recalculation functions compatible with safe-update checks.

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
