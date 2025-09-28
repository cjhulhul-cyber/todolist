const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Load todos from file
async function loadTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Save todos to file
async function saveTodos(todos) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error saving todos:', error);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await loadTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load todos' });
  }
});

// Add new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { text, priority = 'medium' } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todos = await loadTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      priority: priority,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    await saveTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority } = req.body;
    
    const todos = await loadTodos();
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (text !== undefined) todos[todoIndex].text = text.trim();
    if (completed !== undefined) todos[todoIndex].completed = completed;
    if (priority !== undefined) todos[todoIndex].priority = priority;
    todos[todoIndex].updatedAt = new Date().toISOString();

    await saveTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todos = await loadTodos();
    const filteredTodos = todos.filter(todo => todo.id !== id);
    
    if (filteredTodos.length === todos.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await saveTodos(filteredTodos);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Start server
async function startServer() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`🚀 TaskBox server running at http://localhost:${PORT}`);
    console.log(`📁 Data stored in: ${DATA_FILE}`);
  });
}

startServer().catch(console.error);
