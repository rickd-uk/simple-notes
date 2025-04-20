const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all category routes
router.use(authenticate);

// Get all categories for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Handle admin user from .env file (backward compatibility)
    if (userId === 'admin') {
      const result = await db.query('SELECT * FROM categories');
      return res.json(result.rows);
    }
    
    const result = await db.query(
      'SELECT * FROM categories WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new category for the current user
router.post('/', async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.user.userId;
    
    // Handle admin user from .env file (backward compatibility)
    if (userId === 'admin') {
      const result = await db.query(
        'INSERT INTO categories (name, icon) VALUES ($1, $2) RETURNING *',
        [name, icon]
      );
      return res.status(201).json(result.rows[0]);
    }
    
    const result = await db.query(
      'INSERT INTO categories (name, icon, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, icon, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a category for the current user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;
    const userId = req.user.userId;
    
    // Handle admin user from .env file (backward compatibility)
    if (userId === 'admin') {
      const result = await db.query(
        'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 RETURNING *',
        [name, icon, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      return res.json(result.rows[0]);
    }
    
    // For regular users, ensure they can only update their own categories
    const result = await db.query(
      'UPDATE categories SET name = $1, icon = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, icon, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a category for the current user and update related notes
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Handle admin user from .env file (backward compatibility)
    if (userId === 'admin') {
      // Set category_id to NULL for notes in this category
      await db.query('UPDATE notes SET category_id = NULL WHERE category_id = $1', [id]);
      
      // Delete the category
      await db.query('DELETE FROM categories WHERE id = $1', [id]);
      return res.json({ message: 'Category deleted' });
    }
    
    // For regular users, verify ownership and handle related notes
    
    // Check if category exists and belongs to user
    const categoryCheck = await db.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }
    
    // Set category_id to NULL for notes in this category that belong to the user
    await db.query(
      'UPDATE notes SET category_id = NULL WHERE category_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    // Delete the category
    await db.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
