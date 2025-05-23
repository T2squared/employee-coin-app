import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Employee Coin-Based Evaluation App API' });
});

app.get('/api/users', (req: Request, res: Response) => {
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
      email: 'employee1@example.com', 
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

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (email === 'admin@example.com' && password === 'admin') {
    res.json({
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        departmentId: '1',
        currentBalance: 100
      }
    });
  } else if (email === 'employee@example.com' && password === 'employee') {
    res.json({
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '2',
        name: 'Employee One',
        email: 'employee@example.com',
        role: 'EMPLOYEE',
        departmentId: '2',
        currentBalance: 20
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/transactions', (req: Request, res: Response) => {
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

app.post('/api/transactions', (req: Request, res: Response) => {
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
