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
  'I build secure, reliable platforms and intelligent developer tools.',
  'Explore My Work',
  'I am Mudabbirul Saad, a Bachelor of Computer Science student at Swinburne University of Technology, majoring in Software Development.',
  'I build product and platform systems with typed boundaries, reliable delivery paths, and evidence-backed engineering decisions.',
  'Additional applied-AI coursework and projects support my work in developer tooling, local AI workflows, and evaluated machine-learning systems.',
  'Bachelor of Computer Science',
  'Software Development',
  'Swinburne University of Technology',
  'I prefer clear contracts, observable failure modes, focused tests, and deployment processes that remain understandable under pressure.',
  'Use the contact form or LinkedIn to discuss software and platform engineering opportunities.',
  'Seeking graduate, internship, and junior software or platform engineering roles in Melbourne or remote-friendly teams.',
  'SAAD',
  'Building secure platforms, developer tools, and reliable product systems.',
  'Melbourne, Australia',
  'Swinburne University',
  'Software Development'
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
('OpenReels', 'Private production-oriented video platform with protected media delivery, resilient asynchronous workflows, and immutable releases.', 'In Development', 1),
('ThePlanner', 'Published TypeScript CLI for deterministic planning graphs, work items, readiness checks, and agent handoffs.', 'Completed', 2),
('Inspector', 'Local TypeScript CLI for evidence-backed AI-assisted codebase inspection, deterministic QA, and resumable reports.', 'In Development', 3),
('Study Podcast Generator', 'Local-first FastAPI and React app for queued WAV podcast generation with persistent projects and reusable voices.', 'In Development', 4),
('Aura', 'End-to-end misinformation-classification prototype with evaluated ML models, FastAPI inference, Vue, and Docker.', 'Completed', 5);

-- =============================================
-- PROJECT TECHNOLOGIES
-- =============================================
DO $$
DECLARE
    openreels_id UUID;
    planner_id UUID;
    inspector_id UUID;
    podcast_id UUID;
    aura_id UUID;
BEGIN
    SELECT id INTO openreels_id FROM projects WHERE title = 'OpenReels';
    SELECT id INTO planner_id FROM projects WHERE title = 'ThePlanner';
    SELECT id INTO inspector_id FROM projects WHERE title = 'Inspector';
    SELECT id INTO podcast_id FROM projects WHERE title = 'Study Podcast Generator';
    SELECT id INTO aura_id FROM projects WHERE title = 'Aura';

    INSERT INTO project_technologies (project_id, technology_name, display_order) VALUES
    (openreels_id, 'Next.js', 1),
    (openreels_id, 'Bun', 2),
    (openreels_id, 'PostgreSQL', 3),
    (openreels_id, 'Cloudflare', 4),
    (planner_id, 'TypeScript', 1),
    (planner_id, 'Node.js', 2),
    (planner_id, 'Vitest', 3),
    (inspector_id, 'TypeScript', 1),
    (inspector_id, 'Node.js', 2),
    (inspector_id, 'JSON Schema', 3),
    (podcast_id, 'FastAPI', 1),
    (podcast_id, 'React', 2),
    (podcast_id, 'Python', 3),
    (aura_id, 'Python', 1),
    (aura_id, 'FastAPI', 2),
    (aura_id, 'Vue', 3),
    (aura_id, 'Docker', 4);
END $$;

-- =============================================
-- CONTACT METHODS
-- =============================================
INSERT INTO contact_methods (title, value, description, link, icon_name, display_order) VALUES
('LinkedIn', 'linkedin.com/in/mudabbirul-saad-b71a0a211', 'Connect for software and platform engineering opportunities', 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', 'Linkedin', 1);

-- =============================================
-- SOCIAL LINKS
-- =============================================
INSERT INTO social_links (platform, url, username, icon_name, display_order) VALUES
('GitHub', 'https://github.com/MudabbirulSaad', 'MudabbirulSaad', 'Github', 1),
('LinkedIn', 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', 'mudabbirul-saad-b71a0a211', 'Linkedin', 2);

-- =============================================
-- SITE SETTINGS
-- =============================================
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('projects_section_title', 'Projects', 'text', 'Title for the projects section'),
('projects_section_description', 'Selected work across platform delivery, developer tooling, full-stack product engineering, and evaluated applied-AI systems.', 'text', 'Description for the projects section'),
('projects_coming_soon_title', 'Coming Soon', 'text', 'Title for coming soon projects'),
('projects_coming_soon_description', 'Additional software and platform projects will be published as they become ready for review.', 'text', 'Description for coming soon projects'),
('projects_coming_soon_note', 'Currently working on exciting new projects', 'text', 'Note for coming soon projects'),
('skills_section_title', 'Skills & Expertise', 'text', 'Title for the skills section'),
('skills_section_description', 'A comprehensive overview of my technical skills and areas of expertise, continuously expanding through academic study and hands-on project development.', 'text', 'Description for the skills section'),
('skills_continuous_learning_title', 'Continuous Learning', 'text', 'Title for continuous learning section'),
('skills_continuous_learning_description', 'I am expanding my software-development foundation through coursework, production-oriented projects, and additional applied-AI study.', 'text', 'Description for continuous learning section'),
('navigation_items', '["Home", "About", "Projects", "Skills", "Contact"]', 'json', 'Navigation menu items'),
('footer_navigation_items', '["Home", "About", "Projects", "Skills", "Contact"]', 'json', 'Footer navigation items');
