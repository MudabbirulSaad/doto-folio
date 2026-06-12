-- Consolidate the legacy percentage-based skills system into the evidence model.
-- Old skill names are preserved as technology chips in a single Technical Toolkit capability.

DO $$
DECLARE
  toolkit_id UUID;
  has_category_id BOOLEAN;
  has_flat_category BOOLEAN;
BEGIN
  IF to_regclass('public.skills') IS NOT NULL THEN
    INSERT INTO skill_capabilities (title, summary, icon_name, display_order, is_published)
    VALUES (
      'Technical Toolkit',
      'A compact inventory of the individual tools and technologies I can discuss, connected to the evidence-based capability model.',
      'Wrench',
      99,
      true
    )
    ON CONFLICT (title) DO UPDATE SET
      summary = EXCLUDED.summary,
      icon_name = EXCLUDED.icon_name,
      display_order = EXCLUDED.display_order,
      is_published = EXCLUDED.is_published
    RETURNING id INTO toolkit_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'category_id'
    ) INTO has_category_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'category'
    ) INTO has_flat_category;

    IF has_category_id THEN
      EXECUTE $sql$
        INSERT INTO skill_evidence (
          capability_id,
          label,
          description,
          technologies,
          proof_label,
          proof_url,
          display_order,
          is_published
        )
        SELECT
          $1,
          COALESCE(skill_categories.title, 'Other') AS label,
          'Individual skills preserved from the original skills inventory and managed through this evidence-based section.' AS description,
          array_agg(DISTINCT skills.name ORDER BY skills.name) AS technologies,
          NULL,
          NULL,
          100 + row_number() OVER (ORDER BY COALESCE(skill_categories.title, 'Other')),
          true
        FROM skills
        LEFT JOIN skill_categories ON skill_categories.id = skills.category_id
        GROUP BY COALESCE(skill_categories.title, 'Other')
        ON CONFLICT (capability_id, label) DO UPDATE SET
          description = EXCLUDED.description,
          technologies = EXCLUDED.technologies,
          proof_label = NULL,
          proof_url = NULL,
          display_order = EXCLUDED.display_order,
          is_published = true
      $sql$ USING toolkit_id;
    ELSIF has_flat_category THEN
      EXECUTE $sql$
        INSERT INTO skill_evidence (
          capability_id,
          label,
          description,
          technologies,
          proof_label,
          proof_url,
          display_order,
          is_published
        )
        SELECT
          $1,
          COALESCE(skills.category, 'Other') AS label,
          'Individual skills preserved from the original skills inventory and managed through this evidence-based section.' AS description,
          array_agg(DISTINCT skills.name ORDER BY skills.name) AS technologies,
          NULL,
          NULL,
          100 + row_number() OVER (ORDER BY COALESCE(skills.category, 'Other')),
          true
        FROM skills
        GROUP BY COALESCE(skills.category, 'Other')
        ON CONFLICT (capability_id, label) DO UPDATE SET
          description = EXCLUDED.description,
          technologies = EXCLUDED.technologies,
          proof_label = NULL,
          proof_url = NULL,
          display_order = EXCLUDED.display_order,
          is_published = true
      $sql$ USING toolkit_id;
    END IF;
  END IF;
END $$;

DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS skill_categories;
