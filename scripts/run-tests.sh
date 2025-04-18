#!/bin/bash

# Comprehensive Test Script for Blockchain-Based Voting System
# Phase 7: Final Testing and Validation

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
cd "$BASE_DIR"

echo -e "${YELLOW}Starting comprehensive testing for Blockchain-Based Voting System...${NC}"
echo -e "${YELLOW}======================================================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to run a test and report result
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -e "\n${YELLOW}Running test: ${test_name}${NC}"
  echo -e "${YELLOW}--------------------${NC}"
  
  if eval "$test_command"; then
    echo -e "${GREEN}✓ Test passed: ${test_name}${NC}"
    return 0
  else
    echo -e "${RED}✗ Test failed: ${test_name}${NC}"
    return 1
  fi
}

# Check for required tools
echo -e "\n${YELLOW}Checking required tools...${NC}"
required_tools=("node" "npm" "docker" "docker-compose" "curl" "jq")
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
  echo -e "${RED}Please install the missing tools before running tests: ${missing_tools[*]}${NC}"
  exit 1
fi

# Check if Docker is running
echo -e "\n${YELLOW}Checking if Docker is running...${NC}"
if docker info >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Docker is running${NC}"
else
  echo -e "${RED}✗ Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Create test results directory
TEST_RESULTS_DIR="$BASE_DIR/test-results"
mkdir -p "$TEST_RESULTS_DIR"
echo -e "\n${YELLOW}Test results will be saved to: ${TEST_RESULTS_DIR}${NC}"

# 1. Unit Tests
echo -e "\n${YELLOW}Running Unit Tests...${NC}"
echo -e "${YELLOW}=====================${NC}"

# Backend Unit Tests
run_test "Backend Unit Tests" "cd $BASE_DIR/backend && npm test" && \
  echo "Backend unit tests completed at $(date)" > "$TEST_RESULTS_DIR/backend-unit-tests.log"

# Chaincode Unit Tests
run_test "Chaincode Unit Tests" "cd $BASE_DIR/chaincode && npm test" && \
  echo "Chaincode unit tests completed at $(date)" > "$TEST_RESULTS_DIR/chaincode-unit-tests.log"

# Frontend Unit Tests
run_test "Frontend Admin Dashboard Unit Tests" "cd $BASE_DIR/frontend/admin-dashboard && npm test -- --watchAll=false" && \
  echo "Admin dashboard unit tests completed at $(date)" > "$TEST_RESULTS_DIR/admin-dashboard-unit-tests.log"

run_test "Frontend Voter Portal Unit Tests" "cd $BASE_DIR/frontend/voter-portal && npm test -- --watchAll=false" && \
  echo "Voter portal unit tests completed at $(date)" > "$TEST_RESULTS_DIR/voter-portal-unit-tests.log"

run_test "Frontend Polling Station Unit Tests" "cd $BASE_DIR/frontend/polling-station && npm test -- --watchAll=false" && \
  echo "Polling station unit tests completed at $(date)" > "$TEST_RESULTS_DIR/polling-station-unit-tests.log"

# 2. Integration Tests
echo -e "\n${YELLOW}Running Integration Tests...${NC}"
echo -e "${YELLOW}===========================${NC}"

# Start test network if not already running
if ! docker ps | grep -q "fabric-peer0"; then
  echo -e "${YELLOW}Starting test network...${NC}"
  "$BASE_DIR/scripts/start-network.sh" -t
  sleep 10 # Wait for network to stabilize
fi

# Blockchain Integration Tests
run_test "Blockchain Integration Tests" "cd $BASE_DIR/tests/integration && npm test" && \
  echo "Blockchain integration tests completed at $(date)" > "$TEST_RESULTS_DIR/blockchain-integration-tests.log"

# 3. API Tests
echo -e "\n${YELLOW}Running API Tests...${NC}"
echo -e "${YELLOW}===================${NC}"

# Start API servers if not already running
api_servers=("identity-api" "admin-api" "voter-api")
for api in "${api_servers[@]}"; do
  if ! curl -s "http://localhost:300${api: -1}/health" > /dev/null; then
    echo -e "${YELLOW}Starting $api server...${NC}"
    NODE_ENV=test nohup node "$BASE_DIR/backend/$api/server.js" > "$TEST_RESULTS_DIR/$api-server.log" 2>&1 &
    sleep 5 # Wait for server to start
  fi
done

# Run API tests
run_test "API Tests" "cd $BASE_DIR/tests/api && npm test" && \
  echo "API tests completed at $(date)" > "$TEST_RESULTS_DIR/api-tests.log"

