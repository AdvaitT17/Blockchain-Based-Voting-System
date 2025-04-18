#!/bin/bash

# Start Network script for Blockchain-Based Voting System
# This script sets up and starts the Hyperledger Fabric network

set -e

# Set the project root directory
PROJECT_ROOT="/Users/advait/Somaiya/SEM 8/Blockchain-Based Voting System"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"

# Print colored text
print_color() {
    case $1 in
        "info") COLOR="\\033[0;32m" ;;  # green
        "error") COLOR="\\033[0;31m" ;; # red
        "warning") COLOR="\\033[0;33m" ;; # yellow
        *) COLOR="\\033[0m" ;;           # no color
    esac
    echo -e "${COLOR}$2\\033[0m"
}

# Check if running on Apple Silicon
check_apple_silicon() {
    if [[ "$(uname -m)" == "arm64" ]]; then
        print_color "info" "Detected Apple Silicon (M1/M2) Mac"
        return 0
    else
        return 1
    fi
}

# Set environment variables
set_env_vars() {
    print_color "info" "Setting environment variables..."
    
    # Load environment variables from .env file if it exists
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    fi
    
    # Set default values if not already set
    export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-blockchain_voting}
    export FABRIC_VERSION=${FABRIC_VERSION:-2.4.7}
    export CA_VERSION=${CA_VERSION:-1.5.5}
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PROJECT_ROOT/bin:$PATH
    
    print_color "info" "Environment variables set successfully."
}

# Clean up existing network
clean_up() {
    print_color "info" "Cleaning up existing network..."
    
    # Check if blockchain directory exists
    if [ ! -d "$BLOCKCHAIN_DIR" ]; then
        print_color "error" "Blockchain directory not found at $BLOCKCHAIN_DIR"
        exit 1
    fi
    
    # Stop and remove containers
    if [ -f "$BLOCKCHAIN_DIR/config/docker-compose.yaml" ]; then
        cd "$BLOCKCHAIN_DIR"
        docker-compose -f config/docker-compose.yaml down --volumes --remove-orphans
        cd "$PROJECT_ROOT"
    else
        print_color "warning" "Docker compose file not found, skipping container cleanup"
    fi
    
    # Remove generated crypto materials
    rm -rf "$BLOCKCHAIN_DIR/organizations/ordererOrganizations" 2>/dev/null || true
    rm -rf "$BLOCKCHAIN_DIR/organizations/peerOrganizations" 2>/dev/null || true
    rm -rf "$BLOCKCHAIN_DIR/system-genesis-block" 2>/dev/null || true
    rm -rf "$BLOCKCHAIN_DIR/channel-artifacts" 2>/dev/null || true
    
    print_color "info" "Cleanup completed successfully."
}

# Generate crypto materials
generate_crypto_materials() {
    print_color "info" "Generating crypto materials..."
    
    # Check if scripts directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/scripts" ]; then
        print_color "error" "Scripts directory not found at $BLOCKCHAIN_DIR/scripts"
        exit 1
    fi
    
    # Make the script executable
    chmod +x "$BLOCKCHAIN_DIR/scripts/generate-crypto.sh"
    
    # Run the script
    cd "$BLOCKCHAIN_DIR/scripts"
    ./generate-crypto.sh
    cd "$PROJECT_ROOT"
    
    print_color "info" "Crypto materials generated successfully."
}

# Generate genesis block
generate_genesis_block() {
    print_color "info" "Generating genesis block..."
    
    # Check if scripts directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/scripts" ]; then
        print_color "error" "Scripts directory not found at $BLOCKCHAIN_DIR/scripts"
        exit 1
    fi
    
    # Make the script executable
    chmod +x "$BLOCKCHAIN_DIR/scripts/generate-genesis-block.sh"
    
    # Run the script
    cd "$BLOCKCHAIN_DIR/scripts"
    ./generate-genesis-block.sh
    cd "$PROJECT_ROOT"
    
    print_color "info" "Genesis block generated successfully."
}

# Generate channel artifacts
generate_channel_artifacts() {
    print_color "info" "Generating channel artifacts..."
    
    # Check if scripts directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/scripts" ]; then
        print_color "error" "Scripts directory not found at $BLOCKCHAIN_DIR/scripts"
        exit 1
    fi
    
    # Make the script executable
    chmod +x "$BLOCKCHAIN_DIR/scripts/generate-channel-artifacts.sh"
    
    # Run the script
    cd "$BLOCKCHAIN_DIR/scripts"
    ./generate-channel-artifacts.sh
    cd "$PROJECT_ROOT"
    
    print_color "info" "Channel artifacts generated successfully."
}

# Setup Admin certificates
setup_admin_certs() {
    print_color "info" "Setting up Admin certificates..."
    
    # Check if scripts directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/scripts" ]; then
        print_color "error" "Scripts directory not found at $BLOCKCHAIN_DIR/scripts"
        exit 1
    fi
    
    # Make the script executable
    chmod +x "$BLOCKCHAIN_DIR/scripts/setup-admin-certs.sh"
    
    # Run the script
    cd "$BLOCKCHAIN_DIR/scripts"
    ./setup-admin-certs.sh
    cd "$PROJECT_ROOT"
    
    print_color "info" "Admin certificates set up successfully."
}

# Start the network
start_network() {
    print_color "info" "Starting the network..."
    
    # Check if config directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/config" ]; then
        print_color "error" "Config directory not found at $BLOCKCHAIN_DIR/config"
        exit 1
    fi
    
    # Start the network using docker-compose
    cd "$BLOCKCHAIN_DIR"
    docker-compose -f config/docker-compose.yaml up -d
    cd "$PROJECT_ROOT"
    
    print_color "info" "Network started successfully."
}

# Create and join channels
create_channels() {
    print_color "info" "Creating and joining channels..."
    
    # Wait for network to start
    sleep 10
    
    # Check if scripts directory exists
    if [ ! -d "$BLOCKCHAIN_DIR/scripts" ]; then
        print_color "error" "Scripts directory not found at $BLOCKCHAIN_DIR/scripts"
        exit 1
    fi
    
    # Make the script executable
    chmod +x "$BLOCKCHAIN_DIR/scripts/create-channel.sh"
    
    # Run the script
    cd "$BLOCKCHAIN_DIR/scripts"
    ./create-channel.sh
    cd "$PROJECT_ROOT"
    
    print_color "info" "Channels created and joined successfully."
}

# Main function
main() {
    print_color "info" "Starting network setup for Blockchain-Based Voting System..."
    
    set_env_vars
    clean_up
    generate_crypto_materials
    setup_admin_certs
    generate_genesis_block
    generate_channel_artifacts
    start_network
    create_channels
    
    print_color "info" "Network setup completed successfully."
    print_color "info" "You can now deploy chaincode using ./scripts/deploy-chaincode.sh"
}

# Run main function
main
