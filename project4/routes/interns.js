const express = require('express');
const router = express.Router();
const Intern = require('../models/Intern');

// GET all interns
router.get('/', async (req, res) => {
  try {
    const interns = await Intern.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: interns.length, data: interns });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// GET single intern
router.get('/:id', async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    res.status(200).json({ success: true, data: intern });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// POST create intern
router.post('/', async (req, res) => {
  try {
    const intern = await Intern.create(req.body);
    res.status(201).json({ success: true, data: intern });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(422).json({ success: false, message: 'Email already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update intern
router.put('/:id', async (req, res) => {
  try {
    const intern = await Intern.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    res.status(200).json({ success: true, data: intern });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE intern
router.delete('/:id', async (req, res) => {
  try {
    const intern = await Intern.findByIdAndDelete(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    res.status(200).json({ success: true, message: 'Intern removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;