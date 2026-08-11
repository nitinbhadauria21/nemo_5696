-- Add facebook to platform_enum for ScrapeCreators Facebook trend rows
DO $$ BEGIN
  ALTER TYPE platform_enum ADD VALUE IF NOT EXISTS 'facebook';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
