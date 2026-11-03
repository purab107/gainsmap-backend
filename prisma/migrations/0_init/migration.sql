-- =============================================================================
-- GainsMap Baseline Migration (0_init)
-- Module-wise Prisma Schema with Better Auth and PostgreSQL triggers/views
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create Schemas
CREATE SCHEMA IF NOT EXISTS "app";
CREATE SCHEMA IF NOT EXISTS "catalog";

-- Helper Functions
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- -----------------------------------------------------------------------------
-- Users & Better Auth Tables
-- -----------------------------------------------------------------------------

CREATE TABLE "app"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expires_at" TIMESTAMPTZ NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- Catalog Tables
-- -----------------------------------------------------------------------------

CREATE TABLE "catalog"."muscles" (
    "id" SMALLSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_path" TEXT,

    CONSTRAINT "muscles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog"."equipment" (
    "id" SMALLSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_path" TEXT,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- Exercises Tables
-- -----------------------------------------------------------------------------

CREATE TABLE "app"."exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "catalog_key" TEXT,
    "owner_user_id" UUID,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "equipment_id" SMALLINT,
    "tracking_type" TEXT NOT NULL,
    "mechanic" TEXT,
    "force_type" TEXT,
    "difficulty" TEXT,
    "met" DECIMAL(4,2) NOT NULL DEFAULT 5.0,
    "is_unilateral" BOOLEAN NOT NULL DEFAULT false,
    "is_bodyweight" BOOLEAN NOT NULL DEFAULT false,
    "default_rest_seconds" SMALLINT,
    "image_paths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deprecated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."exercise_translations" (
    "exercise_id" UUID NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tips" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "exercise_translations_pkey" PRIMARY KEY ("exercise_id","lang")
);

CREATE TABLE "app"."exercise_muscles" (
    "exercise_id" UUID NOT NULL,
    "muscle_id" SMALLINT NOT NULL,
    "role" TEXT NOT NULL,
    "volume_weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "exercise_muscles_pkey" PRIMARY KEY ("exercise_id","muscle_id")
);

-- -----------------------------------------------------------------------------
-- Identity / User Settings
-- -----------------------------------------------------------------------------

CREATE TABLE "app"."user_settings" (
    "user_id" UUID NOT NULL,
    "unit_system" TEXT NOT NULL DEFAULT 'metric',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "week_starts_on" TEXT NOT NULL DEFAULT 'monday',
    "rest_timer_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_load_increment_kg" DECIMAL(5,3) NOT NULL DEFAULT 2.5,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- -----------------------------------------------------------------------------
-- Progression & Records
-- -----------------------------------------------------------------------------

CREATE TABLE "app"."progression_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "workout_id" UUID,
    "rule_version" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "recommended_weight_kg" DECIMAL(7,3),
    "recommended_reps_min" SMALLINT,
    "recommended_reps_max" SMALLINT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applied_weight_kg" DECIMAL(7,3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "progression_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."personal_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "record_type" TEXT NOT NULL,
    "value" DECIMAL(10,3) NOT NULL,
    "weight_kg" DECIMAL(7,3),
    "reps" SMALLINT,
    "formula" TEXT,
    "set_id" UUID,
    "achieved_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- Routines & Workouts
-- -----------------------------------------------------------------------------

CREATE TABLE "app"."routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."routine_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "routine_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "superset_group" SMALLINT,
    "target_sets" SMALLINT NOT NULL DEFAULT 3,
    "rep_min" SMALLINT,
    "rep_max" SMALLINT,
    "target_rir" DECIMAL(3,1),
    "rest_seconds" SMALLINT,
    "load_increment_kg" DECIMAL(5,3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."workouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "routine_id" UUID,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "local_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."workout_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "routine_exercise_id" UUID,
    "position" SMALLINT NOT NULL,
    "superset_group" SMALLINT,
    "target_sets" SMALLINT,
    "rep_min" SMALLINT,
    "rep_max" SMALLINT,
    "target_rir" DECIMAL(3,1),
    "rest_seconds" SMALLINT,
    "load_increment_kg" DECIMAL(5,3),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app"."sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_exercise_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_index" SMALLINT NOT NULL,
    "set_type" TEXT NOT NULL DEFAULT 'working',
    "weight_kg" DECIMAL(7,3),
    "added_weight_kg" DECIMAL(7,3),
    "reps" SMALLINT,
    "duration_seconds" INTEGER,
    "distance_m" DECIMAL(9,2),
    "rir" DECIMAL(3,1),
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- -----------------------------------------------------------------------------
-- Indexes & Unique Constraints
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX "users_email_key" ON "app"."users"("email");
CREATE UNIQUE INDEX "sessions_token_key" ON "app"."sessions"("token");
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "app"."accounts"("provider_id", "account_id");
CREATE UNIQUE INDEX "muscles_slug_key" ON "catalog"."muscles"("slug");
CREATE UNIQUE INDEX "equipment_slug_key" ON "catalog"."equipment"("slug");
CREATE UNIQUE INDEX "exercises_catalog_key_key" ON "app"."exercises"("catalog_key");
CREATE UNIQUE INDEX "exercises_id_owner_uq" ON "app"."exercises"("id", "owner_user_id");
CREATE INDEX "exercises_body_part_idx" ON "app"."exercises"("body_part");
CREATE INDEX "exercises_equipment_idx" ON "app"."exercises"("equipment_id");
CREATE INDEX "exercises_category_idx" ON "app"."exercises"("category");
CREATE INDEX "exercises_owner_idx" ON "app"."exercises"("owner_user_id");
CREATE INDEX "exercises_name_trgm" ON "app"."exercises" USING gin (lower(name) gin_trgm_ops);
CREATE INDEX "exercise_muscles_muscle_idx" ON "app"."exercise_muscles"("muscle_id", "exercise_id");
CREATE INDEX "progression_recs_user_exercise_idx" ON "app"."progression_recommendations"("user_id", "exercise_id", "created_at" DESC);
CREATE UNIQUE INDEX "personal_records_user_id_exercise_id_record_type_key" ON "app"."personal_records"("user_id", "exercise_id", "record_type");
CREATE INDEX "routines_user_active_idx" ON "app"."routines"("user_id", "created_at" DESC);
CREATE UNIQUE INDEX "routines_id_user_id_key" ON "app"."routines"("id", "user_id");
CREATE INDEX "routine_exercises_exercise_idx" ON "app"."routine_exercises"("exercise_id");
CREATE UNIQUE INDEX "routine_exercises_routine_id_position_key" ON "app"."routine_exercises"("routine_id", "position");
CREATE UNIQUE INDEX "routine_exercises_id_user_id_key" ON "app"."routine_exercises"("id", "user_id");
CREATE INDEX "workouts_user_started_idx" ON "app"."workouts"("user_id", "started_at" DESC);
CREATE INDEX "workouts_user_local_date_idx" ON "app"."workouts"("user_id", "local_date");
CREATE UNIQUE INDEX "workouts_id_user_id_key" ON "app"."workouts"("id", "user_id");
CREATE UNIQUE INDEX "workouts_one_active_per_user_uq" ON "app"."workouts"("user_id") WHERE status = 'in_progress';
CREATE INDEX "workout_exercises_user_exercise_idx" ON "app"."workout_exercises"("user_id", "exercise_id");
CREATE INDEX "workout_exercises_exercise_idx" ON "app"."workout_exercises"("exercise_id");
CREATE UNIQUE INDEX "workout_exercises_workout_id_position_key" ON "app"."workout_exercises"("workout_id", "position");
CREATE UNIQUE INDEX "workout_exercises_id_user_id_exercise_id_key" ON "app"."workout_exercises"("id", "user_id", "exercise_id");
CREATE INDEX "sets_user_exercise_completed_idx" ON "app"."sets"("user_id", "exercise_id", "completed_at" DESC);
CREATE UNIQUE INDEX "sets_workout_exercise_id_set_index_key" ON "app"."sets"("workout_exercise_id", "set_index");

-- -----------------------------------------------------------------------------
-- Foreign Keys
-- -----------------------------------------------------------------------------

ALTER TABLE "app"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."exercises" ADD CONSTRAINT "exercises_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."exercises" ADD CONSTRAINT "exercises_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "catalog"."equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."exercise_translations" ADD CONSTRAINT "exercise_translations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."exercise_muscles" ADD CONSTRAINT "exercise_muscles_muscle_id_fkey" FOREIGN KEY ("muscle_id") REFERENCES "catalog"."muscles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."progression_recommendations" ADD CONSTRAINT "progression_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."progression_recommendations" ADD CONSTRAINT "progression_recommendations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."progression_recommendations" ADD CONSTRAINT "progression_recommendations_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "app"."workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."personal_records" ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."personal_records" ADD CONSTRAINT "personal_records_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "app"."sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_user_id_fkey" FOREIGN KEY ("routine_id", "user_id") REFERENCES "app"."routines"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."workouts" ADD CONSTRAINT "workouts_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "app"."routines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."workout_exercises" ADD CONSTRAINT "workout_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_user_id_fkey" FOREIGN KEY ("workout_id", "user_id") REFERENCES "app"."workouts"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."workout_exercises" ADD CONSTRAINT "workout_exercises_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "app"."routine_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app"."sets" ADD CONSTRAINT "sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app"."sets" ADD CONSTRAINT "sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."sets" ADD CONSTRAINT "sets_workout_exercise_id_user_id_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id", "user_id", "exercise_id") REFERENCES "app"."workout_exercises"("id", "user_id", "exercise_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Triggers & Constraints
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.workouts_set_local_date() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.local_date := (NEW.started_at AT TIME ZONE NEW.timezone)::date;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS workouts_local_date_trg ON app.workouts;
CREATE TRIGGER workouts_local_date_trg
  BEFORE INSERT OR UPDATE OF started_at, timezone ON app.workouts
  FOR EACH ROW EXECUTE FUNCTION app.workouts_set_local_date();

CREATE OR REPLACE FUNCTION app.assert_exercise_usable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app.exercises e
    WHERE e.id = NEW.exercise_id
      AND (e.owner_user_id IS NULL OR e.owner_user_id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'exercise % is not available to user %', NEW.exercise_id, NEW.user_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS routine_exercises_usable_trg ON app.routine_exercises;
CREATE TRIGGER routine_exercises_usable_trg
  BEFORE INSERT OR UPDATE OF exercise_id, user_id ON app.routine_exercises
  FOR EACH ROW EXECUTE FUNCTION app.assert_exercise_usable();

DROP TRIGGER IF EXISTS workout_exercises_usable_trg ON app.workout_exercises;
CREATE TRIGGER workout_exercises_usable_trg
  BEFORE INSERT OR UPDATE OF exercise_id, user_id ON app.workout_exercises
  FOR EACH ROW EXECUTE FUNCTION app.assert_exercise_usable();

-- -----------------------------------------------------------------------------
-- Views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW app.weekly_muscle_volume WITH (security_invoker = true) AS
SELECT
  w.user_id,
  date_trunc('week', w.local_date)::date                 AS week_start,
  em.muscle_id,
  m.slug                                                 AS muscle_slug,
  round(sum(em.volume_weight), 2)                        AS weighted_sets,
  count(*) FILTER (WHERE em.role = 'primary')            AS direct_sets,
  count(*) FILTER (WHERE em.role = 'secondary')          AS indirect_sets
FROM app.sets s
JOIN app.workout_exercises we ON we.id = s.workout_exercise_id
JOIN app.workouts w           ON w.id = we.workout_id
JOIN app.exercise_muscles em  ON em.exercise_id = we.exercise_id
JOIN catalog.muscles m        ON m.id = em.muscle_id
WHERE s.completed_at IS NOT NULL
  AND s.set_type IN ('working','drop','failure')
GROUP BY w.user_id, date_trunc('week', w.local_date), em.muscle_id, m.slug;

