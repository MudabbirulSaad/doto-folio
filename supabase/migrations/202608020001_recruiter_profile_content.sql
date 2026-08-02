-- Recruiter-focused portfolio content refresh.
-- This migration changes content only; it introduces no schema or API changes.

UPDATE site_content
SET
  hero_title = 'I build secure, reliable platforms and intelligent developer tools.',
  hero_subtitle = 'Software Development student at Swinburne University with additional applied-AI coursework and project experience.',
  hero_cta_text = 'Explore My Work',
  hero_cta_link = '#projects',
  about_title = 'About Me',
  about_intro = 'I am Mudabbirul Saad, a Bachelor of Computer Science student at Swinburne University of Technology, majoring in Software Development.',
  about_description = 'I build product and platform systems with typed boundaries, reliable delivery paths, and evidence-backed engineering decisions.',
  about_personal = 'Additional applied-AI coursework and projects support my work in developer tooling, local AI workflows, and evaluated machine-learning systems.',
  education_title = 'Education',
  education_degree = 'Bachelor of Computer Science',
  education_field = 'Software Development',
  education_institution = 'Swinburne University of Technology',
  approach_title = 'My Approach',
  approach_description = 'I prefer clear contracts, observable failure modes, focused tests, and deployment processes that remain understandable under pressure.',
  contact_title = 'Let''s Connect',
  contact_description = 'Use the contact form or LinkedIn to discuss software and platform engineering opportunities.',
  contact_opportunities_title = 'Open to Opportunities',
  contact_opportunities_description = 'Seeking graduate, internship, and junior software or platform engineering roles in Melbourne or remote-friendly teams.',
  footer_brand_name = 'SAAD',
  footer_brand_description = 'Building secure platforms, developer tools, and reliable product systems.',
  footer_location = 'Melbourne, Australia',
  footer_university = 'Swinburne University',
  footer_field = 'Software Development',
  footer_copyright = '© {year} Mudabbirul Saad. All rights reserved.',
  updated_at = NOW(),
  is_published = true;

DELETE FROM projects
WHERE title IN ('AI-Powered Application', 'Web Development Project', 'Data Analysis Tool');

INSERT INTO projects (title, description, status, display_order, is_featured, is_published)
SELECT project.title, project.description, project.status, project.display_order, true, true
FROM (
  VALUES
    ('OpenReels', 'Private production-oriented video platform with protected media delivery, resilient asynchronous workflows, and immutable releases.', 'In Development', 1),
    ('ThePlanner', 'Published TypeScript CLI for deterministic planning graphs, work items, readiness checks, and agent handoffs.', 'Completed', 2),
    ('Inspector', 'Local TypeScript CLI for evidence-backed AI-assisted codebase inspection, deterministic QA, and resumable reports.', 'In Development', 3),
    ('Study Podcast Generator', 'Local-first FastAPI and React app for queued WAV podcast generation with persistent projects and reusable voices.', 'In Development', 4),
    ('Aura', 'End-to-end misinformation-classification prototype with evaluated ML models, FastAPI inference, Vue, and Docker.', 'Completed', 5)
) AS project(title, description, status, display_order)
WHERE NOT EXISTS (SELECT 1 FROM projects existing WHERE existing.title = project.title);

UPDATE projects
SET
  description = refreshed.description,
  status = refreshed.status,
  display_order = refreshed.display_order,
  is_featured = true,
  is_published = true,
  updated_at = NOW()
FROM (
  VALUES
    ('OpenReels', 'Private production-oriented video platform with protected media delivery, resilient asynchronous workflows, and immutable releases.', 'In Development', 1),
    ('ThePlanner', 'Published TypeScript CLI for deterministic planning graphs, work items, readiness checks, and agent handoffs.', 'Completed', 2),
    ('Inspector', 'Local TypeScript CLI for evidence-backed AI-assisted codebase inspection, deterministic QA, and resumable reports.', 'In Development', 3),
    ('Study Podcast Generator', 'Local-first FastAPI and React app for queued WAV podcast generation with persistent projects and reusable voices.', 'In Development', 4),
    ('Aura', 'End-to-end misinformation-classification prototype with evaluated ML models, FastAPI inference, Vue, and Docker.', 'Completed', 5)
) AS refreshed(title, description, status, display_order)
WHERE projects.title = refreshed.title;

DELETE FROM project_technologies
WHERE project_id IN (
  SELECT id FROM projects
  WHERE title IN ('OpenReels', 'ThePlanner', 'Inspector', 'Study Podcast Generator', 'Aura')
);

INSERT INTO project_technologies (project_id, technology_name, display_order)
SELECT project.id, technology.name, technology.display_order
FROM projects project
JOIN (
  VALUES
    ('OpenReels', 'Next.js', 1), ('OpenReels', 'Bun', 2), ('OpenReels', 'PostgreSQL', 3), ('OpenReels', 'Cloudflare', 4),
    ('ThePlanner', 'TypeScript', 1), ('ThePlanner', 'Node.js', 2), ('ThePlanner', 'Vitest', 3),
    ('Inspector', 'TypeScript', 1), ('Inspector', 'Node.js', 2), ('Inspector', 'JSON Schema', 3),
    ('Study Podcast Generator', 'FastAPI', 1), ('Study Podcast Generator', 'React', 2), ('Study Podcast Generator', 'Python', 3),
    ('Aura', 'Python', 1), ('Aura', 'FastAPI', 2), ('Aura', 'Vue', 3), ('Aura', 'Docker', 4)
) AS technology(project_title, name, display_order)
ON project.title = technology.project_title;

