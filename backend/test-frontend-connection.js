const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Test endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { username, password } = req.body;
  
  if (username === 'testfounder' && password === 'password123') {
    res.json({
      message: 'Login successful',
      token: 'test-token-123',
      user: {
        id: 1,
        username: 'testfounder',
        role: 'Founder'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.listen(5000, () => {
  console.log('Test server running on port 5000');
  console.log('Try logging in with: testfounder / password123');
});
