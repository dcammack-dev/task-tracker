// =============================================================
// TASK API ROUTES
//
// This file defines all the API endpoints for task operations.
// It uses an Express Router, which is a mini-app that handles
// a group of related routes. The server.js file imports this
// router and mounts it at /api/tasks.
//
// Endpoints:
//   GET    /api/tasks       → Get all tasks (with optional filter)
//   GET    /api/tasks/:id   → Get one task by ID
//   POST   /api/tasks       → Create a new task
//   PUT    /api/tasks/:id   → Update an existing task
//   DELETE /api/tasks/:id   → Delete a task
// =============================================================

const express = require("express");

// A Router is like a mini Express app that only handles routes.
// We define routes on it, then export it for server.js to use.
const router = express.Router();


// =============================================================
// DATA STORAGE (temporary -- Module 11 replaces with database)
//
// For now, tasks live in a JavaScript array on the server.
// This is better than localStorage (server-side, not browser-side)
// but still temporary -- restarting the server resets everything.
// =============================================================

let tasks = [
    {
        id: 1,
        title: "Learn HTML",
        description: "Understand elements, tags, attributes, and semantic HTML.",
        status: "completed",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        title: "Learn CSS",
        description: "Style the Task Tracker with colors, layout, and spacing.",
        status: "completed",
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        title: "Learn JavaScript",
        description: "Make the Task Tracker interactive with DOM manipulation.",
        status: "completed",
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        title: "Build the API",
        description: "Create REST endpoints for task CRUD operations.",
        status: "in-progress",
        createdAt: new Date().toISOString()
    }
];

let nextId = 5;


// =============================================================
// ROUTES
// =============================================================

// ----- GET /api/tasks -----
// Returns all tasks. Supports optional query parameter for filtering:
//   /api/tasks            → all tasks
//   /api/tasks?status=pending  → only pending tasks
//
router.get("/", (req, res) => {
    // Check for a status filter in the query string
    const { status } = req.query;

    if (status) {
        // Filter tasks by status
        const filtered = tasks.filter(task => task.status === status);
        return res.json(filtered);
    }

    // No filter -- return all tasks
    res.json(tasks);
});


// ----- GET /api/tasks/:id -----
// Returns a single task by its ID.
// :id is a route parameter -- whatever value is in the URL
// gets captured in req.params.id.
//
router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);

    if (!task) {
        // 404 = the resource was not found
        return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
});


// ----- POST /api/tasks -----
// Creates a new task. The task data comes in req.body (parsed
// by the express.json() middleware in server.js).
//
// Validates that a title is provided.
// Returns the created task with a 201 (Created) status code.
//
router.post("/", (req, res) => {
    const { title, description, status } = req.body;

    // --- VALIDATION ---
    // Always validate input from the client. Never trust that
    // the data is correct or complete. This prevents bugs and
    // is a security best practice.
    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
    }

    const validStatuses = ["pending", "in-progress", "completed"];
    const taskStatus = validStatuses.includes(status) ? status : "pending";

    // --- CREATE THE TASK ---
    const newTask = {
        id: nextId++,
        title: title.trim(),
        description: (description || "").trim(),
        status: taskStatus,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    // 201 = Created (more specific than 200 OK)
    res.status(201).json(newTask);
});


// ----- PUT /api/tasks/:id -----
// Updates an existing task. Only updates the fields that are
// provided in the request body -- other fields stay unchanged.
//
router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }

    const { title, description, status } = req.body;

    // Validate title if it's being updated
    if (title !== undefined && title.trim() === "") {
        return res.status(400).json({ error: "Title cannot be empty" });
    }

    // Update only the fields that were provided.
    // If a field wasn't sent, keep the existing value.
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) {
        const validStatuses = ["pending", "in-progress", "completed"];
        if (validStatuses.includes(status)) {
            task.status = status;
        }
    }

    res.json(task);
});


// ----- DELETE /api/tasks/:id -----
// Deletes a task by its ID.
// Returns the deleted task so the frontend knows what was removed.
//
router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: "Task not found" });
    }

    // splice removes the item from the array and returns it
    const deleted = tasks.splice(taskIndex, 1)[0];

    res.json({ message: "Task deleted", task: deleted });
});


// Export the router so server.js can use it
module.exports = router;
