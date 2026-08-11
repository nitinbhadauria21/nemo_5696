-- Add youtube_shorts to platform_enum for Shorts-tagged trend rows
DO $$ BEGIN
  ALTER TYPE platform_enum ADD VALUE IF NOT EXISTS 'youtube_shorts';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
