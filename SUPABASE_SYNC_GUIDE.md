# Supabase Sync Guide

## Overview

The Church Service Manager app now syncs all local SQLite data to Supabase automatically. This guide explains how the sync process works.

## Sync Architecture

```
Local SQLite Database → Sync Service → Supabase (Primary) → Old API (Fallback)
```

### Flow Diagram

```
┌─────────────────┐
│  Mobile App     │
│  (SQLite)       │
│                 │
│  - Services     │
│  - Visitors     │
│  - Attendance   │
└────────┬────────┘
         │
         │ Creates records locally
         │ synced = false
         │
         ▼
┌─────────────────┐
│  Sync Service   │
│  (Auto-trigger) │
└────────┬────────┘
         │
         │ Checks for unsynced records
         │
         ▼
┌─────────────────┐
│  API Service    │
│  (Tries Supabase│
│   First)        │
└────────┬────────┘
         │
         ├─► Supabase ✅ (Primary)
         │
         └─► Old API (Fallback)
```

---

## How Sync Works

### 1. Creating Records Locally

When you create a service, visitor, or check-in attendance:

```typescript
// Example: Creating a service
const service = {
  local_id: uuidv4(),           // UUID for local reference
  service_type_id: 1,
  started_at: new Date().toISOString(),
  synced: false,                 // Marked as unsynced
  remote_id: null                // No Supabase ID yet
}

await databaseService.createService(service)
```

**Result**: Record stored in SQLite with `synced = false`

---

### 2. Automatic Sync Detection

The sync service automatically:
- Monitors network connectivity
- Detects unsynced records (`synced = false`)
- Triggers sync when internet is available

**Auto-sync triggers**:
- When network connection is restored
- When app comes to foreground (if network available)
- Manually via "Sync Now" button

---

### 3. Sync Process

#### Step 1: Sync Services

```typescript
// Get all unsynced services
const unsyncedServices = await databaseService.getUnsyncedServices()

// For each service:
// 1. Send to Supabase
const supabaseResponse = await supabaseService.createService({
  service_type_id: service.service_type_id,
  location: service.location,
  notes: service.notes,
  started_at: service.started_at,
  ended_at: service.ended_at
})

// 2. Update local record with Supabase ID
await databaseService.markServiceSynced(
  service.local_id,      // Local UUID
  supabaseResponse.id    // Supabase row ID (remote_id)
)
```

**What happens**:
- Service data sent to Supabase `services` table
- Supabase returns new row `id`
- Local SQLite record updated:
  - `synced = true`
  - `remote_id = Supabase ID`

---

#### Step 2: Sync Visitors

```typescript
// Get all unsynced visitors
const unsyncedVisitors = await databaseService.getUnsyncedVisitors()

// For each visitor:
// 1. Send to Supabase
const supabaseResponse = await supabaseService.createVisitor({
  first_name: visitor.first_name,
  last_name: visitor.last_name,
  phone: visitor.phone,
  email: visitor.email,
  inviter_name: visitor.inviter_name
})

// 2. Update local record with Supabase ID
await databaseService.markVisitorSynced(
  visitor.local_id,      // Local UUID
  supabaseResponse.id    // Supabase row ID (remote_id)
)
```

**What happens**:
- Visitor data sent to Supabase `visitors` table
- Supabase returns new row `id`
- Local SQLite record updated:
  - `synced = true`
  - `remote_id = Supabase ID`

---

#### Step 3: Sync Attendance

```typescript
// Get all unsynced attendance
const unsyncedAttendance = await databaseService.getUnsyncedAttendance()

// For each attendance record:
// 1. Look up Supabase IDs for service and visitor
const service = await databaseService.getServiceByLocalId(record.service_local_id)
const visitor = await databaseService.getVisitorByLocalId(record.visitor_local_id)

// 2. Check if dependencies are synced
if (!service?.remote_id || !visitor?.remote_id) {
  // Skip - wait for service/visitor to sync first
  continue
}

// 3. Send to Supabase using Supabase IDs
const supabaseResponse = await supabaseService.createAttendance({
  service_id: service.remote_id,    // Supabase service ID
  visitor_id: visitor.remote_id,    // Supabase visitor ID
  checked_in_at: record.checked_in_at
})

// 4. Update local record with Supabase ID
await databaseService.markAttendanceSynced(
  record.local_id,           // Local UUID
  supabaseResponse.id        // Supabase row ID (remote_id)
)
```

**What happens**:
- Attendance data sent to Supabase `attendance` table
- Uses Supabase IDs (not local IDs) for foreign keys
- Supabase returns new row `id`
- Local SQLite record updated:
  - `synced = true`
  - `remote_id = Supabase ID`

---

## Sync Order (Critical!)

Sync **must** happen in this order:

1. **Services** (no dependencies)
2. **Visitors** (no dependencies)
3. **Attendance** (depends on both service & visitor)

**Why?**
- Attendance records need `service_id` and `visitor_id` from Supabase
- These IDs only exist after services/visitors are synced
- If attendance syncs first, it will be skipped until dependencies exist

---

## ID Mapping

