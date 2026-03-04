-- create_settings_table.sql
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  value JSONB
);

-- Insert initial value for enrollment setting
INSERT INTO site_settings (id, value)
VALUES ('enrollment', '{"is_open": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
