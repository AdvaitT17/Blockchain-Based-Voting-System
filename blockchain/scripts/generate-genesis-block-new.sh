#!/bin/bash

# Script to generate genesis block for the Blockchain-Based Voting System
# This script uses the configtxgen tool to generate the genesis block

set -e

# Set the project root directory
PROJECT_ROOT="/Users/advait/Somaiya/SEM 8/Blockchain-Based Voting System"
BLOCKCHAIN_DIR="${PROJECT_ROOT}/blockchain"
CONFIG_DIR="${BLOCKCHAIN_DIR}/config"
SYSTEM_GENESIS_BLOCK_DIR="${BLOCKCHAIN_DIR}/system-genesis-block"

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

# Set environment variables
set_env_vars() {
    print_color "info" "Setting environment variables..."
    
    export FABRIC_CFG_PATH="${CONFIG_DIR}"
    export FABRIC_VERSION=2.4.7
    export CA_VERSION=1.5.5
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    
    print_color "info" "Environment variables set successfully."
}

# Download the configtxgen tool if not already available
download_configtxgen() {
    print_color "info" "Checking for configtxgen tool..."
    
    if [ ! -f "${BLOCKCHAIN_DIR}/bin/configtxgen" ]; then
        print_color "info" "Downloading configtxgen tool..."
        
        # Create bin directory if it doesn't exist
        mkdir -p "${BLOCKCHAIN_DIR}/bin"
        
        # Download configtxgen binary
        curl -sSL https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-darwin-amd64-${FABRIC_VERSION}.tar.gz | tar xz -C "${BLOCKCHAIN_DIR}/bin" --strip-components=1 bin/configtxgen
        
        # Make configtxgen executable
        chmod +x "${BLOCKCHAIN_DIR}/bin/configtxgen"
        
        print_color "info" "Configtxgen tool downloaded successfully."
    else
        print_color "info" "Configtxgen tool already exists."
    fi
    
    # Add configtxgen to PATH
    export PATH="${BLOCKCHAIN_DIR}/bin:$PATH"
}

# Generate genesis block
generate_genesis_block() {
    print_color "info" "Generating genesis block..."
    
    # Create system-genesis-block directory if it doesn't exist
    mkdir -p "${SYSTEM_GENESIS_BLOCK_DIR}"
    
    # Generate genesis block for the orderer
    configtxgen -profile VotingOrdererGenesis -channelID system-channel -outputBlock "${SYSTEM_GENESIS_BLOCK_DIR}/genesis.block"
    
    print_color "info" "Genesis block generated successfully."
}

# Main function
main() {
    print_color "info" "Starting genesis block generation for Blockchain-Based Voting System..."
    
    set_env_vars
    download_configtxgen
    generate_genesis_block
    
    print_color "info" "Genesis block generation completed successfully."
}

# Run main function
main
