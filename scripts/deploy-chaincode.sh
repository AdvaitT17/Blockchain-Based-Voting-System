#!/bin/bash

# Deploy Chaincode script for Blockchain-Based Voting System
# This script packages and deploys the voting and identity chaincodes

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
    if [ -f .env ]; then
        source .env
    fi
    
    # Set default values if not already set
    export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-blockchain_voting}
    export FABRIC_VERSION=${FABRIC_VERSION:-2.4.7}
    export CA_VERSION=${CA_VERSION:-1.5.5}
    export CHANNEL_NAME=${CHANNEL_NAME:-votingchannel}
    export CHAINCODE_NAME_VOTING=${CHAINCODE_NAME_VOTING:-voting}
    export CHAINCODE_NAME_IDENTITY=${CHAINCODE_NAME_IDENTITY:-identity}
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PWD/bin:$PATH
    
    # Set peer environment variables for StateElectionOffice
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="StateElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:7053
    
    print_color "info" "Environment variables set successfully."
}

# Package voting chaincode
package_voting_chaincode() {
    print_color "info" "Packaging voting chaincode..."
    
    # Navigate to the chaincode directory
    cd chaincode/voting
    
    # Initialize npm package if not already initialized
    if [ ! -f "package.json" ]; then
        print_color "info" "Initializing npm package for voting chaincode..."
        npm init -y
    fi
    
    # Install dependencies
    npm install fabric-contract-api fabric-shim
    
    # Return to the project root
    cd ../..
    
    # Package the chaincode using peer lifecycle chaincode
    peer lifecycle chaincode package ${CHAINCODE_NAME_VOTING}.tar.gz --path ./chaincode/voting --lang node --label ${CHAINCODE_NAME_VOTING}_1.0
    
    print_color "info" "Voting chaincode packaged successfully."
}

# Package identity chaincode
package_identity_chaincode() {
    print_color "info" "Packaging identity chaincode..."
    
    # Navigate to the chaincode directory
    cd chaincode/identity
    
    # Initialize npm package if not already initialized
    if [ ! -f "package.json" ]; then
        print_color "info" "Initializing npm package for identity chaincode..."
        npm init -y
    fi
    
    # Install dependencies
    npm install fabric-contract-api fabric-shim
    
    # Return to the project root
    cd ../..
    
    # Package the chaincode using peer lifecycle chaincode
    peer lifecycle chaincode package ${CHAINCODE_NAME_IDENTITY}.tar.gz --path ./chaincode/identity --lang node --label ${CHAINCODE_NAME_IDENTITY}_1.0
    
    print_color "info" "Identity chaincode packaged successfully."
}

# Install voting chaincode
install_voting_chaincode() {
    print_color "info" "Installing voting chaincode..."
    
    # Install on StateElectionOffice peer0
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="StateElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:7053
    
    peer lifecycle chaincode install ${CHAINCODE_NAME_VOTING}.tar.gz
    
    # Install on DistrictElectionOffice peer0
    export CORE_PEER_LOCALMSPID="DistrictElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:9051
    
    peer lifecycle chaincode install ${CHAINCODE_NAME_VOTING}.tar.gz
    
    print_color "info" "Voting chaincode installed successfully."
}

# Install identity chaincode
install_identity_chaincode() {
    print_color "info" "Installing identity chaincode..."
    
    # Install on StateElectionOffice peer0
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="StateElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:7053
    
    peer lifecycle chaincode install ${CHAINCODE_NAME_IDENTITY}.tar.gz
    
    # Install on DistrictElectionOffice peer0
    export CORE_PEER_LOCALMSPID="DistrictElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:9051
    
    peer lifecycle chaincode install ${CHAINCODE_NAME_IDENTITY}.tar.gz
    
    print_color "info" "Identity chaincode installed successfully."
}

# Approve and commit voting chaincode
approve_commit_voting_chaincode() {
    print_color "info" "Approving and committing voting chaincode..."
    
    # Get the package ID
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="StateElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:7053
    
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME_VOTING}_1.0" | awk '{print $3}' | sed 's/,//')
    
    # Approve for StateElectionOffice
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_VOTING} --version 1.0 --package-id ${PACKAGE_ID} --sequence 1
    
    # Approve for DistrictElectionOffice
    export CORE_PEER_LOCALMSPID="DistrictElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:9051
    
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_VOTING} --version 1.0 --package-id ${PACKAGE_ID} --sequence 1
    
    # Check commit readiness
    peer lifecycle chaincode checkcommitreadiness --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_VOTING} --version 1.0 --sequence 1 --output json
    
    # Commit the chaincode
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_VOTING} --peerAddresses localhost:7053 --tlsRootCertFiles $PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt --version 1.0 --sequence 1
    
    print_color "info" "Voting chaincode approved and committed successfully."
}

# Approve and commit identity chaincode
approve_commit_identity_chaincode() {
    print_color "info" "Approving and committing identity chaincode..."
    
    # Get the package ID
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="StateElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:7053
    
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME_IDENTITY}_1.0" | awk '{print $3}' | sed 's/,//')
    
    # Approve for StateElectionOffice
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_IDENTITY} --version 1.0 --package-id ${PACKAGE_ID} --sequence 1
    
    # Approve for DistrictElectionOffice
    export CORE_PEER_LOCALMSPID="DistrictElectionOfficeMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp
    export CORE_PEER_ADDRESS=localhost:9051
    
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_IDENTITY} --version 1.0 --package-id ${PACKAGE_ID} --sequence 1
    
    # Check commit readiness
    peer lifecycle chaincode checkcommitreadiness --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_IDENTITY} --version 1.0 --sequence 1 --output json
    
    # Commit the chaincode
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.election-commission.gov.in --tls --cafile $PWD/blockchain/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/tlsca.election-commission.gov.in-cert.pem --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME_IDENTITY} --peerAddresses localhost:7053 --tlsRootCertFiles $PWD/blockchain/organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/blockchain/organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls/ca.crt --version 1.0 --sequence 1
    
    print_color "info" "Identity chaincode approved and committed successfully."
}

# Main function
main() {
    print_color "info" "Starting chaincode deployment for Blockchain-Based Voting System..."
    
    set_env_vars
    package_voting_chaincode
    package_identity_chaincode
    install_voting_chaincode
    install_identity_chaincode
    approve_commit_voting_chaincode
    approve_commit_identity_chaincode
    
    print_color "info" "Chaincode deployment completed successfully."
    print_color "info" "You can now start the backend servers and frontend applications."
}

# Run main function
main
