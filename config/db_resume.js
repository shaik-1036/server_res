/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/config/db_resume.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase Client for Resumes
const supabaseResume = createClient(process.env.SUPABASE_RESUME_URL, process.env.SUPABASE_RESUME_ANON_KEY);

// Function to check if tables exist
const initTables = async () => {
  const { data: resumeData, error: resumeError } = await supabaseResume.from('resumes').select('*').limit(1);
  if (resumeError) {
    console.error('Error checking resumes table:', resumeError.message);
    console.log('Ensure the "resumes" table is created in Supabase dashboard.');
  } else {
    console.log('Resumes table exists and is accessible.');
  }
};

initTables();

module.exports = supabaseResume;