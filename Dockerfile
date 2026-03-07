# =============================================================
# DOCKERFILE FOR TASK TRACKER
#
# This file tells Docker how to build an image of our app.
# Each instruction creates a "layer" that Docker caches.
# =============================================================

# --- LAYER 1: Base Image ---
# Start from Node.js 24 on Alpine Linux (a tiny 5MB Linux distro).
# This gives us Node.js and npm pre-installed.
FROM node:24-alpine

# --- LAYER 2: Working Directory ---
# Create and switch to /app inside the container.
# All following commands run from this directory.
WORKDIR /app

# --- LAYER 3: Copy Dependency Files ---
# Copy package.json and package-lock.json FIRST.
# This layer is cached -- if these files don't change,
# Docker skips the npm install step on rebuilds.
COPY package*.json ./

# --- LAYER 4: Install Dependencies ---
# Install only production dependencies (skip devDependencies
# like nodemon -- we don't need them in the container).
RUN npm install --production

# --- LAYER 5: Copy Application Code ---
# Now copy everything else. This layer rebuilds when
# any code changes, but layers 1-4 stay cached.
COPY . .

# --- LAYER 6: Document the Port ---
# This doesn't actually open the port -- it's documentation
# telling anyone reading this Dockerfile that the app
# listens on port 3000.
EXPOSE 3000

# --- LAYER 7: Start Command ---
# The command that runs when the container starts.
# We use the array form (exec form) which is best practice.
CMD ["node", "backend/server.js"]
