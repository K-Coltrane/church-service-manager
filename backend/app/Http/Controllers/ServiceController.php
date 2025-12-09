<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function index()
    {
        $services = Service::with(['serviceType', 'user'])
            ->orderBy('started_at', 'desc')
            ->paginate(20);

        return response()->json($services);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_type_id' => 'required|exists:service_types,id',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'started_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $service = Service::create([
            'service_type_id' => $request->service_type_id,
            'user_id' => auth()->id(),
            'location' => $request->location,
            'notes' => $request->notes,
            'started_at' => $request->started_at,
        ]);

        $service->load(['serviceType', 'user']);

        return response()->json([
            'message' => 'Service created successfully',
            'service' => $service
        ], 201);
    }

    public function show($id)
    {
        $service = Service::with(['serviceType', 'user', 'attendance.visitor'])
            ->findOrFail($id);

        return response()->json($service);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'service_type_id' => 'sometimes|exists:service_types,id',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'ended_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $service->update($validator->validated());
        $service->load(['serviceType', 'user']);

        return response()->json([
            'message' => 'Service updated successfully',
            'service' => $service
        ]);
    }

    public function endService($id)
    {
        $service = Service::findOrFail($id);
        
        if ($service->ended_at) {
            return response()->json(['error' => 'Service already ended'], 400);
        }

        $service->update(['ended_at' => now()]);
        $service->load(['serviceType', 'user', 'attendance.visitor']);

        return response()->json([
            'message' => 'Service ended successfully',
            'service' => $service
        ]);
    }

    public function getActiveService()
    {
        $activeService = Service::whereNull('ended_at')
            ->where('user_id', auth()->id())
            ->with(['serviceType', 'user', 'attendance.visitor'])
            ->first();

        if (!$activeService) {
            return response()->json(['message' => 'No active service found'], 404);
        }

        return response()->json($activeService);
    }

    public function getServiceStats($id)
    {
        $service = Service::with(['attendance.visitor'])->findOrFail($id);
        
        $stats = [
            'total_attendance' => $service->attendance->count(),
            'service_duration' => $service->ended_at 
                ? $service->started_at->diffInMinutes($service->ended_at) 
                : $service->started_at->diffInMinutes(now()),
            'attendees' => $service->attendance->map(function ($attendance) {
                return [
                    'visitor_name' => $attendance->visitor->full_name,
                    'checked_in_at' => $attendance->checked_in_at,
                ];
            })
        ];

        return response()->json($stats);
    }
}
