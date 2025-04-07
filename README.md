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

## Repository Structure

- `/blockchain` - Hyperledger Fabric network configuration
- `/chaincode` - Smart contracts for the voting system
- `/backend` - API servers and services
- `/frontend` - Web interfaces for various user roles
- `/scripts` - Utility scripts for setup and deployment

## Getting Started

1. Clone the repository
2. Run `./scripts/bootstrap.sh` to set up dependencies
3. Start the network with `./scripts/start-network.sh`
4. Deploy chaincode with `./scripts/deploy-chaincode.sh`
5. Start backend servers with `npm run start:backend`
6. Start frontend applications with `npm run start:frontend`

## Documentation

Detailed documentation can be found in the `/docs` directory.
