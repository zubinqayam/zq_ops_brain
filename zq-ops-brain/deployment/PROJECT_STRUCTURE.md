# ZQ Ops Brain - Project Structure

This document outlines the complete project structure for the ZQ Ops Brain deployment.

## Directory Layout

```
zq-ops-brain/
├── .github/
│   └── workflows/
│       └── mobile-release.yml      # CI/CD pipeline
├── android/                         # Android-specific code
│   └── app/
│       ├── build.gradle
│       └── src/
├── app/                             # Frontend React application
│   ├── components/
│   │   ├── Chat/
│   │   ├── Projects/
│   │   ├── Tasks/
│   │   └── Voice/
│   ├── screens/
│   │   ├── TodayScreen.tsx
│   │   ├── ProjectsScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── hooks/
│   ├── types/
│   └── config.ts
├── src-tauri/                       # Rust governance core
│   ├── src/
│   │   ├── main.rs
│   │   ├── budget/
│   │   │   ├── ledger.rs
│   │   │   └── preflight.rs
│   │   ├── security/
│   │   │   ├── ed25519.rs
│   │   │   ├── hwid.rs
│   │   │   └── sqlcipher.rs
│   │   ├── ops/
│   │   │   ├── parser.rs
│   │   │   └── executor.rs
│   │   └── commands.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── sidecars/                        # Backend executors
│   ├── node/
│   │   ├── package.json
│   │   └── src/
│   │       └── orchestrator.js
│   └── python/
│       ├── requirements.txt
│       └── src/
│           └── drafting.py
├── resources/
│   ├── config.zq                    # Signed configuration
│   └── icons/
├── docs/                            # Documentation
├── deployment/                      # Deployment configs
│   ├── mobile-release.yml
│   ├── config.zq.template
│   └── build.sh
└── tests/                           # Test suites
    ├── unit/
    ├── integration/
    └── e2e/
```

## Core Components

### 1. Frontend (React + TypeScript)
- **Location**: `/app`
- **Stack**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Responsibilities**:
  - User interface rendering
  - Chat interface
  - Task/Project management views
  - Voice command UI
  - Settings/Keyhole vault

### 2. Governance Layer (Rust/Tauri)
- **Location**: `/src-tauri`
- **Responsibilities**:
  - ed25519 signature verification
  - Budget ledger management
  - SQLCipher encryption
  - HWID-based key derivation
  - Pre-flight operation validation

### 3. Sidecars (Node.js/Python)
- **Location**: `/sidecars`
- **Responsibilities**:
  - Background task execution
  - AI provider integration
  - File system operations
  - Script execution

### 4. Android Native
- **Location**: `/android`
- **Responsibilities**:
  - Android-specific optimizations
  - WorkManager for background tasks
  - Notification handling
  - Keystore integration

## Database Schema

### SQLite with SQLCipher

```sql
-- Tasks table
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT REFERENCES projects(id),
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'todo',
    due_datetime INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Projects table (supports nesting)
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES projects(id),
    created_at INTEGER DEFAULT (unixepoch())
);

-- Schedule items
CREATE TABLE schedule_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_datetime INTEGER,
    end_datetime INTEGER,
    linked_task_id TEXT REFERENCES tasks(id),
    project_id TEXT REFERENCES projects(id)
);

-- Reminders
CREATE TABLE reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    trigger_time INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
);

-- Chat messages
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    action_json TEXT,
    action_status TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- API Keys (Keyhole vault)
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Budget ledger
CREATE TABLE budget_ledger (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'reserved',
    task_id TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    committed_at INTEGER
);

-- Compliance hashes
CREATE TABLE compliance_hashes (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);
```

## Configuration

### config.zq Structure

```toml
[application]
name = "ZQ Ops Brain"
version = "1.0.0-Dv1"

[security]
public_key = "..."
encryption_enabled = true
hwid_binding = true

[features]
chatbot_enabled = true
voice_commands = true
offline_mode = true

[budget]
daily_limit = 5.000

[task_costs]
create_task = 0.010
update_task = 0.005
```

## Build Outputs

### Android
- **Output**: `src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk`
- **Target**: `aarch64-linux-android`
- **Format**: Signed APK

### Desktop (Windows)
- **Output**: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
- **Formats**: `.exe`, `.msi`, `.nsis`
- **Target**: `x86_64-pc-windows-msvc`

## Security Considerations

1. **Config Signing**: All config.zq files must be signed with ed25519
2. **Database Encryption**: SQLCipher with hardware-bound keys
3. **API Key Storage**: AES-256 encrypted, never logged
4. **Build Signing**: APK and EXE must be code-signed
5. **Update Verification**: Manifest signatures validated before install
