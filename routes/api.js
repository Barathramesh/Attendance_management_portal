const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get all students
router.get('/students', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT * FROM ITA
    `);
    
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No students found in database'
      });
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ 
      success: false,
      error: 'DATABASE_ERROR',
      message: err.message,
      sqlState: err.sqlState
    });
  } finally {
    if (connection) connection.release();
  }
});

// Update attendance status
router.post('/attendance', async (req, res) => {
  let connection;
  try {
    // Validate request body
    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'Expected array of student attendance data'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const results = [];
    for (const student of req.body) {
      // Validate each student object
      if (!student.id || !student.status || !['Present', 'Absent'].includes(student.status)) {
        throw new Error(`Invalid data for student ID: ${student.id || 'unknown'}`);
      }

      const [result] = await connection.query(
        'UPDATE ITA SET attendance_status = ? WHERE id = ?',
        [student.status, student.id]
      );
      results.push({
        id: student.id,
        affectedRows: result.affectedRows
      });
    }

    await connection.commit();
    
    res.json({
      success: true,
      updated: results.filter(r => r.affectedRows > 0).length,
      details: results
    });
    
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Update error:', err);
    
    res.status(400).json({
      success: false,
      error: 'UPDATE_FAILED',
      message: err.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;