const express = require('express');
const cors = require('cors');
const db = require('./db');
const history = require('connect-history-api-fallback');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Keep the server running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running despite the error
});



const app = express();
const port = process.env.PORT || 3012;

// In the backend, at the top of your app.js file
app.use((req, res, next) => {
  console.log('Request URL:', req.method, req.url);
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Params:`, req.params);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Get credentials from .env
const USERNAME = process.env.AUTH_USERNAME;
const PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

// Check if required environment variables are set
if (!USERNAME || !PASSWORD_HASH || !JWT_SECRET) {
  console.error('ERROR: Required environment variables are missing. Make sure AUTH_USERNAME, AUTH_PASSWORD_HASH, and JWT_SECRET are set in your .env file.');
  process.exit(1); // Exit the application with an error
}


const authenticate = (req, res, next) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};


// Login route (public)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password: '***' });
  
  // Check username first
  if (username !== USERNAME) {
    console.log('Login failed - username mismatch');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  try {
    // Use bcrypt to compare the password
    const passwordMatch = await bcrypt.compare(password, PASSWORD_HASH);
    
    if (passwordMatch) {
      // Create token
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '180d' });
      
      // Set HTTP-only cookie with token
      res.cookie('auth_token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 180 * 24 * 60 * 60 * 1000 // 180 days
      });
      
      console.log('Login successful - token created');
      return res.json({ success: true });
    } else {
      console.log('Login failed - password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout route (public)
app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// Test route (public)
app.get('/test', (req, res) => {
  res.send('Server is working correctly');
});

// Apply authentication to protected API routes 
// (MUST come before the route definitions)
app.use('/api/notes', authenticate);
app.use('/api/categories', authenticate);

// Protected API Routes for notes

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get notes by category - KEEP THIS FIRST
app.get('/api/notes/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let query;
    let params;
    
    if (id === 'uncategorized') {
      query = 'SELECT * FROM notes WHERE category_id IS NULL ORDER BY updated_at DESC';
      params = [];
    } else if (id === 'all') {
      query = 'SELECT * FROM notes ORDER BY updated_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM notes WHERE category_id = $1 ORDER BY updated_at DESC';
      params = [id];
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

console.log("Registering bulk delete route: DELETE /api/notes/category/:id");



// Bulk delete notes by category - THIS MUST COME BEFORE THE INDIVIDUAL DELETE ROUTE
app.delete('/api/notes/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    let params;
    let message;
    
    if (id === 'uncategorized') {
      query = 'DELETE FROM notes WHERE category_id IS NULL';
      params = [];
      message = 'All uncategorized notes deleted';
    } else if (id === 'all') {
      query = 'DELETE FROM notes';
      params = [];
      message = 'All notes deleted';
    } else {
      query = 'DELETE FROM notes WHERE category_id = $1';
      params = [id];
      message = 'All notes in this category deleted';
    }
    
    const result = await db.query(query, params);
    console.log(`Bulk deleted ${result.rowCount} notes from category: ${id}`);
    res.json({ message, count: result.rowCount });
  } catch (err) {
    console.error('Error in bulk delete:', err);
    res.status(500).json({ error: 'Server error during bulk delete operation' });
  }
});

// Create a note
app.post('/api/notes', async (req, res) => {
  try {
    const { content, category_id } = req.body;
    const result = await db.query(
      'INSERT INTO notes (content, category_id) VALUES ($1, $2) RETURNING *',
      [content, category_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, category_id } = req.body;
    const result = await db.query(
      'UPDATE notes SET content = $1, category_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [content, category_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

console.log("Registering individual delete route: DELETE /api/notes/:id");

// Delete individual note - THIS MUST COME AFTER THE BULK DELETE ROUTE
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected API Routes for categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *',
      [name, icon]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;
    const result = await db.query(
      'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 RETURNING *',
      [name, icon, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// DELETE all categories
app.delete('/api/categories/all',  async (req, res) => {
  try {
    // First update all notes to have null category_id
    await db.query('UPDATE notes SET category_id = NULL');
    
    // Then delete all categories
    const result = await db.query('DELETE FROM categories');
    
    console.log(`Deleted ${result.rowCount} categories`);
    res.json({ message: 'All categories deleted', count: result.rowCount });
  } catch (err) {
    console.error('Error in bulk delete categories:', err);
    res.status(500).json({ error: 'Server error during bulk delete operation' });
  }
});



app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notes SET category_id = NULL WHERE category_id = $1', [id]);
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});




// Explicit handler for login page - BEFORE history middleware
app.get('/login.html', (req, res) => {
  console.log('Explicitly serving login.html');
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Authentication check middleware - BEFORE history middleware
app.use((req, res, next) => {
  console.log('Path:', req.path, 'Has token:', !!req.cookies.auth_token);
  
  const token = req.cookies.auth_token;
  const isLoginPage = req.path === '/login.html';
  const isLoginApi = req.path === '/api/login';
  const isLogoutApi = req.path === '/api/logout';
  const isTestRoute = req.path === '/test';
  const isStaticAsset = req.path.startsWith('/css/') || 
                       req.path.startsWith('/js/') || 
                       req.path.startsWith('/icons/') || 
                       req.path.startsWith('/images/');
  
  // Public paths don't need authentication
  if (isLoginPage || isLoginApi || isLogoutApi || isTestRoute || isStaticAsset) {
    return next();
  }
  
  // Check for authentication for all other paths
  if (!token) {
    console.log('Redirecting to login.html');
    return res.redirect('/login.html');
  } else if (token && isLoginPage) {
    console.log('Redirecting to main app');
    return res.redirect('/');
  }
  
  next();
});

// NOW add the history middleware with special treatment for login.html
app.use(history({
  rewrites: [
    {
      from: /^\/login\.html$/,
      to: '/login.html'
    }
  ],
  // Disable history API fallback for some paths
  historyApiFallback: function(req, res, next) {
    if (req.path === '/login.html' || 
        req.path === '/api/login' || 
        req.path === '/api/logout' ||
        req.path === '/test') {
      next();
    } else {
      history()(req, res, next);
    }
  }
}));

// Static files come AFTER history middleware
app.use(express.static(path.join(__dirname, '../frontend')));

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