UPDATE skill_capabilities SET is_published = false, updated_at = NOW();
UPDATE skill_evidence SET is_published = false, updated_at = NOW();

INSERT INTO skill_capabilities (title, summary, icon_name, display_order, is_published)
VALUES
  ('Platform & Delivery', 'Build and release systems designed for repeatability, observability, and safe recovery.', 'Container', 1, true),
  ('Backend & Distributed Systems', 'Typed service boundaries, durable data, queues, and explicit ownership for real product workflows.', 'Network', 2, true),
  ('Security & Media Delivery', 'Scoped authorization and protected delivery paths with clearly documented trust boundaries.', 'ShieldCheck', 3, true),
  ('AI & Developer Tools', 'Applied-AI workflows that remain evidence-backed, testable, and useful without overstating automation.', 'Bot', 4, true),
  ('Frontend Product Engineering', 'Accessible interfaces that expose complex system behavior through clear user workflows.', 'LayoutDashboard', 5, true)
ON CONFLICT (title) DO UPDATE SET
  summary = EXCLUDED.summary,
  icon_name = EXCLUDED.icon_name,
  display_order = EXCLUDED.display_order,
  is_published = true,
  updated_at = NOW();

INSERT INTO skill_evidence (capability_id, label, description, technologies, proof_label, proof_url, display_order, is_published)
SELECT capability.id, evidence.label, evidence.description, evidence.technologies, evidence.proof_label, evidence.proof_url, 1, true
FROM skill_capabilities capability
JOIN (
  VALUES
    ('Platform & Delivery', 'Production-oriented delivery', 'OpenReels uses containerised services, health-aware release checks, and immutable delivery practices.', ARRAY['Docker', 'Cloudflare'], 'OpenReels case study', '/projects/openreels'),
    ('Backend & Distributed Systems', 'Service and data boundaries', 'OpenReels and the portfolio demonstrate typed application boundaries, durable persistence, caching, and asynchronous messaging.', ARRAY['TypeScript', 'PostgreSQL', 'Redis', 'RabbitMQ'], 'Selected projects', '/#projects'),
    ('Security & Media Delivery', 'Protected product flows', 'Project work includes protected object delivery, scoped access, browser-to-browser transfer, and explicit threat boundaries.', ARRAY['Cloudflare', 'WebRTC'], 'OpenReels case study', '/projects/openreels'),
    ('AI & Developer Tools', 'Evaluated and reviewable automation', 'Inspector, Study Podcast Generator, and Aura use structured validation, local-first workflows, or recorded model evaluation.', ARRAY['Python', 'FastAPI', 'Machine Learning'], 'Selected projects', '/#projects'),
    ('Frontend Product Engineering', 'Product interfaces', 'Next.js and React surfaces turn platform behavior into responsive, testable user workflows.', ARRAY['Next.js', 'React', 'TypeScript'], 'View portfolio', '/')
) AS evidence(capability_title, label, description, technologies, proof_label, proof_url)
ON capability.title = evidence.capability_title
ON CONFLICT (capability_id, label) DO UPDATE SET
  description = EXCLUDED.description,
  technologies = EXCLUDED.technologies,
  proof_label = EXCLUDED.proof_label,
  proof_url = EXCLUDED.proof_url,
  display_order = EXCLUDED.display_order,
  is_published = true,
  updated_at = NOW();

UPDATE contact_methods SET is_published = false, updated_at = NOW();
UPDATE contact_methods
SET
  value = 'linkedin.com/in/mudabbirul-saad-b71a0a211',
  description = 'Connect for software and platform engineering opportunities',
  link = 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/',
  icon_name = 'Linkedin',
  display_order = 1,
  is_published = true,
  updated_at = NOW()
WHERE lower(title) = 'linkedin';

INSERT INTO contact_methods (title, value, description, link, icon_name, display_order, is_published)
SELECT 'LinkedIn', 'linkedin.com/in/mudabbirul-saad-b71a0a211', 'Connect for software and platform engineering opportunities', 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', 'Linkedin', 1, true
WHERE NOT EXISTS (SELECT 1 FROM contact_methods WHERE lower(title) = 'linkedin');

UPDATE social_links SET is_published = false, updated_at = NOW();

UPDATE social_links SET url = 'https://github.com/MudabbirulSaad', username = 'MudabbirulSaad', icon_name = 'Github', display_order = 1, is_published = true, updated_at = NOW()
WHERE lower(platform) = 'github';
INSERT INTO social_links (platform, url, username, icon_name, display_order, is_published)
SELECT 'GitHub', 'https://github.com/MudabbirulSaad', 'MudabbirulSaad', 'Github', 1, true
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE lower(platform) = 'github');

UPDATE social_links SET url = 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', username = 'mudabbirul-saad-b71a0a211', icon_name = 'Linkedin', display_order = 2, is_published = true, updated_at = NOW()
WHERE lower(platform) = 'linkedin';
INSERT INTO social_links (platform, url, username, icon_name, display_order, is_published)
SELECT 'LinkedIn', 'https://www.linkedin.com/in/mudabbirul-saad-b71a0a211/', 'mudabbirul-saad-b71a0a211', 'Linkedin', 2, true
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE lower(platform) = 'linkedin');
