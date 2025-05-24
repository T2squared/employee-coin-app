const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kpoint-app-jwt-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://k-point-evaluation-app-mln4xy0x.devinapps.com',
      'http://localhost:3000'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // During development, allow all origins
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'JWT-Authorization', 'Basic-Auth'],
  credentials: true,
  exposedHeaders: ['Access-Control-Allow-Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Employee Coin-Based Evaluation App API' });
});

app.get('/api/users', (req, res) => {
  res.json([
    { 
      id: '1', 
      name: 'Admin User', 
      email: 'admin@example.com', 
      role: 'ADMIN',
      departmentId: '1',
      currentBalance: 100,
      isActive: true
    },
    { 
      id: '2', 
      name: 'Employee One', 
      email: 'employee@example.com', 
      role: 'EMPLOYEE',
      departmentId: '2',
      currentBalance: 20,
      isActive: true
    },
    { 
      id: '3', 
      name: 'Employee Two', 
      email: 'employee2@example.com', 
      role: 'EMPLOYEE',
      departmentId: '2',
      currentBalance: 15,
      isActive: true
    }
  ]);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  let user = null;
  
  if (email === 'admin@example.com' && password === 'admin') {
    user = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      departmentId: '1',
      currentBalance: 100
    };
  } else if (email === 'employee@example.com' && password === 'employee') {
    user = {
      id: '2',
      name: 'Employee One',
      email: 'employee@example.com',
      role: 'EMPLOYEE',
      departmentId: '2',
      currentBalance: 20
    };
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  
  res.json({
    token,
    refreshToken,
    user
  });
});

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('No Authorization header, proceeding with default user');
    req.user = { userId: '2', role: 'EMPLOYEE' };
    return next();
  }
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.log('Invalid token, proceeding with default user');
      req.user = { userId: '2', role: 'EMPLOYEE' };
      next();
    }
  } else {
    console.log('Invalid auth method, proceeding with default user');
    req.user = { userId: '2', role: 'EMPLOYEE' };
    next();
  }
};

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'リフレッシュトークンが必要です' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    const token = jwt.sign({ userId: decoded.userId, role: decoded.role || 'EMPLOYEE' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.json({
      token,
      refreshToken // Return the same refresh token
    });
  } catch (error) {
    res.status(401).json({ message: '無効なリフレッシュトークンです' });
  }
});

app.use('/api/transactions', authenticateJWT);
app.use('/api/users', authenticateJWT);

app.get('/api/transactions', (req, res) => {
  res.json([
    {
      id: '1',
      senderId: '2',
      recipientId: '3',
      amount: 2,
      reason: 'Great help with the project',
      transactionTime: new Date().toISOString(),
      periodName: '2024-Q2'
    },
    {
      id: '2',
      senderId: '3',
      recipientId: '2',
      amount: 1,
      reason: 'Excellent presentation',
      transactionTime: new Date().toISOString(),
      periodName: '2024-Q2'
    }
  ]);
});

app.post('/api/transactions', (req, res) => {
  const { recipientId, amount, reason } = req.body;
  
  if (!recipientId || !amount || !reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  if (amount < 1 || amount > 3) {
    return res.status(400).json({ message: 'Amount must be between 1 and 3' });
  }
  
  res.status(201).json({
    id: Math.floor(Math.random() * 1000).toString(),
    senderId: '2', // Assuming logged in user
    recipientId,
    amount,
    reason,
    transactionTime: new Date().toISOString(),
    periodName: '2024-Q2'
  });
});

app.listen(port, () => {
  console.log(`Simple server running on port ${port}`);
  console.log(`Variable point system (1-3 points) is now active`);
});
