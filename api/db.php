<?php
// Shared bootstrap: config, PDO connection, schema, session + auth helpers.
declare(strict_types=1);

require __DIR__ . '/config.php';

// ── JSON response helpers ─────────────────────────────────────────────
function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ── Database ──────────────────────────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (Throwable $e) {
        json_out(['error' => 'db_connect_failed'], 500);
    }
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS photos (
            id        VARCHAR(64)  PRIMARY KEY,
            filename  VARCHAR(255) NOT NULL DEFAULT "",
            thumb_url VARCHAR(255) NOT NULL DEFAULT "",
            full_url  VARCHAR(255) NOT NULL DEFAULT "",
            exif      LONGTEXT,
            location  VARCHAR(255) NOT NULL DEFAULT "",
            caption   TEXT,
            coords    VARCHAR(255),
            added_at  VARCHAR(40)  NOT NULL DEFAULT ""
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS kv (
            k VARCHAR(64) PRIMARY KEY,
            v LONGTEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    return $pdo;
}

// ── Session + auth ────────────────────────────────────────────────────
function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 30,   // 30 days
        'path'     => '/',
        'httponly' => true,
        'secure'   => $https,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function is_owner(): bool {
    start_session();
    return !empty($_SESSION['owner']);
}

function require_owner(): void {
    if (!is_owner()) json_out(['error' => 'unauthorized'], 401);
}

// Constant-time PBKDF2 verification of the owner password.
function verify_owner_password(string $input): bool {
    $calc = hash_pbkdf2('sha256', $input, hex2bin(OWNER_SALT_HEX),
                        OWNER_ITERS, 32, true);
    return hash_equals(hex2bin(OWNER_HASH_HEX), $calc);
}
