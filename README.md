# DataPusher API Documentation

## Overview
Customer Labs API is a webhook management system that allows you to handle incoming data, manage accounts, destinations, members, and track logs. This API provides a comprehensive set of endpoints for managing webhook configurations and monitoring webhook events.

## Base URL
```
http://localhost:8000
```

## Authentication
The API uses Bearer token authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## API Endpoints

### User Management

#### Register User
- **POST** `/api/user/register`
- **Body:**
```json
{
  "email": "john123@gmail.com",
  "password": "Demo@123"
}
```

#### Login User
- **POST** `/api/user/login`
- **Body:**
```json
{
  "email": "john123@gmail.com",
  "password": "Demo@123"
}
```

#### Get User Profile
- **GET** `/api/user/profile`
- Requires authentication

#### Get All Users
- **GET** `/api/user/users`
- Requires authentication

#### Update Profile
- **PUT** `/api/user/profile`
- Requires authentication
- **Body:**
```json
{
  "email": "john@gmail.com",
  "currentPassword": "Demo@1234",
  "newPassword": "Demo@123"
}
```

### Account Management

#### Create Account
- **POST** `/api/accounts`
- **Body:**
```json
{
  "account_name": "Webhook Test Account",
  "website": "https://webhook.site"
}
```

#### Get Account By Id
- **GET** `/api/accounts/{id}`

#### Update Account
- **PUT** `/api/accounts/{id}`
- **Body:**
```json
{
  "account_name": "Johns Testing",
  "website": "https://demoanalytics.com"
}
```

#### Delete Account
- **DELETE** `/api/accounts/{id}`

#### List All Accounts
- **GET** `/api/accounts`

### Destination Management

#### Create Destination
- **POST** `/api/accounts/{accountId}/destinations`
- **Body:**
```json
{
  "url": "https://webhook.site/930ce096-9fd6-46c9-be29-58ec51b41308",
  "http_method": "POST",
  "headers": {
    "APP_ID": "e70b157d-d333-4151-ac0a-0d01cdc6989a",
    "APP_SECRET": "032d03b7-6db0-4009-aef6-35a5aa5e9d35",
    "ACTION": "user.update",
    "Content-Type": "application/json",
    "Accept": "*"
  }
}
```

#### Get Destination
- **GET** `/api/accounts/{accountId}/destinations/{destinationId}`

#### Update Destination
- **PUT** `/api/accounts/{accountId}/destinations/{destinationId}`
- **Body:**
```json
{
  "http_method": "PUT",
  "url": "https://webhook.site/updated-url-123",
  "headers": {
    "APP_ID": "NEWAPPID9876",
    "APP_SECRET": "updatedsecretkey123",
    "ACTION": "user.replace",
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}
```

#### Delete Destination
- **DELETE** `/api/accounts/{accountId}/destinations/{destinationId}`

#### List All Destinations
- **GET** `/api/accounts/{accountId}/destinations`

### Member Management

#### Create Member
- **POST** `/api/accounts/{accountId}/members`
- **Body:**
```json
{
  "email": "john123@gmail.com",
  "role_name": "User"
}
```

#### Update Member Role
- **PUT** `/api/accounts/{accountId}/members/{memberId}`
- **Body:**
```json
{
  "role_name": "Admin"
}
```

#### Remove Member
- **DELETE** `/api/accounts/{accountId}/members/{memberId}`

#### List All Members
- **GET** `/api/accounts/{accountId}/members`

#### Get Member By Id
- **GET** `/api/accounts/{accountId}/members/{memberId}`

### Logs Management

#### Read Logs By EventId
- **GET** `/api/accounts/{accountId}/logs/{eventId}`

#### Read All Logs
- **GET** `/api/accounts/{accountId}/logs`

### Incoming Data

#### Send Incoming Data
- **POST** `/api/server/incoming_data`
- **Headers:**
  - `CL-X-TOKEN: <your_token>`
  - `CL-X-EVENT-ID: <event_id>`
- **Body:**
```json
{
  "event_type": "user.update",
  "timestamp": "2025-06-15T13:05:00Z",
  "data": {
    "user": {
      "id": "USR-123",
      "email": "test123@example.com",
      "update_type": "profile_change",
      "changes": {
        "name": {
          "old": "John Doe",
          "new": "John Smith"
        },
        "phone": {
          "old": null,
          "new": "+1234567890"
        }
      }
    },
    "metadata": {
      "source": "api",
      "version": "1.0",
      "app_id": "ff9a24e3-fe44-4d15-a049-ffa761c99a04",
      "timestamp": "2025-06-15T13:05:00Z",
      "ip_address": "192.168.1.1"
    }
  }
}
```

## Error Handling
The API uses standard HTTP status codes to indicate the success or failure of requests:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
The API implements rate limiting for certain endpoints:

- `/api/server/incoming_data`: Limited to 5 requests per second per account
- Other endpoints: Please contact the API administrator for information about rate limiting policies.

When rate limits are exceeded, the API will respond with a 429 (Too Many Requests) status code.
