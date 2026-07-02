<?php
require __DIR__ . '/db.php';
json_out(['owner' => is_owner()]);
