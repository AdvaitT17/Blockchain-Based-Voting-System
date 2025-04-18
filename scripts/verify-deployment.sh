#!/bin/bash

# Deployment Verification Script for Blockchain-Based Voting System
# Phase 7: Final Verification

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$BASE_DIR"

echo -e "${BLUE}Blockchain-Based Voting System - Deployment Verification${NC}"
echo -e "${BLUE}======================================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to verify a component
verify_component() {
  local component="$1"
  local verification_command="$2"
  local success_message="$3"
  local failure_message="$4"
  
  echo -e "\n${YELLOW}Verifying ${component}...${NC}"
  
  if eval "$verification_command"; then
    echo -e "${GREEN}✓ $success_message${NC}"
    return 0
  else
    echo -e "${RED}✗ $failure_message${NC}"
    return 1
  fi
}

# Create results directory
RESULTS_DIR="$BASE_DIR/verification-results"
mkdir -p "$RESULTS_DIR"
RESULTS_FILE="$RESULTS_DIR/verification-$(date +%Y%m%d%H%M%S).log"

# Start logging
exec > >(tee -a "$RESULTS_FILE") 2>&1

echo "Verification started at $(date)"
echo "======================================================="

# 1. Verify Docker and required tools
echo -e "\n${YELLOW}Checking required tools...${NC}"
required_tools=("docker" "docker-compose" "node" "npm" "curl" "jq")
missing_tools=()

for tool in "${required_tools[@]}"; do
  if command_exists "$tool"; then
    echo -e "${GREEN}✓ $tool is installed${NC}"
  else
    echo -e "${RED}✗ $tool is not installed${NC}"
    missing_tools+=("$tool")
  fi
done

if [ ${#missing_tools[@]} -gt 0 ]; then
  echo -e "${RED}Please install the missing tools before proceeding: ${missing_tools[*]}${NC}"
  exit 1
fi

# 2. Verify Docker is running
verify_component "Docker service" \
  "docker info > /dev/null 2>&1" \
  "Docker service is running" \
  "Docker service is not running. Please start Docker and try again."

# 3. Verify Blockchain Network
verify_component "Blockchain network containers" \
  "docker ps | grep -q 'hyperledger/fabric'" \
  "Blockchain network containers are running" \
  "Blockchain network containers are not running. Please start the network with ./scripts/start-network.sh"

# 4. Verify Chaincode Deployment
verify_component "Chaincode deployment" \
  "docker ps | grep -q 'dev-peer0.*votingChaincode'" \
  "Chaincode is deployed and running" \
  "Chaincode is not deployed or not running. Please deploy chaincode with ./scripts/deploy-chaincode.sh"

# 5. Verify Backend API Servers
echo -e "\n${YELLOW}Verifying API servers...${NC}"

# Identity API
verify_component "Identity API" \
  "curl -s http://localhost:3001/health | grep -q 'UP'" \
  "Identity API is running and healthy" \
  "Identity API is not running or has issues. Check logs and restart if needed."

# Admin API
verify_component "Admin API" \
  "curl -s http://localhost:3002/health | grep -q 'UP'" \
  "Admin API is running and healthy" \
  "Admin API is not running or has issues. Check logs and restart if needed."

# Voter API
verify_component "Voter API" \
  "curl -s http://localhost:3003/health | grep -q 'UP'" \
  "Voter API is running and healthy" \
  "Voter API is not running or has issues. Check logs and restart if needed."

# 6. Verify Frontend Applications
echo -e "\n${YELLOW}Verifying frontend applications...${NC}"

# Admin Dashboard
verify_component "Admin Dashboard" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q '200'" \
  "Admin Dashboard is accessible" \
  "Admin Dashboard is not accessible. Check if it's running and properly configured."

# Voter Portal
verify_component "Voter Portal" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:3004 | grep -q '200'" \
  "Voter Portal is accessible" \
  "Voter Portal is not accessible. Check if it's running and properly configured."

# Polling Station
verify_component "Polling Station Interface" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:3005 | grep -q '200'" \
  "Polling Station Interface is accessible" \
  "Polling Station Interface is not accessible. Check if it's running and properly configured."

# 7. Verify Redis Cache
if command_exists "redis-cli"; then
  verify_component "Redis Cache" \
    "redis-cli ping | grep -q 'PONG'" \
    "Redis Cache is running" \
    "Redis Cache is not running. Check Redis service and configuration."
else
  echo -e "${YELLOW}Redis CLI not found. Skipping Redis verification.${NC}"
fi

# 8. Verify API Functionality
echo -e "\n${YELLOW}Verifying API functionality...${NC}"

# Test Identity API endpoints
verify_component "Identity API endpoints" \
  "curl -s -X GET http://localhost:3001/api/health | grep -q 'success'" \
  "Identity API endpoints are functioning" \
  "Identity API endpoints are not functioning correctly. Check API implementation and logs."

# Test Admin API endpoints
verify_component "Admin API endpoints" \
  "curl -s -X GET http://localhost:3002/api/health | grep -q 'success'" \
  "Admin API endpoints are functioning" \
  "Admin API endpoints are not functioning correctly. Check API implementation and logs."

# Test Voter API endpoints
verify_component "Voter API endpoints" \
  "curl -s -X GET http://localhost:3003/api/health | grep -q 'success'" \
  "Voter API endpoints are functioning" \
  "Voter API endpoints are not functioning correctly. Check API implementation and logs."

# 9. Verify Blockchain Network Connectivity
echo -e "\n${YELLOW}Verifying blockchain network connectivity...${NC}"

# Create a temporary test script
TEST_SCRIPT=$(mktemp)
cat > "$TEST_SCRIPT" << 'EOF'
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Load connection profile
    const ccpPath = path.resolve(__dirname, 'blockchain', 'connection-profile.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities
    const walletPath = path.join(__dirname, 'blockchain', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if admin identity exists
    const identity = await wallet.get('admin');
    if (!identity) {
      console.log('Admin identity not found in the wallet');
      process.exit(1);
    }

    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(ccp, { 
      wallet, 
      identity: 'admin', 
      discovery: { enabled: true, asLocalhost: true } 
    });

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork('votingchannel');

    // Get the contract from the network
    const contract = network.getContract('votingChaincode');

    // Test query
    const result = await contract.evaluateTransaction('GetVersion');
    console.log(`Chaincode version: ${result.toString()}`);
    
    // Disconnect from the gateway
    await gateway.disconnect();
    
    console.log('Blockchain connectivity test successful');
    process.exit(0);
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    process.exit(1);
  }
}

main();
EOF

verify_component "Blockchain connectivity" \
  "cd $BASE_DIR && node $TEST_SCRIPT" \
  "Blockchain network connectivity verified" \
  "Failed to connect to blockchain network. Check network configuration and credentials."

# Clean up temporary script
rm -f "$TEST_SCRIPT"

# 10. Verify System Resources
echo -e "\n${YELLOW}Verifying system resources...${NC}"

# Check CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1)
if [ "$CPU_USAGE" -lt 80 ]; then
  echo -e "${GREEN}✓ CPU usage is at ${CPU_USAGE}% (below 80% threshold)${NC}"
else
  echo -e "${RED}✗ CPU usage is high at ${CPU_USAGE}% (above 80% threshold)${NC}"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ "$MEM_USAGE" -lt 80 ]; then
  echo -e "${GREEN}✓ Memory usage is at ${MEM_USAGE}% (below 80% threshold)${NC}"
else
  echo -e "${RED}✗ Memory usage is high at ${MEM_USAGE}% (above 80% threshold)${NC}"
fi

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d% -f1)
if [ "$DISK_USAGE" -lt 80 ]; then
  echo -e "${GREEN}✓ Disk usage is at ${DISK_USAGE}% (below 80% threshold)${NC}"
