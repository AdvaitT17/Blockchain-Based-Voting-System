#!/bin/bash

# Generate genesis block for the Blockchain-Based Voting System
# This script generates the genesis block for the orderer

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
    export CHANNEL_NAME=${CHANNEL_NAME:-votingchannel}
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PROJECT_ROOT/bin:$PATH
    
    print_color "info" "Environment variables set successfully."
}

# Create system-genesis-block directory
create_genesis_block_dir() {
    print_color "info" "Creating system-genesis-block directory..."
    
    mkdir -p "$BLOCKCHAIN_DIR/system-genesis-block"
    
    print_color "info" "System-genesis-block directory created successfully."
}

# Generate genesis block
generate_genesis_block() {
    print_color "info" "Generating genesis block..."
    
    # Generate genesis block
    configtxgen -profile VotingOrdererGenesis \
        -channelID system-channel \
        -outputBlock "$BLOCKCHAIN_DIR/system-genesis-block/genesis.block" \
        -configPath "$BLOCKCHAIN_DIR/config"
    
    print_color "info" "Genesis block generated successfully."
}

# Main function
main() {
    print_color "info" "Starting genesis block generation for Blockchain-Based Voting System..."
    
    set_env_vars
    create_genesis_block_dir
    generate_genesis_block
    
    print_color "info" "Genesis block generation completed successfully."
}

# Run main function
main
