#!/bin/bash

# Generate channel artifacts for the Blockchain-Based Voting System
# This script generates channel transaction files for channel creation

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

# Create channel artifacts directory
create_channel_artifacts_dir() {
    print_color "info" "Creating channel artifacts directory..."
    
    mkdir -p "$BLOCKCHAIN_DIR/channel-artifacts"
    
    print_color "info" "Channel artifacts directory created successfully."
}

# Generate channel transaction
generate_channel_tx() {
    print_color "info" "Generating channel transaction for ${CHANNEL_NAME}..."
    
    # Create channel transaction
    configtxgen -profile VotingChannel \
        -outputCreateChannelTx "$BLOCKCHAIN_DIR/channel-artifacts/${CHANNEL_NAME}.tx" \
        -channelID ${CHANNEL_NAME} \
        -configPath "$BLOCKCHAIN_DIR/config"
    
    print_color "info" "Channel transaction generated successfully."
}

# Generate anchor peer transactions
generate_anchor_peer_tx() {
    print_color "info" "Generating anchor peer transactions..."
    
    # Create anchor peer update for StateElectionOfficeMSP
    configtxgen -profile VotingChannel \
        -outputAnchorPeersUpdate "$BLOCKCHAIN_DIR/channel-artifacts/StateElectionOfficeMSPanchors.tx" \
        -channelID ${CHANNEL_NAME} \
        -asOrg StateElectionOfficeMSP \
        -configPath "$BLOCKCHAIN_DIR/config"
    
    # Create anchor peer update for DistrictElectionOfficeMSP
    configtxgen -profile VotingChannel \
        -outputAnchorPeersUpdate "$BLOCKCHAIN_DIR/channel-artifacts/DistrictElectionOfficeMSPanchors.tx" \
        -channelID ${CHANNEL_NAME} \
        -asOrg DistrictElectionOfficeMSP \
        -configPath "$BLOCKCHAIN_DIR/config"
    
    print_color "info" "Anchor peer transactions generated successfully."
}

# Main function
main() {
    print_color "info" "Starting channel artifacts generation for Blockchain-Based Voting System..."
    
    set_env_vars
    create_channel_artifacts_dir
    generate_channel_tx
    generate_anchor_peer_tx
    
    print_color "info" "Channel artifacts generation completed successfully."
}

# Run main function
main
