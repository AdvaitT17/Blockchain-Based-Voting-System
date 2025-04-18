#!/bin/bash

# Script to generate channel artifacts for the Blockchain-Based Voting System
# This script uses the configtxgen tool to generate channel transaction and anchor peer transactions

set -e

# Set the project root directory
PROJECT_ROOT="/Users/advait/Somaiya/SEM 8/Blockchain-Based Voting System"
BLOCKCHAIN_DIR="${PROJECT_ROOT}/blockchain"
CONFIG_DIR="${BLOCKCHAIN_DIR}/config"
CHANNEL_ARTIFACTS_DIR="${BLOCKCHAIN_DIR}/channel-artifacts"

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

# Ensure configtxgen is in PATH
ensure_configtxgen() {
    print_color "info" "Ensuring configtxgen is in PATH..."
    
    # Add configtxgen to PATH
    export PATH="${BLOCKCHAIN_DIR}/bin:$PATH"
    
    # Check if configtxgen is available
    if ! command -v configtxgen &> /dev/null; then
        print_color "error" "configtxgen not found. Please run generate-genesis-block-new.sh first."
        exit 1
    fi
    
    print_color "info" "configtxgen is available."
}

# Generate channel transaction
generate_channel_tx() {
    print_color "info" "Generating channel transaction..."
    
    # Create channel-artifacts directory if it doesn't exist
    mkdir -p "${CHANNEL_ARTIFACTS_DIR}"
    
    # Generate channel transaction
    configtxgen -profile VotingChannel -outputCreateChannelTx "${CHANNEL_ARTIFACTS_DIR}/voting-channel.tx" -channelID votingchannel
    
    print_color "info" "Channel transaction generated successfully."
}

# Generate anchor peer transactions
generate_anchor_peer_tx() {
    print_color "info" "Generating anchor peer transactions..."
    
    # Generate anchor peer transaction for StateElectionOfficeMSP
    configtxgen -profile VotingChannel -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS_DIR}/StateElectionOfficeMSPanchors.tx" -channelID votingchannel -asOrg StateElectionOfficeMSP
    
    # Generate anchor peer transaction for DistrictElectionOfficeMSP
    configtxgen -profile VotingChannel -outputAnchorPeersUpdate "${CHANNEL_ARTIFACTS_DIR}/DistrictElectionOfficeMSPanchors.tx" -channelID votingchannel -asOrg DistrictElectionOfficeMSP
    
    print_color "info" "Anchor peer transactions generated successfully."
}

# Main function
main() {
    print_color "info" "Starting channel artifacts generation for Blockchain-Based Voting System..."
    
    set_env_vars
    ensure_configtxgen
    generate_channel_tx
    generate_anchor_peer_tx
    
    print_color "info" "Channel artifacts generation completed successfully."
}

# Run main function
main
