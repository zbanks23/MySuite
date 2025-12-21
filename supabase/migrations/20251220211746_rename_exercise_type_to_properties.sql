-- Rename exercise_type to exercise_properties
ALTER TABLE public.exercises RENAME COLUMN exercise_type TO properties;

-- Change column type to TEXT to support multiple properties
ALTER TABLE public.exercises ALTER COLUMN properties TYPE TEXT;
