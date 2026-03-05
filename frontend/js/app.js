// =============================================================
// TASK TRACKER - JavaScript (Module 08: Complete Frontend)
//
// Features:
//   1. Add, edit, delete tasks
//   2. localStorage persistence (survives page refresh)
//   3. Filter tasks by status
//   4. Task count display
//
// Architecture:
//   - tasks array = source of truth (all data lives here)
//   - localStorage = persistence layer (saves array as JSON)
//   - renderTasks() = display layer (builds HTML from array)
//   - Every user action: modify array -> save -> re-render
// =============================================================


// =============================================================
// 1. DATA LAYER: Storage and state
// =============================================================

// Load tasks from localStorage, or use sample data if first visit.
// This is the first thing that runs -- before anything is displayed.
let tasks = loadTasks();

// Counter for unique IDs. We calculate it from existing tasks so
// we never accidentally reuse an ID after a page refresh.
let nextId = tasks.length > 0
    ? Math.max(...tasks.map(t => t.id)) + 1
    : 1;

// Track the current filter (which tasks to display)
let currentFilter = "all";

// Track which task is being edited (null = none)
let editingTaskId = null;

/**
 * SAVE tasks to localStorage.
 * Called every time the tasks array changes.
 *
 * JSON.stringify converts our array of objects into a string
 * because localStorage can only store strings.
 */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * LOAD tasks from localStorage.
 * Called once when the page first loads.
 *
 * JSON.parse converts the stored string back into an array.
 * If nothing is stored yet (first visit), returns sample data.
 */
function loadTasks() {
    const stored = localStorage.getItem("tasks");

    if (stored) {
        // We have saved data -- parse and return it
        return JSON.parse(stored);
    }

    // First visit -- return sample tasks to show how the app works
    return [
        {
            id: 1,
            title: "Learn HTML",
            description: "Understand elements, tags, attributes, and semantic HTML.",
            status: "completed"
        },
        {
            id: 2,
            title: "Learn CSS",
            description: "Style the Task Tracker with colors, layout, and spacing.",
            status: "completed"
        },
        {
            id: 3,
            title: "Learn JavaScript",
            description: "Make the Task Tracker interactive with DOM manipulation.",
            status: "in-progress"
        }
    ];
}


// =============================================================
// 2. DOM REFERENCES
//
// Grab elements once, reuse everywhere. More efficient than
// calling getElementById every time we need an element.
// =============================================================

const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskStatusInput = document.getElementById("task-status");
const taskListContainer = document.getElementById("task-list");
const taskCountDisplay = document.getElementById("task-count");
const filterBar = document.getElementById("filter-bar");


// =============================================================
// 3. RENDER FUNCTION: Data -> HTML
//
// This is the core of the app. It reads the tasks array, applies
// the current filter, and builds the HTML that the user sees.
// Called after every data change.
// =============================================================

function renderTasks() {
    // Clear the display
    taskListContainer.innerHTML = "";

    // Apply the current filter.
    // If filter is "all", show everything. Otherwise, show only
    // tasks matching the selected status.
    const filtered = currentFilter === "all"
        ? tasks
        : tasks.filter(task => task.status === currentFilter);

    // Update the task count display
    updateTaskCount(filtered.length);

    // Empty state
    if (filtered.length === 0) {
        const message = tasks.length === 0
            ? "No tasks yet. Add one above!"
            : `No ${currentFilter.replace("-", " ")} tasks.`;

        taskListContainer.innerHTML = `
            <p class="empty-message">${message}</p>
        `;
        return;
    }

    // Build a card for each task
    filtered.forEach(task => {
        const card = document.createElement("article");
        card.className = "task-card";
        card.setAttribute("data-status", task.status);

        // Check if this task is currently being edited
        if (editingTaskId === task.id) {
            // EDIT MODE: Show input fields pre-filled with current values
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
            // VIEW MODE: Show the normal task card
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

    // Attach event listeners to the newly created elements
    attachTaskEventListeners();
}


// =============================================================
// 4. HELPER FUNCTIONS
// =============================================================

/** Convert status slug to display text */
function formatStatus(status) {
    const statusMap = {
        "pending": "Pending",
        "in-progress": "In Progress",
        "completed": "Completed"
    };
    return statusMap[status] || status;
}

/** Update the "X tasks" counter */
function updateTaskCount(count) {
    const label = count === 1 ? "task" : "tasks";
    taskCountDisplay.textContent = `${count} ${label}`;
}


// =============================================================
// 5. EVENT HANDLERS
// =============================================================

// --- FORM SUBMISSION: Add a new task ---
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusInput.value;

    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    const newTask = {
        id: nextId++,
        title: title,
        description: description,
        status: status
    };

    tasks.push(newTask);
    saveTasks();        // Persist to localStorage
    taskForm.reset();
    renderTasks();

    console.log("Task added:", newTask);
});


// --- FILTER BUTTONS ---
// We listen for clicks on the filter bar container, not individual
// buttons. This is called "event delegation" -- a single listener
// on the parent handles clicks for all children. More efficient
// and works even if buttons are added dynamically.
filterBar.addEventListener("click", (event) => {
    // Check if what was clicked is actually a filter button
    if (!event.target.classList.contains("filter-btn")) {
        return;  // Clicked the gap between buttons, ignore
    }

    // Update the active button styling
    // Remove "active" from all buttons, add to the clicked one
    filterBar.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    event.target.classList.add("active");

    // Update the filter and re-render
    currentFilter = event.target.getAttribute("data-filter");
    renderTasks();
});


// --- TASK CARD BUTTONS (Edit, Delete, Save, Cancel) ---
function attachTaskEventListeners() {

    // DELETE buttons
    document.querySelectorAll(".btn-delete").forEach(button => {
        button.addEventListener("click", () => {
            const taskId = parseInt(button.getAttribute("data-id"));

            // Confirm before deleting (prevents accidental clicks)
            if (!confirm("Are you sure you want to delete this task?")) {
                return;
            }

            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            console.log("Task deleted, ID:", taskId);
        });
    });

    // EDIT buttons -- switch a card to edit mode
    document.querySelectorAll(".btn-edit").forEach(button => {
        button.addEventListener("click", () => {
            editingTaskId = parseInt(button.getAttribute("data-id"));
            renderTasks();  // Re-render shows the edit form
        });
    });

    // SAVE buttons -- save edits and return to view mode
    document.querySelectorAll(".btn-save").forEach(button => {
        button.addEventListener("click", () => {
            const taskId = parseInt(button.getAttribute("data-id"));

            // Find the edit form inputs (they're in the same card)
            const card = button.closest(".task-card");
            const newTitle = card.querySelector(".edit-title").value.trim();
            const newDescription = card.querySelector(".edit-description").value.trim();
            const newStatus = card.querySelector(".edit-status").value;

            if (newTitle === "") {
                alert("Task title cannot be empty.");
                return;
            }

            // Find the task in the array and update it
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.title = newTitle;
                task.description = newDescription;
                task.status = newStatus;
            }

            editingTaskId = null;   // Exit edit mode
            saveTasks();
            renderTasks();
            console.log("Task updated:", task);
        });
    });

    // CANCEL buttons -- exit edit mode without saving
    document.querySelectorAll(".btn-cancel").forEach(button => {
        button.addEventListener("click", () => {
            editingTaskId = null;
            renderTasks();
        });
    });
}


// =============================================================
// 6. INITIALIZATION
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
    renderTasks();
    console.log("Task Tracker initialized with", tasks.length, "tasks.");
    console.log("Data loaded from:", localStorage.getItem("tasks") ? "localStorage" : "default sample data");
});
