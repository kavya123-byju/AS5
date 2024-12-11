const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL connection using Neon.tech credentials
const pool = new Pool({
  host: 'ep-mute-band-a5vunfrp.us-east-2.aws.neon.tech',
  database: 'blog_database',
  user: 'neondb_owner',
  password: '7xScTIoh9vXW',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to fetch all articles
app.get('/api/articles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles');
    res.json(result.rows); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to fetch a single article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Article not found');
    }
    
    res.json(result.rows[0]); // Send the specific article as JSON
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to fetch all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to fetch a single category by ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Category not found');
    }
    
    res.json(result.rows[0]); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to display homepage with articles
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles');
    res.render('index', { articles: result.rows }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to display the About page
app.get('/about', (req, res) => {
  res.render('about'); 
});

// Route to add a new article
app.get('/addArticle', (req, res) => {
  res.render('addArticle');
});

app.post('/addArticle', async (req, res) => {
  const { title, content, category_id } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO articles (title, content, category_id) VALUES ($1, $2, $3)',
      [title, content, category_id]
    );
    res.redirect('/'); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to display all categories
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.render('categories', { categories: result.rows }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Route to view articles in a category
app.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM articles WHERE category_id = $1',
      [id]
    );
    res.render('articles', { articles: result.rows }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Database Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 
