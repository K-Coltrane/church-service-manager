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
$service_id = $input['service_id'] ?? '';
$visitor_id = $input['visitor_id'] ?? '';

if (empty($service_id) || empty($visitor_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Service ID and Visitor ID required']);
    exit;
}

try {
    // Check if already checked in
    $stmt = $pdo->prepare("SELECT id FROM attendance WHERE service_id = ? AND visitor_id = ?");
    $stmt->execute([$service_id, $visitor_id]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Visitor already checked in']);
        exit;
    }
    
    // Create attendance record
    $stmt = $pdo->prepare("
        INSERT INTO attendance (service_id, visitor_id, checked_in_at, created_at, updated_at) 
        VALUES (?, ?, NOW(), NOW(), NOW())
    ");
    $stmt->execute([$service_id, $visitor_id]);
    
    $attendance_id = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'id' => (int)$attendance_id,
        'message' => 'Visitor checked in successfully'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
