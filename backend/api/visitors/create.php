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
$first_name = $input['first_name'] ?? '';
$last_name = $input['last_name'] ?? '';
$phone = $input['phone'] ?? '';
$email = $input['email'] ?? '';
$inviter_name = $input['inviter_name'] ?? '';

if (empty($first_name) || empty($last_name)) {
    http_response_code(400);
    echo json_encode(['error' => 'First name and last name required']);
    exit;
}

try {
    // Check for duplicates
    $stmt = $pdo->prepare("
        SELECT id FROM visitors 
        WHERE first_name = ? AND last_name = ? AND (phone = ? OR email = ?)
    ");
    $stmt->execute([$first_name, $last_name, $phone, $email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Visitor already exists']);
        exit;
    }
    
    // Create new visitor
    $stmt = $pdo->prepare("
        INSERT INTO visitors (first_name, last_name, phone, email, inviter_name, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([$first_name, $last_name, $phone, $email, $inviter_name]);
    
    $visitor_id = $pdo->lastInsertId();
    
    // Get the created visitor
    $stmt = $pdo->prepare("SELECT * FROM visitors WHERE id = ?");
    $stmt->execute([$visitor_id]);
    $visitor = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'visitor' => $visitor
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
