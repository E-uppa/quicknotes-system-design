
# QuickNotes Data Model

## 1. Entities and Columns

### Users

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | Primary key |
| `email` | VARCHAR(255) | Required, unique |
| `password_hash` | VARCHAR(255) | Required |
| `created_at` | TIMESTAMP | Required |

### Notes

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | Required, foreign key to `users.id` |
| `title` | VARCHAR(100) | Required |
| `body` | TEXT | Optional |
| `created_at` | TIMESTAMP | Required |
| `updated_at` | TIMESTAMP | Required |

### Tags

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | Primary key |
| `user_id` | INTEGER | Required, foreign key to `users.id` |
| `name` | VARCHAR(50) | Required |
| `created_at` | TIMESTAMP | Required |

The combination of `user_id` and `name` is unique so that a user cannot create duplicate tags with the same name.

### Note_Tags

| Column | Type | Constraints |
|---|---|---|
| `note_id` | INTEGER | Primary key component, foreign key to `notes.id` |
| `tag_id` | INTEGER | Primary key component, foreign key to `tags.id` |

The pair `(note_id, tag_id)` is the composite primary key, preventing the same tag from being attached to the same note more than once.

## 2. Relationships

### One-to-Many

One user can own many notes, but each note belongs to one user. This is represented by `notes.user_id` referencing `users.id`.

One user can also create many tags, but each tag belongs to one user. This is represented by `tags.user_id` referencing `users.id`.

### Many-to-Many

One note can have several tags, and one tag can be attached to several notes. This many-to-many relationship is represented by the `note_tags` join table.

The join table is needed because a relational database should store each note-tag association as a separate row instead of storing a comma-separated list of tag IDs in the notes table. It also allows the database to enforce valid references and prevent duplicate associations.

## 3. CREATE TABLE Statements

The following SQL uses SQLite-compatible types and constraints.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL
        CHECK (length(trim(title)) BETWEEN 1 AND 100),
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id)
        ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
);
```

The foreign keys prevent notes and tags from referring to users that do not exist. Cascading deletion removes dependent records when a user, note, or tag is deleted. The application must enforce authorization before performing these operations.

## 4. Example SQL Queries

### Query 1: List a user's notes

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 12
ORDER BY updated_at DESC;
```

This retrieves the notes owned by user 12, with recently updated notes first.

### Query 2: Find all tags attached to a note

```sql
SELECT tags.id, tags.name
FROM tags
JOIN note_tags ON tags.id = note_tags.tag_id
WHERE note_tags.note_id = 101;
```

This uses a JOIN to connect tags with the note-tag associations for note 101.

### Query 3: Count notes per user

```sql
SELECT users.id, users.email, COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON users.id = notes.user_id
GROUP BY users.id, users.email;
```

The LEFT JOIN includes users who have no notes, and COUNT reports the number of notes for each user.

### Query 4: Find notes with a particular tag

```sql
SELECT notes.id, notes.title
FROM notes
JOIN note_tags ON notes.id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.id
WHERE tags.user_id = 12
  AND tags.name = 'Work';
```

This retrieves notes associated with the user's `Work` tag.

## 5. Indexes

```sql
CREATE INDEX idx_notes_user_updated
ON notes(user_id, updated_at);
```

This index supports queries that filter notes by user and sort them by update time. It can reduce the amount of work required to locate and order a user's notes. Indexes consume additional storage and can slow writes slightly because they must be maintained when data changes.

The primary keys and unique constraints also create indexes as required by the database.

## 6. Why SQL Instead of NoSQL?

I would choose a relational SQL database for QuickNotes because users, notes and tags have well-defined relationships. Foreign keys and unique constraints help preserve data integrity, while JOINs support queries involving notes and tags. Transactions can help keep related changes consistent. A NoSQL database may be useful for certain specialized workloads, but a relational database is a straightforward fit for the structured data and relationships in this application.
