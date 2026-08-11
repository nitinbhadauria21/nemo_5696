-- One-time niche backfill helper (also applied via MCP). Keeps migration history aligned.
-- Classifies topic_text into brief UI niches; never leaves dump-bucket "other" when text exists.

UPDATE trend_records SET
  niches = ARRAY[
    CASE
      WHEN topic_text ~* '(ai|artificial intelligence|chatgpt|gpt|claude|llm|machine learning|robot|coding|software|tech)' THEN 'AI'
      WHEN topic_text ~* '(fit(ness)?|gym|workout|health|wellness|sport|cricket|ipl|football|soccer|nba|yoga)' THEN 'Fitness'
      WHEN topic_text ~* '(financ|crypto|bitcoin|stock|invest|upi|bank|money|trading|nft|fintech)' THEN 'Finance'
      WHEN topic_text ~* '(fashion|beauty|style|outfit|luxury|makeup|skincare|sneaker)' THEN 'Fashion'
      WHEN topic_text ~* '(game|gaming|esport|steam|xbox|playstation|minecraft|fortnite|roblox|twitch)' THEN 'Gaming'
      WHEN topic_text ~* '(movie|film|cinema|netflix|disney|trailer|series|television|bollywood|anime)' THEN 'Movies'
      WHEN topic_text ~* '(educat|learn|course|school|study|productiv|notion|tutorial|exam|university)' THEN 'Education'
      WHEN topic_text ~* '(startup|entrepreneur|saas|b2b|business|marketing|seo|brand|founder)' THEN 'Startups'
      WHEN topic_text ~* '(travel|tourism|flight|hotel|vacation|trip|airline|passport|visa)' THEN 'Travel'
      WHEN topic_text ~* '(food|cook|recipe|restaurant|cuisine|chef|baking|meal|pizza|burger|coffee)' THEN 'Food'
      ELSE 'AI'
    END
  ],
  niche = CASE
    WHEN topic_text ~* '(ai|artificial intelligence|chatgpt|gpt|claude|llm|machine learning|robot|coding|software|tech)' THEN 'AI'::trend_niche_enum
    WHEN topic_text ~* '(fit(ness)?|gym|workout|health|wellness|sport|cricket|ipl|football|soccer|nba|yoga)' THEN 'fitness'::trend_niche_enum
    WHEN topic_text ~* '(financ|crypto|bitcoin|stock|invest|upi|bank|money|trading|nft|fintech)' THEN 'finance'::trend_niche_enum
    WHEN topic_text ~* '(fashion|beauty|style|outfit|luxury|makeup|skincare|sneaker)' THEN 'fashion'::trend_niche_enum
    WHEN topic_text ~* '(game|gaming|esport|steam|xbox|playstation|minecraft|fortnite|roblox|twitch)' THEN 'gaming'::trend_niche_enum
    WHEN topic_text ~* '(movie|film|cinema|netflix|disney|trailer|series|television|bollywood|anime)' THEN 'movies'::trend_niche_enum
    WHEN topic_text ~* '(educat|learn|course|school|study|productiv|notion|tutorial|exam|university)' THEN 'education'::trend_niche_enum
    WHEN topic_text ~* '(startup|entrepreneur|saas|b2b|business|marketing|seo|brand|founder)' THEN 'startups'::trend_niche_enum
    WHEN topic_text ~* '(travel|tourism|flight|hotel|vacation|trip|airline|passport|visa)' THEN 'travel'::trend_niche_enum
    WHEN topic_text ~* '(food|cook|recipe|restaurant|cuisine|chef|baking|meal|pizza|burger|coffee)' THEN 'food'::trend_niche_enum
    ELSE 'AI'::trend_niche_enum
  END
WHERE niches IS NULL
   OR niches = '{}'
   OR niches = ARRAY['other']
   OR niche::text IN ('other', 'unknown', 'general');
