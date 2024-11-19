const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS light_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intensity INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(201).json({ message: 'User created successfully' });
    });
  } catch {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error accessing database' });
    }
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
        res.json({ accessToken: accessToken });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    } catch {
      res.status(500).json({ error: 'Error logging in' });
    }
  });
});

app.get('/light-intensity', authenticateToken, (req, res) => {
  db.get('SELECT intensity FROM light_data ORDER BY timestamp DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving light intensity data' });
    }
    res.json(row || { intensity: 0 });
  });
});

app.post('/update-light', authenticateToken, (req, res) => {
  const { intensity } = req.body;
  db.run('INSERT INTO light_data (intensity) VALUES (?)', [intensity], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error updating light intensity' });
    }
    res.json({ message: 'Light intensity updated successfully', id: this.lastID });
  });
});

// Simple AI decision making
app.post('/ai-control', authenticateToken, (req, res) => {
  const { intensity } = req.body;
  let decision;
  if (intensity < 30) {
    decision = 'ON';
  } else {
    decision = 'OFF';
  }
  res.json({ decision: decision });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});