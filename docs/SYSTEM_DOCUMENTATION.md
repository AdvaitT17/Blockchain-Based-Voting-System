# Blockchain-Based Voting System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Installation](#installation)
5. [Deployment](#deployment)
6. [Usage Guide](#usage-guide)
7. [API Documentation](#api-documentation)
8. [Security Features](#security-features)
9. [Troubleshooting](#troubleshooting)
10. [FAQs](#faqs)

## System Overview

The Blockchain-Based Voting System is a secure, transparent, and tamper-proof electronic voting solution built on Hyperledger Fabric blockchain technology. The system enables secure voter authentication, transparent vote casting, and immutable recording of votes, ensuring the integrity of the electoral process.

### Key Features

- **Secure Authentication**: Multi-factor voter authentication using Voter ID and Aadhar verification
- **Immutable Vote Records**: All votes are recorded on the blockchain, ensuring they cannot be altered
- **Transparent Process**: The entire voting process is transparent and verifiable
- **Real-time Results**: Election results are calculated and displayed in real-time
- **Audit Trail**: Complete audit trail of all voting activities
- **Multiple Interfaces**: Separate interfaces for voters, polling officials, and administrators

## Architecture

The system follows a modular architecture with the following layers:

1. **Blockchain Layer**: Hyperledger Fabric network with custom chaincode
2. **API Layer**: RESTful API servers for different functionalities
3. **Frontend Layer**: Web applications for different user roles
4. **Security Layer**: Authentication, authorization, and encryption mechanisms

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Applications                         │
├───────────────────┬───────────────────────┬─────────────────────────┤
│  Admin Dashboard  │     Voter Portal      │  Polling Station UI     │
└────────┬──────────┴──────────┬────────────┴────────────┬────────────┘
         │                     │                         │
         ▼                     ▼                         ▼
┌────────────────┐   ┌─────────────────┐   ┌───────────────────────┐
│   Admin API    │   │    Voter API    │   │     Identity API      │
└────────┬───────┘   └────────┬────────┘   └───────────┬───────────┘
         │                    │                        │
         └────────────────────┼────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Hyperledger Fabric Network                     │
├─────────────────────────────┬───────────────────────────────────────┤
│      Voting Chaincode       │         Identity Chaincode            │
└─────────────────────────────┴───────────────────────────────────────┘
```

## Components

### Blockchain Components

1. **Hyperledger Fabric Network**:
   - Organizations: Election Commission, Government
   - Peers, Orderers, and Certificate Authorities
   - Channels for secure communication

2. **Chaincodes**:
   - **Voting Chaincode**: Manages elections, candidates, and votes
   - **Identity Chaincode**: Manages voter registration and verification

### Backend Components

1. **Identity API**: Handles voter registration and verification
2. **Admin API**: Manages elections, candidates, and administrative functions
3. **Voter API**: Handles vote casting and voter-specific operations

### Frontend Components

1. **Admin Dashboard**: Interface for election administrators
2. **Voter Portal**: Interface for voters to view elections and cast votes
3. **Polling Station Interface**: Interface for polling officials to verify voters and manage the voting process

## Installation

### Prerequisites

- Node.js (v14+)
- Docker and Docker Compose
- Go (for chaincode development)
- PM2 (for process management)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdvaitT17/Blockchain-Based-Voting-System.git
   cd Blockchain-Based-Voting-System
   ```

2. **Install dependencies**:
   ```bash
   # Install global dependencies
   npm install -g pm2

   # Install backend dependencies
   cd backend
   npm install
   cd ..

   # Install frontend dependencies
   cd frontend/admin-dashboard
   npm install
   cd ../voter-portal
   npm install
   cd ../polling-station
   npm install
   cd ../../
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env` in each component directory
   - Update the variables according to your environment

## Deployment

### Automated Deployment

Use the provided deployment script to deploy the entire system:

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Deploy the system
./scripts/deploy.sh

# Deploy and run tests
./scripts/deploy.sh --test

# Clean up previous deployment
./scripts/deploy.sh --cleanup
```

### Manual Deployment

#### 1. Start the Blockchain Network

```bash
cd blockchain/scripts
./generate-crypto.sh
./start-network.sh
./create-channel.sh
./deploy-chaincode.sh
cd ../../
```

#### 2. Start Backend APIs

```bash
# Start Identity API
cd backend/identity-api
pm2 start server.js --name identity-api
cd ../..

# Start Admin API
cd backend/admin-api
pm2 start server.js --name admin-api
cd ../..

# Start Voter API
cd backend/voter-api
pm2 start server.js --name voter-api
cd ../..
```

#### 3. Build and Deploy Frontend Applications

```bash
# Build and serve Admin Dashboard
cd frontend/admin-dashboard
npm run build
pm2 serve build 3000 --name admin-dashboard
cd ../..

# Build and serve Voter Portal
cd frontend/voter-portal
npm run build
pm2 serve build 3005 --name voter-portal
cd ../..

# Build and serve Polling Station Interface
cd frontend/polling-station
npm run build
pm2 serve build 3006 --name polling-station
cd ../..
```

## Usage Guide

### Admin Dashboard

The Admin Dashboard is used by election administrators to manage the entire election process.

#### Key Features:

1. **Election Management**:
   - Create, edit, and delete elections
   - Set election parameters (start time, end time, constituencies)
   - Activate and deactivate elections

2. **Candidate Management**:
   - Add, edit, and remove candidates
   - Assign candidates to elections and constituencies

3. **Polling Station Management**:
   - Create and manage polling stations
   - Assign polling stations to constituencies

4. **Results and Analytics**:
   - View real-time election results
   - Generate reports and analytics

#### Access:
- URL: `http://localhost:3000`
- Default credentials: Username: `admin`, Password: `adminpassword`

### Voter Portal

The Voter Portal allows voters to view elections and cast their votes securely.

#### Key Features:

1. **Voter Authentication**:
   - Login using Voter ID and Aadhar number
   - Secure multi-factor authentication

2. **Election Viewing**:
   - View active elections
   - See election details and candidates

3. **Vote Casting**:
   - Cast votes in active elections
   - Receive confirmation of vote submission

#### Access:
- URL: `http://localhost:3005`
- Authentication: Voter ID and Aadhar number

### Polling Station Interface

The Polling Station Interface is used by polling officials to verify voters and facilitate the voting process.

#### Key Features:

1. **Voter Verification**:
   - Verify voter identity using Voter ID and Aadhar number
   - Check voter eligibility

2. **Voting Facilitation**:
   - Enable verified voters to cast votes
   - Monitor voting progress

3. **Statistics and Reporting**:
   - View real-time statistics for the polling station
   - Generate reports on voter turnout

#### Access:
- URL: `http://localhost:3006`
- Authentication: Polling Station ID and password

## API Documentation

### Identity API

Base URL: `http://localhost:3002/api`

#### Endpoints:

- `POST /voters/register`: Register a new voter
- `POST /voters/verify`: Verify voter credentials
- `GET /voters/:voterId`: Get voter information
- `GET /voters/:voterId/status`: Check if a voter has voted

### Admin API

Base URL: `http://localhost:3001/api`

#### Endpoints:

- `POST /auth/login`: Admin login
- `POST /elections`: Create a new election
- `GET /elections`: Get all elections
- `GET /elections/:electionId`: Get election details
- `PUT /elections/:electionId`: Update election
- `DELETE /elections/:electionId`: Delete election
- `PUT /elections/:electionId/activate`: Activate election
- `PUT /elections/:electionId/end`: End election
- `GET /elections/:electionId/results`: Get election results
- `POST /candidates`: Add a candidate
- `GET /candidates`: Get all candidates
- `GET /candidates/:candidateId`: Get candidate details
- `PUT /candidates/:candidateId`: Update candidate
- `DELETE /candidates/:candidateId`: Delete candidate
- `POST /polling-stations`: Add a polling station
- `GET /polling-stations`: Get all polling stations
- `GET /polling-stations/:stationId`: Get polling station details
- `PUT /polling-stations/:stationId`: Update polling station
- `DELETE /polling-stations/:stationId`: Delete polling station

### Voter API

Base URL: `http://localhost:3003/api`

#### Endpoints:

- `POST /voters/verify`: Verify voter credentials
- `GET /voters/:voterId/status`: Check if a voter has voted
- `POST /voting/cast`: Cast a vote
- `GET /elections/active`: Get active elections
- `GET /elections/:electionId`: Get election details
- `GET /candidates/election/:electionId`: Get candidates for an election
- `GET /candidates/constituency/:constituencyId`: Get candidates for a constituency
- `GET /polling-stations/:stationId/stats`: Get polling station statistics

## Security Features

The Blockchain-Based Voting System implements multiple layers of security:

1. **Blockchain Security**:
   - Immutable ledger for vote records
   - Consensus mechanism for transaction validation
   - Private channels for data isolation

2. **Authentication Security**:
   - Multi-factor authentication for voters
   - JWT-based authentication for APIs
   - Role-based access control

3. **Data Security**:
   - Encryption of sensitive data
   - Hashing of voter credentials
   - Secure storage of private keys

4. **Network Security**:
   - HTTPS for all communications
   - API rate limiting
   - Input validation and sanitization

5. **Audit and Compliance**:
   - Complete audit trail of all actions
   - Logging of all system activities
   - Regular security assessments

## Troubleshooting

### Common Issues and Solutions

1. **Blockchain Network Issues**:
   - **Issue**: Network fails to start
   - **Solution**: Check Docker status, ensure ports are available, and verify crypto materials

2. **API Connection Issues**:
   - **Issue**: Frontend cannot connect to APIs
   - **Solution**: Verify API servers are running, check CORS settings, and confirm environment variables

3. **Authentication Issues**:
   - **Issue**: Unable to log in
   - **Solution**: Verify credentials, check if the user exists, and ensure the authentication service is running

4. **Vote Casting Issues**:
   - **Issue**: Vote not being recorded
   - **Solution**: Check blockchain connection, verify voter eligibility, and ensure the election is active

### Logging and Debugging

- Backend logs: Check PM2 logs using `pm2 logs`
- Blockchain logs: Check Docker logs using `docker logs <container_name>`
- Frontend logs: Check browser console for errors

## FAQs

### General Questions

1. **Q: How secure is the blockchain voting system?**
   - A: The system uses Hyperledger Fabric, a permissioned blockchain, with multiple security layers including encryption, hashing, and multi-factor authentication.

2. **Q: Can votes be changed or deleted?**
   - A: No, once a vote is recorded on the blockchain, it cannot be altered or deleted due to the immutable nature of blockchain technology.

3. **Q: How is voter privacy maintained?**
   - A: Voter identities are hashed and the system uses a separation of concerns to ensure that while votes are verifiable, they cannot be traced back to individual voters.

### Technical Questions

1. **Q: What blockchain platform is used?**
   - A: The system uses Hyperledger Fabric, a permissioned blockchain framework.

2. **Q: How are smart contracts implemented?**
   - A: Smart contracts (chaincode) are implemented in Go and deployed to the Hyperledger Fabric network.

3. **Q: How does the system handle network failures?**
   - A: The system implements retry mechanisms, transaction queuing, and state recovery to handle network failures gracefully.

4. **Q: Is the system compatible with M1/M2 Macs?**
   - A: Yes, the system is designed to work on M1/M2 Macs using Rosetta 2 for compatibility with Docker containers.

---

## Support and Contact

For additional support or questions, please contact:

- **Email**: support@blockchain-voting-system.com
- **GitHub Issues**: [https://github.com/AdvaitT17/Blockchain-Based-Voting-System/issues](https://github.com/AdvaitT17/Blockchain-Based-Voting-System/issues)

---

*Last Updated: April 18, 2025*
