# Blockchain-Based Voting System

A secure, transparent, and privacy-preserving e-voting system using Hyperledger Fabric blockchain technology, integrated with Indian identity verification systems (Aadhar and Voter ID).

## System Architecture

This project implements a complete blockchain-based voting system with the following components:

1. **Hyperledger Fabric Network** - A permissioned blockchain providing the secure, immutable foundation
2. **Smart Contracts** - Chaincode for voting logic and processes
3. **Backend Services** - APIs for identity verification and system management
4. **Frontend Applications** - Interfaces for voters and administrators

## Key Features

- Secure voter authentication using Aadhar and Voter ID verification
- Privacy-preserving voting using zero-knowledge proofs
- Transparent yet private ballot casting
- Verifiable vote counting and results
- End-to-end audit capabilities
- Protection against common voting vulnerabilities

## Prerequisites

- Docker and Docker Compose
- Node.js (v14+)
- Go (for chaincode development)
- Hyperledger Fabric binaries

### Special Note for M1/M2 Mac Users
Hyperledger Fabric does not currently have native ARM support. However, you can run the system on Apple Silicon Macs using Rosetta 2 to run amd64 architecture images and binaries. The setup scripts in this repository handle the necessary platform configurations automatically.

## Repository Structure

- `/blockchain` - Hyperledger Fabric network configuration
  - `/config` - Channel and organization configurations
  - `/scripts` - Network startup and management scripts
- `/chaincode` - Smart contracts for the voting system
  - `/voting` - Main voting chaincode
  - `/identity` - Identity management chaincode
- `/backend` - API servers and services
  - `/identity-api` - Aadhar and Voter ID verification
  - `/admin-api` - Administrative functions
  - `/voter-api` - Voter interface API
- `/frontend` - Web interfaces for various user roles
  - `/admin` - Administrative dashboard
  - `/voter` - Voter portal
  - `/polling` - Polling station interface
- `/scripts` - Utility scripts for setup and deployment
- `/docs` - Documentation

## Getting Started

### 1. Install Prerequisites

#### For macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Install Node.js
brew install node@14

# Install Go
brew install golang

# Install jq (for scripts)
brew install jq
```

#### For M1/M2 Macs:
Ensure Rosetta 2 is installed:
```bash
softwareupdate --install-rosetta
```

### 2. Clone the repository
```bash
git clone https://github.com/AdvaitT17/blockchain-voting-system.git
cd blockchain-voting-system
```

### 3. Bootstrap the network
```bash
# Download Fabric binaries & Docker images
./scripts/bootstrap.sh
```

### 4. Start the Fabric network
```bash
# Launch Hyperledger Fabric network
./blockchain/scripts/start-network-new.sh
```

### 5. Deploy chaincode
```bash
# Package & activate chaincode
./blockchain/scripts/deploy-chaincode.sh
```

### 6. Start backend servers
```bash
cd backend
npm install
npm run start
```

### 7. Start frontend applications
```bash
cd frontend
npm install
npm run start
```

## Documentation

Comprehensive guides are available in the `docs/` folder:
- `docs/DEPLOYMENT_GUIDE.md` – full setup & deployment
- `docs/SYSTEM_DOCUMENTATION.md` – architecture & components
- `docs/SECURITY_AUDIT.md` – security recommendations
- `docs/PERFORMANCE_OPTIMIZATION.md`
- …

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

Advait Thakur
