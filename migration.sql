-- SQL Data Migration Script
-- Objective: Migrate data from old tables to the new tables used by the Spring Boot application.

-- --------------------------------------------------------------------------------
-- IMPORTANT NOTE ON USERS (sys_user vs. users)
-- --------------------------------------------------------------------------------
-- Your database contains two user tables: `sys_user` and `users`.
-- - `sys_user` is the OLD table and contains unencrypted passwords (e.g., '123').
-- - `users` is the NEW table used by Spring Security and contains correctly hashed (BCrypt) passwords.
--
-- For security and functionality, the application MUST use the `users` table.
-- DO NOT migrate data from `sys_user` as it would break the login system.
-- After running this script, you can safely delete the `sys_user` table.
-- --------------------------------------------------------------------------------


-- --------------------------------------------------------------------------------
-- Step 1: Migrate Event Data (from `event_info` to `events`)
-- --------------------------------------------------------------------------------
-- Description: This copies the single event from the old `event_info` table to the new `events` table,
-- matching the columns and placing the old `img_url` into the `description` field.

INSERT INTO events (id, name, organizer_id, rules, start_time, location, theme, status, description)
SELECT
    id,
    title,          -- old `title` maps to new `name`
    organizer_id,
    rule,           -- old `rule` maps to new `rules`
    time,           -- old `time` maps to new `start_time`
    location,
    theme,
    status,
    img_url         -- old `img_url` is saved in the `description` field
FROM
    event_info
WHERE id NOT IN (SELECT id FROM events); -- Prevents errors if you run this script multiple times


-- --------------------------------------------------------------------------------
-- Step 2: Migrate Material Data (from `material` to `materials`)
-- --------------------------------------------------------------------------------
-- Description: This copies all records from the old `material` table to the new `materials` table.
-- The schemas are compatible.

INSERT INTO materials (id, name, type, condition_level, donor_id, status, current_holder_id)
SELECT
    id,
    name,
    type,
    condition_level,
    donor_id,
    status,
    current_holder_id
FROM
    material
WHERE id NOT IN (SELECT id FROM materials); -- Prevents errors if you run this script multiple times


-- --------------------------------------------------------------------------------
-- Step 3: (Recommended) Clean up old tables
-- --------------------------------------------------------------------------------
-- Description: After confirming the data is migrated correctly, you can run these
-- commands to remove the old, now-redundant tables.

DROP TABLE IF EXISTS `sys_user`;
DROP TABLE IF EXISTS `event_info`;
DROP TABLE IF EXISTS `material`;
DROP TABLE IF EXISTS `material_record`;
DROP TABLE IF EXISTS `event_registration`;


-- --- END OF SCRIPT ---
