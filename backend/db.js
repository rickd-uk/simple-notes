const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Error handling for pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
  // Don't crash the server on connection errors
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Define a single export object with all methods
module.exports = {
  // Basic query function
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err; // Rethrow so the API can respond with an error
    }
  },
  
  // Get a client for transactions
  getClient: async () => {
    return await pool.connect();
  },
  
  // Helper function to get user by username
  getUserByUsername: async (username) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0]; 
    } catch (err) {
      console.error('Error getting user by username:', err);
      throw err;
    }
  },
  
  // Helper function to get user by email
  getUserByEmail: async (email) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error getting user by email:', err);
      throw err;
    }
  },
  
  // Helper function to create a new user
  createUser: async (username, email, passwordHash) => {
    try {
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, passwordHash]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  },
  
  // Helper function to update last login time
  updateUserLastLogin: async (userId) => {
    try {
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (err) {
      console.error('Error updating last login:', err);
      // Don't throw error for non-critical operations
    }
  }
};
