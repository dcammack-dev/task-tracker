# Task Tracker

A simple CRUD web application for managing tasks. Built as a learning project
to practice full-stack web development.

## Features
- Create new tasks with a title, description, and status
- View all tasks in a list
- Edit existing tasks
- Delete tasks
- Filter tasks by status (pending, in progress, completed)

## Tech Stack

| Layer    | Technology | Purpose                        |
|----------|------------|--------------------------------|
| Frontend | HTML/CSS/JS| User interface in the browser  |
| Backend  | Node.js    | Server and API                 |
| Backend  | Express    | Web framework for Node.js      |
| Database | SQLite     | Lightweight file-based database|

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation
```bash
# 1. Navigate to this directory
cd task-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start the server
npm start
```

### Project Structure
```
task-tracker/
├── frontend/           # Client-side code (HTML, CSS, JS)
│   ├── index.html      # Main page
│   ├── css/style.css   # Styles
│   └── js/app.js       # Frontend logic
├── backend/            # Server-side code
│   ├── server.js       # Express server setup
│   ├── routes/         # API route handlers
│   └── database/       # Database setup
└── tests/              # Automated tests
```
