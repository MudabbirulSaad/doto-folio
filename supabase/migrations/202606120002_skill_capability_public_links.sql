-- Keep seeded public proof links visitor-safe after the initial capability seed.

UPDATE skill_evidence
SET proof_label = NULL,
    proof_url = NULL
WHERE label IN (
  'Admin content workflows',
  'Scoped content APIs',
  'Hexagonal architecture'
);
