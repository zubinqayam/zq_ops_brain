# ZQ Ops Brain

**Sovereign AI Operations Platform**

[![Version](https://img.shields.io/badge/version-1.0.0--Dv1-rose)](https://github.com/yourrepo/zq-ops-brain)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/yourrepo/zq-ops-brain/mobile-release.yml)](https://github.com/yourrepo/zq-ops-brain/actions)

---

## Overview

ZQ Ops Brain is a chat-first, sovereign AI operations platform designed for industrial-grade task management, project organization, and secure API key vaulting. It combines military-grade security with intuitive voice-driven interfaces.

### Key Features

- **Chat-Driven Operations**: Natural language task creation and management
- **Voice Commands**: Hands-free operation with speech-to-text parsing
- **Project Hierarchy**: Unlimited nested folders for complex organizations
- **Keyhole Vault**: Hardware-bound encrypted API key storage
- **Budget Ledger**: Atomic transaction tracking with cost controls
- **Offline-First**: Full functionality without internet connectivity
- **Cross-Platform**: Android (.apk) and Windows (.exe) support

### Security Features

- **ed25519 Config Signing**: Cryptographic verification of all configurations
- **SQLCipher Encryption**: AES-256 page-level database encryption
- **HWID Binding**: Hardware-locked to prevent unauthorized copies
- **Zero-Knowledge Audit**: Compliance hashing without data exposure
- **No-Log Policy**: API keys never written to logs

---

## Quick Start

### Prerequisites

- Node.js 20+
- Rust 1.75+
- Android SDK (for mobile builds)
- Windows SDK (for desktop builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourrepo/zq-ops-brain.git
cd zq-ops-brain

# Install dependencies
npm install

# Copy and configure
cp deployment/config.zq.template config.zq
# Edit config.zq with your settings

# Sign configuration
./deployment/build.sh sign

# Build for all platforms
./deployment/build.sh all
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test
cd src-tauri && cargo test

# Build for specific platform
npm run tauri android build
npm run tauri build
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ZQ Ops Brain                            │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                              │
│  ├── Chat Interface                                         │
│  ├── Project Navigator                                      │
│  ├── Task Manager                                           │
│  └── Settings / Keyhole Vault                               │
├─────────────────────────────────────────────────────────────┤
│  Governance Layer (Rust/Tauri)                              │
│  ├── Pre-flight Gatekeeper                                  │
│  ├── ed25519 Verifier                                       │
│  ├── Budget Ledger                                          │
│  └── SQLCipher Engine                                       │
├─────────────────────────────────────────────────────────────┤
│  Sidecars                                                   │
│  ├── Node.js Orchestrator                                   │
│  └── Python Executor                                        │
├─────────────────────────────────────────────────────────────┤
│  Memory Layer                                               │
│  └── SQLite + SQLCipher                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage

### Chat Commands

| Command | Example | Action |
|---------|---------|--------|
| Create Task | "Create task: Verify clinics tomorrow 9am high priority" | Creates new task |
| Create Project | "Create project: Sohar Industrial" | Creates project folder |
| Set Reminder | "Remind me to call supplier in 2 hours" | Sets notification |
| Schedule Event | "Schedule meeting Friday 11am" | Adds calendar event |

### Voice Commands

Tap the microphone button and speak naturally:
- "Add task review solar panel specs low priority"
- "Create subfolder for USP Lab Reports"
- "Remind me about the clinic visit tomorrow morning"

### Budget System

Every operation has a cost in OMR:
- Create Task: 0.010 OMR
- Update Task: 0.005 OMR
- Create Project: 0.015 OMR
- Execute Script: 0.050 OMR

Daily limits prevent runaway spending.

---

## Deployment

### GitHub Actions

The repository includes a complete CI/CD pipeline:

1. **Quality Checks**: Formatting, linting, type checking
2. **Security Audit**: Dependency vulnerability scanning
3. **Build**: Android APK and Windows EXE
4. **Sign**: Code signing with stored certificates
5. **Release**: Automatic GitHub release creation

### Manual Deployment

```bash
# Build Android
./deployment/build.sh android

# Build Desktop
./deployment/build.sh desktop

# Build everything
./deployment/build.sh all
```

---

## Configuration

Edit `config.zq` to customize:

```toml
[security]
public_key = "your-ed25519-public-key"
encryption_enabled = true
hwid_binding = true

[budget]
daily_limit = 5.000

[features]
chatbot_enabled = true
voice_commands = true
offline_mode = true
```

Sign the configuration:
```bash
./deployment/build.sh sign
```

---

## API Documentation

### Task Operations

```typescript
// Create task
invoke('create_task', {
  title: string,
  description?: string,
  project_id?: string,
  priority: 'low' | 'medium' | 'high',
  due_date?: string
})

// Update task
invoke('update_task', {
  id: string,
  updates: Partial<Task>
})

// Complete task
invoke('complete_task', { id: string })
```

### Project Operations

```typescript
// Create project
invoke('create_project', {
  name: string,
  parent_id?: string
})

// Get project tree
invoke('get_projects')
```

### Chat Operations

```typescript
// Parse command
invoke('parse_command', { text: string })

// Send message
invoke('send_message', {
  project_id: string,
  content: string
})
```

---

## Security

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Config tampering | ed25519 signatures |
| Database theft | SQLCipher encryption |
| Key extraction | Hardware binding |
| API key leakage | No-log policy, masking |
| Unauthorized copies | HWID locking |

### Compliance

- Zero-knowledge audit trails
- Daily Merkle root proofs
- Exportable compliance packages

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Development Guidelines

- Follow Rust naming conventions
- Use TypeScript strict mode
- Write tests for new features
- Update documentation

---

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

---

## Support

- Documentation: [docs.zq-ai.dev](https://docs.zq-ai.dev)
- Issues: [GitHub Issues](https://github.com/yourrepo/zq-ops-brain/issues)
- Email: support@zq-ai.dev

---

**ZQ AI Logic\u2122** - Sovereign Computing for the Modern Age
