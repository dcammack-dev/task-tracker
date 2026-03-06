// =============================================================
// DATABASE SETUP
//
// This file initializes the SQLite database and creates the
// tasks table if it doesn't exist. It exports the database
// connection so other files can use it.
//
// SQLite stores the entire database in a single file (tasks.db).
// If the file doesn't exist, it's created automatically.
// If it does exist, we just connect to it (data persists!).
// =============================================================

const Database = require("better-sqlite3");
const path = require("path");

// --- DATABASE FILE PATH ---
// The database file lives in this same folder: backend/database/tasks.db
// path.join builds the full path from this file's location.
const DB_PATH = path.join(__dirname, "tasks.db");

// --- CONNECT TO DATABASE ---
// This opens the database file (or creates it if it doesn't exist).
// The { verbose: console.log } option logs every SQL query to the
// console -- great for learning and debugging. Remove in production.
const db = new Database(DB_PATH);

// --- PERFORMANCE SETTING ---
// WAL (Write-Ahead Logging) mode improves performance for apps
// that read and write frequently. It's a best practice for SQLite.
db.pragma("journal_mode = WAL");

// =============================================================
// CREATE TABLE
//
// This SQL statement defines the structure (schema) of our tasks
// table. IF NOT EXISTS means it only runs on first setup -- if the
// table already exists, it's skipped.
//
// Column definitions:
//   id          - Unique number, auto-assigned (1, 2, 3, ...)
//   title       - Required text field
//   description - Optional text field (defaults to empty string)
//   status      - One of: pending, in-progress, completed
//   created_at  - Timestamp, auto-set to current time
// =============================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("Database initialized at:", DB_PATH);

// --- CHECK IF TABLE IS EMPTY ---
// If this is the first time running, seed with sample data
// so the app isn't empty on first visit.
const count = db.prepare("SELECT COUNT(*) as count FROM tasks").get();

if (count.count === 0) {
    console.log("Seeding database with sample tasks...");

    // prepare() creates a reusable query template.
    // The ? marks are placeholders for parameterized values.
    const insert = db.prepare(`
        INSERT INTO tasks (title, description, status)
        VALUES (?, ?, ?)
    `);

    // Run multiple inserts inside a transaction.
    // A transaction groups operations so they either ALL succeed
    // or ALL fail -- no partial updates. This protects data integrity.
    const seedData = db.transaction(() => {
        insert.run("Learn HTML", "Understand elements, tags, attributes, and semantic HTML.", "completed");
        insert.run("Learn CSS", "Style the Task Tracker with colors, layout, and spacing.", "completed");
        insert.run("Learn JavaScript", "Make the Task Tracker interactive with DOM manipulation.", "completed");
        insert.run("Build the API", "Create REST endpoints for task CRUD operations.", "completed");
        insert.run("Add a database", "Store tasks permanently with SQLite.", "in-progress");
    });

    seedData();
    console.log("Sample tasks added.");
}

// Export the database connection for use in route files
module.exports = db;
