
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No notes to display.";
    notesList.appendChild(emptyItem);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-item";

    const title = document.createElement("h3");
    title.textContent = note.title || "(Untitled note)";

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    item.append(title, body);
    notesList.appendChild(item);
  });
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();

  return { data, status: response.status };
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...");

  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = result.data;
    renderNotes();

    if (notes.length === 0) {
      setStatus("No notes were found.", "success");
    } else {
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    setStatus("Unable to load notes. Please try again.", "error");
    console.error(error);
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);


noteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus("The title cannot exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1
      })
    });

    // JSONPlaceholder simulates creation but does not persist new posts.
    // Keep the returned note in local UI state so it appears until a reload.
    notes.unshift(result.data);
    renderNotes();

    noteForm.reset();

    setStatus(
      `Note created (status ${result.status}, id ${result.data.id}).`,
      "success"
    );
  } catch (error) {
    setStatus("Unable to create the note. Please try again.", "error");
    console.error(error);
  } finally {
    submitButton.disabled = false;
  }
});
