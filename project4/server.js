require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Added this for file paths

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. SERVE STATIC FILES
// This allows your HTML to find its CSS and Images
app.use(express.static(__dirname)); 

// 2. SERVE THE UI
// This sends your index.html file when you go to http://localhost:5000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. API ROUTES
app.use('/api/interns', require('./routes/interns'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' 
  });
});

// 404 - This must stay at the VERY BOTTOM
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Connect DB & Start Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB Connection Failed:', err.message);
    process.exit(1);
  });