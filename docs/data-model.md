# Data Model

## Users
```
Users(
    id PK,
    name VARCHAR(255),
    email VARCHAR(255) UQ,
    password_hash VARCHAR(255),
    role ENUM('employee', 'admin') DEFAULT 'employee',
    department_id FK (Departments.id) NULLABLE,
    current_balance INT DEFAULT 0 CHECK (current_balance >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Departments
```
Departments(
    id PK,
    name VARCHAR(255) UQ,
    parent_department_id FK (Departments.id) NULLABLE, -- For future hierarchy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Config
```
Config(
    key VARCHAR(100) PK,          -- e.g., 'FixedCoinPerTx', 'InitialAllocationPerUser', 'FeatureFlag_ShowRankings'
    value TEXT,                    -- Store as string, parse in application
    description TEXT NULLABLE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by FK (Users.id) NULLABLE
)
```

## CoinSupplyPeriods
```
CoinSupplyPeriods(                 -- Defines the evaluation periods
    id PK,
    period_name VARCHAR(50) UQ,    -- e.g., "2024-Q1"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_supply INT NULLABLE,     -- Overall supply for this period, if applicable globally beyond individual allocations
    created_by FK (Users.id) NULLABLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## PeriodBalances
```
PeriodBalances(
    user_id FK (Users.id),
    period_name VARCHAR(50),       -- e.g., "2024-Q1" (from CoinSupplyPeriods) or "2024-01" (for monthly GSheet)
    balance INT NOT NULL,
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, period_name, snapshot_date) -- snapshot_date allows multiple snapshots if needed
)
```

## Transactions
```
Transactions(
    id PK,
    sender_id FK (Users.id),
    recipient_id FK (Users.id),
    amount INT NOT NULL,
    reason TEXT NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_name VARCHAR(50) FK (CoinSupplyPeriods.period_name) NULLABLE -- Associates transaction with a supply period
)
```

## SyncLog
```
SyncLog(
    id PK,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_type ENUM('export_gsheet', 'import_users_gsheet', 'quarterly_reset') NOT NULL,
    status ENUM('success', 'failed', 'partial_success') NOT NULL,
    rows_processed INT NULLABLE,   -- covers exported or imported
    sheet_url VARCHAR(255) NULLABLE,
    details TEXT NULLABLE          -- For error messages or summary
)
```

## AuditLog_AdminActions
```
AuditLog_AdminActions(            -- For tracking important admin changes
    id PK,
    admin_user_id FK (Users.id),
    action_type VARCHAR(100),     -- e.g., 'USER_CREATE', 'CONFIG_UPDATE', 'BALANCE_ADJUST'
    target_entity_type VARCHAR(50) NULLABLE, -- e.g., 'User', 'Config', 'Department'
    target_entity_id VARCHAR(255) NULLABLE,
    old_value TEXT NULLABLE,
    new_value TEXT NULLABLE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULLABLE
)
```