# 4. End-to-End Tests
echo -e "\n${YELLOW}Running End-to-End Tests...${NC}"
echo -e "${YELLOW}==========================${NC}"

# Start frontend servers if needed for E2E tests
frontend_apps=("admin-dashboard" "voter-portal" "polling-station")
for app in "${frontend_apps[@]}"; do
  if ! curl -s "http://localhost:300${app: -1}" > /dev/null; then
    echo -e "${YELLOW}Starting $app frontend...${NC}"
    cd "$BASE_DIR/frontend/$app" && \
    PORT=300${app: -1} nohup npm start > "$TEST_RESULTS_DIR/$app-frontend.log" 2>&1 &
    sleep 10 # Wait for frontend to start
  fi
done

# Run E2E tests with Cypress
run_test "End-to-End Tests" "cd $BASE_DIR/tests/e2e && npm test" && \
  echo "End-to-end tests completed at $(date)" > "$TEST_RESULTS_DIR/e2e-tests.log"

# 5. Performance Tests
echo -e "\n${YELLOW}Running Performance Tests...${NC}"
echo -e "${YELLOW}===========================${NC}"

# Run performance tests with Artillery
if command_exists "artillery"; then
  run_test "API Performance Tests" "cd $BASE_DIR/tests/performance && artillery run load-test.yml -o $TEST_RESULTS_DIR/performance-results.json" && \
    echo "Performance tests completed at $(date)" > "$TEST_RESULTS_DIR/performance-tests.log"
else
  echo -e "${YELLOW}Artillery not found. Skipping performance tests.${NC}"
  echo -e "${YELLOW}Install with: npm install -g artillery${NC}"
fi

# 6. Security Tests
echo -e "\n${YELLOW}Running Security Tests...${NC}"
echo -e "${YELLOW}========================${NC}"

# Run dependency vulnerability check
run_test "Dependency Vulnerability Check" "cd $BASE_DIR && npm audit --json > $TEST_RESULTS_DIR/dependency-audit.json" && \
  echo "Dependency vulnerability check completed at $(date)" > "$TEST_RESULTS_DIR/dependency-audit.log"

# Run OWASP ZAP scan if installed
if command_exists "zap-cli"; then
  run_test "OWASP ZAP Security Scan" "zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://localhost:3003 -o $TEST_RESULTS_DIR/zap-results.html" && \
    echo "Security scan completed at $(date)" > "$TEST_RESULTS_DIR/security-scan.log"
else
  echo -e "${YELLOW}OWASP ZAP CLI not found. Skipping security scan.${NC}"
  echo -e "${YELLOW}Install OWASP ZAP and ZAP CLI for security scanning.${NC}"
fi

# 7. Cleanup
echo -e "\n${YELLOW}Cleaning up test environment...${NC}"
echo -e "${YELLOW}==============================${NC}"

# Stop test servers if they were started by this script
for api in "${api_servers[@]}"; do
  if [ -f "$TEST_RESULTS_DIR/$api-server.log" ]; then
    echo -e "${YELLOW}Stopping $api server...${NC}"
    pkill -f "$BASE_DIR/backend/$api/server.js"
  fi
done

for app in "${frontend_apps[@]}"; do
  if [ -f "$TEST_RESULTS_DIR/$app-frontend.log" ]; then
    echo -e "${YELLOW}Stopping $app frontend...${NC}"
    pkill -f "react-scripts start.*$app"
  fi
done

# Generate test summary
echo -e "\n${YELLOW}Generating test summary...${NC}"
echo -e "${YELLOW}========================${NC}"

# Count test results
TOTAL_TESTS=$(grep -c "Running test:" "$0")
PASSED_TESTS=$(grep -c "✓ Test passed:" "$TEST_RESULTS_DIR"/*.log 2>/dev/null || echo 0)
FAILED_TESTS=$((TOTAL_TESTS - PASSED_TESTS))

# Create summary file
cat > "$TEST_RESULTS_DIR/summary.txt" << EOF
Blockchain-Based Voting System Test Summary
==========================================
Date: $(date)

Test Results:
------------
Total Tests: $TOTAL_TESTS
Passed: $PASSED_TESTS
Failed: $FAILED_TESTS
Success Rate: $(( (PASSED_TESTS * 100) / TOTAL_TESTS ))%

See individual test logs for details.
EOF

echo -e "\n${YELLOW}Test Summary:${NC}"
cat "$TEST_RESULTS_DIR/summary.txt"

# Final result
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please check the logs for details.${NC}"
  exit 1
fi
