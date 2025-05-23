# API Endpoints

## Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password with token

## Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

## Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department (admin only)
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)

## Transactions
- `GET /api/transactions` - Get all transactions (admin only)
- `GET /api/transactions/me` - Get current user's transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction by ID

## Config
- `GET /api/config` - Get all config values (admin only)
- `PUT /api/config/:key` - Update config value (admin only)

## Coin Supply Periods
- `GET /api/periods` - Get all periods (admin only)
- `GET /api/periods/:id` - Get period by ID (admin only)
- `POST /api/periods` - Create new period (admin only)
- `PUT /api/periods/:id` - Update period (admin only)

## Google Sheets Sync
- `POST /api/sync/export` - Trigger manual export to Google Sheets (admin only)
- `POST /api/sync/import` - Trigger manual import from Google Sheets (admin only)
- `GET /api/sync/logs` - Get sync logs (admin only)