### Local IDs (SQLite)
- **Type**: UUID v4 strings
- **Example**: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`
- **Purpose**: Unique identifier within local database
- **Stored in**: `local_id` field

### Remote IDs (Supabase)
- **Type**: Auto-increment integers
- **Example**: `123`
- **Purpose**: Supabase row ID
- **Stored in**: `remote_id` field (after sync)

### Mapping Flow

```
Before Sync:
┌─────────────────────────────────────┐
│ SQLite Record                       │
│ local_id: "uuid-123"                │
│ remote_id: null                     │
│ synced: false                       │
└─────────────────────────────────────┘

After Sync:
┌─────────────────────────────────────┐
│ SQLite Record                       │
│ local_id: "uuid-123"                │
│ remote_id: 456  ← Supabase ID       │
│ synced: true                        │
└─────────────────────────────────────┘
         │
         │ Maps to
         ▼
┌─────────────────────────────────────┐
│ Supabase Record                     │
│ id: 456                             │
│ (other fields...)                   │
└─────────────────────────────────────┘
```

---

## Preventing Duplicates

### How Duplicates Are Prevented

1. **Local Level**: UUID `local_id` ensures uniqueness in SQLite
2. **Supabase Level**: 
   - Services/Visitors: Unique by data (name, phone, etc.)
   - Attendance: Unique constraint on `(service_id, visitor_id)`

### Sync Behavior

- **First Sync**: Creates new record in Supabase
- **Re-sync Attempt**: 
  - If record already exists, Supabase returns existing ID
  - Local record still gets `remote_id` updated
  - No duplicate created

---

## Sync Status Tracking

### Local Record States

| State | `synced` | `remote_id` | Meaning |
|-------|----------|-------------|---------|
| **Unsynced** | `false` | `null` | Waiting to sync |
| **Synced** | `true` | `123` | Successfully synced to Supabase |

### Sync Status Indicators

- **Synced** (Green): All data uploaded to Supabase
- **Pending** (Orange): Data waiting to sync
- **Syncing** (Blue): Currently uploading
- **Error** (Red): Sync failed (check connection/Supabase)

---

## Error Handling

### Network Errors
- **Handled**: Silently fails, retries on next sync
- **Behavior**: Record remains `synced = false`, will retry

### Supabase Errors
- **Handled**: Logged, continues with next record
- **Behavior**: Single failure doesn't stop entire sync

### Dependency Errors
- **Handled**: Attendance skipped if service/visitor not synced
- **Behavior**: Will sync on next sync cycle after dependencies exist

---

## Manual Sync

You can manually trigger sync:

1. Navigate to **Sync Status** screen
2. Tap **"Sync Now"** button
3. Wait for sync to complete
4. Check status indicator

---

## Automatic Sync

Sync happens automatically when:
- Network connection is restored
- App comes to foreground (if network available)
- Background sync is enabled

**Note**: Sync only happens when:
- Internet connection is available
- No sync is already in progress
- There are unsynced records

---

## Supabase Tables Required

Ensure these tables exist in your Supabase project:

### 1. `services`
```sql
CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  service_type_id INTEGER NOT NULL,
  location TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `visitors`
```sql
CREATE TABLE visitors (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  inviter_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `attendance`
```sql
CREATE TABLE attendance (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL REFERENCES services(id),
  visitor_id BIGINT NOT NULL REFERENCES visitors(id),
  checked_in_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, visitor_id)
);
```

### 4. `service_types`
```sql
CREATE TABLE service_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
```

---

## Testing Sync

### Test Sync Flow

1. **Create a service** (offline)
   - Service stored locally with `synced = false`
   
2. **Create a visitor** (offline)
   - Visitor stored locally with `synced = false`

3. **Check in visitor** (offline)
   - Attendance stored locally with `synced = false`

4. **Connect to internet**
   - Auto-sync triggers
   - Services sync first → get Supabase ID
   - Visitors sync second → get Supabase ID
   - Attendance syncs last → uses Supabase IDs

5. **Verify in Supabase**
   - Check Supabase dashboard
   - All records should appear
   - IDs should match `remote_id` in SQLite

---

## Troubleshooting

### Sync Not Working

**Check**:
1. Internet connection
2. Supabase tables exist
3. Supabase URL and key are correct
4. Check console logs for errors

### Records Not Syncing

**Possible causes**:
1. Network unavailable
2. Supabase table missing
3. Supabase permissions issue
4. Data validation error

**Solution**:
- Check Sync Status screen
- Review console logs
- Verify Supabase table structure
- Check Supabase Row Level Security (RLS) policies

### Duplicate Records

**Prevention**:
- Sync service checks for existing records
- Supabase unique constraints prevent duplicates
- `remote_id` tracking prevents re-syncing

**If duplicates occur**:
- Check Supabase unique constraints
- Verify sync logic is working
- Review error logs

---

## Best Practices

1. **Always sync in order**: Services → Visitors → Attendance
2. **Handle errors gracefully**: Don't stop sync on single failure
3. **Track remote_id**: Always store Supabase ID after sync
4. **Monitor sync status**: Use Sync Status screen
5. **Test offline**: App should work fully offline
6. **Verify Supabase**: Check Supabase dashboard after sync

---

## Summary

✅ **Local SQLite** stores all data offline-first
✅ **Supabase** receives synced data when online
✅ **Sync order** ensures dependencies are met
✅ **ID mapping** tracks local ↔ Supabase relationships
✅ **Duplicate prevention** via unique constraints
✅ **Error handling** continues sync despite failures
✅ **Auto-sync** triggers when network available

The sync system is fully integrated and ready to use!

