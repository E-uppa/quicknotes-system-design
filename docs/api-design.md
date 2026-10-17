# QuickNotes API Design

## Overview

QuickNotes provides a REST API for authenticated users to create, read, update and delete notes and organize notes with tags.

Base URL: `https://api.quicknotes.example/v1`

All request and response bodies use JSON unless otherwise specified. Authenticated endpoints require a bearer access token.

## Endpoints

| Method | Path                           | Description                                          | Success status |
| ------ | ------------------------------ | ---------------------------------------------------- | -------------- |
| POST   | `/auth/login`                  | Authenticate a user and issue an access token        | 200 OK         |
| GET    | `/notes`                       | List the authenticated user's notes, with pagination | 200 OK         |
| POST   | `/notes`                       | Create a note for the authenticated user             | 201 Created    |
| GET    | `/notes/{noteId}`              | Retrieve one note owned by the user                  | 200 OK         |
| PATCH  | `/notes/{noteId}`              | Update selected fields of a note                     | 200 OK         |
| DELETE | `/notes/{noteId}`              | Delete a note owned by the user                      | 204 No Content |
| GET    | `/tags`                        | List tags available to the authenticated user        | 200 OK         |
| POST   | `/notes/{noteId}/tags`         | Attach an existing tag to a note                     | 201 Created    |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag from a note                             | 204 No Content |

## Creating a Note

### Request

`POST /v1/notes`

Headers:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

Request JSON:

```json
{
  "title": "Meeting notes",
  "body": "Discuss project milestones.",
  "tagIds": [2, 4]
}
```

The title is required and must contain no more than 100 characters. The body is optional. The authenticated user ID is derived from the access token rather than trusted from the request body.

### Successful response

Status: `201 Created`

```json
{
  "id": 101,
  "userId": 12,
  "title": "Meeting notes",
  "body": "Discuss project milestones.",
  "tags": [
    {
      "id": 2,
      "name": "Work"
    },
    {
      "id": 4,
      "name": "Planning"
    }
  ],
  "createdAt": "2026-10-15T10:30:00Z",
  "updatedAt": "2026-10-15T10:30:00Z"
}
```

## Listing Notes

### Request

`GET /v1/notes?page=1&limit=20`

Headers:

```http
Authorization: Bearer <access-token>
```

### Successful response

Status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "userId": 12,
      "title": "Meeting notes",
      "body": "Discuss project milestones.",
      "tags": [
        {
          "id": 2,
          "name": "Work"
        }
      ],
      "createdAt": "2026-10-15T10:30:00Z",
      "updatedAt": "2026-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

The API returns only notes the authenticated user is authorized to view. Pagination limits the amount of data returned in one response.

## Error Status Codes

| Status                    | Meaning                                                             | Example situation                                          |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| 400 Bad Request           | The request is invalid                                              | Missing title or invalid JSON                              |
| 401 Unauthorized          | Authentication is missing or invalid                                | Expired or absent access token                             |
| 403 Forbidden             | The user is authenticated but not allowed to perform the action     | Attempting an operation prohibited by a user's permissions |
| 404 Not Found             | The requested resource does not exist or is not visible to the user | Note ID not found                                          |
| 409 Conflict              | The request conflicts with the current state                        | Duplicate tag association                                  |
| 422 Unprocessable Content | The JSON is valid but fails a business validation rule              | Title exceeds the permitted length                         |
| 429 Too Many Requests     | The client exceeded its rate limit                                  | Too many requests in a short period                        |
| 500 Internal Server Error | An unexpected server error occurred                                 | Unhandled application or database error                    |

## Example Error Body

Status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required.",
    "details": {
      "field": "title"
    },
    "requestId": "req_abc123"
  }
}
```

Error responses should use a consistent structure and must not expose passwords, access tokens, SQL statements, or internal stack traces.

## API Design Decisions

- Use nouns in resource paths and HTTP methods to express actions.
- Require authentication for private user data.
- Derive ownership from the authenticated identity, not an untrusted `userId` supplied by the client.
- Validate all inputs on the server.
- Use pagination to control response size.
- Use `201 Created` for successful creation and `204 No Content` for successful deletion without a response body.
- Return consistent error objects to help clients handle failures.
