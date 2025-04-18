#!/bin/bash
# Setup environment variables for backend services

# Set the base directory
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOCKCHAIN_DIR="$BASE_DIR/../blockchain"
TEST_NETWORK_DIR="$BLOCKCHAIN_DIR/test-network"

# Create .env files for each API service
create_env_file() {
  local service_dir="$1"
  local env_file="$service_dir/.env"
  
  echo "Creating .env file for $service_dir..."
  
  # Create or overwrite the .env file
  cat > "$env_file" << EOL
# Fabric connection settings
FABRIC_CONNECTION_PROFILE=$BASE_DIR/utils/connection-profile.json
FABRIC_WALLET_PATH=$BASE_DIR/utils/wallet
FABRIC_USER_ID=admin
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=voting

# API settings
PORT=3000
HOST=localhost
EOL

  echo "Created $env_file"
}

# Initialize the fabric connection utilities
initialize_fabric_connection() {
  echo "Initializing Fabric connection utilities..."
  
  # Create the utils directory if it doesn't exist
  mkdir -p "$BASE_DIR/utils/wallet"
  
  # Run the initialize function
  node -e "
    const fabricConnection = require('$BASE_DIR/utils/fabric-connection');
    async function init() {
      try {
        const result = await fabricConnection.initialize();
        console.log(result);
      } catch (error) {
        console.error('Error initializing Fabric connection:', error);
      }
    }
    init();
  "
}

# Create .env files for each service
create_env_file "$BASE_DIR/identity-api"
create_env_file "$BASE_DIR/admin-api"
create_env_file "$BASE_DIR/voter-api"

# Initialize the fabric connection
initialize_fabric_connection

echo "Backend environment setup complete!"
