# API Fixes Summary

## Overview
Fixed all API calls in the React Native app to match the FastAPI backend endpoints and data structures.

## **CRITICAL FIX: HMAC Signature**

### The Problem
The original code was using **simple SHA-256 hashing** instead of **HMAC-SHA256**, which caused all requests to fail with 401 Unauthorized.

**Backend expects:**
```python
hmac.new(APP_SECRET.encode(), (body + timestamp + APP_SECRET).encode(), hashlib.sha256).hexdigest()
```

**Old frontend (WRONG):**
```javascript
// ❌ This is just SHA-256, not HMAC!
Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, message)
```

**New frontend (CORRECT):**
```javascript
// ✅ Using Web Crypto API for proper HMAC-SHA256
const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signature = await crypto.subtle.sign('HMAC', key, messageData);
```

### Why This Matters
- **HMAC** is a keyed-hash message authentication code that uses a secret key
- **SHA-256** is just a hash function without authentication
- The backend uses Python's `hmac.new()` which requires matching HMAC on the frontend
- `expo-crypto` doesn't support HMAC, so we use the **Web Crypto API** instead

## Backend Endpoint Reference

### 1. `/mark_attendance` (POST)
- **Request**: `{ reg_no: string }`
- **Response (Success)**: `{ status: "success", message: "..." }`
- **Response (Already Marked)**: `{ status: "already_marked", message: "..." }` (HTTP 409)
- **Response (Not Found)**: `{ detail: "..." }` (HTTP 404)

### 2. `/check_attendance` (POST)
- **Request**: `{ reg_no: string }`
- **Response (Attended)**: 
  ```json
  {
    "reg_no": "...",
    "name": "...",
    "department": "...",
    "year": 1,
    "status": "attended",
    "attended_at": "DD-MM-YYYY HH:MM:SS"
  }
  ```
- **Response (Not Attended)**: 
  ```json
  {
    "reg_no": "...",
    "name": "...",
    "department": "...",
    "year": 1,
    "status": "not attended"
  }
  ```

### 3. `/stats` (GET)
- **Request**: No body (GET request)
- **Response**: 
  ```json
  {
    "summary": [
      { "year": 1, "attended": 50 },
      { "year": 2, "attended": 75 }
    ]
  }
  ```

### 4. `/recent_students` (GET)
- **Request**: Query params: `?page=1&per_page=10`
- **Response**: 
  ```json
  {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "total_pages": 10,
    "students": [
      {
        "reg_no": "...",
        "name": "...",
        "department": "...",
        "year": 1,
        "attended_at": "2024-10-24T10:30:00"
      }
    ]
  }
  ```

## Changes Made

### 1. `app/(tabs)/scanner.tsx`
- ✅ Changed `{ regno }` to `{ reg_no }` in API calls
- ✅ Added `sendSignedGet()` function for GET requests
- ✅ Updated `fetchTotalAttendees()` to use GET `/stats` and calculate total from summary
- ✅ Fixed response handling to check `status === "attended"` instead of `attended` property
- ✅ Fixed response handling for mark attendance to check `status === "success"`
- ✅ Added attended_at timestamp display in alerts

### 2. `app/(tabs)/manual.tsx`
- ✅ Added complete API integration (was missing)
- ✅ Added `sendSignedPost()` and `sendSignedGet()` functions
- ✅ Added state management for regNo, lastAdded, totalAttendees, isProcessing
- ✅ Implemented `fetchTotalAttendees()` using GET `/stats`
- ✅ Implemented `handleAddEntry()` to check and mark attendance
- ✅ Changed request payload from `{ regno }` to `{ reg_no }`
- ✅ Updated UI to show loading state and last added entry
- ✅ Added proper error handling and alerts

### 3. `app/(tabs)/stats.tsx`
- ✅ Fixed `/stats` endpoint to use GET instead of POST
- ✅ Added call to `/recent_students` endpoint for recent check-ins list
- ✅ Updated data transformation to match backend response structure
- ✅ Calculate total from summary array
- ✅ Transform students array to component's expected format
- ✅ Parse `attended_at` timestamp and format as time string
- ✅ Fixed error handling for better user feedback

### 4. `scripts/attendence_frontend.js`
- ✅ Added `sendSignedGet()` function for GET requests
- ✅ Updated comments to reference `reg_no` instead of generic examples
- ✅ Added note to use APP_SECRET from Constants.expoConfig

## Authentication
All endpoints (except `/`, `/docs`, `/redoc`, `/openapi.json`) require HMAC-SHA256 signature:
- Header: `X-App-Signature` - HMAC signature of `body + timestamp + APP_SECRET`
- Header: `X-App-Timestamp` - Current timestamp in milliseconds
- The signature must be generated using the same `APP_SECRET` as the backend
- Requests older than 5 minutes are rejected

## Testing Checklist
- [ ] Scanner screen: Scan a barcode/QR code that doesn't exist in DB (should show error)
- [ ] Scanner screen: Scan a valid registration number (should mark attendance)
- [ ] Scanner screen: Scan the same registration number again (should show "Already Checked In")
- [ ] Scanner screen: Verify total attendees count updates after marking
- [ ] Manual entry: Enter invalid registration number (should show error)
- [ ] Manual entry: Enter valid registration number (should mark attendance)
- [ ] Manual entry: Enter same registration number again (should show "Already Checked In")
- [ ] Manual entry: Verify last added displays correctly
- [ ] Stats screen: Pull to refresh to see updated data
- [ ] Stats screen: Verify total count matches backend
- [ ] Stats screen: Verify recent students list displays correctly with timestamps

## Configuration
Make sure your `app.json` has the correct values:
```json
{
  "expo": {
    "extra": {
      "appSecret": "cdb8d7497b34a314db76dd832803b393f6f4ef0dfa2a1dd230a7c8b32d600fb9",
      "apiBaseUrl": "https://unique-inspiration-production.up.railway.app"
    }
  }
}
```

## Common Issues & Solutions

### Issue: "Unauthorized request" (401)
- **Cause**: Signature mismatch or timestamp too old
- **Solution**: Verify APP_SECRET matches between frontend and backend

### Issue: "Student not found" (404)
- **Cause**: Registration number doesn't exist in database
- **Solution**: Add student to database first

### Issue: "Missing signature headers"
- **Cause**: Request not properly signed
- **Solution**: Ensure all requests use `sendSignedPost()` or `sendSignedGet()`

### Issue: Network errors
- **Cause**: CORS or connectivity issues
- **Solution**: Verify API_BASE_URL is correct and uses HTTPS
