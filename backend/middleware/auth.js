const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Check if required environment variables are set
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is missing. Make sure it is set in your .env file.');
  process.exit(1); // Exit the application with an error
}

// Authentication middleware
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

module.exports = {
  authenticate
};
