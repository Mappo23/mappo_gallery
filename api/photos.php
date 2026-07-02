<?php
// Photos resource.
//   GET                       → list all photos (public)
//   POST   {photo + data urls} → create   (owner)
//   PATCH  {id, location?, caption?, coords?} → edit (owner)
//   DELETE ?id=…               → remove   (owner)
require __DIR__ . '/db.php';

const UPLOAD_DIR = __DIR__ . '/../uploads';
const UPLOAD_URL = '/uploads';

function row_to_photo(array $r): array {
    return [
        'id'        => $r['id'],
        'filename'  => $r['filename'],
        'thumbnail' => $r['thumb_url'],
        'dataUrl'   => $r['full_url'],
        'exif'      => $r['exif']   ? json_decode($r['exif'], true)   : (object)[],
        'location'  => $r['location'],
        'caption'   => $r['caption'] ?? '',
        'coords'    => $r['coords'] ? json_decode($r['coords'], true) : null,
        'addedAt'   => $r['added_at'],
    ];
}

// Decode a "data:image/…;base64,…" URL and write it to disk.
function save_data_url(string $dataUrl, string $path): void {
    $comma = strpos($dataUrl, ',');
    if ($comma === false) json_out(['error' => 'bad_image'], 400);
    $bytes = base64_decode(substr($dataUrl, $comma + 1), true);
    if ($bytes === false) json_out(['error' => 'bad_image'], 400);
    if (file_put_contents($path, $bytes) === false) {
        json_out(['error' => 'write_failed'], 500);
    }
}

function safe_id(string $id): string {
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) json_out(['error' => 'bad_id'], 400);
    return $id;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = db()->query('SELECT * FROM photos ORDER BY added_at DESC')->fetchAll();
    json_out(array_map('row_to_photo', $rows));
}

require_owner();

if ($method === 'POST') {
    $b  = json_body();
    $id = safe_id((string)($b['id'] ?? ''));

    if (!is_dir(UPLOAD_DIR)) @mkdir(UPLOAD_DIR, 0755, true);
    save_data_url((string)($b['fullDataUrl']  ?? ''), UPLOAD_DIR . "/$id.jpg");
    save_data_url((string)($b['thumbDataUrl'] ?? ''), UPLOAD_DIR . "/{$id}_thumb.jpg");

    $stmt = db()->prepare(
        'INSERT INTO photos (id, filename, thumb_url, full_url, exif, location, caption, coords, added_at)
         VALUES (:id, :filename, :thumb, :full, :exif, :location, :caption, :coords, :added_at)'
    );
    $stmt->execute([
        ':id'       => $id,
        ':filename' => (string)($b['filename'] ?? ''),
        ':thumb'    => UPLOAD_URL . "/{$id}_thumb.jpg",
        ':full'     => UPLOAD_URL . "/$id.jpg",
        ':exif'     => json_encode($b['exif'] ?? (object)[]),
        ':location' => (string)($b['location'] ?? ''),
        ':caption'  => (string)($b['caption'] ?? ''),
        ':coords'   => isset($b['coords']) && $b['coords'] ? json_encode($b['coords']) : null,
        ':added_at' => (string)($b['addedAt'] ?? gmdate('c')),
    ]);

    $row = db()->prepare('SELECT * FROM photos WHERE id = ?');
    $row->execute([$id]);
    json_out(row_to_photo($row->fetch()), 201);
}

if ($method === 'PATCH') {
    $b  = json_body();
    $id = safe_id((string)($b['id'] ?? ''));
    $sets = [];
    $args = [':id' => $id];
    if (array_key_exists('location', $b)) { $sets[] = 'location = :location'; $args[':location'] = (string)$b['location']; }
    if (array_key_exists('caption',  $b)) { $sets[] = 'caption = :caption';   $args[':caption']  = (string)$b['caption']; }
    if (array_key_exists('coords',   $b)) { $sets[] = 'coords = :coords';     $args[':coords']   = $b['coords'] ? json_encode($b['coords']) : null; }
    if (!$sets) json_out(['error' => 'nothing_to_update'], 400);

    $stmt = db()->prepare('UPDATE photos SET ' . implode(', ', $sets) . ' WHERE id = :id');
    $stmt->execute($args);

    $row = db()->prepare('SELECT * FROM photos WHERE id = ?');
    $row->execute([$id]);
    $found = $row->fetch();
    json_out($found ? row_to_photo($found) : ['error' => 'not_found'], $found ? 200 : 404);
}

if ($method === 'DELETE') {
    $id = safe_id((string)($_GET['id'] ?? ''));
    db()->prepare('DELETE FROM photos WHERE id = ?')->execute([$id]);
    @unlink(UPLOAD_DIR . "/$id.jpg");
    @unlink(UPLOAD_DIR . "/{$id}_thumb.jpg");
    json_out(['ok' => true]);
}

json_out(['error' => 'method'], 405);
