<?php
// Database connection settings for InfinityFree

$host = "sql211.infinityfree.com"; // Your InfinityFree MySQL host
$db_name = "if0_39702651_church_db"; // Your InfinityFree database name
$username = "if0_39702651"; // Your InfinityFree MySQL username
$password = "c0dJL7U9nXz"; // Replace with your vPanel password

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
