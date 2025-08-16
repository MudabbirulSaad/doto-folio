-- Initial Content Data Migration
-- Populates the content management tables with current hardcoded content

-- =============================================
-- SITE CONTENT (Single Record)
-- =============================================
INSERT INTO site_content (
  hero_title,
  hero_cta_text,
  about_intro,
  about_description,
  about_personal,
  education_degree,
  education_field,
  education_institution,
  approach_description,
  contact_description,
  contact_opportunities_description,
  footer_brand_name,
  footer_brand_description,
  footer_location,
  footer_university,
  footer_field
) VALUES (
  'I build beautiful and intelligent digital experiences.',
  'Explore My Work',
  'I''m Mudabbirul Saad, a passionate Bachelor''s degree student at Swinburne University of Technology, majoring in Artificial Intelligence.',
  'My journey in technology is driven by a deep fascination with how intelligent systems can transform the way we interact with digital experiences. I thrive in quiet, focused environments where I can dive deep into complex problems and emerge with elegant solutions.',
  'When I''m not immersed in coursework, you''ll find me coding personal projects, watching the latest tech content, and staying current with emerging technology trends. I believe that continuous learning and hands-on experimentation are the keys to mastering the rapidly evolving field of AI.',
  'Bachelor''s Degree',
  'Artificial Intelligence',
  'Swinburne University of Technology',
  'I believe in building beautiful, intelligent digital experiences through focused work, continuous learning, and staying at the forefront of technological innovation.',
  'I''m always interested in discussing AI, technology trends, and potential collaboration opportunities. Feel free to reach out through any of the channels below.',
  'As a dedicated AI student, I''m actively seeking internships, research opportunities, and collaborative projects that align with my passion for artificial intelligence and software development. I''m particularly interested in roles that combine technical challenges with innovative problem-solving.',
  'SAAD',
  'AI Student & Developer building intelligent digital experiences with a passion for innovation and technology.',
  'Melbourne, Australia',
  'Swinburne University',
  'Artificial Intelligence'
);

-- =============================================
-- SKILL CATEGORIES
-- =============================================
INSERT INTO skill_categories (title, display_order) VALUES
('Programming Languages', 1),
('Web Technologies', 2),
('Artificial Intelligence', 3);

-- Get category IDs for skills insertion
DO $$
DECLARE
    prog_lang_id UUID;
    web_tech_id UUID;
    ai_id UUID;
BEGIN
    SELECT id INTO prog_lang_id FROM skill_categories WHERE title = 'Programming Languages';
    SELECT id INTO web_tech_id FROM skill_categories WHERE title = 'Web Technologies';
    SELECT id INTO ai_id FROM skill_categories WHERE title = 'Artificial Intelligence';

    -- =============================================
    -- SKILLS
    -- =============================================
    -- Programming Languages
    INSERT INTO skills (category_id, name, level, description, display_order) VALUES
    (prog_lang_id, 'Python', 'Advanced', 'AI/ML development, data analysis', 1),
    (prog_lang_id, 'JavaScript', 'Advanced', 'Full-stack web development', 2),
    (prog_lang_id, 'Java', 'Intermediate', 'Object-oriented programming', 3),
    (prog_lang_id, 'C++', 'Intermediate', 'System programming, algorithms', 4),
    (prog_lang_id, 'C', 'Intermediate', 'Low-level programming', 5);

    -- Web Technologies
    INSERT INTO skills (category_id, name, level, description, display_order) VALUES
    (web_tech_id, 'HTML', 'Advanced', 'Semantic markup, accessibility', 1),
    (web_tech_id, 'CSS', 'Advanced', 'Modern styling, responsive design', 2),
    (web_tech_id, 'Node.js', 'Intermediate', 'Server-side JavaScript', 3);

    -- Artificial Intelligence
    INSERT INTO skills (category_id, name, level, description, display_order) VALUES
    (ai_id, 'Machine Learning', 'Intermediate', 'Algorithm implementation', 1),
    (ai_id, 'Data Analysis', 'Intermediate', 'Pattern recognition, insights', 2),
    (ai_id, 'Neural Networks', 'Learning', 'Deep learning fundamentals', 3);
END $$;

