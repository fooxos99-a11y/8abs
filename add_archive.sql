ALTER TABLE students ADD COLUMN completed_juzs integer[] DEFAULT '{}';
ALTER TABLE students ADD COLUMN current_juzs integer[] DEFAULT '{}';
ALTER TABLE student_plans ADD COLUMN status text DEFAULT 'active';
