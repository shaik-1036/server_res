/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/db'); // Primary database for users
const supabaseResume = require('../config/db_resume'); // Secondary database for resumes
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

router.get('/user-stats', async (req, res) => {
  try {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;

    // Aggregate data for stats
    const totalUsers = users.length;
    const statusCount = {
      employed: users.filter(u => u.status === 'employed').length,
      graduated: users.filter(u => u.status === 'graduated').length,
      pursuing: users.filter(u => u.status === 'pursuing').length,
    };

    // Aggregate by city, state, country for filters
    const cityCount = {};
    const stateCount = {};
    const countryCount = {};
    users.forEach(user => {
      cityCount[user.city] = (cityCount[user.city] || 0) + 1;
      stateCount[user.state] = (stateCount[user.state] || 0) + 1;
      countryCount[user.country] = (countryCount[user.country] || 0) + 1;
    });

    // Aggregate by qualification, passoutyear, branch with status
    const qualificationByYearStatus = {};
    const branchByQualYearStatus = {};
    users.forEach(user => {
      const qualKey = `${user.qualification}-${user.passoutyear}-${user.status}`;
      const branchKey = `${user.branch}-${user.qualification}-${user.passoutyear}-${user.status}`;
      qualificationByYearStatus[qualKey] = (qualificationByYearStatus[qualKey] || 0) + 1;
      branchByQualYearStatus[branchKey] = (branchByQualYearStatus[branchKey] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      totalUsers,
      statusCount,
      cityCount,
      stateCount,
      countryCount,
      qualificationByYearStatus,
      branchByQualYearStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching user stats', error: err.message });
  }
});

router.post('/upload-resume', async (req, res) => {
  try {
    const { email, name } = req.body;
    const resumeFile = req.files.resume;
    if (!resumeFile) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Check file size (less than 2MB)
    if (resumeFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 2MB limit' });
    }

    // Temporary save file to extract content
    const tempPath = path.join(__dirname, '../temp', resumeFile.name);
    await resumeFile.mv(tempPath);

    // Extract text from PDF
    let resumeData = '';
    if (resumeFile.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(tempPath);
      const data = await pdfParse(dataBuffer);
      resumeData = data.text;
    } else {
      // For simplicity, handle only PDF for now; extend for DOC/DOCX if needed
      resumeData = 'Text extraction for this file type is not supported yet.';
    }

    // Delete temporary file
    fs.unlinkSync(tempPath);

    // Store in Supabase (secondary database for resumes)
    const { data, error } = await supabaseResume
      .from('resumes')
      .upsert([{ email, name, resume_data: resumeData }], { onConflict: 'email' });
    if (error) throw error;

    res.status(200).json({ success: true, resumeData });
  } catch (err) {
    console.error('Error uploading resume:', err);
    res.status(500).json({ success: false, message: 'Error uploading resume', error: err.message });
  }
});

router.get('/user-resume', async (req, res) => {
  try {
    const { email } = req.query;
    const { data, error } = await supabaseResume
      .from('resumes')
      .select('*')
      .eq('email', email);
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume found for this user' });
    }
    res.status(200).json({ success: true, email: data[0].email, resumeData: data[0].resume_data });
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ success: false, message: 'Error fetching resume', error: err.message });
  }
});

router.get('/resume-users', async (req, res) => {
  try {
    const { data, error } = await supabaseResume
      .from('resumes')
      .select('name, email');
    if (error) throw error;

    // Handle duplicate names by combining with email
    const nameEmailMap = {};
    const users = data.map(user => {
      if (data.filter(u => u.name === user.name).length > 1) {
        return `${user.name} - ${user.email}`;
      }
      return `${user.name} - ${user.email}`;
    });

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error('Error fetching resume users:', err);
    res.status(500).json({ success: false, message: 'Error fetching resume users', error: err.message });
  }
});

router.delete('/delete-resume', async (req, res) => {
  try {
    const { email } = req.body;
    const { data, error } = await supabaseResume
      .from('resumes')
      .delete()
      .eq('email', email);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Error deleting resume:', err);
    res.status(500).json({ success: false, message: 'Error deleting resume', error: err.message });
  }
});

module.exports = router;