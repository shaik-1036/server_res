/*
 * Copyright (c) 2025 Your Company Name
 * All rights reserved.
 */
// server/routes/users.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

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

module.exports = router;