// =========================================
// 1. SETUP
// =========================================
const express = require('express');
const app = express();
const PORT = 3000;

// This is MIDDLEWARE: a function that runs on every incoming
// request before it reaches your route handlers.
// express.json() parses a JSON request body into req.body
// so we can read things like req.body.title.
app.use(express.json());

// A tiny custom middleware, just to show what one looks like.
// It runs for every request, logs it, then calls next()
// to pass control on to the next middleware/route.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// =========================================
// 2. IN-MEMORY "DATABASE"
// Just an array living in server memory.
// Resets every time the server restarts.
// =========================================
let books = [
  { id: 1, title: '1984', author: 'George Orwell' },
  { id: 2, title: 'The Hobbit', author: 'J.R.R. Tolkien' }
];
let nextId = 3; // simple counter to generate new ids

// =========================================
// 3. ROUTES (CRUD)
// =========================================

// GET /books -> return every book
app.get('/books', (req, res) => {
  res.status(200).json(books);
});

// GET /books/:id -> return a single book
// :id is a route parameter, available as req.params.id
app.get('/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  res.status(200).json(book);
});

// POST /books -> create a new book from the request body
app.post('/books', (req, res) => {
  const { title, author } = req.body;

  // Basic validation
  if (!title || !author) {
    return res.status(400).json({ error: 'title and author are required' });
  }

  const newBook = { id: nextId++, title, author };
  books.push(newBook);

  // 201 Created is the correct status for a successful POST
  res.status(201).json(newBook);
});

// PUT /books/:id -> update an existing book
app.put('/books/:id', (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const { title, author } = req.body;
  if (title) book.title = title;
  if (author) book.author = author;

  res.status(200).json(book);
});

// DELETE /books/:id -> remove a book
app.delete('/books/:id', (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const [deleted] = books.splice(index, 1);
  res.status(200).json({ message: 'Book deleted', book: deleted });
});

// =========================================
// 4. FALLBACK ERROR HANDLING
// This is a special 4-argument middleware Express recognizes
// as an error handler. Any error passed to next(err) anywhere
// in the app ends up here instead of crashing the server.
// =========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// =========================================
// 5. START SERVER
// =========================================
app.listen(PORT, () => {
  console.log(`Books API running at http://localhost:${PORT}`);
});