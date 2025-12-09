<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\ExportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function ($router) {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('user-profile', [AuthController::class, 'userProfile']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    // Service types
    Route::get('/service-types', function () {
        return response()->json(\App\Models\ServiceType::all());
    });
    
    // Services
    Route::apiResource('services', ServiceController::class);
    Route::post('services/{id}/end', [ServiceController::class, 'endService']);
    Route::get('services/{id}/stats', [ServiceController::class, 'getServiceStats']);
    Route::get('active-service', [ServiceController::class, 'getActiveService']);
    
    // Visitors
    Route::apiResource('visitors', VisitorController::class);
    Route::post('visitors/search', [VisitorController::class, 'search']);
    Route::post('visitors/check-duplicate', [VisitorController::class, 'checkDuplicate']);
    
    // Attendance
    Route::apiResource('attendance', AttendanceController::class);
    Route::post('attendance/bulk-checkin', [AttendanceController::class, 'bulkCheckIn']);
    
    // Sync endpoints
    Route::post('sync/bulk', [SyncController::class, 'bulkSync']);
    Route::get('sync/status', [SyncController::class, 'getSyncStatus']);
    
    // Export endpoints
    Route::get('export/service/{id}/{format?}', [ExportController::class, 'exportServiceAttendance']);
    Route::get('export/attendance/{format?}', [ExportController::class, 'exportAllAttendance']);
    Route::get('export/stats', [ExportController::class, 'getExportStats']);
    
    // Test endpoint
    Route::get('/test', function () {
        return response()->json([
            'message' => 'Church Service API is working!',
            'user' => auth()->user(),
            'timestamp' => now()
        ]);
    });
});
