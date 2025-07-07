/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/config/db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Function to check if tables exist (we'll log instead of creating since Supabase JS doesn't support table creation directly)
const initTables = async () => {
  // Check for Users Table
  const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
  if (usersError) {
    console.error('Error checking users table:', usersError.message);
    console.log('Ensure the "users" table is created in Supabase dashboard.');
  } else {
    console.log('Users table exists and is accessible.');
  }

  // Check for Messages Table
  const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').limit(1);
  if (messagesError) {
    console.error('Error checking messages table:', messagesError.message);
    console.log('Ensure the "messages" table is created in Supabase dashboard.');
  } else {
    console.log('Messages table exists and is accessible.');
  }
};

initTables();

module.exports = supabase;