// =============================================================
// CENTRALIZED CONFIGURATION
//
// This file is the SINGLE source of truth for all app settings.
// Instead of reading process.env scattered throughout the code,
// every configurable value is defined here.
//
// How it works:
//   1. dotenv loads variables from the .env file into process.env
//   2. We read them here and provide sensible defaults
//   3. Other files import this module instead of reading process.env
//
// To add a new setting:
//   1. Add it to .env and .env.example
//   2. Read it here with a default value
//   3. Import config wherever you need it
// =============================================================

const path = require("path");

// Load .env file into process.env.
// This must happen BEFORE we read any variables.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
    // Server settings
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",

    // Database settings
    dbPath: process.env.DATABASE_PATH || path.join(__dirname, "database", "tasks.db"),

    // Helper: is this a production environment?
    isProduction: process.env.NODE_ENV === "production"
};
