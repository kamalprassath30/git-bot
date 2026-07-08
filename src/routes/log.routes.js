const express = require("express");
const pool = require("../database/db");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM bot_logs
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});

module.exports = router;
