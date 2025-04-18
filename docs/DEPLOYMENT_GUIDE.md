# Deployment Guide
## Blockchain-Based Voting System

This guide provides detailed instructions for deploying the Blockchain-Based Voting System in various environments, from development to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Testing Environment Setup](#testing-environment-setup)
4. [Production Environment Setup](#production-environment-setup)
5. [Deployment Process](#deployment-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Hardware Requirements
- **Development**: 8GB RAM, 4 CPU cores, 50GB storage
- **Testing**: 16GB RAM, 8 CPU cores, 100GB storage
- **Production**: 32GB RAM, 16 CPU cores, 500GB storage (distributed across nodes)

### Software Requirements
- Docker and Docker Compose (latest stable version)
- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Git
- Hyperledger Fabric Prerequisites:
  - Go (v1.14.x or higher)
  - Python (v2.7.x)
  - Make

### Network Requirements
- Firewall access for the following ports:
  - 7050-7053 (Fabric orderer)
  - 7054 (Fabric CA)
  - 7051, 7061, 7071 (Fabric peers)
  - 3001-3003 (API servers)
  - 3000, 3004, 3005 (Frontend applications)
  - 6379 (Redis)
  - 5984 (CouchDB)

## Development Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AdvaitT17/Blockchain-Based-Voting-System.git
cd Blockchain-Based-Voting-System
```

### 2. Install Dependencies
```bash
# Install root-level dependencies
npm install

# Install backend dependencies
cd backend/identity-api && npm install
cd ../admin-api && npm install
cd ../voter-api && npm install
cd ../..

# Install frontend dependencies
cd frontend/admin-dashboard && npm install
cd ../voter-portal && npm install
cd ../polling-station && npm install
cd ../..

# Install test dependencies
cd tests/integration && npm install
cd ../api && npm install
cd ../e2e && npm install
cd ../performance && npm install
cd ../..
```

### 3. Configure Environment Variables
```bash
# Copy example environment files
cp .env.example .env
cp backend/identity-api/.env.example backend/identity-api/.env
cp backend/admin-api/.env.example backend/admin-api/.env
cp backend/voter-api/.env.example backend/voter-api/.env
```

Edit the `.env` files with appropriate values for your development environment.

### 4. Start Development Environment
```bash
# Start the blockchain network (with M1/M2 Mac compatibility)
./scripts/start-network.sh

# Deploy chaincode
./scripts/deploy-chaincode.sh

# Start backend services
cd backend/identity-api && npm run dev &
cd ../admin-api && npm run dev &
cd ../voter-api && npm run dev &
cd ../..

# Start frontend applications
cd frontend/admin-dashboard && npm start &
cd ../voter-portal && PORT=3004 npm start &
cd ../polling-station && PORT=3005 npm start &
cd ../..
```

## Testing Environment Setup

### 1. Configure Testing Environment
```bash
# Copy testing environment files
cp .env.test.example .env.test
cp backend/identity-api/.env.test.example backend/identity-api/.env.test
cp backend/admin-api/.env.test.example backend/admin-api/.env.test
cp backend/voter-api/.env.test.example backend/voter-api/.env.test
```

Edit the `.env.test` files with appropriate values for your testing environment.

### 2. Start Testing Environment
```bash
# Start the test network
./scripts/start-network.sh -t

# Deploy chaincode to test network
./scripts/deploy-chaincode.sh -t

# Start backend services in test mode
NODE_ENV=test cd backend/identity-api && npm start &
NODE_ENV=test cd ../admin-api && npm start &
NODE_ENV=test cd ../voter-api && npm start &
cd ../..
```

### 3. Run Tests
```bash
# Run the comprehensive test suite
./scripts/run-tests.sh
```

## Production Environment Setup

### 1. Server Preparation
Prepare the following servers:
- **Blockchain Nodes**: 4+ servers for Fabric network (2 for each organization)
- **API Servers**: 3+ servers for backend APIs (with load balancing)
- **Frontend Servers**: 2+ servers for frontend applications (with CDN)
- **Database Servers**: 2+ servers for Redis and other databases (with replication)
- **Monitoring Server**: 1 server for monitoring and logging

### 2. Security Setup
- Set up SSL certificates for all domains
- Configure firewalls to restrict access
- Set up VPN for administrative access
- Configure network security groups
- Implement intrusion detection systems

### 3. Configure Production Environment
```bash
# Copy production environment files
cp .env.prod.example .env.prod
cp backend/identity-api/.env.prod.example backend/identity-api/.env.prod
cp backend/admin-api/.env.prod.example backend/admin-api/.env.prod
cp backend/voter-api/.env.prod.example backend/voter-api/.env.prod
```

Edit the `.env.prod` files with appropriate values for your production environment.

### 4. Build Production Assets
```bash
# Build frontend applications
cd frontend/admin-dashboard && npm run build
cd ../voter-portal && npm run build
cd ../polling-station && npm run build
cd ../..
```

## Deployment Process

### 1. Automated Deployment Script
The system includes an automated deployment script that handles most of the deployment process:

```bash
# For development deployment
./scripts/deploy.sh -e dev

# For testing deployment
./scripts/deploy.sh -e test

# For production deployment
./scripts/deploy.sh -e prod
```

### 2. Manual Deployment Steps

#### Blockchain Network Deployment
```bash
# Generate crypto materials
./scripts/generate-crypto.sh

# Start the network
./scripts/start-network.sh

# Create channel
./scripts/create-channel.sh

# Deploy chaincode
./scripts/deploy-chaincode.sh
```

#### Backend API Deployment
```bash
# Deploy identity API
cd backend/identity-api
NODE_ENV=production npm install --production
NODE_ENV=production npm start &

# Deploy admin API
cd ../admin-api
NODE_ENV=production npm install --production
NODE_ENV=production npm start &

# Deploy voter API
cd ../voter-api
NODE_ENV=production npm install --production
NODE_ENV=production npm start &
cd ../..
```

#### Frontend Deployment
```bash
# Deploy admin dashboard
cd frontend/admin-dashboard
npm run build
# Copy build files to web server
cp -r build/* /var/www/admin-dashboard/

# Deploy voter portal
cd ../voter-portal
npm run build
# Copy build files to web server
cp -r build/* /var/www/voter-portal/

# Deploy polling station interface
cd ../polling-station
npm run build
# Copy build files to web server
cp -r build/* /var/www/polling-station/
cd ../..
```

### 3. Docker Deployment
For containerized deployment:

```bash
# Build Docker images
docker-compose build

# Start containers
docker-compose up -d
```

## Post-Deployment Verification

### 1. Health Check
Verify that all services are running correctly:

```bash
# Check blockchain network
docker ps | grep hyperledger

# Check API servers
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Check frontend applications
curl http://localhost:3000
curl http://localhost:3004
curl http://localhost:3005
```

### 2. Functional Verification
Run the verification script to ensure all components are functioning correctly:

```bash
./scripts/verify-deployment.sh
```

### 3. Performance Verification
Run performance tests to ensure the system meets performance requirements:

```bash
cd tests/performance
npm test
```

## Monitoring and Maintenance

### 1. Monitoring Setup
The system includes monitoring capabilities that should be configured post-deployment:

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d
```

Access the monitoring dashboard at `http://localhost:3000/grafana`.

### 2. Log Management
Configure log aggregation:

```bash
# Configure log rotation
./scripts/configure-logs.sh

# Set up log forwarding to centralized logging system
./scripts/setup-log-forwarding.sh
```

### 3. Backup Procedures
Set up regular backups:

```bash
# Configure automated backups
./scripts/setup-backups.sh

# Test backup restoration
./scripts/test-backup-restore.sh
```

## Troubleshooting

### Common Issues and Solutions

#### Blockchain Network Issues
- **Issue**: Peers not joining channel
  - **Solution**: Check crypto materials and channel configuration
  
- **Issue**: Chaincode installation fails
  - **Solution**: Verify chaincode path and dependencies

#### API Server Issues
- **Issue**: API server not starting
  - **Solution**: Check environment variables and dependencies
  
- **Issue**: API returning errors
  - **Solution**: Check logs and verify blockchain connectivity

#### Frontend Issues
- **Issue**: Frontend not loading
  - **Solution**: Verify build process and web server configuration
  
- **Issue**: Authentication failures
  - **Solution**: Check JWT configuration and API connectivity

### Diagnostic Commands
```bash
# Check blockchain network status
./scripts/check-network.sh

# Check API server logs
./scripts/check-api-logs.sh

# Check system resources
./scripts/check-resources.sh
```

## Rollback Procedures

### 1. Blockchain Rollback
```bash
# Stop the network
./scripts/stop-network.sh

# Restore from backup
./scripts/restore-blockchain.sh --backup-date YYYY-MM-DD

# Restart the network
./scripts/start-network.sh
```

### 2. API Rollback
```bash
# Stop API servers
./scripts/stop-apis.sh

# Restore API code from previous version
git checkout v1.x.x -- backend/

# Restart API servers
./scripts/start-apis.sh
```

### 3. Frontend Rollback
```bash
# Restore frontend code from previous version
git checkout v1.x.x -- frontend/

# Rebuild and redeploy frontend
./scripts/deploy-frontend.sh
```

---

## Special Notes for M1/M2 Mac Deployment

This system has been specifically designed to work with M1/M2 Macs using Rosetta 2 for Hyperledger Fabric compatibility. The following additional steps are necessary for M1/M2 Mac deployment:

1. **Install Rosetta 2** (if not already installed):
   ```bash
   softwareupdate --install-rosetta
   ```

2. **Use the M1-compatible scripts**:
   ```bash
   # Start network with M1 compatibility
   ./scripts/start-network.sh --m1
   
   # Deploy chaincode with M1 compatibility
   ./scripts/deploy-chaincode.sh --m1
   ```

3. **Docker Configuration**:
   Ensure Docker Desktop is configured to use Rosetta 2 for x86/amd64 emulation.

---

For additional assistance or to report issues, please contact the system administrator or refer to the project documentation.
