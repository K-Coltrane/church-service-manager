<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Visitor;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function bulkSync(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'services' => 'sometimes|array',
            'visitors' => 'sometimes|array',
            'attendance' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        DB::beginTransaction();
        
        try {
            $results = [
                'services' => [],
                'visitors' => [],
                'attendance' => [],
                'errors' => []
            ];

            // Sync services first
            if ($request->has('services')) {
                $results['services'] = $this->syncServices($request->services);
            }

            // Sync visitors second
            if ($request->has('visitors')) {
                $results['visitors'] = $this->syncVisitors($request->visitors);
            }

            // Sync attendance last
            if ($request->has('attendance')) {
                $results['attendance'] = $this->syncAttendance($request->attendance);
            }

            DB::commit();

            return response()->json([
                'message' => 'Bulk sync completed successfully',
                'results' => $results,
                'timestamp' => now()
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'error' => 'Sync failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function syncServices($services)
    {
        $results = [];
        
        foreach ($services as $serviceData) {
            try {
                // Check if service already exists by local_id or other identifier
                $existingService = null;
                if (isset($serviceData['id'])) {
                    $existingService = Service::find($serviceData['id']);
                }

                if ($existingService) {
                    // Update existing service
                    $existingService->update([
                        'location' => $serviceData['location'] ?? $existingService->location,
                        'notes' => $serviceData['notes'] ?? $existingService->notes,
                        'ended_at' => $serviceData['ended_at'] ?? $existingService->ended_at,
                    ]);
                    $results[] = ['action' => 'updated', 'service' => $existingService];
                } else {
                    // Create new service
                    $service = Service::create([
                        'service_type_id' => $serviceData['service_type_id'],
                        'user_id' => auth()->id(),
                        'location' => $serviceData['location'],
                        'notes' => $serviceData['notes'],
                        'started_at' => $serviceData['started_at'],
                        'ended_at' => $serviceData['ended_at'] ?? null,
                    ]);
                    $results[] = ['action' => 'created', 'service' => $service];
                }
            } catch (\Exception $e) {
                $results[] = ['action' => 'error', 'data' => $serviceData, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    private function syncVisitors($visitors)
    {
        $results = [];
        
        foreach ($visitors as $visitorData) {
            try {
                // Check for duplicate visitor
                $existingVisitor = Visitor::where('first_name', $visitorData['first_name'])
                    ->where('last_name', $visitorData['last_name'])
                    ->where('phone', $visitorData['phone'] ?? '')
                    ->first();

                if ($existingVisitor) {
                    // Update existing visitor
                    $existingVisitor->update([
                        'email' => $visitorData['email'] ?? $existingVisitor->email,
                        'inviter_name' => $visitorData['inviter_name'] ?? $existingVisitor->inviter_name,
                    ]);
                    $results[] = ['action' => 'updated', 'visitor' => $existingVisitor];
                } else {
                    // Create new visitor
                    $visitor = Visitor::create([
                        'first_name' => $visitorData['first_name'],
                        'last_name' => $visitorData['last_name'],
                        'phone' => $visitorData['phone'],
                        'email' => $visitorData['email'],
                        'inviter_name' => $visitorData['inviter_name'],
                    ]);
                    $results[] = ['action' => 'created', 'visitor' => $visitor];
                }
            } catch (\Exception $e) {
                $results[] = ['action' => 'error', 'data' => $visitorData, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    private function syncAttendance($attendanceRecords)
    {
        $results = [];
        
        foreach ($attendanceRecords as $attendanceData) {
            try {
                // Check if attendance record already exists
                $existingAttendance = Attendance::where('service_id', $attendanceData['service_id'])
                    ->where('visitor_id', $attendanceData['visitor_id'])
                    ->first();

                if (!$existingAttendance) {
                    $attendance = Attendance::create([
                        'service_id' => $attendanceData['service_id'],
                        'visitor_id' => $attendanceData['visitor_id'],
                        'checked_in_at' => $attendanceData['checked_in_at'],
                    ]);
                    $results[] = ['action' => 'created', 'attendance' => $attendance];
                } else {
                    $results[] = ['action' => 'skipped', 'reason' => 'already_exists', 'attendance' => $existingAttendance];
                }
            } catch (\Exception $e) {
                $results[] = ['action' => 'error', 'data' => $attendanceData, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    public function getSyncStatus()
    {
        $user = auth()->user();
        
        $stats = [
            'user_services' => Service::where('user_id', $user->id)->count(),
            'total_visitors' => Visitor::count(),
            'total_attendance' => Attendance::whereHas('service', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count(),
            'active_services' => Service::whereNull('ended_at')->where('user_id', $user->id)->count(),
            'last_sync' => now(),
        ];

        return response()->json($stats);
    }
}
