# API Endpoints for Image Upload Testing

## Prerequisites
1. Add these environment variables to your `.env` file:
   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
   S3_BUCKET_NAME=your_bucket_name_here
   ```

2. Ensure you have a valid JWT token for authentication
3. Your S3 bucket should have proper IAM permissions for the access key

---

## 1. Upload Feed Image

**Endpoint:** `POST /api/feeds/upload-image`

**Headers:**
```
Authorization: Bearer your_jwt_token_here
Content-Type: multipart/form-data
```

**Body (form-data):**
```
Key: image
Type: File
Value: [Select your image file]
```

**Roles Required:** Founder, WCM, SuperAdmin

**Expected Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image_url": "https://your-bucket.s3.eu-north-1.amazonaws.com/images/1703123456789-987654321_your-image.jpg",
    "filename": "images/1703123456789-987654321_your-image.jpg"
  }
}
```

---

## 2. Create Feed with Image

**Endpoint:** `POST /api/feeds`

**Headers:**
```
Authorization: Bearer your_jwt_token_here
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Test Feed with Image",
  "content": "This is a test feed with an uploaded image",
  "priority": "high",
  "image_url": "https://your-bucket.s3.eu-north-1.amazonaws.com/images/1703123456789-987654321_your-image.jpg",
  "video_url": null,
  "expires_at": "2024-12-31 23:59:59",
  "send_notification": true,
  "area_id": 1
}
```

**Roles Required:** Founder, WCM, SuperAdmin

---

## 3. Upload Profile Picture

**Endpoint:** `POST /api/users/upload-profile-picture`

**Headers:**
```
Authorization: Bearer your_jwt_token_here
Content-Type: multipart/form-data
```

**Body (form-data):**
```
Key: profile_picture
Type: File
Value: [Select your profile image file]
```

**Roles Required:** Any authenticated user

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profile_picture": "https://your-bucket.s3.eu-north-1.amazonaws.com/images/1703123456789-987654321_profile.jpg",
    "filename": "images/1703123456789-987654321_profile.jpg"
  }
}
```

---

## 4. Upload Announcement Image

**Endpoint:** `POST /api/announcements/upload-image`

**Headers:**
```
Authorization: Bearer your_jwt_token_here
Content-Type: multipart/form-data
```

**Body (form-data):**
```
Key: image
Type: File
Value: [Select your image file]
```

**Roles Required:** Founder, WCM, SuperAdmin

**Expected Response:**
```json
{
  "success": true,
  "message": "Announcement image uploaded successfully",
  "data": {
    "image_url": "https://your-bucket.s3.eu-north-1.amazonaws.com/images/1703123456789-987654321_announcement.jpg",
    "filename": "images/1703123456789-987654321_announcement.jpg"
  }
}
```

---

## Testing Steps in Postman

### Step 1: Authenticate and Get Token
1. First, login using your existing login endpoint
2. Copy the JWT token from the response

### Step 2: Test Image Upload
1. Create a new POST request
2. Set the URL to one of the upload endpoints above
3. Add Authorization header with "Bearer your_jwt_token"
4. In Body tab, select "form-data"
5. Add key "image" (or "profile_picture" for profile uploads)
6. Set type to "File" and select an image file
7. Send the request

### Step 3: Use the Uploaded Image
1. Copy the `image_url` from the upload response
2. Use this URL in your feed/announcement creation requests

---

## Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**400 Bad Request (No file):**
```json
{
  "success": false,
  "message": "No image file provided"
}
```

**403 Forbidden (Wrong role):**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Failed to upload image",
  "error": "Detailed error message"
}
```

---

## File Constraints

- **Allowed file types:** Images only (jpg, jpeg, png, gif, webp)
- **Maximum file size:** 5MB
- **File naming:** Automatically generated with timestamp and random suffix
- **Storage location:** S3 bucket under `images/` folder
- **Access:** Public read access for uploaded files

---

## S3 Bucket Configuration Required

Your S3 bucket needs:
1. IAM user with `GetObject` and `PutObject` permissions
2. Public read access for the uploaded files
3. CORS configuration if accessing from web browsers
4. Proper bucket policy for the access point

## Example S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```
