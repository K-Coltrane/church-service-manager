# Church Service Manager App - Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Screens & Navigation](#screens--navigation)
5. [Services](#services)
6. [Data Models](#data-models)
7. [Sync System](#sync-system)
8. [API Integration](#api-integration)
9. [Database Schema](#database-schema)
10. [Usage Guide](#usage-guide)

---

## Overview

**Church Service Manager** is a React Native mobile application designed to help churches manage service attendance and visitor check-ins. The app works **offline-first**, storing all data locally and automatically syncing with a backend server when an internet connection is available.

### Key Characteristics
- **Offline-First**: All data is stored locally using SQLite, allowing the app to function without internet
- **Automatic Sync**: Data automatically syncs to the backend when connectivity is restored
- **Real-Time Status**: Visual indicators show sync status and pending operations
- **Visitor Management**: Add new visitors or check in existing ones
- **Service Tracking**: Start, manage, and end church services

---

## Architecture

### Technology Stack
- **Framework**: React Native with Expo
- **Database**: SQLite (expo-sqlite) for local storage
- **Navigation**: React Navigation (Stack Navigator)
- **HTTP Client**: Axios for API communication
- **State Management**: React Hooks (useState, useEffect, useContext)
- **UUID Generation**: uuid library for generating unique IDs

### Project Structure
```
church-service-app/
├── screens/              # UI screens
│   ├── HomeScreen.tsx
│   ├── service/
│   │   ├── StartServiceScreen.tsx
│   │   └── ActiveServiceScreen.tsx
│   ├── visitor/
│   │   ├── AddVisitorScreen.tsx
│   │   └── SearchVisitorScreen.tsx
│   └── SyncStatusScreen.tsx
├── services/            # Business logic
│   ├── database.ts      # SQLite database operations
│   ├── api.ts          # API service layer
│   └── sync.ts         # Data synchronization logic
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx
├── context/            # React context providers
│   └── AuthContext.tsx
└── backend/            # Backend API (PHP/Laravel)
```

---

## Core Features

### 1. Service Management
- **Start New Service**: Create a new church service with type, location, and notes
- **Active Service Tracking**: View and manage the currently active service
- **End Service**: Mark a service as completed
- **Service Types**: Support for multiple service types (Sunday Morning, Evening, Prayer Meeting, etc.)

### 2. Visitor Management
- **Add New Visitor**: Register new visitors with contact information
- **Search Visitors**: Find existing visitors by name or phone number
- **Check-In**: Record visitor attendance for active services
- **Duplicate Detection**: Prevents duplicate visitor entries

### 3. Attendance Tracking
- **Real-Time Check-Ins**: Track who attended each service
- **Attendance List**: View all checked-in visitors for a service
- **Timestamp Recording**: Automatically records check-in times

### 4. Data Synchronization
- **Automatic Sync**: Syncs data when internet connection is available
- **Manual Sync**: Trigger sync manually from Sync Status screen
- **Sync Status Indicators**: Visual feedback on sync state (synced, pending, syncing, error)
- **Offline Support**: Continue working without internet; data syncs later

---

## Screens & Navigation

### Home Screen (`HomeScreen.tsx`)
**Purpose**: Main dashboard showing active service status and quick actions

**Features**:
- Displays active service information (if any)
- Shows sync status indicator (color-coded dot)
- Quick action buttons:
  - Start New Service (if no active service)
  - Manage Service (if active service exists)
  - View Sync Status
- Pull-to-refresh functionality

**Navigation**:
- → Start Service Screen
- → Active Service Screen
- → Sync Status Screen

---

### Start Service Screen (`StartServiceScreen.tsx`)
**Purpose**: Create and start a new church service

**Features**:
- Service type selection (dropdown picker)
- Optional location field
- Optional notes field
- Loads service types from local database or API
- Falls back to default service types if API unavailable

**Data Collected**:
- Service Type (required)
- Location (optional)
- Notes (optional)
- Start timestamp (auto-generated)

**Navigation**:
- → Active Service Screen (after starting)
- ← Back to Home

---

### Active Service Screen (`ActiveServiceScreen.tsx`)
**Purpose**: Manage an active service and check in visitors

**Features**:
- Display service details (type, location, start time, notes)
- Show total check-ins count
- List of recent check-ins with timestamps
- Action buttons:
  - Add New Visitor
  - Check In Existing Visitor
  - End Service
- Pull-to-refresh to update attendance list

**Data Displayed**:
- Service information
- Attendance statistics
- Recent check-ins (visitor name, phone, check-in time)

**Navigation**:
- → Add Visitor Screen
- → Search Visitor Screen
- ← Back to Home (after ending service)

---

### Add Visitor Screen (`AddVisitorScreen.tsx`)
**Purpose**: Register a new visitor and check them in

**Features**:
- Form fields:
  - First Name (required)
  - Last Name (required)
  - Phone (optional)
  - Email (optional)
  - Invited By (optional)
- Duplicate detection (checks for existing visitors)
- Auto check-in after saving
- Keyboard-aware scrolling

**Validation**:
- First and last name required
- Checks for exact matches (name + phone)

**Navigation**:
- ← Back to Active Service (after check-in)

---

### Search Visitor Screen (`SearchVisitorScreen.tsx`)
**Purpose**: Find and check in existing visitors

**Features**:
- Search by name or phone number
- Searches local database first
- Falls back to remote API search if no local results
- Displays search results with visitor details
- One-tap check-in for found visitors
- Option to add new visitor if search yields no results

**Search Behavior**:
1. Search local SQLite database
2. If no results and internet available, search remote API
3. Display combined results

**Navigation**:
- → Add Visitor Screen (if no results)
- ← Back to Active Service

---

### Sync Status Screen (`SyncStatusScreen.tsx`)
**Purpose**: Monitor and manage data synchronization

**Features**:
- Sync status indicator (synced/pending/syncing/error)
- Detailed breakdown of unsynced items:
  - Services count
  - Visitors count
  - Attendance records count
- Manual sync button (when pending)
- Real-time status updates via listeners
- Information about offline-first architecture

**Sync Statuses**:
- **Synced** (Green): All data uploaded successfully
- **Pending** (Orange): Data waiting to sync
- **Syncing** (Blue): Currently uploading data
- **Error** (Red): Sync failed (check connection)

**Navigation**:
- ← Back to Home

---

## Services

### Database Service (`services/database.ts`)
**Purpose**: Manages all local SQLite database operations

#### Key Methods:

**Service Operations**:
- `createService(service)`: Create a new service record
- `getActiveService()`: Get the currently active (unended) service
- `endService(localId, endedAt)`: Mark a service as ended
- `getUnsyncedServices()`: Get all services not yet synced
- `markServiceSynced(localId, remoteId)`: Mark service as synced with remote ID
- `getServiceByLocalId(localId)`: Get service by local ID (for sync lookups)

**Visitor Operations**:
- `createVisitor(visitor)`: Create a new visitor record
- `searchVisitors(query)`: Search visitors by name or phone
- `getUnsyncedVisitors()`: Get all visitors not yet synced
- `markVisitorSynced(localId, remoteId)`: Mark visitor as synced
- `getVisitorByLocalId(localId)`: Get visitor by local ID (for sync lookups)

**Attendance Operations**:
- `createAttendance(attendance)`: Create attendance record
- `getServiceAttendance(serviceLocalId)`: Get all attendance for a service
- `getUnsyncedAttendance()`: Get all unsynced attendance records
- `markAttendanceSynced(localId, remoteId)`: Mark attendance as synced

**Service Type Operations**:
- `getServiceTypes()`: Get all service types
- `saveServiceTypes(types)`: Save service types to database

**Database Initialization**:
- `initDatabase()`: Creates tables if they don't exist
- Tables: `services`, `visitors`, `attendance`, `service_types`

---

### API Service (`services/api.ts`)
**Purpose**: Handles HTTP communication with backend server

#### Configuration:
- Base URL: Configurable via `API_BASE_URL` environment variable
- Default: `http://localhost:3000/api`
- Timeout: 10 seconds
- Headers: JSON content type, optional auth token

#### Methods:

**Authentication** (legacy, currently unused):
- `login(credentials)`: Authenticate user

**Service Types**:
- `getServiceTypes()`: Fetch service types from server

**Sync Operations**:
- `syncService(service)`: Upload service to server
- `syncVisitor(visitor)`: Upload visitor to server
- `syncAttendance(attendance)`: Upload attendance record

**Search**:
- `searchVisitors(query)`: Search visitors on server

#### Error Handling:
- Request timeout detection
- Network error detection
- Response error logging

---

### Sync Service (`services/sync.ts`)
**Purpose**: Manages data synchronization between local database and server

#### Features:
- **Automatic Sync**: Triggers when network connection is restored
- **Manual Sync**: Can be triggered manually
- **Status Listeners**: Components can subscribe to sync status changes
- **Ordered Sync**: Syncs in order (services → visitors → attendance)

#### Sync Process:

1. **Check Network**: Verifies internet connection
2. **Sync Services**: Uploads all unsynced services
3. **Sync Visitors**: Uploads all unsynced visitors
4. **Sync Attendance**: Uploads attendance (only if service & visitor are synced)
5. **Update Status**: Notifies listeners of sync completion

#### Methods:

**Status Management**:
- `getSyncStatus()`: Returns current sync status
- `addStatusListener(listener)`: Subscribe to status changes
- `removeStatusListener(listener)`: Unsubscribe from status changes

**Sync Operations**:
- `syncAll()`: Sync all unsynced data
- `startAutoSync()`: Enable automatic syncing on network reconnect

**Private Methods**:
- `syncServices()`: Sync service records
- `syncVisitors()`: Sync visitor records
- `syncAttendance()`: Sync attendance records (with dependency checks)

#### Sync Logic:
- Attendance sync requires both service and visitor to have `remote_id`
- If dependencies not met, attendance sync is skipped
- Errors in one record don't stop sync of other records
- Each sync operation updates local database with remote ID

---

## Data Models

### Service
```typescript
interface Service {
  id?: number                    // Local database ID
  local_id: string               // UUID for local reference
  service_type_id: number        // Reference to service type
  service_type_name?: string     // Cached service type name
  location?: string              // Service location
  notes?: string                 // Additional notes
  started_at: string             // ISO timestamp
  ended_at?: string              // ISO timestamp (null if active)
  synced: boolean                // Sync status
  remote_id?: number             // Server-side ID after sync
}
```

### Visitor
```typescript
interface Visitor {
  id?: number                    // Local database ID
  local_id: string               // UUID for local reference
  first_name: string             // Required
  last_name: string              // Required
  phone?: string                 // Optional
  email?: string                 // Optional
  inviter_name?: string          // Optional
  synced: boolean                // Sync status
  remote_id?: number             // Server-side ID after sync
  created_at: string             // ISO timestamp
}
```

### Attendance
```typescript
interface Attendance {
  id?: number                    // Local database ID
  local_id: string               // UUID for local reference
  service_local_id: string       // Reference to service (local)
  visitor_local_id: string       // Reference to visitor (local)
  checked_in_at: string          // ISO timestamp
  synced: boolean                // Sync status
  remote_id?: number             // Server-side ID after sync
}
```

### ServiceType
```typescript
interface ServiceType {
  id: number                     // Service type ID
  name: string                   // Display name
}
```

---

## Sync System

### How Sync Works

1. **Local-First Storage**: All data is stored locally first
2. **Mark as Unsynced**: New/modified records marked `synced = false`
3. **Network Detection**: App monitors network connectivity
4. **Automatic Trigger**: When network available, sync starts automatically
5. **Ordered Upload**: Data syncs in dependency order:
   - Services (no dependencies)
   - Visitors (no dependencies)
   - Attendance (depends on service & visitor)
6. **Remote ID Storage**: After successful sync, `remote_id` stored locally
7. **Status Update**: Local record marked `synced = true`

### Sync Dependencies

**Attendance Sync Requirements**:
- Service must have `remote_id` (already synced)
- Visitor must have `remote_id` (already synced)
- If dependencies not met, attendance record skipped until next sync

### Error Handling

- **Network Errors**: Logged, sync continues with next record
- **API Errors**: Logged, record remains unsynced for retry
- **Partial Failures**: One failed record doesn't stop others
- **Retry Logic**: Failed records remain unsynced, retry on next sync

---

## API Integration

### Endpoints Used

**Service Types**:
- `GET /service_types` - Fetch available service types

**Services**:
- `POST /services` - Create/upload service

**Visitors**:
- `POST /visitors` - Create/upload visitor
- `GET /visitors/search?q={query}` - Search visitors

**Attendance**:
- `POST /attendance/checkin` - Check in visitor to service

### Request Format

**Service Sync**:
```json
{
  "service_type_id": 1,
  "location": "Main Sanctuary",
  "notes": "Special event",
  "started_at": "2024-01-15T10:00:00Z",
  "ended_at": "2024-01-15T12:00:00Z"
}
```

**Visitor Sync**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "email": "john@example.com",
  "inviter_name": "Jane Smith"
}
```

**Attendance Sync**:
```json
{
  "service_id": 123,
  "visitor_id": 456,
  "checked_in_at": "2024-01-15T10:30:00Z"
}
```

### Response Format

**Service/Visitor Sync Response**:
```json
{
  "id": 123,
  ...
}
```

**Attendance Sync Response**:
```json
{
  "success": true,
  "id": 789,
  "message": "Visitor checked in successfully"
}
```

---

## Database Schema

### Services Table
```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  service_type_id INTEGER NOT NULL,
  service_type_name TEXT,
  location TEXT,
  notes TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  synced INTEGER DEFAULT 0,
  remote_id INTEGER
)
```

### Visitors Table
```sql
CREATE TABLE visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  inviter_name TEXT,
  synced INTEGER DEFAULT 0,
  remote_id INTEGER,
  created_at TEXT NOT NULL
)
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL UNIQUE,
  service_local_id TEXT NOT NULL,
  visitor_local_id TEXT NOT NULL,
  checked_in_at TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  remote_id INTEGER,
  FOREIGN KEY (service_local_id) REFERENCES services (local_id),
  FOREIGN KEY (visitor_local_id) REFERENCES visitors (local_id)
)
```

### Service Types Table
```sql
CREATE TABLE service_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
)
```

---

## Usage Guide

### Starting a Service

1. Open the app (starts on Home Screen)
2. Tap **"Start New Service"**
3. Select service type from dropdown
4. (Optional) Enter location
5. (Optional) Add notes
6. Tap **"Start Service"**
7. Automatically navigates to Active Service screen

### Checking In Visitors

**Option 1: Add New Visitor**
1. From Active Service screen, tap **"Add New Visitor"**
2. Fill in required fields (First Name, Last Name)
3. (Optional) Add phone, email, inviter name
4. Tap **"Save & Check In"**
5. Visitor is created and checked in automatically

**Option 2: Check In Existing Visitor**
1. From Active Service screen, tap **"Check In Existing Visitor"**
2. Enter name or phone number
3. Tap **"Search"**
4. Select visitor from results
5. Tap **"Check In"** button

### Ending a Service

1. From Active Service screen
2. Scroll to bottom
3. Tap **"End Service"**
4. Confirm action
5. Returns to Home Screen

### Monitoring Sync Status

1. From Home Screen, tap sync status indicator OR
2. Tap **"View Sync Status"** in Quick Actions
3. View detailed sync information:
   - Overall status
   - Counts of unsynced items
   - Manual sync button (if pending)

### Manual Sync

1. Navigate to Sync Status screen
2. If status is "Pending", tap **"Sync Now"**
3. Wait for sync to complete
4. Status updates automatically

---

## Configuration

### API Base URL

Set the `API_BASE_URL` environment variable to point to your backend server:

```bash
# Example for local development
export API_BASE_URL="http://192.168.1.100/api"

# Example for production
export API_BASE_URL="https://api.yourchurch.com/api"
```

**Note**: For mobile devices, `localhost` won't work. Use your computer's local IP address or a production URL.

### Default Service Types

If API is unavailable, the app uses these default service types:
- Sunday Morning Service (ID: 1)
- Sunday Evening Service (ID: 2)
- Wednesday Prayer Meeting (ID: 3)
- Special Event (ID: 4)

---

## Troubleshooting

### Sync Not Working

1. **Check Network Connection**: Ensure device has internet
2. **Verify API URL**: Check `API_BASE_URL` is correct
3. **Check Backend**: Ensure backend server is running and accessible
4. **View Sync Status**: Check Sync Status screen for error details
5. **Manual Sync**: Try manual sync from Sync Status screen

### Attendance Sync Errors

- **"Service or visitor not synced yet"**: Attendance requires service and visitor to be synced first. Wait for them to sync, then attendance will sync automatically.

### Network Errors

- **"Network Error"**: Check internet connection
- **"Request Timeout"**: Server may be slow or unreachable
- **"ECONNABORTED"**: Request took longer than 10 seconds

### Data Not Appearing

1. **Pull to Refresh**: Try pull-to-refresh on relevant screens
2. **Check Sync Status**: Ensure data has been synced
3. **Restart App**: Close and reopen the app
4. **Check Database**: Verify data exists in local database

---

## Future Enhancements

Potential features for future versions:
- Export attendance data (CSV, PDF)
- Visitor history and analytics
- Multiple service management
- Push notifications for sync status
- Biometric authentication
- QR code check-in
- Visitor photo capture
- Custom service type creation
- Reporting and statistics dashboard

---

## Technical Notes

### Offline-First Architecture

The app is designed to work completely offline:
- All data stored locally in SQLite
- No internet required for core functionality
- Sync happens automatically when available
- Failed syncs don't prevent app usage

### UUID Generation

All local records use UUID v4 for `local_id`:
- Ensures uniqueness across devices
- Prevents conflicts during sync
- Generated using `uuid` library

### Sync Order Importance

Sync order is critical:
1. Services must sync first (attendance depends on service)
2. Visitors must sync second (attendance depends on visitor)
3. Attendance syncs last (depends on both)

### Error Recovery

- Failed syncs don't delete local data
- Records remain unsynced for retry
- App continues functioning normally
- Manual retry available from Sync Status screen

---

## Support & Maintenance

For issues or questions:
1. Check Sync Status screen for sync errors
2. Review console logs for detailed error messages
3. Verify backend API is accessible
4. Ensure database is properly initialized
5. Check network connectivity

---

**Last Updated**: 2024
**Version**: 1.0.0

