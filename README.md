# QuickNotes System Design

QuickNotes is a browser-based notes client and system-design project. The client demonstrates GET, POST and DELETE requests using the JSONPlaceholder practice API. The documentation describes the real API, relational data model and scalable architecture that a production QuickNotes service could use.

## Features

- Load 10 notes from JSONPlaceholder.
- Create a note with title validation and an optional body.
- Delete notes from the current page state after a successful API response.
- Display loading, success, error and empty states.
- Disable relevant buttons while requests are in progress.
- Insert note text with `textContent` to avoid interpreting it as HTML.
- Document REST endpoints, SQL data structures, capacity estimates and architecture trade-offs.

**Important:** JSONPlaceholder is a practice API. Its POST and DELETE operations simulate changes but do not permanently persist them. Notes created by the client may disappear after a reload, and deleted sample posts may appear again.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the API Client

1. Clone or download this repository.
2. Open the project folder in VS Code.
3. Start a local web server, for example with the VS Code Live Server extension.
4. Open `index.html` through the local server.
5. Click **Load notes** to retrieve sample posts.
6. Use the form to create a note and use the Delete buttons to remove notes from the current page state.

The browser needs an internet connection to contact JSONPlaceholder. Opening the HTML file directly may work, but using a local web server is recommended.

No backend installation or database setup is required for the practice client.

## Design Documents

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, and error handling.
- [Data Model](docs/data-model.md) — users, notes, tags, relationships, SQL queries and indexes.
- [Architecture](docs/architecture.md) — requirements, capacity estimates, architecture diagram, request flows and trade-offs.

## What I Learned

- How to use `fetch()` and asynchronous JavaScript to make GET, POST and DELETE requests.
- How to handle loading, success, error and empty states, validate input, and disable buttons during requests.
- Why user-provided text should be rendered with `textContent` rather than inserted as HTML.
- How primary keys, foreign keys, indexes and join tables support a relational data model.
- How caching, load balancing, read replicas and background queues help an application scale.
- How to estimate read/write traffic and storage needs before selecting an architecture.
- Why scalable system design requires trade-offs between performance, consistency, availability, cost and complexity.
