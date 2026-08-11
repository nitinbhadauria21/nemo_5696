-- Public dashboard must be able to read live trends without a user session.
-- Writes remain service_role-only (no INSERT/UPDATE/DELETE policies for anon).

DO $$ BEGIN
  CREATE POLICY "Anon read trend records"
    ON trend_records FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read collector runs"
    ON collector_runs FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read trend snapshots"
    ON trend_snapshots FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON trend_records TO anon;
GRANT SELECT ON collector_runs TO anon;
GRANT SELECT ON trend_snapshots TO anon;
