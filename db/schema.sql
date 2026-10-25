-- db/schema.sql -- the SHAPE of our database (which tables exist, which columns each holds).
-- Re-running this file resets the database: drop what exists, rebuild from scratch.

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS restaurants;

CREATE TABLE restaurants (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  cuisine   TEXT NOT NULL,
  area      TEXT NOT NULL
);

CREATE TABLE reviews (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
