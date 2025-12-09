
<?php


namespace App\Http\Controllers;


use App\Models\Attendance;
use App\Models\Service;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|exists:services,id',
            'visitor_id' => 'required|exists:visitors,id',
            'checked_in_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check if visitor is already checked in to this service
        $existingAttendance = Attendance::where('service_id', $request->service_id)
            ->where('visitor_id', $request->visitor_id)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'error' => 'Visitor already checked in to this service',
                'attendance' => $existingAttendance->load(['visitor', 'service'])
            ], 409);
        }

        $attendance = Attendance::create([
            'service_id' => $request->service_id,
            'visitor_id' => $request->visitor_id,
            'checked_in_at' => $request->checked_in_at ?? now(),
        ]);

        $attendance->load(['visitor', 'service.serviceType']);

        return response()->json([
            'message' => 'Visitor checked in successfully',
            'attendance' => $attendance
        ], 201);
    }

    public function index(Request $request)
    {
        $query = Attendance::with(['visitor', 'service.serviceType']);

        if ($request->has('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->has('visitor_id')) {
            $query->where('visitor_id', $request->visitor_id);
        }

        $attendance = $query->orderBy('checked_in_at', 'desc')->paginate(20);

        return response()->json($attendance);
    }

    public function show($id)
    {
        $attendance = Attendance::with(['visitor', 'service.serviceType'])
            ->findOrFail($id);

        return response()->json($attendance);
    }

    public function destroy($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record deleted successfully'
        ]);
    }

    public function bulkCheckIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|exists:services,id',
            'visitors' => 'required|array',
            'visitors.*.visitor_id' => 'required|exists:visitors,id',
            'visitors.*.checked_in_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $service = Service::findOrFail($request->service_id);
        $results = [];
        $errors = [];

        foreach ($request->visitors as $visitorData) {
            // Check if already checked in
            $existing = Attendance::where('service_id', $service->id)
                ->where('visitor_id', $visitorData['visitor_id'])
                ->first();

            if ($existing) {
                $errors[] = [
                    'visitor_id' => $visitorData['visitor_id'],
                    'error' => 'Already checked in'
                ];
                continue;
            }

            $attendance = Attendance::create([
                'service_id' => $service->id,
                'visitor_id' => $visitorData['visitor_id'],
                'checked_in_at' => $visitorData['checked_in_at'] ?? now(),
            ]);

            $results[] = $attendance->load(['visitor']);
        }

        return response()->json([
            'message' => 'Bulk check-in completed',
            'successful' => $results,
            'errors' => $errors,
            'total_processed' => count($request->visitors),
            'successful_count' => count($results),
            'error_count' => count($errors)
        ]);
    }
}
