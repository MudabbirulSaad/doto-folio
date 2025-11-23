-- Add parent_id to blog_comments for nested replies
ALTER TABLE blog_comments 
ADD COLUMN parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_blog_comments_parent_id ON blog_comments(parent_id);

-- Update RLS policies to allow reading replies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON blog_comments;
CREATE POLICY "Comments are viewable by everyone" 
ON blog_comments FOR SELECT 
USING (true);

-- Allow authenticated users to insert replies (already covered by existing policy, but good to verify)
-- Existing policy: "Authenticated users can insert comments"
-- We might need to ensure they can only link to existing comments, but FK constraint handles that.
