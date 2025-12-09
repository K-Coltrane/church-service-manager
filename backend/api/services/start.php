<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once '../../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);
$service_type_id = $input['service_type_id'] ?? '';
$location = $input['location'] ?? '';
$notes = $input['notes'] ?? '';

if (empty($service_type_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Service type required']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO services (service_type_id, location, notes, started_at, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW(), NOW())
    ");
    $stmt->execute([$service_type_id, $location, $notes]);
    
    $service_id = $pdo->lastInsertId();
    
    // Get the created service with service type name
    $stmt = $pdo->prepare("
        SELECT s.*, st.name as service_type_name 
        FROM services s 
        JOIN service_types st ON s.service_type_id = st.id 
        WHERE s.id = ?
    ");
    $stmt->execute([$service_id]);
    $service = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'service' => $service
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
