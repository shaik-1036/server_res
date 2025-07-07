/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/routes/messages.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { sendEmailNotification } = require('../utils/email');

router.post('/send-message', async (req, res) => {
  const { category, message } = req.body;
  const timestamp = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ category, message, timestamp }]);
    if (error) throw error;

    // Fetch users in the specified category for email notification
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('status', category);
    if (userError) throw userError;

    // Send email to all users in the category
    users.forEach(user => {
      sendEmailNotification(user.email, message);
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error sending message', error: err.message });
  }
});

router.get('/messages', async (req, res) => {
  const { category } = req.query;
  try {
    // Fetch messages for the specific category and delete old messages (older than 2 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deleteData, error: deleteError } = await supabase
      .from('messages')
      .delete()
      .lt('timestamp', twoDaysAgo);
    if (deleteError) throw deleteError;

    const query = category 
      ? supabase.from('messages').select('*').eq('category', category).gte('timestamp', twoDaysAgo)
      : supabase.from('messages').select('*').gte('timestamp', twoDaysAgo);

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching messages', error: err.message });
  }
});

router.get('/message-stats', async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .gte('timestamp', twoDaysAgo);
    if (error) throw error;

    const totalMessages = data.length;
    const categoryCount = {
      employed: data.filter(m => m.category === 'employed').length,
      graduated: data.filter(m => m.category === 'graduated').length,
      pursuing: data.filter(m => m.category === 'pursuing').length,
    };

    res.status(200).json({
      success: true,
      totalMessages,
      categoryCount,
      messages: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching message stats', error: err.message });
  }
});

module.exports = router;