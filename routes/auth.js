/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const userData = {
    email: req.body.email,
    fullname: req.body.fullName, // Changed to lowercase to match Supabase
    password: req.body.password,
    dob: req.body.dob,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    qualification: req.body.qualification,
    branch: req.body.branch,
    passoutyear: req.body.passoutYear // Changed to lowercase to match Supabase
  };
  try {
    console.log('Attempting to insert user data into Supabase:', userData);
    const { data, error } = await supabase.from('users').insert([userData]);
    if (error) {
      console.error('Supabase insert error:', error);
      if (error.code === '23505') { // Duplicate key error for unique constraint
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      return res.status(500).json({ success: false, message: 'Signup failed', error: error.message });
    }
    console.log('User inserted successfully:', data);
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    res.status(500).json({ success: false, message: 'Signup failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password);
    if (error) {
      console.error('Supabase login error:', error);
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
    if (data.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Return user data with adjusted field names if needed
    const user = {
      email: data[0].email,
      fullName: data[0].fullname, // Adjusted to match Supabase
      city: data[0].city,
      status: data[0].status,
      qualification: data[0].qualification,
      passoutYear: data[0].passoutyear // Adjusted to match Supabase
    };
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Unexpected error during login:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email);
    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ success: false, message: 'Error updating password', error: error.message });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Unexpected error during password update:', err);
    res.status(500).json({ success: false, message: 'Error updating password', error: err.message });
  }
});

module.exports = router;