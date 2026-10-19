-- MARIZ Learn V0.2: additional public preview scenarios.
-- Apply only after 001_learn_foundation.sql, on an isolated Neon test branch first.
-- Public content only. No changes to roles, RLS, billing or entitlements.
BEGIN;
INSERT INTO mariz_learn.scenarios (id, lesson_id, prompt) VALUES
  ('observe-queue-02', 'observation-foundations',
   'A queue shortens after a sign changes. Which other variables could explain the observation?'),
  ('observe-message-03', 'observation-foundations',
   'A message is delivered without a reply. Separate the known facts from assumptions.'),
  ('finance-discount-02', 'finance-reasoning',
   'Does doubling orders at a 25 percent discount improve contribution when variable costs remain RM12 per meal?'),
  ('finance-stock-03', 'finance-reasoning',
   'Explain how a seasonal sales rush can leave a retailer short of cash.'),
  ('design-phone-02', 'design-reasoning',
   'Improve the order flow for a small-screen phone without trading away accuracy.'),
  ('design-rain-03', 'design-reasoning',
   'Evaluate a rain shelter that protects one group but directs water onto the walkway.')
ON CONFLICT (id) DO NOTHING;
COMMIT;
