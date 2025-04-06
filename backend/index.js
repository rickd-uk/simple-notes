const express = require('express');
const cors = require('cors');
const db = require('./db');

const history = require('connect-history-api-fallback');
const path = require('path');
const app = express();
const port = process.env.PORT || 3012;

// Middleware
app.use(cors());
app.use(express.json());


// Routes for notes
app.get('/api/notes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notes ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

// Routes for categories
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

// Fallback middleware for SPA routing
app.use(history());


app.use(express.static(path.join(__dirname, '../frontend')));



// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
