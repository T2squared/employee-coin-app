import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import transactionRoutes from './routes/transaction.routes';
import configRoutes from './routes/config.routes';
import periodRoutes from './routes/period.routes';
import syncRoutes from './routes/sync.routes';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 8000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/config', configRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Employee Coin-Based Evaluation App API' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const setupScheduler = () => {
  const checkNightlySync = () => {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    
    if (hours === 17 && minutes === 0) {
      console.log('Running nightly sync job...');
    }
  };

  const checkQuarterlyReset = () => {
    const now = new Date();
    const month = now.getUTCMonth();
    const date = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    
    if (
      ((month === 2 && date === 31) || // March 31
       (month === 5 && date === 30) || // June 30
       (month === 8 && date === 30) || // September 30
       (month === 11 && date === 31)) && // December 31
      hours === 0 && minutes === 0
    ) {
      console.log('Running quarterly reset job...');
    }
  };

  setInterval(() => {
    checkNightlySync();
    checkQuarterlyReset();
  }, 60000);
};

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  setupScheduler();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