else
  echo -e "${RED}✗ Disk usage is high at ${DISK_USAGE}% (above 80% threshold)${NC}"
fi

# 11. Verify Network Configuration
echo -e "\n${YELLOW}Verifying network configuration...${NC}"

# Check if required ports are open
required_ports=(7050 7051 7054 3001 3002 3003 3000 3004 3005 6379)
for port in "${required_ports[@]}"; do
  if command_exists "nc"; then
    if nc -z localhost "$port" 2>/dev/null; then
      echo -e "${GREEN}✓ Port $port is open${NC}"
    else
      echo -e "${RED}✗ Port $port is not open${NC}"
    fi
  else
    # Fallback to checking with curl
    if curl -s localhost:"$port" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Port $port is accessible${NC}"
    else
      echo -e "${RED}✗ Port $port is not accessible${NC}"
    fi
  fi
done

# 12. Generate Verification Summary
echo -e "\n${YELLOW}Generating verification summary...${NC}"

# Count successes and failures
SUCCESSES=$(grep -c "✓" "$RESULTS_FILE")
FAILURES=$(grep -c "✗" "$RESULTS_FILE")
TOTAL=$((SUCCESSES + FAILURES))
SUCCESS_RATE=$((SUCCESSES * 100 / TOTAL))

# Create summary
echo -e "\n${BLUE}Verification Summary${NC}"
echo -e "${BLUE}====================${NC}"
echo -e "Total checks: $TOTAL"
echo -e "Passed: $SUCCESSES"
echo -e "Failed: $FAILURES"
echo -e "Success rate: $SUCCESS_RATE%"

# Create summary file
cat > "$RESULTS_DIR/summary.txt" << EOF
Blockchain-Based Voting System Verification Summary
==================================================
Date: $(date)

Verification Results:
--------------------
Total Checks: $TOTAL
Passed: $SUCCESSES
Failed: $FAILURES
Success Rate: $SUCCESS_RATE%

See detailed verification log for more information.
EOF

echo -e "\n${YELLOW}Verification results saved to: $RESULTS_FILE${NC}"
echo -e "${YELLOW}Summary saved to: $RESULTS_DIR/summary.txt${NC}"

# Final result
if [ $FAILURES -eq 0 ]; then
  echo -e "\n${GREEN}All verification checks passed successfully!${NC}"
  echo -e "${GREEN}The system is ready for deployment.${NC}"
  exit 0
else
  echo -e "\n${RED}Some verification checks failed. Please address the issues before deployment.${NC}"
  exit 1
fi
