#!/bin/bash

# Script to start the Hyperledger Fabric network for the Blockchain-Based Voting System
# This script orchestrates the entire process of setting up and starting the network

set -e

# Set the project root directory
PROJECT_ROOT="/Users/advait/Somaiya/SEM 8/Blockchain-Based Voting System"
BLOCKCHAIN_DIR="${PROJECT_ROOT}/blockchain"
CONFIG_DIR="${BLOCKCHAIN_DIR}/config"

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

# Clean up existing containers and volumes
clean_up() {
    print_color "info" "Cleaning up existing containers and volumes..."
    
    # Stop and remove containers
    docker-compose -f "${CONFIG_DIR}/docker-compose.yaml" down --volumes --remove-orphans
    
    # Remove generated artifacts
    rm -rf "${BLOCKCHAIN_DIR}/system-genesis-block/*"
    rm -rf "${BLOCKCHAIN_DIR}/channel-artifacts/*"
    
    print_color "info" "Clean up completed successfully."
}

# Generate crypto materials
generate_crypto_materials() {
    print_color "info" "Generating crypto materials..."
    
    # Run the fix-crypto-materials.sh script
    "${BLOCKCHAIN_DIR}/scripts/fix-crypto-materials.sh"
    
    print_color "info" "Crypto materials generated successfully."
}

# Generate genesis block
generate_genesis_block() {
    print_color "info" "Generating genesis block..."
    
    # Run the generate-genesis-block-fixed.sh script
    "${BLOCKCHAIN_DIR}/scripts/generate-genesis-block-fixed.sh"
    
    print_color "info" "Genesis block generated successfully."
}

# Generate channel artifacts
generate_channel_artifacts() {
    print_color "info" "Generating channel artifacts..."
    
    # Run the generate-channel-artifacts-fixed.sh script
    "${BLOCKCHAIN_DIR}/scripts/generate-channel-artifacts-fixed.sh"
    
    print_color "info" "Channel artifacts generated successfully."
}

# Start the network
start_network() {
    print_color "info" "Starting the network..."
    
    # Start the network using docker-compose
    docker-compose -f "${CONFIG_DIR}/docker-compose.yaml" up -d
    
    # Wait for the network to start
    sleep 5
    
    # Update hosts files in containers
    "${BLOCKCHAIN_DIR}/scripts/update-hosts.sh"
    
    print_color "info" "Network started successfully."
}

# Create and join channels
create_channels() {
    print_color "info" "Creating and joining channels..."
    
    # Wait for the network to stabilize
    sleep 10
    
    # Get orderer IP address
    ORDERER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' orderer.election-commission.gov.in)
    
    # Create the voting channel using IP address instead of hostname
    docker exec cli bash -c "ping -c 2 orderer.election-commission.gov.in && peer channel create -o orderer.election-commission.gov.in:7050 -c votingchannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/voting-channel.tx"
    
    # Join peer0.state.gov.in to the channel
    docker exec cli peer channel join -b votingchannel.block
    
    # Join peer1.state.gov.in to the channel
    docker exec -e CORE_PEER_ADDRESS=peer1.state.gov.in:7051 cli peer channel join -b votingchannel.block
    
    # Join peer0.district.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 cli peer channel join -b votingchannel.block
    
    # Join peer1.district.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp -e CORE_PEER_ADDRESS=peer1.district.gov.in:9051 cli peer channel join -b votingchannel.block
    
    # Update anchor peers for StateElectionOfficeMSP
    docker exec cli peer channel update -o orderer.election-commission.gov.in:7050 -c votingchannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/StateElectionOfficeMSPanchors.tx
    
    # Update anchor peers for DistrictElectionOfficeMSP
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 cli peer channel update -o orderer.election-commission.gov.in:7050 -c votingchannel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/DistrictElectionOfficeMSPanchors.tx
    
    print_color "info" "Channels created and joined successfully."
}

# Verify network status
verify_network() {
    print_color "info" "Verifying network status..."
    
    # List running containers
    docker ps
    
    # Get channel information
    docker exec cli peer channel list
    
    print_color "info" "Network verification completed."
}

# Main function
main() {
    print_color "info" "Starting Hyperledger Fabric network for Blockchain-Based Voting System..."
    
    set_env_vars
    clean_up
    generate_crypto_materials
    generate_genesis_block
    generate_channel_artifacts
    start_network
    create_channels
    verify_network
    
    print_color "info" "Hyperledger Fabric network setup completed successfully."
}

# Run main function
main
