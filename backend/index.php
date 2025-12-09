<?php
// Simple API router
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove base path if hosted in subdirectory
$path = str_replace('/backend', '', $path);

switch ($path) {
    case '/api/auth/login':
        require_once 'api/auth/login.php';
        break;
    case '/api/services/start':
        require_once 'api/services/start.php';
        break;
    case '/api/visitors/create':
        require_once 'api/visitors/create.php';
        break;
    case '/api/attendance/checkin':
        require_once 'api/attendance/checkin.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?>
