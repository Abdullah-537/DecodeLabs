// =============================================
// DecodeLabs Project 2 - Backend API
// server.js — Entry point
// =============================================

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────
app.use(express.json());          // Parse JSON request bodies
app.use(cors());                  // Allow frontend (Project 1) to call this API

// ── In-memory "database" (array acts as our DB for now) ──
let users = [
  { id: 1, name: 'Ali Hassan',  email: 'ali@example.com',   age: 22 },
  { id: 2, name: 'Sara Malik',  email: 'sara@example.com',  age: 24 },
  { id: 3, name: 'Usman Raza',  email: 'usman@example.com', age: 21 },
];
let nextId = 4; // Auto-increment counter


// ── Helper: standard JSON response ───────────
function sendResponse(res, statusCode, success, message, data = null) {
  const response = { success, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
}


// =============================================
// ROUTES
// =============================================

// GET /  → Health check
app.get('/', (req, res) => {
  sendResponse(res, 200, true, 'DecodeLabs API is running', {
    version: '1.0.0',
    endpoints: [
      'GET  /api/users',
      'GET  /api/users/:id',
      'POST /api/users',
      'PUT  /api/users/:id',
      'DELETE /api/users/:id',
    ]
  });
});


// ── GET /api/users → Get all users ───────────
app.get('/api/users', (req, res) => {
  sendResponse(res, 200, true, 'Users retrieved successfully', users);
});


// ── GET /api/users/:id → Get one user ────────
app.get('/api/users/:id', (req, res) => {
  const id   = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return sendResponse(res, 404, false, `User with id ${id} not found`);
  }

  sendResponse(res, 200, true, 'User retrieved successfully', user);
});


// ── POST /api/users → Create a new user ──────
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;

  // ── Validation (The Gatekeeper Rule from brief) ──
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!email || typeof email !== 'string') {
    errors.push('email is required');
  } else {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('email format is invalid');
    } else if (users.find(u => u.email === email)) {
      errors.push('email already exists');
    }
  }

  if (age !== undefined) {
    if (typeof age !== 'number' || age < 1 || age > 120) {
      errors.push('age must be a number between 1 and 120');
    }
  }

  if (errors.length > 0) {
    return sendResponse(res, 400, false, 'Validation failed', { errors });
  }

  // Create the new user
  const newUser = {
    id:    nextId++,
    name:  name.trim(),
    email: email.toLowerCase(),
    age:   age || null,
  };

  users.push(newUser);
  sendResponse(res, 201, true, 'User created successfully', newUser);
});


// ── PUT /api/users/:id → Update a user ───────
app.put('/api/users/:id', (req, res) => {
  const id    = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, `User with id ${id} not found`);
  }

  const { name, email, age } = req.body;
  const errors = [];

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('email format is invalid');
    } else {
      const duplicate = users.find(u => u.email === email && u.id !== id);
      if (duplicate) errors.push('email already in use by another user');
    }
  }

  if (age !== undefined && (typeof age !== 'number' || age < 1 || age > 120)) {
    errors.push('age must be a number between 1 and 120');
  }

  if (errors.length > 0) {
    return sendResponse(res, 400, false, 'Validation failed', { errors });
  }

  // Merge updates
  users[index] = {
    ...users[index],
    name:  name  ? name.trim()          : users[index].name,
    email: email ? email.toLowerCase()  : users[index].email,
    age:   age   !== undefined ? age    : users[index].age,
  };

  sendResponse(res, 200, true, 'User updated successfully', users[index]);
});


// ── DELETE /api/users/:id → Delete a user ────
app.delete('/api/users/:id', (req, res) => {
  const id    = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return sendResponse(res, 404, false, `User with id ${id} not found`);
  }

  const deleted = users.splice(index, 1)[0];
  sendResponse(res, 200, true, 'User deleted successfully', deleted);
});


// ── 404 catch-all (must be last) ─────────────
app.use((req, res) => {
  sendResponse(res, 404, false, `Route ${req.method} ${req.path} not found`);
});


// ── Global error handler ──────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  sendResponse(res, 500, false, 'Internal server error');
});


// ── Start server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ DecodeLabs API running at http://localhost:${PORT}`);
  console.log(`📋 Test endpoints at http://localhost:${PORT}/\n`);
});