// =============================================================
// API INTEGRATION TESTS
//
// These tests verify that the Task Tracker API works correctly.
// Each test sends a real HTTP request to the server and checks
// the response status code and body.
//
// The tests follow the Arrange → Act → Assert pattern:
//   Arrange: Set up test data
//   Act:     Send the HTTP request
//   Assert:  Check the response
//
// Run with: npm test
// =============================================================

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const API_URL = `${BASE_URL}/api/tasks`;

let server;

// --- START SERVER BEFORE TESTS ---
before(async () => {
    const serverPath = path.join(__dirname, "..", "backend", "server.js");

    server = spawn("node", [serverPath], {
        env: { ...process.env, PORT: PORT, NODE_ENV: "test" },
        stdio: ["pipe", "pipe", "pipe"]
    });

    // Wait for the server to be ready
    for (let i = 0; i < 20; i++) {
        try {
            await fetch(`${BASE_URL}/api/health`);
            return; // Server is ready
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
    throw new Error("Server did not start within 10 seconds");
});

// --- STOP SERVER AFTER TESTS ---
after(() => {
    if (server) {
        server.kill();
    }
});


// =============================================================
// HEALTH CHECK
// =============================================================

describe("Health Check", () => {
    test("GET /api/health returns status ok", async () => {
        // Act
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.status, "ok");
        assert.ok(data.timestamp, "Should include a timestamp");
    });
});


// =============================================================
// CREATE (POST)
// =============================================================

describe("POST /api/tasks", () => {
    test("creates a task with valid data", async () => {
        // Arrange
        const taskData = {
            title: "Test task",
            description: "Created by automated test",
            status: "pending"
        };

        // Act
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });
        const task = await response.json();

        // Assert
        assert.strictEqual(response.status, 201);
        assert.strictEqual(task.title, "Test task");
        assert.strictEqual(task.description, "Created by automated test");
        assert.strictEqual(task.status, "pending");
        assert.ok(task.id, "Should have an id");
        assert.ok(task.created_at, "Should have a created_at timestamp");
    });

    test("returns 400 when title is missing", async () => {
        // Arrange -- no title provided
        const taskData = { description: "No title here" };

        // Act
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });
        const data = await response.json();

        // Assert
        assert.strictEqual(response.status, 400);
        assert.ok(data.error, "Should return an error message");
    });

    test("returns 400 when title is empty string", async () => {
        // Arrange
        const taskData = { title: "   " };

        // Act
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });

        // Assert
        assert.strictEqual(response.status, 400);
    });

    test("defaults status to pending when not provided", async () => {
        // Arrange -- no status field
        const taskData = { title: "No status provided" };

        // Act
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });
        const task = await response.json();

        // Assert
        assert.strictEqual(response.status, 201);
        assert.strictEqual(task.status, "pending");
    });
});


// =============================================================
// READ (GET)
// =============================================================

describe("GET /api/tasks", () => {
    test("returns an array of tasks", async () => {
        // Act
        const response = await fetch(API_URL);
        const tasks = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(tasks), "Response should be an array");
        assert.ok(tasks.length > 0, "Should have at least one task");
    });

    test("filters tasks by status", async () => {
        // Arrange -- first create a completed task
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Completed task", status: "completed" })
        });

        // Act
        const response = await fetch(`${API_URL}?status=completed`);
        const tasks = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(tasks), "Response should be an array");
        tasks.forEach(task => {
            assert.strictEqual(task.status, "completed",
                "All filtered tasks should be completed");
        });
    });
});

describe("GET /api/tasks/:id", () => {
    test("returns a single task by id", async () => {
        // Arrange -- create a task and get its id
        const createResponse = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Find me by ID" })
        });
        const created = await createResponse.json();

        // Act
        const response = await fetch(`${API_URL}/${created.id}`);
        const task = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.strictEqual(task.id, created.id);
        assert.strictEqual(task.title, "Find me by ID");
    });

    test("returns 404 for non-existent task", async () => {
        // Act
        const response = await fetch(`${API_URL}/99999`);

        // Assert
        assert.strictEqual(response.status, 404);
    });
});


// =============================================================
// UPDATE (PUT)
// =============================================================

describe("PUT /api/tasks/:id", () => {
    test("updates a task with new data", async () => {
        // Arrange -- create a task first
        const createResponse = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Before update", status: "pending" })
        });
        const created = await createResponse.json();

        // Act -- update the title and status
        const response = await fetch(`${API_URL}/${created.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "After update",
                status: "completed"
            })
        });
        const updated = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.strictEqual(updated.title, "After update");
        assert.strictEqual(updated.status, "completed");
    });

    test("returns 404 when updating non-existent task", async () => {
        // Act
        const response = await fetch(`${API_URL}/99999`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Ghost task" })
        });

        // Assert
        assert.strictEqual(response.status, 404);
    });

    test("returns 400 when title is empty", async () => {
        // Arrange
        const createResponse = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Will try empty update" })
        });
        const created = await createResponse.json();

        // Act
        const response = await fetch(`${API_URL}/${created.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "" })
        });

        // Assert
        assert.strictEqual(response.status, 400);
    });
});


// =============================================================
// DELETE
// =============================================================

describe("DELETE /api/tasks/:id", () => {
    test("deletes a task and returns it", async () => {
        // Arrange -- create a task to delete
        const createResponse = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Delete me" })
        });
        const created = await createResponse.json();

        // Act
        const response = await fetch(`${API_URL}/${created.id}`, {
            method: "DELETE"
        });
        const data = await response.json();

        // Assert
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.task.title, "Delete me");

        // Verify it's actually gone
        const getResponse = await fetch(`${API_URL}/${created.id}`);
        assert.strictEqual(getResponse.status, 404);
    });

    test("returns 404 when deleting non-existent task", async () => {
        // Act
        const response = await fetch(`${API_URL}/99999`, {
            method: "DELETE"
        });

        // Assert
        assert.strictEqual(response.status, 404);
    });
});
