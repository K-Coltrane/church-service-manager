# Database Documentation - Church Service Manager

## Table of Contents
1. [Overview](#overview)
2. [Mobile Database (SQLite)](#mobile-database-sqlite)
3. [Backend Database (MySQL)](#backend-database-mysql)
4. [Data Synchronization](#data-synchronization)
5. [Database Operations](#database-operations)
6. [Schema Details](#schema-details)
7. [API Reference](#api-reference)

---

## Overview

The Church Service Manager app uses a **dual-database architecture**:

1. **Mobile Database (SQLite)** - Local database on each device
2. **Backend Database (MySQL)** - Centralized server database

### Architecture Flow

```
Mobile App (SQLite) ←→ Sync Service ←→ Backend API ←→ MySQL Database
     (Local)                              (Server)
```

### Key Concepts

- **Offline-First**: Mobile app works completely offline using SQLite
- **Sync Pattern**: Data syncs from mobile → backend when online
- **Local IDs**: Mobile uses UUIDs (`local_id`) for records
- **Remote IDs**: Backend assigns numeric IDs after sync
- **Sync Tracking**: Each record tracks sync status (`synced` flag)

---

## Mobile Database (SQLite)

### Location & Access

- **Database Name**: `church_service.db`
- **Storage**: Device local storage (managed by Expo SQLite)
- **Path**: Managed by React Native/Expo (not directly accessible)
- **Type**: SQLite 3
- **Initialization**: Automatic on first app launch

### Database Service

The mobile database is managed by `DatabaseService` class in `services/database.ts`.

**Initialization**:
```typescript
// Database is initialized automatically
const db = SQLite.openDatabaseSync("church_service.db")
```

**Auto-Creation**: Tables are created automatically if they don't exist using `CREATE TABLE IF NOT EXISTS`.

---

## Mobile Database Schema

### 1. Services Table

Stores church service sessions.

```sql
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT UNIQUE NOT NULL,           -- UUID for local reference
  service_type_id INTEGER NOT NULL,        -- Reference to service type
  service_type_name TEXT,                  -- Cached name (denormalized)
  location TEXT,                           -- Optional location
  notes TEXT,                              -- Optional notes
  started_at TEXT NOT NULL,                -- ISO timestamp
  ended_at TEXT,                           -- ISO timestamp (NULL if active)
  synced INTEGER DEFAULT 0,                -- 0 = not synced, 1 = synced
  remote_id INTEGER                        -- Backend ID after sync
);
```

**Fields**:
- `id`: Auto-incrementing local database ID
- `local_id`: UUID v4 string (unique identifier for local operations)
- `service_type_id`: Numeric ID of service type
- `service_type_name`: Cached service type name (for quick display)
- `location`: Optional service location
- `notes`: Optional service notes
- `started_at`: ISO 8601 timestamp when service started
- `ended_at`: ISO 8601 timestamp when service ended (NULL = active)
- `synced`: Boolean flag (0 = false, 1 = true)
- `remote_id`: Numeric ID from backend after successful sync

**Indexes**: 
- Unique index on `local_id`

**Example Record**:
```json
{
  "id": 1,
  "local_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "service_type_id": 1,
  "service_type_name": "Sunday Morning Service",
  "location": "Main Sanctuary",
  "notes": "Special guest speaker",
  "started_at": "2024-01-15T10:00:00.000Z",
  "ended_at": null,
  "synced": 0,
  "remote_id": null
}
```

---

### 2. Visitors Table

Stores visitor information.

```sql
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT UNIQUE NOT NULL,           -- UUID for local reference
  first_name TEXT NOT NULL,                -- Required
  last_name TEXT NOT NULL,                 -- Required
  phone TEXT,                              -- Optional
  email TEXT,                              -- Optional
  inviter_name TEXT,                       -- Optional (who invited them)
  synced INTEGER DEFAULT 0,               -- 0 = not synced, 1 = synced
  remote_id INTEGER,                       -- Backend ID after sync
  created_at TEXT NOT NULL                 -- ISO timestamp
);
```

**Fields**:
- `id`: Auto-incrementing local database ID
- `local_id`: UUID v4 string (unique identifier)
- `first_name`: Visitor's first name (required)
- `last_name`: Visitor's last name (required)
- `phone`: Phone number (optional)
- `email`: Email address (optional)
- `inviter_name`: Name of person who invited visitor (optional)
- `synced`: Boolean flag (0 = false, 1 = true)
- `remote_id`: Numeric ID from backend after sync
- `created_at`: ISO 8601 timestamp when visitor was created

**Indexes**: 
- Unique index on `local_id`

**Example Record**:
```json
{
  "id": 1,
  "local_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "email": "john.doe@example.com",
  "inviter_name": "Jane Smith",
  "synced": 0,
  "remote_id": null,
  "created_at": "2024-01-15T09:30:00.000Z"
}
```

---

### 3. Attendance Table

Links visitors to services (check-in records).

```sql
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT UNIQUE NOT NULL,           -- UUID for local reference
  service_local_id TEXT NOT NULL,          -- Reference to service (local_id)
  visitor_local_id TEXT NOT NULL,          -- Reference to visitor (local_id)
  checked_in_at TEXT NOT NULL,             -- ISO timestamp
  synced INTEGER DEFAULT 0,               -- 0 = not synced, 1 = synced
  remote_id INTEGER,                       -- Backend ID after sync
  FOREIGN KEY (service_local_id) REFERENCES services (local_id),
  FOREIGN KEY (visitor_local_id) REFERENCES visitors (local_id)
);
```

**Fields**:
- `id`: Auto-incrementing local database ID
- `local_id`: UUID v4 string (unique identifier)
- `service_local_id`: UUID reference to `services.local_id`
- `visitor_local_id`: UUID reference to `visitors.local_id`
- `checked_in_at`: ISO 8601 timestamp when visitor checked in
- `synced`: Boolean flag (0 = false, 1 = true)
- `remote_id`: Numeric ID from backend after sync

**Foreign Keys**:
- `service_local_id` → `services.local_id`
- `visitor_local_id` → `visitors.local_id`

**Indexes**: 
- Unique index on `local_id`

**Example Record**:
```json
{
  "id": 1,
  "local_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "service_local_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "visitor_local_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "checked_in_at": "2024-01-15T10:30:00.000Z",
  "synced": 0,
  "remote_id": null
}
```

---

### 4. Service Types Table

Caches service type definitions (can be synced from backend).

```sql
CREATE TABLE IF NOT EXISTS service_types (
  id INTEGER PRIMARY KEY,                  -- Service type ID
  name TEXT NOT NULL                       -- Service type name
);
```

**Fields**:
- `id`: Numeric service type ID
- `name`: Display name of service type

**Default Service Types** (if backend unavailable):
- ID: 1, Name: "Sunday Morning Service"
- ID: 2, Name: "Sunday Evening Service"
- ID: 3, Name: "Wednesday Prayer Meeting"
- ID: 4, Name: "Special Event"

**Example Record**:
```json
{
  "id": 1,
  "name": "Sunday Morning Service"
}
```

---

## Backend Database (MySQL)

### Connection Details

- **Host**: `sql211.infinityfree.com`
- **Database**: `if0_39702651_church_db`
- **Username**: `if0_39702651`
- **Type**: MySQL 5.7+
- **Connection**: Via PHP PDO or Laravel

### Connection Configuration

Located in `backend/config/database.php`:

```php
$host = "sql211.infinityfree.com";
$db_name = "if0_39702651_church_db";
$username = "if0_39702651";
$password = "c0dJL7U9nXz";

$pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
```

---

## Backend Database Schema

### 1. Users Table

Stores user accounts for authentication.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'usher') DEFAULT 'usher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Auto-incrementing primary key
- `name`: User's full name
- `email`: Unique email address (used for login)
- `password`: Hashed password
- `role`: User role ('admin' or 'usher')
- `created_at`: Timestamp when user was created
- `updated_at`: Timestamp when user was last updated

**Indexes**:
- Unique index on `email`

---

### 2. Service Types Table

Defines available service types.

```sql
CREATE TABLE service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Auto-incrementing primary key
- `name`: Service type name
- `description`: Optional description
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

---

### 3. Services Table

Stores services synced from mobile apps.

```sql
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type_id INT NOT NULL,
    user_id INT NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields**:
- `id`: Auto-incrementing primary key (this becomes `remote_id` in mobile)
- `service_type_id`: Foreign key to `service_types.id`
- `user_id`: Foreign key to `users.id` (who created the service)
- `location`: Optional service location
- `notes`: Optional service notes
- `started_at`: When service started
- `ended_at`: When service ended (NULL if active)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Foreign Keys**:
- `service_type_id` → `service_types.id`
- `user_id` → `users.id`

**Indexes**:
- Index on `user_id`
- Index on `service_type_id`
- Index on `started_at`

---

### 4. Visitors Table

Stores visitors synced from mobile apps.

```sql
CREATE TABLE visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    inviter_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (first_name, last_name),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);
```

**Fields**:
- `id`: Auto-incrementing primary key (this becomes `remote_id` in mobile)
- `first_name`: Visitor's first name
- `last_name`: Visitor's last name
- `phone`: Optional phone number
- `email`: Optional email address
- `inviter_name`: Optional inviter name
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Indexes**:
- Composite index on `(first_name, last_name)` for name searches
- Index on `phone` for phone searches
- Index on `email` for email searches

---

### 5. Attendance Table

Stores attendance records synced from mobile apps.

```sql
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    visitor_id INT NOT NULL,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (service_id, visitor_id)
);
```

**Fields**:
- `id`: Auto-incrementing primary key (this becomes `remote_id` in mobile)
- `service_id`: Foreign key to `services.id`
- `visitor_id`: Foreign key to `visitors.id`
- `checked_in_at`: When visitor checked in
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Foreign Keys**:
- `service_id` → `services.id`
- `visitor_id` → `visitors.id`

**Constraints**:
- Unique constraint on `(service_id, visitor_id)` - prevents duplicate check-ins

**Indexes**:
- Index on `service_id`
- Index on `visitor_id`
- Unique index on `(service_id, visitor_id)`

---

## Data Synchronization

### Sync Flow

```
Mobile SQLite → Sync Service → Backend API → MySQL Database
```

### Sync Process

1. **Mobile App Creates Record**
   - Record created in SQLite with `local_id` (UUID)
   - `synced = 0` (not synced)
   - `remote_id = NULL`

2. **Sync Service Detects Unsynced Records**
   - Queries SQLite for records where `synced = 0`
   - Checks network connectivity

3. **Sync Order** (Important!)
   - **Services** sync first (no dependencies)
   - **Visitors** sync second (no dependencies)
   - **Attendance** syncs last (depends on service & visitor)

4. **API Call to Backend**
   - Mobile sends data to backend API endpoint
   - Backend creates record in MySQL
   - Backend returns new `id` (remote_id)

5. **Mobile Updates Record**
   - Sets `synced = 1`
   - Stores `remote_id` from backend response

### Sync Dependencies

**Attendance Sync Requirements**:
- Service must have `remote_id` (already synced)
- Visitor must have `remote_id` (already synced)
- If dependencies not met, attendance sync is skipped

### Sync Status Tracking

Each record has a `synced` flag:
- `0` (false) = Not synced, waiting to sync
- `1` (true) = Synced successfully

### ID Mapping

**Mobile (SQLite)**:
- Uses `local_id` (UUID) for local operations
- Stores `remote_id` after sync

**Backend (MySQL)**:
- Uses `id` (auto-increment integer) as primary key
- Returns `id` to mobile as `remote_id`

**Example**:
```
Mobile Record:
  local_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  remote_id: null (before sync)
  
After Sync:
  local_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  remote_id: 123 (from backend)
  
Backend Record:
  id: 123
  (other fields...)
```

---

## Database Operations

### Mobile Database Operations

#### Creating a Service

```typescript
const service = {
  local_id: uuidv4(),
  service_type_id: 1,
  service_type_name: "Sunday Morning Service",
  location: "Main Sanctuary",
  notes: "Special event",
  started_at: new Date().toISOString(),
  synced: false
}

await databaseService.createService(service)
```

#### Creating a Visitor

```typescript
const visitor = {
  local_id: uuidv4(),
  first_name: "John",
  last_name: "Doe",
  phone: "555-1234",
  email: "john@example.com",
  inviter_name: "Jane Smith",
  synced: false,
  created_at: new Date().toISOString()
}

await databaseService.createVisitor(visitor)
```

#### Creating Attendance

```typescript
const attendance = {
  local_id: uuidv4(),
  service_local_id: service.local_id,
  visitor_local_id: visitor.local_id,
  checked_in_at: new Date().toISOString(),
  synced: false
}

await databaseService.createAttendance(attendance)
```

#### Getting Unsynced Records

```typescript
// Get all unsynced services
const unsyncedServices = await databaseService.getUnsyncedServices()

// Get all unsynced visitors
const unsyncedVisitors = await databaseService.getUnsyncedVisitors()

// Get all unsynced attendance
const unsyncedAttendance = await databaseService.getUnsyncedAttendance()
```

#### Marking Records as Synced

```typescript
// After successful sync, update with remote_id
await databaseService.markServiceSynced(localId, remoteId)
await databaseService.markVisitorSynced(localId, remoteId)
await databaseService.markAttendanceSynced(localId, remoteId)
```

#### Searching Visitors

```typescript
// Search by name or phone
const results = await databaseService.searchVisitors("John")
```

#### Getting Service Attendance

```typescript
// Get all attendance for a service
const attendance = await databaseService.getServiceAttendance(serviceLocalId)
```

---

### Backend Database Operations

#### Creating a Service (via API)

```php
// POST /api/services
{
  "service_type_id": 1,
  "location": "Main Sanctuary",
  "notes": "Special event",
  "started_at": "2024-01-15T10:00:00Z",
  "ended_at": null
}

// Response
{
  "id": 123,
  "service_type_id": 1,
  ...
}
```

#### Creating a Visitor (via API)

```php
// POST /api/visitors
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "555-1234",
  "email": "john@example.com",
  "inviter_name": "Jane Smith"
}

// Response
{
  "id": 456,
  "first_name": "John",
  ...
}
```

#### Creating Attendance (via API)

```php
// POST /api/attendance/checkin
{
  "service_id": 123,
  "visitor_id": 456,
  "checked_in_at": "2024-01-15T10:30:00Z"
}

// Response
{
  "success": true,
  "id": 789,
  "message": "Visitor checked in successfully"
}
```

---

## Schema Details

### Mobile Database Relationships

```
services (1) ──┐
               ├──> attendance (many)
visitors (1) ──┘

service_types (1) ──> services (many)
```

### Backend Database Relationships

```
users (1) ──> services (many)
service_types (1) ──> services (many)
services (1) ──> attendance (many)
visitors (1) ──> attendance (many)
```

### Data Type Mappings

| Mobile (SQLite) | Backend (MySQL) |
|----------------|-----------------|
| TEXT | VARCHAR/TEXT |
| INTEGER | INT |
| REAL | DECIMAL/FLOAT |
| BLOB | BLOB |

### Timestamp Handling

**Mobile**: Stores timestamps as ISO 8601 strings (`TEXT`)
- Example: `"2024-01-15T10:00:00.000Z"`

**Backend**: Uses MySQL `TIMESTAMP` type
- Auto-managed by MySQL
- Format: `YYYY-MM-DD HH:MM:SS`

---

## API Reference

### DatabaseService Methods

#### Service Methods
- `createService(service)` - Create new service
- `getActiveService()` - Get currently active service
- `endService(localId, endedAt)` - Mark service as ended
- `getUnsyncedServices()` - Get all unsynced services
- `markServiceSynced(localId, remoteId)` - Mark service as synced
- `getServiceByLocalId(localId)` - Get service by local ID

#### Visitor Methods
- `createVisitor(visitor)` - Create new visitor
- `searchVisitors(query)` - Search visitors by name/phone
- `getUnsyncedVisitors()` - Get all unsynced visitors
- `markVisitorSynced(localId, remoteId)` - Mark visitor as synced
- `getVisitorByLocalId(localId)` - Get visitor by local ID

#### Attendance Methods
- `createAttendance(attendance)` - Create attendance record
- `getServiceAttendance(serviceLocalId)` - Get attendance for service
- `getUnsyncedAttendance()` - Get all unsynced attendance
- `markAttendanceSynced(localId, remoteId)` - Mark attendance as synced
- `getRecentCheckIns(limit)` - Get recent check-ins across all services

#### Service Type Methods
- `getServiceTypes()` - Get all service types
- `saveServiceTypes(types)` - Save service types to cache

---

## Best Practices

### Mobile Database

1. **Always use `local_id` for references** - Don't use auto-increment `id` for relationships
2. **Check sync status** - Before syncing, verify `synced = 0`
3. **Handle sync failures gracefully** - Don't delete records if sync fails
4. **Use transactions** - For complex operations involving multiple tables
5. **Index frequently queried fields** - Already done for `local_id`

### Backend Database

1. **Use foreign keys** - Maintain referential integrity
2. **Use transactions** - For bulk operations
3. **Index search fields** - Already done for names, phones, emails
4. **Validate data** - Before inserting/updating
5. **Use prepared statements** - Prevent SQL injection

### Synchronization

1. **Sync in order** - Services → Visitors → Attendance
2. **Handle dependencies** - Don't sync attendance until service & visitor synced
3. **Retry failed syncs** - Keep `synced = 0` for retry
4. **Check network** - Verify connectivity before syncing
5. **Update remote_id** - Always store backend ID after sync

---

## Troubleshooting

### Mobile Database Issues

**Database not initializing**:
- Check Expo SQLite is installed
- Verify app has storage permissions
- Check console for initialization errors

**Tables not created**:
- Check `initDatabase()` is called
- Verify SQL syntax is correct
- Check for SQLite version compatibility

**Data not persisting**:
- Verify database is not being cleared
- Check app storage permissions
- Verify records are being saved correctly

### Backend Database Issues

**Connection failed**:
- Verify database credentials
- Check host is accessible
- Verify database exists
- Check firewall/network settings

**Sync failing**:
- Verify backend API is running
- Check API endpoints are correct
- Verify database schema matches
- Check foreign key constraints

**Duplicate records**:
- Check unique constraints
- Verify sync logic handles duplicates
- Check for race conditions

---

## Migration & Backup

### Mobile Database

**Backup**: SQLite database is stored on device. To backup:
- Export database file (if accessible)
- Export data via app (future feature)

**Migration**: Database schema is versioned. Future migrations can be added to `initDatabase()`.

### Backend Database

**Backup**: Use MySQL dump:
```bash
mysqldump -h sql211.infinityfree.com -u if0_39702651 -p if0_39702651_church_db > backup.sql
```

**Migration**: Use Laravel migrations or SQL scripts in `database/` folder.

---

## Security Considerations

### Mobile Database

- **Local storage**: SQLite file is stored on device
- **No encryption**: Currently unencrypted (consider adding)
- **Access control**: App-level access only

### Backend Database

- **Credentials**: Stored in config files (keep secure)
- **SQL Injection**: Use prepared statements (already implemented)
- **Access control**: API authentication required
- **Backup**: Regular backups recommended

---

**Last Updated**: 2024
**Version**: 1.0.0

