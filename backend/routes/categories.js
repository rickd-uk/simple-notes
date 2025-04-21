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

// --- Route to delete ALL categories ---
// DELETE /api/categories/all
router.delete('/all', async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    // ***** ADD THIS ADMIN HANDLING BLOCK *****
    if (userId === 'admin') {
      console.log('Handling delete all for admin user...'); // Add log for confirmation

      // Option A: Delete categories/notes where user_id IS NULL
      // (Adjust this logic based on your exact requirement for admin)

      // Step 1 (Admin): Update notes associated with NULL user categories
      // This query might need adjustment. Do admin-created notes have user_id=NULL?
      // Or maybe update notes whose category_id points to a category with user_id=NULL?
      // Let's assume we target notes with user_id IS NULL for now:
      await db.query(
        'UPDATE notes SET category_id = NULL WHERE user_id IS NULL'
        // Or maybe: 'UPDATE notes SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE user_id IS NULL)'
      );

      // Step 2 (Admin): Delete categories associated with NULL user
      const deleteResult = await db.query(
        'DELETE FROM categories WHERE user_id IS NULL RETURNING id'
      );

      console.log(`Admin deleted ${deleteResult.rowCount} categories with NULL user_id.`);
      return res.json({
        message: `Admin operation: Deleted categories not associated with a specific user. Count: ${deleteResult.rowCount}`
      });
      // Make sure to RETURN here to exit the admin block
    }
    // ***** END OF ADMIN HANDLING BLOCK *****


    // --- Logic for REGULAR (non-admin) users ---
    console.log(`Handling delete all for regular user: ${userId}`); // Add log

    // Step 1: Update all notes belonging to this user
    await db.query(
      'UPDATE notes SET category_id = NULL WHERE user_id = $1',
      [userId] // For regular users, userId should be an integer here
    );

    // Step 2: Delete all categories belonging to this user
    const deleteResult = await db.query(
      'DELETE FROM categories WHERE user_id = $1 RETURNING id',
      [userId] // For regular users, userId should be an integer here
    );

    console.log(`User ${userId} deleted ${deleteResult.rowCount} categories.`);
    // Step 3: Respond with success
    res.json({
      message: `All categories deleted for the user. Count: ${deleteResult.rowCount}`
    });

  } catch (err) {
    console.error('Error deleting all categories:', err);
    // Log the specific userId that caused the error if possible
    console.error(`Error occurred for userId: ${req.user ? req.user.userId : 'unknown'}`);
    res.status(500).json({ error: 'Server error while deleting all categories' });
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
