/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/server.js
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create temp directory if it doesn't exist
const tempDir = path.join('/tmp', 'temp'); // ✅ Writable on Vercel

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}


app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
}));

// Root route for testing
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend Server is Running' });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', messageRoutes);

// Basic Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});