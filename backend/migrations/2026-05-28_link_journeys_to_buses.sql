ALTER TABLE journeys
ADD COLUMN IF NOT EXISTS bus_id TEXT REFERENCES buses(id) ON DELETE SET NULL;

WITH ranked_journeys AS (
  SELECT
    id,
    agency_id,
    CASE
      WHEN lower(operator) LIKE '%vip%' OR lower(operator) LIKE '%executive%' THEN 'premium'
      ELSE 'classic'
    END AS class_group,
    ROW_NUMBER() OVER (
      PARTITION BY agency_id,
      CASE
        WHEN lower(operator) LIKE '%vip%' OR lower(operator) LIKE '%executive%' THEN 'premium'
        ELSE 'classic'
      END
      ORDER BY dep_time, id
    ) AS rn
  FROM journeys
), ranked_buses AS (
  SELECT
    id,
    agency_id,
    CASE
      WHEN bus_class IN ('VIP', 'Executive Class') THEN 'premium'
      ELSE 'classic'
    END AS class_group,
    ROW_NUMBER() OVER (
      PARTITION BY agency_id,
      CASE
        WHEN bus_class IN ('VIP', 'Executive Class') THEN 'premium'
        ELSE 'classic'
      END
      ORDER BY id
    ) AS rn
  FROM buses
  WHERE id NOT LIKE '%-LOC-%'
), matches AS (
  SELECT
    ranked_journeys.id AS journey_id,
    ranked_buses.id AS bus_id
  FROM ranked_journeys
  JOIN ranked_buses
    ON ranked_buses.agency_id = ranked_journeys.agency_id
   AND ranked_buses.class_group = ranked_journeys.class_group
   AND ranked_buses.rn = ranked_journeys.rn
)
UPDATE journeys
SET bus_id = matches.bus_id
FROM matches
WHERE journeys.id = matches.journey_id
  AND journeys.bus_id IS NULL;

UPDATE buses
SET occupied = passenger_counts.total
FROM (
  SELECT journeys.bus_id, COUNT(passengers.id)::integer AS total
  FROM journeys
  LEFT JOIN passengers ON passengers.journey_id = journeys.id
  WHERE journeys.bus_id IS NOT NULL
  GROUP BY journeys.bus_id
) AS passenger_counts
WHERE buses.id = passenger_counts.bus_id;