-- =============================================
-- PROJECTS
-- =============================================
INSERT INTO projects (title, description, status, display_order) VALUES
('AI-Powered Application', 'Intelligent system leveraging machine learning algorithms to solve complex problems.', 'In Development', 1),
('Web Development Project', 'Full-stack web application with modern design and responsive functionality.', 'Completed', 2),
('Data Analysis Tool', 'Comprehensive data processing and visualization tool for insights generation.', 'Planning', 3);

-- =============================================
-- PROJECT TECHNOLOGIES
-- =============================================
DO $$
DECLARE
    ai_project_id UUID;
    web_project_id UUID;
    data_project_id UUID;
BEGIN
    SELECT id INTO ai_project_id FROM projects WHERE title = 'AI-Powered Application';
    SELECT id INTO web_project_id FROM projects WHERE title = 'Web Development Project';
    SELECT id INTO data_project_id FROM projects WHERE title = 'Data Analysis Tool';

    -- AI-Powered Application technologies
    INSERT INTO project_technologies (project_id, technology_name, display_order) VALUES
    (ai_project_id, 'Python', 1),
    (ai_project_id, 'Pytorch', 2),
    (ai_project_id, 'Node.js', 3);

    -- Web Development Project technologies
    INSERT INTO project_technologies (project_id, technology_name, display_order) VALUES
    (web_project_id, 'JavaScript', 1),
    (web_project_id, 'HTML', 2),
    (web_project_id, 'CSS', 3),
    (web_project_id, 'Node.js', 4);

    -- Data Analysis Tool technologies
    INSERT INTO project_technologies (project_id, technology_name, display_order) VALUES
    (data_project_id, 'Python', 1),
    (data_project_id, 'C++', 2),
    (data_project_id, 'JavaScript', 3);
END $$;

-- =============================================
-- CONTACT METHODS
-- =============================================
INSERT INTO contact_methods (title, value, description, link, icon_name, display_order) VALUES
('Email', 'mudabbirulsaad@gmail.com', 'Best for professional inquiries and collaboration opportunities', 'mailto:mudabbirulsaad@gmail.com', 'Mail', 1),
('LinkedIn', 'linkedin.com/in/mudabbirul-saad-b71a0a211', 'Connect with me for professional networking and updates', 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', 'Linkedin', 2),
('GitHub', 'github.com/mudabbirulsaad', 'Explore my code repositories and open-source contributions', 'https://github.com/mudabbirulsaad', 'Github', 3),
('Telegram', 't.me/mudabbirulsaad', 'Quick messaging and tech discussions', 'https://t.me/mudabbirulsaad', 'MessageCircle', 4);

-- =============================================
-- SOCIAL LINKS
-- =============================================
INSERT INTO social_links (platform, url, username, icon_name, display_order) VALUES
('Facebook', 'https://facebook.com/mudabbirulsaad', 'mudabbirulsaad', 'Facebook', 1),
('Instagram', 'https://instagram.com/mudabbirulsaad', 'mudabbirulsaad', 'Instagram', 2);

-- =============================================
-- SITE SETTINGS
-- =============================================
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('projects_section_title', 'Projects', 'text', 'Title for the projects section'),
('projects_section_description', 'A showcase of my work in artificial intelligence, web development, and software engineering. Each project represents my commitment to building intelligent, user-focused solutions.', 'text', 'Description for the projects section'),
('projects_coming_soon_title', 'Coming Soon', 'text', 'Title for coming soon projects'),
('projects_coming_soon_description', 'More projects coming soon as I continue my journey in AI and software development.', 'text', 'Description for coming soon projects'),
('projects_coming_soon_note', 'Currently working on exciting new projects', 'text', 'Note for coming soon projects'),
('skills_section_title', 'Skills & Expertise', 'text', 'Title for the skills section'),
('skills_section_description', 'A comprehensive overview of my technical skills and areas of expertise, continuously expanding through academic study and hands-on project development.', 'text', 'Description for the skills section'),
('skills_continuous_learning_title', 'Continuous Learning', 'text', 'Title for continuous learning section'),
('skills_continuous_learning_description', 'As an AI student, I''m constantly expanding my skill set through coursework, personal projects, and staying current with the latest technology trends. My focus is on building a strong foundation in both theoretical knowledge and practical application.', 'text', 'Description for continuous learning section'),
('navigation_items', '["Home", "About", "Projects", "Skills", "Contact"]', 'json', 'Navigation menu items'),
('footer_navigation_items', '["Home", "About", "Projects", "Skills", "Contact"]', 'json', 'Footer navigation items');
