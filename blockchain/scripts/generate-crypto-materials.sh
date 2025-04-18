#!/bin/bash

# Script to generate crypto materials for the Blockchain-Based Voting System
# This script uses the cryptogen tool to generate proper crypto materials

set -e

# Set the project root directory
PROJECT_ROOT="/Users/advait/Somaiya/SEM 8/Blockchain-Based Voting System"
BLOCKCHAIN_DIR="${PROJECT_ROOT}/blockchain"
CONFIG_DIR="${BLOCKCHAIN_DIR}/config"
CRYPTO_CONFIG_DIR="${BLOCKCHAIN_DIR}/crypto-config"

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

# Clean up existing crypto materials
clean_up() {
    print_color "info" "Cleaning up existing crypto materials..."
    
    # Remove existing crypto materials
    rm -rf "${CRYPTO_CONFIG_DIR}"
    
    print_color "info" "Clean up completed successfully."
}

# Download the cryptogen tool if not already available
download_cryptogen() {
    print_color "info" "Checking for cryptogen tool..."
    
    if [ ! -f "${BLOCKCHAIN_DIR}/bin/cryptogen" ]; then
        print_color "info" "Downloading cryptogen tool..."
        
        # Create bin directory if it doesn't exist
        mkdir -p "${BLOCKCHAIN_DIR}/bin"
        
        # Download cryptogen binary
        curl -sSL https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-darwin-amd64-${FABRIC_VERSION}.tar.gz | tar xz -C "${BLOCKCHAIN_DIR}/bin" --strip-components=1 bin/cryptogen
        
        # Make cryptogen executable
        chmod +x "${BLOCKCHAIN_DIR}/bin/cryptogen"
        
        print_color "info" "Cryptogen tool downloaded successfully."
    else
        print_color "info" "Cryptogen tool already exists."
    fi
    
    # Add cryptogen to PATH
    export PATH="${BLOCKCHAIN_DIR}/bin:$PATH"
}

# Generate crypto materials using cryptogen
generate_crypto_materials() {
    print_color "info" "Generating crypto materials using cryptogen..."
    
    # Generate crypto materials
    cryptogen generate --config="${CONFIG_DIR}/crypto-config.yaml" --output="${CRYPTO_CONFIG_DIR}"
    
    print_color "info" "Crypto materials generated successfully."
}

# Create system-genesis-block directory
create_system_genesis_block_dir() {
    print_color "info" "Creating system-genesis-block directory..."
    
    # Create system-genesis-block directory if it doesn't exist
    mkdir -p "${BLOCKCHAIN_DIR}/system-genesis-block"
    
    print_color "info" "System-genesis-block directory created successfully."
}

# Create channel-artifacts directory
create_channel_artifacts_dir() {
    print_color "info" "Creating channel-artifacts directory..."
    
    # Create channel-artifacts directory if it doesn't exist
    mkdir -p "${BLOCKCHAIN_DIR}/channel-artifacts"
    
    print_color "info" "Channel-artifacts directory created successfully."
}

# Main function
main() {
    print_color "info" "Starting crypto materials generation for Blockchain-Based Voting System..."
    
    set_env_vars
    clean_up
    download_cryptogen
    generate_crypto_materials
    create_system_genesis_block_dir
    create_channel_artifacts_dir
    
    print_color "info" "Crypto materials generation completed successfully."
}

# Run main function
main
