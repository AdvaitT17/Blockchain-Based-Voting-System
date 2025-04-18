#!/bin/bash
# Deployment script for Blockchain-Based Voting System
# This script automates the deployment of the entire system

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
  print_message "Checking if Docker is running..."
  if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
  fi
  print_message "Docker is running."
}

# Check for M1/M2 Mac and set platform flag
check_mac_architecture() {
  print_message "Checking system architecture..."
  if [[ $(uname -m) == 'arm64' ]]; then
    print_message "M1/M2 Mac detected. Will use Rosetta 2 for compatibility."
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    print_message "Set DOCKER_DEFAULT_PLATFORM=linux/amd64"
  fi
}

# Start the blockchain network
start_blockchain() {
  print_message "Starting Hyperledger Fabric network..."
  cd blockchain/scripts
  
  # Generate crypto materials
  print_message "Generating crypto materials..."
  ./generate-crypto.sh
  
  # Start the network
  print_message "Starting the network..."
  ./start-network.sh
  
  # Create channel
  print_message "Creating and joining channel..."
  ./create-channel.sh
  
  # Deploy chaincode
  print_message "Deploying chaincode..."
  ./deploy-chaincode.sh
  
  cd ../../
  print_message "Blockchain network is up and running."
}

# Build and start backend APIs
start_backend() {
  print_message "Starting backend API servers..."
  
  # Install dependencies
  print_message "Installing backend dependencies..."
  cd backend
  npm install
  
  # Start identity API
  print_message "Starting Identity API server..."
  cd identity-api
  npm install
  pm2 start server.js --name identity-api
  cd ..
  
  # Start admin API
  print_message "Starting Admin API server..."
  cd admin-api
  npm install
  pm2 start server.js --name admin-api
  cd ..
  
  # Start voter API
  print_message "Starting Voter API server..."
  cd voter-api
  npm install
  pm2 start server.js --name voter-api
  cd ..
  
  cd ..
  print_message "All backend API servers are running."
}

# Build and deploy frontend applications
deploy_frontend() {
  print_message "Building and deploying frontend applications..."
  
  # Build admin dashboard
  print_message "Building admin dashboard..."
  cd frontend/admin-dashboard
  npm install
  npm run build
  
  # Serve admin dashboard
  print_message "Serving admin dashboard..."
  pm2 serve build 3000 --name admin-dashboard
  cd ../..
  
  # Build voter portal
  print_message "Building voter portal..."
  cd frontend/voter-portal
  npm install
  npm run build
  
  # Serve voter portal
  print_message "Serving voter portal..."
  pm2 serve build 3005 --name voter-portal
  cd ../..
  
  # Build polling station interface
  print_message "Building polling station interface..."
  cd frontend/polling-station
  npm install
  npm run build
  
  # Serve polling station interface
  print_message "Serving polling station interface..."
  pm2 serve build 3006 --name polling-station
  cd ../..
  
  print_message "All frontend applications are deployed and running."
}

# Run integration tests
run_tests() {
  print_message "Running integration tests..."
  cd tests
  npm install
  npm test
  cd ..
  print_message "Integration tests completed."
}

# Display system status
display_status() {
  print_message "System Status:"
  echo "------------------------------------"
  echo "Backend API Servers:"
  pm2 list | grep -E 'identity-api|admin-api|voter-api'
  echo "------------------------------------"
  echo "Frontend Applications:"
  pm2 list | grep -E 'admin-dashboard|voter-portal|polling-station'
  echo "------------------------------------"
  echo "Blockchain Network:"
  docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E 'peer|orderer|ca'
  echo "------------------------------------"
  
  print_message "Blockchain-Based Voting System is deployed and running."
  print_message "Access the applications at:"
  echo "Admin Dashboard:       http://localhost:3000"
  echo "Voter Portal:          http://localhost:3005"
  echo "Polling Station:       http://localhost:3006"
}

# Main deployment process
main() {
  print_message "Starting deployment of Blockchain-Based Voting System..."
  
  # Check prerequisites
  check_docker
  check_mac_architecture
  
  # Deploy components
  start_blockchain
  start_backend
  deploy_frontend
  
  # Run tests if requested
  if [[ "$1" == "--test" ]]; then
    run_tests
  fi
  
  # Display system status
  display_status
}

# Check if script should be run in cleanup mode
if [[ "$1" == "--cleanup" ]]; then
  print_message "Cleaning up previous deployment..."
  
  # Stop PM2 processes
  print_message "Stopping PM2 processes..."
  pm2 delete all 2>/dev/null || true
  
  # Stop Docker containers
  print_message "Stopping Docker containers..."
  cd blockchain/scripts
  ./teardown.sh
  cd ../../
  
  print_message "Cleanup completed."
  exit 0
fi

# Run the deployment
main "$@"
