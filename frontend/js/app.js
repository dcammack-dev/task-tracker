// =============================================================
// TASK TRACKER - JavaScript
//
// This file makes the Task Tracker interactive. It handles:
//   1. Adding new tasks via the form
//   2. Deleting tasks
//   3. Editing task status
//   4. Storing tasks in an array
//   5. Rendering tasks to the page
//
// Key concept: We keep a JavaScript array as our "source of truth"
// and re-render the HTML from it whenever something changes.
// This pattern (data -> render -> display) is the foundation of
// how modern web apps work.
// =============================================================


// =============================================================
// 1. DATA: Our task storage
//
// This array holds all our tasks. Each task is an object with
// properties. Right now tasks live only in memory -- if you
// refresh the page, they're gone. We'll fix that in Module 08
// with localStorage, and in Module 11 with a real database.
// =============================================================

let tasks = [
    // Start with some sample tasks so the page isn't empty
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

// This counter ensures every task gets a unique ID.
// We start at 4 because our sample tasks use 1, 2, 3.
let nextId = 4;


// =============================================================
// 2. DOM REFERENCES: Grab elements we need
//
// We select these once when the script loads, then reuse them.
// This is more efficient than selecting them every time we need them.
// =============================================================

const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskStatusInput = document.getElementById("task-status");
const taskListContainer = document.getElementById("task-list");


// =============================================================
// 3. RENDER FUNCTION: Display tasks on the page
//
// This is the most important function. It takes our tasks array
// and converts it into HTML that the browser displays.
//
// The pattern is:
//   1. Clear the current HTML in the task list
//   2. Loop through the tasks array
//   3. For each task, create HTML and add it to the page
//
// Every time a task is added, deleted, or changed, we call this
// function to update what the user sees.
// =============================================================

function renderTasks() {
    // Step 1: Clear everything currently displayed
    // We set innerHTML to empty string to wipe the container clean
    taskListContainer.innerHTML = "";

    // Step 2: Check if there are any tasks
    if (tasks.length === 0) {
        // Show a friendly message when there are no tasks
        taskListContainer.innerHTML = `
            <p class="empty-message">No tasks yet. Add one above!</p>
        `;
        return;  // Exit the function early, nothing more to do
    }

    // Step 3: Loop through each task and create its HTML
    tasks.forEach((task) => {
        // Create the <article> element for this task card
        const card = document.createElement("article");
        card.className = "task-card";
        card.setAttribute("data-status", task.status);

        // Build the inner HTML using a template literal.
        // Notice how we use ${task.title}, ${task.description}, etc.
        // to insert each task's data into the HTML.
        card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-status status-${task.status}">
                    ${formatStatus(task.status)}
                </span>
            </div>
            <p class="task-description">${task.description || "No description provided."}</p>
            <div class="task-actions">
                <select class="status-select" data-id="${task.id}">
                    <option value="pending" ${task.status === "pending" ? "selected" : ""}>Pending</option>
                    <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
                    <option value="completed" ${task.status === "completed" ? "selected" : ""}>Completed</option>
                </select>
                <button class="btn-delete" data-id="${task.id}">Delete</button>
            </div>
        `;

        // Add the card to the task list container
        taskListContainer.appendChild(card);
    });

    // Step 4: Attach event listeners to the newly created buttons
    // We have to do this AFTER creating the elements because you
    // can't add listeners to elements that don't exist yet.
    attachTaskEventListeners();
}


// =============================================================
// 4. HELPER FUNCTION: Format status text for display
//
// Converts "in-progress" to "In Progress" for cleaner display.
// =============================================================

function formatStatus(status) {
    const statusMap = {
        "pending": "Pending",
        "in-progress": "In Progress",
        "completed": "Completed"
    };
    return statusMap[status] || status;
}


// =============================================================
// 5. EVENT LISTENERS: Respond to user actions
// =============================================================

// --- FORM SUBMISSION ---
// When the user fills out the form and clicks "Add Task"
taskForm.addEventListener("submit", (event) => {
    // Prevent the default form behavior (which would reload the page)
    event.preventDefault();

    // Read the values from the form inputs
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusInput.value;

    // .trim() removes whitespace from the start and end of a string.
    // This prevents tasks with titles like "   " (just spaces).

    // Validate: don't allow empty titles
    if (title === "") {
        alert("Please enter a task title.");
        return;  // Stop here, don't create the task
    }

    // Create a new task object
    const newTask = {
        id: nextId,
        title: title,
        description: description,
        status: status
    };

    // Increment the ID counter for the next task
    nextId++;

    // Add the new task to our array
    tasks.push(newTask);

    // Clear the form inputs so the user can add another task
    taskForm.reset();

    // Re-render the task list to show the new task
    renderTasks();

    // Log to console for debugging (open F12 > Console to see this)
    console.log("Task added:", newTask);
    console.log("All tasks:", tasks);
});


// --- TASK CARD BUTTONS ---
// This function attaches event listeners to Delete buttons and
// Status dropdowns inside task cards. It's called by renderTasks()
// after new cards are created.

function attachTaskEventListeners() {
    // --- Delete buttons ---
    // querySelectorAll returns ALL elements matching the selector.
    // We loop through each one and add a click listener.
    const deleteButtons = document.querySelectorAll(".btn-delete");
    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Read the task ID from the button's data-id attribute.
            // parseInt converts the string "3" to the number 3.
            const taskId = parseInt(button.getAttribute("data-id"));

            // Remove the task from the array.
            // .filter() creates a NEW array containing only tasks
            // whose id does NOT match the one we want to delete.
            tasks = tasks.filter((task) => task.id !== taskId);

            // Re-render to update the display
            renderTasks();

            console.log("Task deleted, ID:", taskId);
            console.log("Remaining tasks:", tasks);
        });
    });

    // --- Status dropdowns ---
    const statusSelects = document.querySelectorAll(".status-select");
    statusSelects.forEach((select) => {
        select.addEventListener("change", () => {
            const taskId = parseInt(select.getAttribute("data-id"));
            const newStatus = select.value;

            // Find the task in our array and update its status.
            // .find() returns the first item that matches the condition.
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
                task.status = newStatus;

                // Re-render to update the status badge and border color
                renderTasks();

                console.log(`Task ${taskId} status changed to: ${newStatus}`);
            }
        });
    });
}


// =============================================================
// 6. INITIALIZATION: Run when the page first loads
//
// DOMContentLoaded fires when the HTML has been fully parsed.
// This ensures all elements exist before we try to use them.
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Render the initial sample tasks
    renderTasks();
    console.log("Task Tracker initialized with", tasks.length, "tasks.");
});
