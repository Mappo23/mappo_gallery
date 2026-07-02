<?php
// Copy this file to `config.php` and fill in the real values.
// config.php is git-ignored — it holds secrets and must NEVER be committed.

// ── MySQL (from cPanel → MySQL Databases) ─────────────────────────────
define('DB_HOST', 'localhost');          // almost always 'localhost' on cPanel
define('DB_NAME', 'cpanelusr_mappo');    // the database you created
define('DB_USER', 'cpanelusr_mappo');    // the DB user you created
define('DB_PASS', 'CHANGE_ME');          // that user's password

// ── Owner password (PBKDF2-SHA256) ────────────────────────────────────
// These verify the login without storing the plaintext password anywhere.
// Regenerate for a new password with the Python snippet in DEPLOY.md.
define('OWNER_SALT_HEX', '00000000000000000000000000000000');
define('OWNER_ITERS',    200000);
define('OWNER_HASH_HEX', '0000000000000000000000000000000000000000000000000000000000000000');
