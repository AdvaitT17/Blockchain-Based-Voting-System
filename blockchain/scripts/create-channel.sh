#!/bin/bash

# Create and join channels for the Blockchain-Based Voting System
# This script creates channels and joins peers to them

set -e

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
    if [ -f ../../.env ]; then
        source ../../.env
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
    export PATH=$PWD/../../bin:$PATH
    
    print_color "info" "Environment variables set successfully."
}

# Create channel
create_channel() {
    print_color "info" "Creating channel ${CHANNEL_NAME}..."
    
    # Use the CLI container to create the channel
    docker exec cli peer channel create \
        -o orderer.election-commission.gov.in:7050 \
        -c ${CHANNEL_NAME} \
        -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.tx \
        --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
    
    print_color "info" "Channel ${CHANNEL_NAME} created successfully."
}

# Join peers to channel
join_peers_to_channel() {
    print_color "info" "Joining peers to channel ${CHANNEL_NAME}..."
    
    # Join peer0.state.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
    
    # Join peer1.state.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer1.state.gov.in:7051 \
        cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
    
    # Join peer0.district.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 \
        cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
    
    # Join peer1.district.gov.in to the channel
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer1.district.gov.in:9051 \
        cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block
    
    print_color "info" "Peers joined to channel ${CHANNEL_NAME} successfully."
}

# Update anchor peers
update_anchor_peers() {
    print_color "info" "Updating anchor peers for channel ${CHANNEL_NAME}..."
    
    # Update anchor peers for StateElectionOfficeMSP
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer channel update \
        -o orderer.election-commission.gov.in:7050 \
        -c ${CHANNEL_NAME} \
        -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/StateElectionOfficeMSPanchors.tx
    
    # Update anchor peers for DistrictElectionOfficeMSP
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 \
        cli peer channel update \
        -o orderer.election-commission.gov.in:7050 \
        -c ${CHANNEL_NAME} \
        -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/DistrictElectionOfficeMSPanchors.tx
    
    print_color "info" "Anchor peers updated successfully."
}

# Main function
main() {
    print_color "info" "Starting channel creation for Blockchain-Based Voting System..."
    
    set_env_vars
    create_channel
    join_peers_to_channel
    update_anchor_peers
    
    print_color "info" "Channel creation completed successfully."
}

# Run main function
main
