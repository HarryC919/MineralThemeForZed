-- SQL sample: DDL, joins, CTE, window functions, CASE
-- keywords: select from where group by order by having limit
CREATE TABLE themes (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(64)  NOT NULL UNIQUE,
    background  CHAR(7)      NOT NULL DEFAULT '#0A0A0A',
    variant     TEXT         NOT NULL,
    is_contrast BOOLEAN      NOT NULL DEFAULT FALSE,
    ratio       NUMERIC(5, 2) CHECK (ratio >= 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    metadata    JSONB
);

CREATE INDEX idx_themes_variant ON themes (variant, created_at DESC);

COMMENT ON TABLE themes IS 'theme registry 0x00-0xFF';

INSERT INTO themes (name, background, variant, is_contrast, ratio, metadata)
VALUES
    ('My Dark Theme Carbon', '#0A0A0A', 'carbon', FALSE, 1.618, '{"tags": ["dark"]}'::jsonb),
    ('My Dark Theme Teal',   '#263238', 'teal',   FALSE, 2.5e-1, NULL),
    ('My Dark Theme Carbon High Contrast', '#101213', 'carbon', TRUE, 0xFF, NULL)
ON CONFLICT (name) DO NOTHING;

WITH ranked AS (
    SELECT
        t.id,
        t.name,
        t.variant,
        t.ratio,
        ROW_NUMBER() OVER (PARTITION BY t.variant ORDER BY t.created_at DESC) AS rn,
        COUNT(*) OVER (PARTITION BY t.variant) AS variants_in_family,
        LAG(t.created_at) OVER w AS previous_created
    FROM themes t
    WHERE t.is_contrast = FALSE
      AND t.name ILIKE '%dark theme%'
    WINDOW w AS (ORDER BY t.created_at)
),
aggregates AS (
    SELECT
        variant,
        AVG(ratio)::NUMERIC(10, 2) AS avg_ratio,
        STRING_AGG(DISTINCT name, ' | ' ORDER BY name) AS names,
        CASE
            WHEN COUNT(*) > 2 THEN 'many'
            WHEN COUNT(*) = 2 THEN 'pair'
            ELSE 'single'
        END AS bucket
    FROM ranked
    WHERE rn <= 3
    GROUP BY variant
    HAVING AVG(ratio) IS NOT NULL
)
SELECT
    a.variant,
    a.avg_ratio,
    a.names,
    r.name,
    COALESCE(r.previous_created::date, DATE '1970-01-01') AS prev_date,
    EXTRACT(EPOCH FROM r.previous_created) AS prev_epoch,
    CASE a.bucket
        WHEN 'many' THEN r.variants_in_family * 1.0
        ELSE 0.5 + 0x1
    END AS score,
    (SELECT COUNT(*) FROM themes t2 WHERE t2.variant = a.variant) AS total
FROM aggregates a
JOIN ranked r ON r.variant = a.variant AND r.rn = 1
LEFT JOIN themes t3 ON t3.name = r.name
FULL OUTER JOIN (SELECT 1 AS dummy) d ON d.dummy = t3.id
WHERE EXISTS (SELECT 1 FROM themes t4 WHERE t4.ratio BETWEEN 0 AND 10.0)
ORDER BY a.variant ASC, r.name DESC NULLS LAST
LIMIT 10
OFFSET 5;

UPDATE themes
SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{updated}', 'true'::jsonb, TRUE),
    ratio = ROUND(ratio * 1.0, 2)
WHERE id IN (SELECT id FROM ranked WHERE rn = 1)
RETURNING id, name, ratio;

DELETE FROM themes
WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_contrast
   OR metadata ->> 'updated' = 'false';
