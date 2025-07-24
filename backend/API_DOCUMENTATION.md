# Prayer Tracker API - New Optimized Structure

## Overview

The prayers table has been optimized from storing individual prayer records to daily records with boolean flags for each of the 5 daily prayers.

### New Table Structure

```sql
Table: prayers
- id: int AI PK
- user_id: int
- mosque_id: int
- prayer_date: date
- fajr: tinyint(1) DEFAULT 0
- dhuhr: tinyint(1) DEFAULT 0
- asr: tinyint(1) DEFAULT 0
- maghrib: tinyint(1) DEFAULT 0
- isha: tinyint(1) DEFAULT 0
- daily_completion_rate: decimal(5,2) DEFAULT 0.00
- notes: text
- created_at: timestamp
- updated_at: timestamp
- zikr_count: int DEFAULT 0
- quran_minutes: int DEFAULT 0
```

## API Endpoints

### 1. GET /prayers - Get Prayer Records

Retrieves prayer records for the authenticated user.

**Query Parameters:**

- `date` (optional): Specific date (YYYY-MM-DD)
- `month` (optional): Month number (1-12)
- `year` (optional): Year (YYYY)
- If no params provided, returns current month

**Example:**

```bash
GET /prayers?date=2025-01-20
GET /prayers?month=1&year=2025
GET /prayers
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "mosque_id": 1,
      "prayer_date": "2025-01-20",
      "fajr": 1,
      "dhuhr": 1,
      "asr": 0,
      "maghrib": 1,
      "isha": 1,
      "daily_completion_rate": 80.0,
      "notes": "Good day",
      "zikr_count": 50,
      "quran_minutes": 30,
      "mosque_name": "Central Mosque"
    }
  ]
}
```

### 2. POST /prayers - Record Daily Prayers

Records or updates prayers for a specific day. Supports partial updates.

**Request Body:**

```json
{
  "prayer_date": "2025-01-20",
  "fajr": true,
  "dhuhr": true,
  "asr": false,
  "maghrib": true,
  "isha": true,
  "notes": "Alhamdulillah, good day",
  "zikr_count": 100,
  "quran_minutes": 45
}
```

**Response:**

```json
{
  "success": true,
  "message": "Prayers recorded successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "prayer_date": "2025-01-20",
    "fajr": 1,
    "dhuhr": 1,
    "asr": 0,
    "maghrib": 1,
    "isha": 1,
    "daily_completion_rate": 80.0,
    "notes": "Alhamdulillah, good day",
    "zikr_count": 100,
    "quran_minutes": 45
  }
}
```

### 3. PATCH /prayers/individual - Update Individual Prayer

Updates a single prayer for a specific day.

**Request Body:**

```json
{
  "prayer_date": "2025-01-20",
  "prayer_type": "fajr",
  "prayed": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "fajr prayer updated successfully",
  "data": {
    "id": 1,
    "prayer_date": "2025-01-20",
    "fajr": 1,
    "daily_completion_rate": 20.0
  }
}
```

### 4. GET /prayers/stats - Get Prayer Statistics

Retrieves comprehensive prayer statistics.

**Query Parameters:**

- `period` (optional): Number of days to include (default: 30)

**Example:**

```bash
GET /prayers/stats?period=7
GET /prayers/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "period_days": 30,
    "total_days_tracked": 25,
    "overall_completion_rate": 78.5,
    "total_prayers_prayed": 98,
    "total_possible_prayers": 125,
    "current_streak": 5,
    "prayer_breakdown": [
      {
        "prayer_type": "Fajr",
        "prayed": 20,
        "total_possible": 25,
        "rate": "80.00"
      },
      {
        "prayer_type": "Dhuhr",
        "prayed": 22,
        "total_possible": 25,
        "rate": "88.00"
      }
    ],
    "spiritual_activities": {
      "avg_zikr_count": "75.5",
      "avg_quran_minutes": "25.8"
    }
  }
}
```

## cURL Test Examples

### 1. Record Daily Prayers (Complete Day)

```bash
curl -X POST http://localhost:5000/prayers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prayer_date": "2025-01-20",
    "fajr": true,
    "dhuhr": true,
    "asr": true,
    "maghrib": true,
    "isha": true,
    "notes": "Alhamdulillah for this blessed day",
    "zikr_count": 100,
    "quran_minutes": 30
  }'
```

### 2. Update Only Specific Prayers

```bash
curl -X POST http://localhost:5000/prayers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prayer_date": "2025-01-20",
    "fajr": true,
    "dhuhr": false
  }'
```

### 3. Mark Individual Prayer

```bash
curl -X PATCH http://localhost:5000/prayers/individual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prayer_date": "2025-01-20",
    "prayer_type": "fajr",
    "prayed": true
  }'
```

### 4. Get Today's Prayers

```bash
curl -X GET "http://localhost:5000/prayers?date=2025-01-20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Prayer Statistics

```bash
curl -X GET "http://localhost:5000/prayers/stats?period=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Migration Benefits

### Before (Old Structure):

- 5 records per day per user
- Complex GROUP BY queries for statistics
- Redundant data (mosque_id, notes repeated)
- Inefficient storage and indexing

### After (New Structure):

- 1 record per day per user (80% reduction)
- Simple SUM() queries for statistics
- Efficient boolean columns for prayer status
- Built-in completion rate calculation
- Better performance and maintainability

## Key Features

1. **Partial Updates**: Can update individual prayers or full day
2. **Auto-calculated completion rates**: Automatically computes daily progress
3. **Efficient querying**: Single record per day improves query performance
4. **Backward compatibility**: API maintains similar response structure
5. **Enhanced statistics**: More detailed and faster statistics calculation
