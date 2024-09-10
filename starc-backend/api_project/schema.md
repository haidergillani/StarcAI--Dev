# Database Schema Overview

## User Model
Represents the registered users of the system.

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each user. Primary key of the table.
- **name**: String
  - Description: The name of the user.
  - Constraints: Not nullable.
- **password**: String
  - Description: The hashed password of the user.
  - Constraints: Not nullable.
- **email**: String
  - Description: The email address of the user.
  - Constraints: Must be unique and not nullable.

### Methods:
- **set_password(password: str)**
  - Description: Hashes and sets the user's password.
- **check_password(password: str) -> bool**
  - Description: Verifies if the provided password matches the stored hash.
- **to_dict() -> dict**
  - Description: Returns a dictionary representation of the user's information.

### Relationships:
- **documents**: `db.relationship('Document')`
  - Type: List of Document
  - Description: List of documents associated with the user. Lazy-loaded relationship.

---

## Document Model
Represents documents created or uploaded by users.

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
  - Constraints: Not nullable.

### Methods:
- **to_dict() -> dict**
  - Description: Returns a dictionary representation of the document's information.

### Relationships:
- **versions**: `db.relationship('Version')`
  - Type: List of Version
  - Description: List of versions associated with the document. Lazy-loaded relationship.

---

## Version Model
Represents different versions of a document.

### Attributes:
- **id**: Integer
  - Description: A unique identifier for each version. Primary key of the table.
- **input_text_chunk**: Text
  - Description: The text chunk of the document version.
  - Constraints: Not nullable.
- **timestamp**: DateTime
  - Description: The date and time when the version was created. Defaults to the current UTC time.
- **document_id**: Integer
  - Description: Foreign key linking to the Document model.
  - Constraints: Not nullable.
- **parent_version_id**: Integer
  - Description: A reference to the parent version, if any.

### Methods:
- **to_dict() -> dict**
  - Description: Returns a dictionary representation of the version's information.

### Relationships:
- **sentences**: `db.relationship('Sentence')`
  - Type: List of Sentence
  - Description: List of sentences associated with the version. Lazy-loaded relationship.
- **initial_score**: `db.relationship('InitialScore', uselist=False)`
  - Type: InitialScore
  - Description: The initial score associated with the version.
- **final_score**: `db.relationship('FinalScore', uselist=False)`
  - Type: FinalScore
  - Description: The final score associated with the version.

---

---

## InitialScore Model
Captures the initial scoring metrics for a version of a document.

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
- **version_id**: Integer
  - Description: Foreign key linking to the Version model.
  - Constraints: Not nullable.

### Methods:
- **to_dict() -> dict**
  - Description: Returns a dictionary representation of the initial score's information.

### Relationships:
- None defined.

---

## FinalScore Model
Captures the final scoring metrics for a version of a document.

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
- **version_id**: Integer
  - Description: Foreign key linking to the Version model.
  - Constraints: Not nullable.

### Methods:
- **to_dict() -> dict**
  - Description: Returns a dictionary representation of the final score's information.

### Relationships:
- None defined.
