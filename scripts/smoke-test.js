// =============================================================
// SMOKE TEST
//
// A "smoke test" is a quick check that the app can start and
// respond to requests. The name comes from hardware testing --
// plug it in and see if smoke comes out.
//
// This script:
//   1. Starts the server
//   2. Waits for it to be ready
//   3. Hits the /api/health endpoint
//   4. Checks that the response is correct
//   5. Shuts down and reports pass/fail
//
// Used by CI to verify the app works on a fresh machine.
// =============================================================

const { spawn } = require("child_process");
const path = require("path");

const SERVER_PATH = path.join(__dirname, "..", "backend", "server.js");
const PORT = 3001; // Use a different port to avoid conflicts

async function runSmokeTest() {
    console.log("Starting smoke test...\n");

    // Start the server as a child process
    const server = spawn("node", [SERVER_PATH], {
        env: { ...process.env, PORT: PORT, NODE_ENV: "test" },
        stdio: ["pipe", "pipe", "pipe"]
    });

    let serverOutput = "";

    server.stdout.on("data", (data) => {
        serverOutput += data.toString();
    });

    server.stderr.on("data", (data) => {
        serverOutput += data.toString();
    });

    try {
        // Wait for the server to start
        await waitForServer(PORT);
        console.log("  Server started on port", PORT);

        // Test the health endpoint
        const response = await fetch(`http://localhost:${PORT}/api/health`);
        const data = await response.json();

        if (response.ok && data.status === "ok") {
            console.log("  Health check passed:", data.message);
        } else {
            throw new Error(`Health check failed: ${JSON.stringify(data)}`);
        }

        // Test the tasks endpoint
        const tasksResponse = await fetch(`http://localhost:${PORT}/api/tasks`);
        const tasks = await tasksResponse.json();

        if (tasksResponse.ok && Array.isArray(tasks)) {
            console.log(`  Tasks endpoint returned ${tasks.length} tasks`);
        } else {
            throw new Error("Tasks endpoint failed");
        }

        console.log("\n  All smoke tests passed!\n");
        server.kill();
        process.exit(0);
    } catch (error) {
        console.error("\n  Smoke test FAILED:", error.message);
        console.error("\n  Server output:", serverOutput);
        server.kill();
        process.exit(1);
    }
}

// Poll the server until it responds (or timeout after 10 seconds)
async function waitForServer(port, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await fetch(`http://localhost:${port}/api/health`);
            return; // Server is ready
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
    throw new Error("Server did not start within 10 seconds");
}

runSmokeTest();
