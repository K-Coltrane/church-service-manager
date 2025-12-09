<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class VisitorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function index(Request $request)
    {
        $query = Visitor::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $visitors = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($visitors);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'inviter_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check for duplicates
        $duplicate = $this->findDuplicate($request);
        if ($duplicate) {
            return response()->json([
                'error' => 'Visitor already exists',
                'existing_visitor' => $duplicate
            ], 409);
        }

        $visitor = Visitor::create($validator->validated());

        return response()->json([
            'message' => 'Visitor created successfully',
            'visitor' => $visitor
        ], 201);
    }

    public function show($id)
    {
        $visitor = Visitor::with(['attendance.service.serviceType'])->findOrFail($id);
        return response()->json($visitor);
    }

    public function update(Request $request, $id)
    {
        $visitor = Visitor::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'inviter_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $visitor->update($validator->validated());

        return response()->json([
            'message' => 'Visitor updated successfully',
            'visitor' => $visitor
        ]);
    }

    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $searchTerm = $request->query;
        
        $visitors = Visitor::where(function ($q) use ($searchTerm) {
            $q->where('first_name', 'LIKE', "%{$searchTerm}%")
              ->orWhere('last_name', 'LIKE', "%{$searchTerm}%")
              ->orWhere('phone', 'LIKE', "%{$searchTerm}%")
              ->orWhere('email', 'LIKE', "%{$searchTerm}%");
        })
        ->limit(10)
        ->get();

        return response()->json($visitors);
    }

    public function checkDuplicate(Request $request)
    {
        $duplicate = $this->findDuplicate($request);
        
        if ($duplicate) {
            return response()->json([
                'duplicate_found' => true,
                'visitor' => $duplicate
            ]);
        }

        return response()->json(['duplicate_found' => false]);
    }

    private function findDuplicate(Request $request)
    {
        $query = Visitor::query();

        // Check by name and phone combination
        if ($request->first_name && $request->last_name && $request->phone) {
            $query->where('first_name', $request->first_name)
                  ->where('last_name', $request->last_name)
                  ->where('phone', $request->phone);
        }
        // Check by email if provided
        elseif ($request->email) {
            $query->where('email', $request->email);
        }
        // Check by name only
        elseif ($request->first_name && $request->last_name) {
            $query->where('first_name', $request->first_name)
                  ->where('last_name', $request->last_name);
        }

        return $query->first();
    }
}
