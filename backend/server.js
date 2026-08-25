const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Meeting Room Booking API is running",
      database: "connected"
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

app.get("/api/rooms", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, location, capacity, facilities FROM meeting_rooms ORDER BY id"
    );

    res.status(200).json({
      success: true,
      rooms: result.rows
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch meeting rooms"
    });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const {
      room_id,
      user_id,
      booking_date,
      start_time,
      end_time,
      purpose
    } = req.body;

    if (!room_id || !user_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    const conflict = await pool.query(
      `SELECT id FROM bookings
       WHERE room_id = $1
       AND booking_date = $2
       AND start_time < $4
       AND end_time > $3`,
      [room_id, booking_date, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Room is already booked for this time"
      });
    }

    const result = await pool.query(
      `INSERT INTO bookings
       (room_id, user_id, booking_date, start_time, end_time, purpose)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [room_id, user_id, booking_date, start_time, end_time, purpose || null]
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: result.rows[0]
    });

  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create booking"
    });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.id,
        r.name AS room_name,
        u.name AS user_name,
        u.email,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.purpose,
        b.status
      FROM bookings b
      JOIN meeting_rooms r ON b.room_id = r.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.booking_date, b.start_time
    `);

    res.status(200).json({
      success: true,
      bookings: result.rows
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings"
    });
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM bookings WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking"
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});