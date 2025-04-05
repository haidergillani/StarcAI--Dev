# Database Schema Overview

## User Model
Represents the registered users of the system.

### Indexes:
- **idx_user_email**: Index on email field for faster authentication lookups
- **idx_user_username**: Index on username field for faster authentication lookups

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each user. Primary key of the table.
- **username**: String
  - Description: The username of the user.
  - Constraints: Not nullable.
- **password**: String
  - Description: The hashed password of the user.
  - Constraints: Not nullable.
- **email**: String
  - Description: The email address of the user.
  - Constraints: Must be unique and not nullable.
- **is_oauth_user**: Boolean
  - Description: Flag indicating if the user is authenticated via OAuth.
  - Constraints: Defaults to false.

### Methods:
- **set_password(password: str)**
  - Description: Hashes and sets the user's password.
- **check_password(password: str) -> bool**
  - Description: Verifies if the provided password matches the stored hash.

### Relationships:
- **documents**: `relationship('Document')`
  - Type: List of Document
  - Description: List of documents associated with the user. Lazy-loaded relationship with cascade delete.

---

## Document Model
Represents documents created or uploaded by users.

### Indexes:
- **idx_user_docs**: Composite index on (user_id, id) for faster user document lookups
- **idx_doc_title**: Index on title field for title searches
- **idx_word_count**: Index on word_count for sorting/filtering
- **idx_upload_date**: Index on upload_date for date-based queries

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each document. Primary key of the table.
- **title**: String(255)
  - Description: The title of the document.
  - Constraints: Not nullable.
- **upload_date**: DateTime
  - Description: The date and time when the document was uploaded or created. Defaults to the current UTC time.
- **user_id**: Integer
  - Description: Foreign key linking to the User model.
  - Constraints: Not nullable.
- **word_count**: Integer
  - Description: The number of words in the document.
  - Constraints: Not nullable, defaults to 0.

### Relationships:
- **text_chunks**: `relationship('TextChunks')`
  - Type: List of TextChunks
  - Description: List of text chunks associated with the document. Lazy-loaded relationship with cascade delete.
- **history**: `relationship('DocumentHistory')`
  - Type: List of DocumentHistory
  - Description: List of document history entries. Lazy-loaded relationship with cascade delete.
- **suggestions**: `relationship('Suggestion')`
  - Type: List of Suggestion
  - Description: List of suggestions associated with the document.

---

## TextChunks Model
Represents chunks of text from a document that can be processed and rewritten.

### Indexes:
- **idx_doc_chunks**: Index on document_id for faster document lookups
- **idx_input_text**: Index on input_text_chunk for text search capabilities

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each text chunk. Primary key of the table.
- **input_text_chunk**: Text
  - Description: The original input text chunk.
  - Constraints: Not nullable.
- **rewritten_text**: Text
  - Description: The rewritten version of the text chunk.
  - Constraints: Not nullable.
- **document_id**: Integer
  - Description: Foreign key linking to the Document model.
  - Constraints: Not nullable.

### Relationships:
- **initial_score**: `relationship('InitialScore', uselist=False)`
  - Type: InitialScore
  - Description: The initial score associated with the text chunk. One-to-one relationship with cascade delete.
- **final_score**: `relationship('FinalScore', uselist=False)`
  - Type: FinalScore
  - Description: The final score associated with the text chunk. One-to-one relationship with cascade delete.

---

## DocumentHistory Model
Tracks the history of changes made to documents.

### Indexes:
- **idx_doc_history**: Composite index on (document_id, created_at) for efficient history lookups

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each history entry. Primary key of the table.
- **document_id**: Integer
  - Description: Foreign key linking to the Document model.
  - Constraints: Not nullable.
- **content**: Text
  - Description: The document content at this point in history.
  - Constraints: Not nullable.
- **created_at**: DateTime
  - Description: The timestamp when this history entry was created.
  - Constraints: Defaults to current UTC time.

---

## InitialScore Model
Captures the initial scoring metrics for a text chunk.

### Indexes:
- **idx_initial_scores**: Composite index on (text_chunk_id, score) for score lookups

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each initial score. Primary key of the table.
- **score**: Float
  - Description: The overall score.
  - Constraints: Not nullable.
- **optimism**: Float
  - Description: The optimism level.
  - Constraints: Not nullable.
- **forecast**: Float
  - Description: The forecast level.
  - Constraints: Not nullable.
- **confidence**: Float
  - Description: The confidence level.
  - Constraints: Not nullable.
- **text_chunk_id**: Integer
  - Description: Foreign key linking to the TextChunks model.
  - Constraints: Not nullable.

---

## FinalScore Model
Captures the final scoring metrics for a text chunk.

### Indexes:
- **idx_final_scores**: Composite index on (text_chunk_id, score) for score lookups

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each final score. Primary key of the table.
- **score**: Float
  - Description: The overall score.
  - Constraints: Not nullable.
- **optimism**: Float
  - Description: The optimism level.
  - Constraints: Not nullable.
- **forecast**: Float
  - Description: The forecast level.
  - Constraints: Not nullable.
- **confidence**: Float
  - Description: The confidence level.
  - Constraints: Not nullable.
- **text_chunk_id**: Integer
  - Description: Foreign key linking to the TextChunks model.
  - Constraints: Not nullable.

---

## Suggestion Model
Represents suggested improvements for document text chunks.

### Indexes:
- **idx_doc_suggestions**: Index on document_id for faster document suggestion lookups

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each suggestion. Primary key of the table.
- **document_id**: Integer
  - Description: Foreign key linking to the Document model.
  - Constraints: Not nullable.
- **input_text_chunk**: String
  - Description: The original text chunk that the suggestion applies to.
  - Constraints: Not nullable.
- **rewritten_text**: String
  - Description: The suggested rewritten text.
  - Constraints: Not nullable.

### Relationships:
- **document**: `relationship('Document')`
  - Type: Document
  - Description: The document this suggestion belongs to.
