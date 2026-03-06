// =============================================================
// TASK TRACKER SERVER
//
// This is the entry point for our backend. It creates an Express
// server that:
//   1. Serves our frontend files (HTML, CSS, JS)
//   2. Logs every request to the console
//   3. Will later handle API routes for task CRUD operations
//
// To run this server:
//   npm start
//   (which runs: node backend/server.js)
//
// Then visit: http://localhost:3000
// =============================================================


// --- IMPORTS ---
// require() loads a package so we can use it.
// "express" comes from the node_modules folder (installed via npm).
// "path" is a built-in Node.js module for working with file paths.
// The task routes are our own file (loaded with a relative path "./").
const express = require("express");
const path = require("path");
const taskRoutes = require("./routes/tasks");


// --- CREATE THE APP ---
// express() creates an Express application. This object has methods
// for routing (app.get, app.post, etc.), middleware (app.use), and
// starting the server (app.listen).
const app = express();


// --- CONFIGURATION ---
// The port the server will listen on. We check for an environment
// variable first (process.env.PORT), which is how hosting platforms
// tell your app which port to use. If none is set, default to 3000.
const PORT = process.env.PORT || 3000;


// =============================================================
// MIDDLEWARE
//
// These run for EVERY request, in the order they're defined.
// Think of them as a processing pipeline:
// Request → middleware 1 → middleware 2 → ... → route handler
// =============================================================

// --- MIDDLEWARE 1: Request Logger ---
// This custom middleware logs every request to the console.
// It shows the HTTP method, the URL, and the timestamp.
// After logging, it calls next() to pass the request along.
app.use((req, res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// --- MIDDLEWARE 2: JSON Body Parser ---
// When the frontend sends JSON data (like a new task), this
// middleware reads the raw text and converts it into a JavaScript
// object available at req.body.
// Without this, req.body would be undefined for POST/PUT requests.
app.use(express.json());

// --- MIDDLEWARE 3: Static File Server ---
// This tells Express to serve any file found in the "frontend"
// folder. When someone visits http://localhost:3000/, Express
// automatically looks for frontend/index.html and sends it.
//
// path.join(__dirname, "..", "frontend") builds the full path:
//   __dirname = the folder this file is in (backend/)
//   ".."      = go up one level (task-tracker/)
//   "frontend"= go into the frontend folder
//
// Result: C:\...\task-tracker\frontend
app.use(express.static(path.join(__dirname, "..", "frontend")));


// =============================================================
// ROUTES
//
// app.use("/api/tasks", taskRoutes) means:
//   "For any request starting with /api/tasks, use the routes
//    defined in routes/tasks.js"
//
// Inside tasks.js, routes are defined relative to this prefix.
// So router.get("/") actually handles GET /api/tasks,
// and router.get("/:id") handles GET /api/tasks/:id.
// =============================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Task Tracker API is running",
        timestamp: new Date().toISOString()
    });
});

// Task CRUD routes (defined in routes/tasks.js)
app.use("/api/tasks", taskRoutes);


// =============================================================
// START THE SERVER
//
// app.listen() tells the server to start accepting connections
// on the specified port. The callback function runs once the
// server is ready.
// =============================================================

app.listen(PORT, () => {
    console.log("===========================================");
    console.log("  Task Tracker Server");
    console.log(`  Running at: http://localhost:${PORT}`);
    console.log("  Press Ctrl+C to stop");
    console.log("===========================================");
});
