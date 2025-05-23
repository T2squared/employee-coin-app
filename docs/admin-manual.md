# Administrator User Manual

## Introduction

Welcome to the K-Point App Administrator Guide. This manual provides detailed instructions for administrators to manage the system, including user accounts, departments, system configurations, and Google Sheets integration.

## Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your admin email address and password
3. After login, you will be directed to the Admin Dashboard

## Admin Dashboard

The dashboard provides an overview of the system:

- Total coin supply for the current period
- Coins in circulation (sum of all user balances)
- Unallocated supply
- Number of active users
- Top recipients and givers
- Recent transactions

## User Management

### Viewing Users

1. Navigate to "Users" in the admin menu
2. View a list of all users with their details
3. Use filters to search by name, email, department, or status

### Creating a New User

1. Click "Add User" button
2. Fill in the required fields:
   - Name
   - Email
   - Department (select from dropdown)
   - Role (Employee or Admin)
   - Initial balance (optional)
3. Click "Create User"
4. A temporary password will be generated and can be sent to the user

### Editing a User

1. Find the user in the list
2. Click the "Edit" button
3. Update the user's information
4. Click "Save Changes"

### Deactivating a User

1. Find the user in the list
2. Click the "Deactivate" button
3. Confirm the action

## Department Management

### Viewing Departments

1. Navigate to "Departments" in the admin menu
2. View a list of all departments

### Creating a New Department

1. Click "Add Department" button
2. Enter the department name
3. Select a parent department (optional, for hierarchy)
4. Click "Create Department"

### Editing a Department

1. Find the department in the list
2. Click the "Edit" button
3. Update the department information
4. Click "Save Changes"

## System Configuration

### Viewing Current Configuration

1. Navigate to "Configuration" in the admin menu
2. View all system parameters and their current values

### Updating Configuration

1. Find the parameter you want to change
2. Click the "Edit" button
3. Enter the new value
4. Click "Save"

### Key Configuration Parameters

- **FixedCoinPerTx**: Number of coins per transaction (default: 3)
- **MaxTransactionsPerDay**: Maximum transactions per user per day (default: 3)
- **InitialAllocationPerUser**: Coins allocated to each user at the start of a quarter (default: 20)
- **QuarterlyResetDates**: Dates for quarterly reset (default: Mar 31, Jun 30, Sep 30, Dec 31)
- **FeatureFlag_ShowRankings**: Toggle visibility of ranking features (default: true)

## Transaction Explorer

1. Navigate to "Transactions" in the admin menu
2. View all transactions in the system
3. Use filters to search by:
   - Sender
   - Recipient
   - Date range
   - Amount
   - Keywords in reason
4. Export filtered transactions to CSV

## Google Sheets Sync Management

### Viewing Sync Status

1. Navigate to "Google Sheets Sync" in the admin menu
2. View the last sync status and history

### Triggering Manual Sync

1. Click "Trigger Manual Sync" button
2. Select the sync type:
   - Export data to Google Sheets
   - Import users from Google Sheets
   - Both
3. Click "Start Sync"
4. Monitor the progress and status

### Configuring Google Sheets Integration

1. Enter the Google Spreadsheet ID
2. Configure sheet names for:
   - Users
   - Balances
   - Transactions
   - User Import (optional)
3. Click "Save Configuration"

## Period Management

### Creating a New Period

1. Navigate to "Configuration" > "Periods" in the admin menu
2. Click "Add Period" button
3. Enter:
   - Period name (e.g., "2024-Q1")
   - Start date
   - End date
   - Total supply (optional)
4. Click "Create Period"

### Managing Period Transitions

1. When a period ends, the system will automatically:
   - Take a snapshot of all user balances
   - Reset balances to zero
   - Allocate new coins to active users
2. You can manually trigger this process by clicking "End Current Period" in the Periods section

## Reports

1. Navigate to "Reports" in the admin menu
2. Select the report type:
   - User balances
   - Department statistics
   - Transaction volume
   - Custom report
3. Set parameters (date range, filters, etc.)
4. Click "Generate Report"
5. View the report or export to CSV/Excel

## System Maintenance

### Viewing Logs

1. Navigate to "System" > "Logs" in the admin menu
2. View system logs, including:
   - User actions
   - System events
   - Errors
   - Sync operations

### Backup and Restore

1. Navigate to "System" > "Backup" in the admin menu
2. Click "Create Backup" to backup the database
3. To restore, select a backup file and click "Restore"

## Troubleshooting

### Common Issues

1. **Sync Failures**:
   - Check Google Sheets API credentials
   - Verify spreadsheet permissions
   - Check network connectivity

2. **User Balance Issues**:
   - Verify transaction history
   - Check for period transition issues
   - Manually adjust balance if necessary

3. **Performance Issues**:
   - Check database connection
   - Monitor system resources
   - Consider scaling options if user base grows

For technical support, contact the system administrator or development team.
