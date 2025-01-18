# REST API Endpoint Schema

## Authentication API

### Base: `/auth`

1. **Register User**
   - **Endpoint:** `POST /register`
   - **Request Body:**
     - `username`: string (required)
     - `email`: string (required)
     - `password`: string (required)
   - **Responses:**
     - `201 Created`: `message`: "Registered successfully"
     - `400 Bad Request`: `message`: "Username, email, and password required" or "Username already exists" or "Email already registered"

2. **Login User**
   - **Endpoint:** `POST /login`
   - **Request Body:**
     - `login_identifier`: string (required) - username or email
     - `password`: string (required)
   - **Responses:**
     - `200 OK`: `access_token`: string
     - `401 Unauthorized`: `message`: "Invalid credentials"

3. **Google Login**
   - **Endpoint:** `POST /google`
   - **Request Body:**
     - `token` or `credential`: string (required) - Google OAuth token
   - **Responses:**
     - `200 OK`: `access_token`: string
     - `400 Bad Request`: `message`: "Token is required"
     - `401 Unauthorized`: `message`: "Invalid token"
     - `500 Internal Server Error`: `message`: "Internal server error"

4. **Refresh Token**
   - **Endpoint:** `POST /refresh`
   - **Headers:**
     - `Authorization`: Bearer Token (required)
   - **Responses:**
     - `200 OK`: `access_token`: string (new token)
     - `401 Unauthorized`: `message`: "Token is missing or invalid"

## Document Processing API

### Base: `/docs`

1. **Create Document**
   - **Endpoint:** `POST /`
   - **Headers:** `Authorization`: Bearer Token
   - **Request Body:**
     - `title`: string (required)
     - `text`: string (required)
   - **Responses:**
     - `200 OK` with document processing results
     - `400 Bad Request` if title or text is missing

2. **Upload PDF**
   - **Endpoint:** `POST /pdf`
   - **Headers:** `Authorization`: Bearer Token
   - **Form Data:**
     - `file`: PDF file
   - **Responses:**
     - `201 Created` with PDF processing results
     - `400 Bad Request` if file is missing or invalid

3. **Delete Document**
   - **Endpoint:** `DELETE /:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "Document and related data deleted successfully"
     - `404 Not Found`: `message`: "Document not found or access denied"

4. **Update Document**
   - **Endpoint:** `PUT /:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Request Body:**
     - `title`: string (optional)
     - `text`: string (optional)
   - **Responses:**
     - `200 OK` with updated document details and scores
     - `404 Not Found`: `message`: "Document not found or access denied"

5. **Get Document Details**
   - **Endpoint:** `GET /:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with document details including text
     - `404 Not Found`: `message`: "Document not found or access denied"

6. **Get Document as PDF**
   - **Endpoint:** `GET /pdf/:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with PDF file
     - `404 Not Found`: `message`: "Document not found or access denied"

7. **Get Original Scores**
   - **Endpoint:** `GET /scores/:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with final scores
     - `404 Not Found` if scores or document not found

8. **Chat with Bot**
   - **Endpoint:** `POST /chatbot`
   - **Headers:** `Authorization`: Bearer Token
   - **Request Body:**
     - `prompt`: string (required)
   - **Responses:**
     - `200 OK`: `response`: string (chatbot's response)
     - `500 Internal Server Error`: Error details

9. **Save Rewrite**
   - **Endpoint:** `POST /:document_id/save_rewrite`
   - **Headers:** `Authorization`: Bearer Token
   - **Request Body:**
     - `rewritten_text`: string (required)
   - **Responses:**
     - `200 OK`: `message`: "Rewritten text saved successfully"
     - `404 Not Found`: `message`: "Document not found or access denied"

10. **Warm Up Model**
    - **Endpoint:** `GET /warmup`
    - **Headers:** `Authorization`: Bearer Token
    - **Responses:**
      - `200 OK`: `message`: "Model warmed up successfully"
      - `500 Internal Server Error`: `message`: "Failed to warm up model"

## Search API

### Base: `/api`

1. **Search Documents**
   - **Endpoint:** `GET /search`
   - **Headers:** `Authorization`: Bearer Token
   - **Query Parameters:**
     - `q`: Search query string
     - `page`: Page number (default: 1)
     - `limit`: Results per page (default: 12)
   - **Responses:**
     - `200 OK` with paginated search results
     - `204 No Content` if no documents found

## Rewrite API

### Base: `/fix`

1. **Get Document Text Chunks**
   - **Endpoint:** `GET /:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with list of text chunks
     - `404 Not Found`: `message`: "Document not found or access denied"

2. **Update Text Chunk**
   - **Endpoint:** `PUT /:document_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Request Body:**
     - `updated_text_chunk`: string (required)
   - **Responses:**
     - `200 OK`: `message`: "Text chunk updated successfully"
     - `404 Not Found`: `message`: "Document not found or access denied"

3. **Reset Text Chunk**
   - **Endpoint:** `PUT /:document_id/reset`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "Text chunk reset to original text successfully"
     - `404 Not Found`: `message`: "Document not found or access denied"

4. **Generate Suggestions**
   - **Endpoint:** `POST /:document_id/suggestions`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with list of suggestions
     - `404 Not Found`: `message`: "Document not found or access denied"

5. **Get Suggestions**
   - **Endpoint:** `GET /:document_id/suggestions`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK` with list of suggestions
     - `404 Not Found`: `message`: "Document not found or access denied"

6. **Apply Suggestion**
   - **Endpoint:** `PUT /:document_id/suggestions/:suggestion_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "Suggestion applied and deleted successfully"
     - `404 Not Found`: `message`: "Suggestion not found"

7. **Delete Suggestion**
   - **Endpoint:** `DELETE /:document_id/suggestions/:suggestion_id`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "Suggestion deleted successfully"
     - `404 Not Found`: `message`: "Suggestion not found"

8. **Apply All Suggestions**
   - **Endpoint:** `GET /:document_id/suggestions/apply_all`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "All suggestions applied and deleted successfully"
     - `404 Not Found`: `message`: "No suggestions found"

9. **Delete All Suggestions**
   - **Endpoint:** `GET /:document_id/suggestions/delete_all`
   - **Headers:** `Authorization`: Bearer Token
   - **Responses:**
     - `200 OK`: `message`: "All suggestions deleted successfully"
     - `404 Not Found`: `message`: "No suggestions found"

10. **Chat with Bot**
    - **Endpoint:** `POST /chat`
    - **Headers:** `Authorization`: Bearer Token
    - **Request Body:**
      - `prompt`: string (required)
      - `chat_log`: array of ChatMessage objects
    - **Responses:**
      - `200 OK` with chat response and updated chat log
      - `500 Internal Server Error`: Error details

11. **Rewrite Text**
    - **Endpoint:** `POST /:document_id/rewrite`
    - **Headers:** `Authorization`: Bearer Token
    - **Request Body:**
      - `prompt`: string (required)
    - **Responses:**
      - `200 OK` with rewritten text and scores
      - `404 Not Found`: `message`: "Document not found or access denied"
