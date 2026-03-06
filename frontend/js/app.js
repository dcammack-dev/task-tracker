// =============================================================
// TASK TRACKER - Frontend JavaScript (Module 10: API-Connected)
//
// MAJOR CHANGE: The frontend now talks to the backend API
// instead of using localStorage. Data flows like this:
//
//   User action → fetch() to API → server processes → JSON response
//                                                    → update display
//
// This is how real web apps work. The frontend is a "client"
// that communicates with the server via HTTP requests.
// =============================================================


// =============================================================
// 1. STATE: Frontend-only variables
//
// The tasks array is no longer the source of truth -- the SERVER
// is. We keep a local copy for display purposes, but every change
// goes through the API first.
// =============================================================

let tasks = [];
let currentFilter = "all";
let editingTaskId = null;

// The base URL for all API requests.
// Since our frontend is served by the same server, we can use
// relative URLs (starting with /).
const API_URL = "/api/tasks";


// =============================================================
// 2. API FUNCTIONS: Talk to the backend
//
// Each function corresponds to one API endpoint.
// They use fetch() to send HTTP requests and return the response.
//
// These are "async" functions because network requests take time.
// "await" pauses until the request completes.
// =============================================================

/**
 * GET /api/tasks -- Fetch all tasks from the server.
 * Optionally filter by status using a query parameter.
 */
async function fetchTasks(status) {
    // Build the URL. If a status filter is active, add ?status=...
    const url = status && status !== "all"
        ? `${API_URL}?status=${status}`
        : API_URL;

    const response = await fetch(url);
    const data = await response.json();
    return data;
}

/**
 * POST /api/tasks -- Create a new task on the server.
 * Sends the task data as JSON in the request body.
 */
async function createTask(taskData) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            // This header tells the server "I'm sending JSON"
            "Content-Type": "application/json"
        },
        // Convert the JavaScript object to a JSON string
        body: JSON.stringify(taskData)
    });

    // Check if the request succeeded
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
    }

    return await response.json();
}

/**
 * PUT /api/tasks/:id -- Update an existing task on the server.
 */
async function updateTask(id, taskData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
    }

    return await response.json();
}

/**
 * DELETE /api/tasks/:id -- Delete a task from the server.
 */
async function deleteTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
    }

    return await response.json();
}


// =============================================================
// 3. DOM REFERENCES
// =============================================================

const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskStatusInput = document.getElementById("task-status");
const taskListContainer = document.getElementById("task-list");
const taskCountDisplay = document.getElementById("task-count");
const filterBar = document.getElementById("filter-bar");


// =============================================================
// 4. RENDER FUNCTION
//
// Same concept as before: take the tasks array and build HTML.
// The difference is that now we load tasks FROM the server
// before rendering.
// =============================================================

