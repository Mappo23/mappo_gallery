<?php
// Trip resource (single JSON blob in kv['trip']).
//   GET → current trip or null (public)
//   PUT → replace trip         (owner)
require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = db()->prepare('SELECT v FROM kv WHERE k = "trip"');
    $stmt->execute();
    $v = $stmt->fetchColumn();
    json_out($v !== false ? json_decode($v, true) : null);
}

require_owner();

if ($method === 'PUT' || $method === 'POST') {
    $trip = json_body();
    if (!isset($trip['stops']) || !is_array($trip['stops'])) {
        json_out(['error' => 'bad_trip'], 400);
    }
    $stmt = db()->prepare(
        'INSERT INTO kv (k, v) VALUES ("trip", :v)
         ON DUPLICATE KEY UPDATE v = :v'
    );
    $stmt->execute([':v' => json_encode($trip)]);
    json_out($trip);
}

json_out(['error' => 'method'], 405);
