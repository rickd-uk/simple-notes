const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const history = require('connect-history-api-fallback');
const path = require('path');
require('dotenv').config();

// Import route modules
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const categoriesRoutes = require('./routes/categories');

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

// Logging middleware
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

// Check if required environment variables are set
if (!process.env.JWT_SECRET) {
  console.error('ERROR: Required environment variable JWT_SECRET is missing. Make sure it is set in your .env file.');
  process.exit(1); // Exit the application with an error
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/categories', categoriesRoutes);

// Backward compatibility for old routes
app.post('/api/login', (req, res) => {
  // Redirect to new auth login endpoint
  req.url = '/api/auth/login';
  app.handle(req, res);
});

app.post('/api/logout', (req, res) => {
  // Redirect to new auth logout endpoint
  req.url = '/api/auth/logout';
  app.handle(req, res);
});

// Test route (public)
app.get('/test', (req, res) => {
  res.send('Server is working correctly');
});

// Explicit handler for login page - BEFORE history middleware
app.get('/login.html', (req, res) => {
  console.log('Explicitly serving login.html');
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Explicit handler for signup page
app.get('/signup.html', (req, res) => {
  console.log('Explicitly serving signup.html');
  res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

// Authentication check middleware - BEFORE history middleware
app.use((req, res, next) => {
  console.log('Path:', req.path, 'Has token:', !!req.cookies.auth_token);
  
  const token = req.cookies.auth_token;
  const isLoginPage = req.path === '/login.html';
  const isSignupPage = req.path === '/signup.html'; 
  const isAuthApi = req.path.startsWith('/api/auth/');
  const isTestRoute = req.path === '/test';
  const isStaticAsset = req.path.startsWith('/css/') || 
                       req.path.startsWith('/js/') || 
                       req.path.startsWith('/icons/') || 
                       req.path.startsWith('/images/');
  
  // Public paths don't need authentication
  if (isLoginPage || isSignupPage || isAuthApi || isTestRoute || isStaticAsset) {
    return next();
  }
  
  // Check for authentication for all other paths
  if (!token) {
    console.log('Redirecting to login.html');
    return res.redirect('/login.html');
  } else if (token && (isLoginPage || isSignupPage)) {
    console.log('Redirecting to main app');
    return res.redirect('/');
  }
  
  next();
});

// NOW add the history middleware with special treatment for login and signup pages
app.use(history({
  rewrites: [
    {
      from: /^\/login\.html$/,
      to: '/login.html'
    },
    {
      from: /^\/signup\.html$/,
      to: '/signup.html'
    }
  ],
  // Disable history API fallback for some paths
  historyApiFallback: function(req, res, next) {
    if (req.path === '/login.html' || 
        req.path === '/signup.html' ||
        req.path.startsWith('/api/') ||
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
