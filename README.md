# Employee Coin-Based Evaluation App

A web application for employee performance evaluation using a coin-based peer-recognition system.

## Features

- Employee and admin roles
- Fixed coin denomination per transaction (default: 3 coins)
- Daily transaction limit (default: 3 transactions)
- Quarterly reset cycle with automatic redistribution
- Google Sheets integration for data export/import
- Comprehensive admin dashboard

## Tech Stack

- Frontend: React 18, TypeScript, Material-UI
- Backend: Node.js 20, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT + bcrypt
- Infrastructure: AWS (CloudFront, ALB, ECS Fargate, RDS, S3, Secrets Manager)

## Project Structure

```
employee-coin-app/
├── backend/         # Node.js Express backend
├── frontend/        # React frontend
├── docs/            # Documentation and diagrams
└── infra/           # Terraform scripts
```

## Getting Started

See the README files in the backend and frontend directories for setup instructions.
