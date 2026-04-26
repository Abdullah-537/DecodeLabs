const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  role: { type: String, required: [true, 'Role is required'], trim: true },
  stack: { type: String, enum: ['Frontend', 'Backend', 'Full Stack', 'DevOps', 'AI/ML'], default: 'Full Stack' },
  status: { type: String, enum: ['Active', 'Completed', 'On Hold'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Intern', internSchema);