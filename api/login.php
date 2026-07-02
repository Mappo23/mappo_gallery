<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'method'], 405);

$pw = (string)(json_body()['password'] ?? '');
// Tiny throttle to blunt brute force on shared hosting.
usleep(300000);

if ($pw === '' || !verify_owner_password($pw)) {
    json_out(['owner' => false, 'error' => 'bad_password'], 401);
}

start_session();
session_regenerate_id(true);
$_SESSION['owner'] = true;
json_out(['owner' => true]);