async function renderTasks() {
    // Fetch tasks from the server (applying current filter)
    tasks = await fetchTasks(currentFilter);

    // Clear the display
    taskListContainer.innerHTML = "";

    // Update count
    updateTaskCount(tasks.length);

    // Empty state
    if (tasks.length === 0) {
        const filterLabel = currentFilter.replace("-", " ");
        const message = currentFilter === "all"
            ? "No tasks yet. Add one above!"
            : `No ${filterLabel} tasks.`;

        taskListContainer.innerHTML = `
            <p class="empty-message">${message}</p>
        `;
        return;
    }

    // Build a card for each task
    tasks.forEach(task => {
        const card = document.createElement("article");
        card.className = "task-card";
        card.setAttribute("data-status", task.status);

        if (editingTaskId === task.id) {
            // EDIT MODE
            card.classList.add("editing");
            card.innerHTML = `
                <div class="edit-form">
                    <div class="edit-field">
                        <label>Title</label>
                        <input type="text" class="edit-title" value="${task.title}">
                    </div>
                    <div class="edit-field">
                        <label>Description</label>
                        <textarea class="edit-description" rows="2">${task.description || ""}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>Status</label>
                        <select class="edit-status">
                            <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
                            <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
                            <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                        </select>
                    </div>
                    <div class="edit-actions">
                        <button class="btn-save" data-id="${task.id}">Save</button>
                        <button class="btn-cancel" data-id="${task.id}">Cancel</button>
                    </div>
                </div>
            `;
        } else {
            // VIEW MODE
            card.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-status status-${task.status}">
                        ${formatStatus(task.status)}
                    </span>
                </div>
                <p class="task-description">
                    ${task.description || "No description provided."}
                </p>
                <div class="task-actions">
                    <button class="btn-edit" data-id="${task.id}">Edit</button>
                    <button class="btn-delete" data-id="${task.id}">Delete</button>
                </div>
            `;
        }

        taskListContainer.appendChild(card);
    });

    attachTaskEventListeners();
}


// =============================================================
// 5. HELPER FUNCTIONS
// =============================================================

function formatStatus(status) {
    const statusMap = {
        "pending": "Pending",
        "in-progress": "In Progress",
        "completed": "Completed"
    };
    return statusMap[status] || status;
}

function updateTaskCount(count) {
    const label = count === 1 ? "task" : "tasks";
    taskCountDisplay.textContent = `${count} ${label}`;
}


// =============================================================
// 6. EVENT HANDLERS
//
// The key change: instead of modifying a local array and saving
// to localStorage, we now call the API functions. The server
// handles the data, and we re-render from the server's response.
// =============================================================

// --- FORM SUBMISSION ---
taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusInput.value;

    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    try {
        // Send the new task to the server
        const newTask = await createTask({ title, description, status });
        console.log("Task created:", newTask);

        taskForm.reset();
        await renderTasks();
    } catch (error) {
        alert("Error creating task: " + error.message);
        console.error("Create error:", error);
    }
});


// --- FILTER BUTTONS ---
filterBar.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("filter-btn")) return;

    filterBar.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.target.classList.add("active");

    currentFilter = event.target.getAttribute("data-filter");
    await renderTasks();
});


// --- TASK CARD BUTTONS ---
function attachTaskEventListeners() {

    // DELETE
    document.querySelectorAll(".btn-delete").forEach(button => {
        button.addEventListener("click", async () => {
            const taskId = parseInt(button.getAttribute("data-id"));

            if (!confirm("Are you sure you want to delete this task?")) return;

            try {
                await deleteTask(taskId);
                console.log("Task deleted, ID:", taskId);
                await renderTasks();
            } catch (error) {
                alert("Error deleting task: " + error.message);
                console.error("Delete error:", error);
            }
        });
    });

    // EDIT -- enter edit mode
    document.querySelectorAll(".btn-edit").forEach(button => {
        button.addEventListener("click", () => {
            editingTaskId = parseInt(button.getAttribute("data-id"));
            renderTasks();
        });
    });

    // SAVE -- send updates to server
    document.querySelectorAll(".btn-save").forEach(button => {
        button.addEventListener("click", async () => {
            const taskId = parseInt(button.getAttribute("data-id"));
            const card = button.closest(".task-card");
            const newTitle = card.querySelector(".edit-title").value.trim();
            const newDescription = card.querySelector(".edit-description").value.trim();
            const newStatus = card.querySelector(".edit-status").value;

            if (newTitle === "") {
                alert("Task title cannot be empty.");
                return;
            }

            try {
                await updateTask(taskId, {
                    title: newTitle,
                    description: newDescription,
                    status: newStatus
                });
                console.log("Task updated, ID:", taskId);
                editingTaskId = null;
                await renderTasks();
            } catch (error) {
                alert("Error updating task: " + error.message);
                console.error("Update error:", error);
            }
        });
    });

    // CANCEL -- exit edit mode
    document.querySelectorAll(".btn-cancel").forEach(button => {
        button.addEventListener("click", () => {
            editingTaskId = null;
            renderTasks();
        });
    });
}


// =============================================================
// 7. INITIALIZATION
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {
    await renderTasks();
    console.log("Task Tracker initialized (API mode)");
});
