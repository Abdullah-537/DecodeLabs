// =============================================
// DecodeLabs Project 3 - Database Integration
// server.js
// Stack: Node.js + Express + MongoDB (Mongoose)
// =============================================

require('dotenv').config();           // Load .env variables
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────
app.use(express.json());
app.use(cors());


// =============================================
// STEP 1: DATABASE CONNECTION
// Mongoose connects Node.js to MongoDB Atlas
// =============================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);   // Stop server if DB fails
  });


// =============================================
// STEP 2: SCHEMA DESIGN (The Blueprint)
// This defines the structure/shape of our data
// Think of it like designing a table in SQL
// =============================================
const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],   // NOT NULL equivalent
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,                          // UNIQUE constraint
      lowercase: true,
      trim:     true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    age: {
      type: Number,
      min:  [1,   'Age must be at least 1'],
      max:  [120, 'Age cannot exceed 120'],    // CHECK constraint
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'],              // Only these values allowed
      default: 'user',
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,   // Auto-adds createdAt and updatedAt fields
  }
);

// ── Create the Model from the Schema ─────────
// "User" → MongoDB creates a "users" collection automatically
const User = mongoose.model('User', userSchema);


// =============================================
// STEP 3: HELPER FUNCTION
// Standard JSON response format
// =============================================
function sendResponse(res, statusCode, success, message, data = null) {
  const response = { success, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
}


// =============================================
// STEP 4: API ROUTES (CRUD Operations)
// Each route maps to a database operation
// =============================================

// ── Health Check ──────────────────────────────
app.get('/', (req, res) => {
  sendResponse(res, 200, true, 'DecodeLabs P3 API running', {
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: [
      'GET    /api/users          → Read all',
      'GET    /api/users/:id      → Read one',
      'POST   /api/users          → Create',
      'PUT    /api/users/:id      → Update',
      'DELETE /api/users/:id      → Delete',
      'GET    /api/users/stats    → DB stats',
    ]
  });
});


// ── READ ALL users ────────────────────────────
// SQL equivalent: SELECT * FROM users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();           // Mongoose: find all documents
    sendResponse(res, 200, true, `${users.length} users found`, users);
  } catch (err) {
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── STATS endpoint ────────────────────────────
// Must come BEFORE /:id route or "stats" gets treated as an id
app.get('/api/users/stats', async (req, res) => {
  try {
    const total    = await User.countDocuments();
    const admins   = await User.countDocuments({ role: 'admin' });
    const active   = await User.countDocuments({ isActive: true });

    sendResponse(res, 200, true, 'Database statistics', {
      totalUsers:   total,
      adminUsers:   admins,
      activeUsers:  active,
      regularUsers: total - admins,
    });
  } catch (err) {
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── READ ONE user by ID ───────────────────────
// SQL equivalent: SELECT * FROM users WHERE id = ?
app.get('/api/users/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid ID format');
    }

    const user = await User.findById(req.params.id);   // Mongoose: find by _id

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User found', user);
  } catch (err) {
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── CREATE a new user ─────────────────────────
// SQL equivalent: INSERT INTO users (name, email, age) VALUES (?, ?, ?)
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, age, role } = req.body;

    // Create new document — Mongoose runs schema validation automatically
    const newUser = new User({ name, email, age, role });
    const saved   = await newUser.save();      // Save to MongoDB

    sendResponse(res, 201, true, 'User created successfully', saved);
  } catch (err) {
    // Handle duplicate email (MongoDB error code 11000)
    if (err.code === 11000) {
      return sendResponse(res, 400, false, 'Email already exists');
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, 400, false, 'Validation failed', { errors });
    }
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── UPDATE a user ─────────────────────────────
// SQL equivalent: UPDATE users SET name=?, email=? WHERE id=?
app.put('/api/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid ID format');
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new:          true,    // Return the updated document (not the old one)
        runValidators: true,   // Run schema validation on update too
      }
    );

    if (!updated) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User updated successfully', updated);
  } catch (err) {
    if (err.code === 11000) {
      return sendResponse(res, 400, false, 'Email already exists');
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return sendResponse(res, 400, false, 'Validation failed', { errors });
    }
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── DELETE a user ─────────────────────────────
// SQL equivalent: DELETE FROM users WHERE id=?
app.delete('/api/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, 'Invalid ID format');
    }

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return sendResponse(res, 404, false, 'User not found');
    }

    sendResponse(res, 200, true, 'User deleted successfully', deleted);
  } catch (err) {
    sendResponse(res, 500, false, 'Server error: ' + err.message);
  }
});


// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  sendResponse(res, 404, false, `Route ${req.method} ${req.path} not found`);
});


// ── Start Server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 API docs at http://localhost:${PORT}/\n`);
});