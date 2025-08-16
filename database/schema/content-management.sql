-- Content Management System Database Schema
-- This schema provides comprehensive content management for the SAAD Portfolio

-- =============================================
-- SITE CONTENT TABLE
-- =============================================
-- Single record table for hero, about, and general site content
CREATE TABLE site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Hero Section
  hero_title TEXT NOT NULL DEFAULT 'I build beautiful and intelligent digital experiences.',
  hero_subtitle TEXT DEFAULT NULL,
  hero_cta_text TEXT NOT NULL DEFAULT 'Explore My Work',
  hero_cta_link TEXT NOT NULL DEFAULT '#projects',
  
  -- About Section
  about_title TEXT NOT NULL DEFAULT 'About Me',
  about_intro TEXT NOT NULL DEFAULT 'I''m Mudabbirul Saad, a passionate Bachelor''s degree student at Swinburne University of Technology, majoring in Artificial Intelligence.',
  about_description TEXT NOT NULL DEFAULT 'My journey in technology is driven by a deep fascination with how intelligent systems can transform the way we interact with digital experiences. I thrive in quiet, focused environments where I can dive deep into complex problems and emerge with elegant solutions.',
  about_personal TEXT NOT NULL DEFAULT 'When I''m not immersed in coursework, you''ll find me coding personal projects, watching the latest tech content, and staying current with emerging technology trends. I believe that continuous learning and hands-on experimentation are the keys to mastering the rapidly evolving field of AI.',
  
  -- Education Card
  education_title TEXT NOT NULL DEFAULT 'Education',
  education_degree TEXT NOT NULL DEFAULT 'Bachelor''s Degree',
  education_field TEXT NOT NULL DEFAULT 'Artificial Intelligence',
  education_institution TEXT NOT NULL DEFAULT 'Swinburne University of Technology',
  
  -- Approach Card
  approach_title TEXT NOT NULL DEFAULT 'Approach',
  approach_description TEXT NOT NULL DEFAULT 'I believe in building beautiful, intelligent digital experiences through focused work, continuous learning, and staying at the forefront of technological innovation.',
  
  -- Contact Section
  contact_title TEXT NOT NULL DEFAULT 'Let''s Connect',
  contact_description TEXT NOT NULL DEFAULT 'I''m always interested in discussing AI, technology trends, and potential collaboration opportunities. Feel free to reach out through any of the channels below.',
  contact_opportunities_title TEXT NOT NULL DEFAULT 'Open to Opportunities',
  contact_opportunities_description TEXT NOT NULL DEFAULT 'As a dedicated AI student, I''m actively seeking internships, research opportunities, and collaborative projects that align with my passion for artificial intelligence and software development. I''m particularly interested in roles that combine technical challenges with innovative problem-solving.',
  
  -- Footer Brand
  footer_brand_name TEXT NOT NULL DEFAULT 'SAAD',
  footer_brand_description TEXT NOT NULL DEFAULT 'AI Student & Developer building intelligent digital experiences with a passion for innovation and technology.',
  footer_location TEXT NOT NULL DEFAULT 'Melbourne, Australia',
  footer_university TEXT NOT NULL DEFAULT 'Swinburne University',
  footer_field TEXT NOT NULL DEFAULT 'Artificial Intelligence',
  footer_copyright TEXT NOT NULL DEFAULT '© 2025 Mudabbirul Saad. All rights reserved.',
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Planning', 'In Development', 'Completed', 'On Hold')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECT TECHNOLOGIES TABLE
-- =============================================
CREATE TABLE project_technologies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SKILL CATEGORIES TABLE
-- =============================================
CREATE TABLE skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SKILLS TABLE
-- =============================================
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Learning', 'Intermediate', 'Advanced', 'Expert')),
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CONTACT METHODS TABLE
-- =============================================
CREATE TABLE contact_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- Lucide icon name
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SOCIAL LINKS TABLE
-- =============================================
CREATE TABLE social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT DEFAULT NULL,
  icon_name TEXT NOT NULL, -- Lucide icon name
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SITE SETTINGS TABLE
-- =============================================
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_display_order ON projects(display_order);
CREATE INDEX idx_projects_is_published ON projects(is_published);
CREATE INDEX idx_project_technologies_project_id ON project_technologies(project_id);
CREATE INDEX idx_skills_category_id ON skills(category_id);
CREATE INDEX idx_skills_display_order ON skills(display_order);
CREATE INDEX idx_skill_categories_display_order ON skill_categories(display_order);
CREATE INDEX idx_contact_methods_display_order ON contact_methods(display_order);
CREATE INDEX idx_social_links_display_order ON social_links(display_order);
CREATE INDEX idx_site_settings_key ON site_settings(setting_key);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published site content" ON site_content FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published projects" ON projects FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read project technologies" ON project_technologies FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_technologies.project_id AND projects.is_published = true)
);
CREATE POLICY "Public can read published skill categories" ON skill_categories FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published skills" ON skills FOR SELECT USING (
  is_published = true AND EXISTS (SELECT 1 FROM skill_categories WHERE skill_categories.id = skills.category_id AND skill_categories.is_published = true)
);
CREATE POLICY "Public can read published contact methods" ON contact_methods FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published social links" ON social_links FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read site settings" ON site_settings FOR SELECT USING (true);

-- Admin full access (authenticated users only)
CREATE POLICY "Authenticated users can manage site content" ON site_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage project technologies" ON project_technologies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage skill categories" ON skill_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage skills" ON skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage contact methods" ON contact_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage social links" ON social_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage site settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_categories_updated_at BEFORE UPDATE ON skill_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_methods_updated_at BEFORE UPDATE ON contact_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON social_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
