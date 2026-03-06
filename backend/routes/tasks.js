// =============================================================
// TASK API ROUTES (Database-backed)
//
// These routes now use SQLite instead of a JavaScript array.
// Each route handler runs a SQL query and returns the result.
//
// Key change: Data is now PERMANENT. Restarting the server
// does NOT reset tasks -- they live in the tasks.db file.
//
// Notice how each route maps to a SQL command:
//   GET    → SELECT
//   POST   → INSERT
//   PUT    → UPDATE
//   DELETE → DELETE
// =============================================================

const express = require("express");
const router = express.Router();

// Import the database connection from our setup file
const db = require("../database/setup");


// =============================================================
// PREPARED STATEMENTS
//
// We "prepare" our SQL queries once at startup. This is more
// efficient than building the query string on every request.
// The ? marks are placeholders for parameterized values
// (prevents SQL injection).
// =============================================================

const queries = {
    getAll: db.prepare("SELECT * FROM tasks ORDER BY created_at DESC"),
    getByStatus: db.prepare("SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC"),
    getById: db.prepare("SELECT * FROM tasks WHERE id = ?"),
    create: db.prepare("INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)"),
    update: db.prepare("UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?"),
    delete: db.prepare("DELETE FROM tasks WHERE id = ?")
};


// =============================================================
// ROUTES
// =============================================================

// ----- GET /api/tasks -----
// Returns all tasks, optionally filtered by status.
//
// .all() returns an array of all matching rows.
// Compare with the old version that just returned a JS array --
// now we're querying a real database.
//
router.get("/", (req, res) => {
    try {
        const { status } = req.query;

        if (status) {
            const tasks = queries.getByStatus.all(status);
            return res.json(tasks);
        }

        const tasks = queries.getAll.all();
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error.message);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});


// ----- GET /api/tasks/:id -----
// Returns a single task.
//
// .get() returns one row (or undefined if not found).
// This is different from .all() which returns an array.
//
router.get("/:id", (req, res) => {
    try {
        const task = queries.getById.get(req.params.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(task);
    } catch (error) {
        console.error("Error fetching task:", error.message);
        res.status(500).json({ error: "Failed to fetch task" });
    }
});


// ----- POST /api/tasks -----
// Creates a new task in the database.
//
// .run() executes a query that doesn't return data (INSERT, UPDATE, DELETE).
// It returns an object with:
//   - lastInsertRowid: the ID of the newly created row
//   - changes: how many rows were affected
//
router.post("/", (req, res) => {
    const { title, description, status } = req.body;

    // Validation
    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
    }

    const validStatuses = ["pending", "in-progress", "completed"];
    const taskStatus = validStatuses.includes(status) ? status : "pending";

    try {
        // INSERT the new task
        const result = queries.create.run(
            title.trim(),
            (description || "").trim(),
            taskStatus
        );

        // Fetch the newly created task to return it (with id and created_at)
        const newTask = queries.getById.get(result.lastInsertRowid);

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating task:", error.message);
        res.status(500).json({ error: "Failed to create task" });
    }
});


// ----- PUT /api/tasks/:id -----
// Updates an existing task in the database.
//
router.put("/:id", (req, res) => {
    try {
        // First check if the task exists
        const existing = queries.getById.get(req.params.id);

        if (!existing) {
            return res.status(404).json({ error: "Task not found" });
        }

        const { title, description, status } = req.body;

        // Validate title if provided
        if (title !== undefined && title.trim() === "") {
            return res.status(400).json({ error: "Title cannot be empty" });
        }

        // Use existing values for any fields not provided in the request.
        const updatedTitle = title !== undefined ? title.trim() : existing.title;
        const updatedDescription = description !== undefined ? description.trim() : existing.description;
        const updatedStatus = status !== undefined ? status : existing.status;

        // Validate status
        const validStatuses = ["pending", "in-progress", "completed"];
        if (!validStatuses.includes(updatedStatus)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        // UPDATE the task
        queries.update.run(updatedTitle, updatedDescription, updatedStatus, req.params.id);

        // Return the updated task
        const updatedTask = queries.getById.get(req.params.id);
        res.json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error.message);
        res.status(500).json({ error: "Failed to update task" });
    }
});


// ----- DELETE /api/tasks/:id -----
// Deletes a task from the database.
//
router.delete("/:id", (req, res) => {
    try {
        // Check if it exists first (so we can return it)
        const task = queries.getById.get(req.params.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // DELETE the row
        queries.delete.run(req.params.id);

        res.json({ message: "Task deleted", task: task });
    } catch (error) {
        console.error("Error deleting task:", error.message);
        res.status(500).json({ error: "Failed to delete task" });
    }
});


module.exports = router;
