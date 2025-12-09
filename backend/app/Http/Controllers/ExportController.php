<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ExportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function exportServiceAttendance($serviceId, $format = 'csv')
    {
        $service = Service::with(['serviceType', 'attendance.visitor'])->findOrFail($serviceId);
        
        $data = [
            'service_info' => [
                'Service Type' => $service->serviceType->name,
                'Date' => $service->started_at->format('Y-m-d'),
                'Start Time' => $service->started_at->format('H:i:s'),
                'End Time' => $service->ended_at ? $service->ended_at->format('H:i:s') : 'Ongoing',
                'Location' => $service->location ?? 'Not specified',
                'Total Attendance' => $service->attendance->count(),
            ],
            'attendance' => $service->attendance->map(function ($attendance) {
                return [
                    'First Name' => $attendance->visitor->first_name,
                    'Last Name' => $attendance->visitor->last_name,
                    'Phone' => $attendance->visitor->phone ?? '',
                    'Email' => $attendance->visitor->email ?? '',
                    'Inviter' => $attendance->visitor->inviter_name ?? '',
                    'Check-in Time' => $attendance->checked_in_at->format('H:i:s'),
                ];
            })
        ];

        if ($format === 'csv') {
            return $this->exportToCsv($data, "service_{$serviceId}_attendance.csv");
        } elseif ($format === 'json') {
            return response()->json($data);
        }

        return response()->json(['error' => 'Unsupported format'], 400);
    }

    public function exportAllAttendance(Request $request)
    {
        $query = Attendance::with(['visitor', 'service.serviceType']);

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->whereHas('service', function($q) use ($request) {
                $q->where('started_at', '>=', $request->start_date);
            });
        }

        if ($request->has('end_date')) {
            $query->whereHas('service', function($q) use ($request) {
                $q->where('started_at', '<=', $request->end_date);
            });
        }

        // Filter by service type if provided
        if ($request->has('service_type_id')) {
            $query->whereHas('service', function($q) use ($request) {
                $q->where('service_type_id', $request->service_type_id);
            });
        }

        $attendance = $query->orderBy('created_at', 'desc')->get();

        $data = [
            'summary' => [
                'Total Records' => $attendance->count(),
                'Date Range' => ($request->start_date ?? 'All time') . ' to ' . ($request->end_date ?? 'Present'),
                'Export Date' => now()->format('Y-m-d H:i:s'),
            ],
            'attendance' => $attendance->map(function ($record) {
                return [
                    'Service Date' => $record->service->started_at->format('Y-m-d'),
                    'Service Type' => $record->service->serviceType->name,
                    'Service Location' => $record->service->location ?? '',
                    'First Name' => $record->visitor->first_name,
                    'Last Name' => $record->visitor->last_name,
                    'Phone' => $record->visitor->phone ?? '',
                    'Email' => $record->visitor->email ?? '',
                    'Inviter' => $record->visitor->inviter_name ?? '',
                    'Check-in Time' => $record->checked_in_at->format('H:i:s'),
                ];
            })
        ];

        $format = $request->get('format', 'csv');
        
        if ($format === 'csv') {
            return $this->exportToCsv($data, 'all_attendance_' . now()->format('Y-m-d') . '.csv');
        } elseif ($format === 'json') {
            return response()->json($data);
        }

        return response()->json(['error' => 'Unsupported format'], 400);
    }

    private function exportToCsv($data, $filename)
    {
        $output = fopen('php://temp', 'w');

        // Write service info if available
        if (isset($data['service_info'])) {
            fputcsv($output, ['Service Information']);
            foreach ($data['service_info'] as $key => $value) {
                fputcsv($output, [$key, $value]);
            }
            fputcsv($output, []); // Empty row
        }

        // Write summary if available
        if (isset($data['summary'])) {
            fputcsv($output, ['Summary']);
            foreach ($data['summary'] as $key => $value) {
                fputcsv($output, [$key, $value]);
            }
            fputcsv($output, []); // Empty row
        }

        // Write attendance data
        if (isset($data['attendance']) && $data['attendance']->count() > 0) {
            // Write headers
            $headers = array_keys($data['attendance']->first());
            fputcsv($output, $headers);

            // Write data rows
            foreach ($data['attendance'] as $row) {
                fputcsv($output, array_values($row));
            }
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function getExportStats()
    {
        $stats = [
            'total_services' => Service::count(),
            'total_visitors' => \App\Models\Visitor::count(),
            'total_attendance' => Attendance::count(),
            'services_this_month' => Service::whereMonth('started_at', now()->month)
                ->whereYear('started_at', now()->year)
                ->count(),
            'attendance_this_month' => Attendance::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return response()->json($stats);
    }
}
