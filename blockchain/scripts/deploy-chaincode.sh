#!/bin/bash

# Deploy chaincode for the Blockchain-Based Voting System
# This script packages, installs, approves, and commits chaincode

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
    export CC_NAME=${CC_NAME:-voting}
    export CC_VERSION=${CC_VERSION:-1.0}
    export CC_SEQUENCE=${CC_SEQUENCE:-1}
    export CC_SRC_PATH=${CC_SRC_PATH:-../chaincode}
    export CC_RUNTIME_LANGUAGE=${CC_RUNTIME_LANGUAGE:-golang}
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PWD/../../bin:$PATH
    
    # Set peer CLI configuration
    export FABRIC_CFG_PATH=$PWD/../config
    
    print_color "info" "Environment variables set successfully."
}

# Package the chaincode
package_chaincode() {
    print_color "info" "Packaging chaincode ${CC_NAME}..."
    
    # Create a temporary directory for the chaincode
    docker exec cli bash -c "mkdir -p /opt/gopath/src/chaincode/${CC_NAME}"
    
    # Copy chaincode to CLI container
    docker cp ${CC_SRC_PATH}/${CC_NAME}/go/. cli:/opt/gopath/src/chaincode/${CC_NAME}/
    
    # Download dependencies in the CLI container
    docker exec -e GOPATH=/opt/gopath cli bash -c "cd /opt/gopath/src/chaincode/${CC_NAME} && go mod download && go mod tidy"
    
    # Package the chaincode using CLI container
    docker exec -e GOPATH=/opt/gopath cli peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path /opt/gopath/src/chaincode/${CC_NAME} \
        --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${CC_VERSION}
    
    print_color "info" "Chaincode ${CC_NAME} packaged successfully."
}

# Install chaincode on all peers
install_chaincode() {
    print_color "info" "Installing chaincode on all peers..."
    
    # Install on peer0.state.gov.in
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz || true
    
    # Install on peer1.state.gov.in
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer1.state.gov.in:7051 \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz || true
    
    # Install on peer0.district.gov.in
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz || true
    
    # Install on peer1.district.gov.in
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer1.district.gov.in:9051 \
        cli peer lifecycle chaincode install ${CC_NAME}.tar.gz || true
    
    print_color "info" "Chaincode installation completed."
}

# Query installed chaincode
query_installed_chaincode() {
    print_color "info" "Querying installed chaincode..."
    
    # Query installed chaincode using CLI container
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer lifecycle chaincode queryinstalled > log.txt
    cat log.txt
    
    # Extract the package ID
    export CC_PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    
    print_color "info" "Package ID: ${CC_PACKAGE_ID}"
}

# Approve chaincode for organizations
approve_chaincode() {
    print_color "info" "Approving chaincode for organizations..."
    
    # Approve for StateElectionOffice
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer lifecycle chaincode approveformyorg -o orderer.election-commission.gov.in:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${CC_PACKAGE_ID} \
        --sequence ${CC_SEQUENCE} \
        --init-required
    
    # Approve for DistrictElectionOffice
    docker exec -e CORE_PEER_LOCALMSPID=DistrictElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.district.gov.in:9051 \
        cli peer lifecycle chaincode approveformyorg -o orderer.election-commission.gov.in:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id ${CC_PACKAGE_ID} \
        --sequence ${CC_SEQUENCE} \
        --init-required
    
    print_color "info" "Chaincode approved for organizations successfully."
}

# Check commit readiness
check_commit_readiness() {
    print_color "info" "Checking commit readiness..."
    
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer lifecycle chaincode checkcommitreadiness \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --sequence ${CC_SEQUENCE} \
        --init-required \
        --output json
    
    print_color "info" "Commit readiness checked successfully."
}

# Commit chaincode
commit_chaincode() {
    print_color "info" "Committing chaincode..."
    
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer lifecycle chaincode commit \
        -o orderer.election-commission.gov.in:7050 \
        --channelID ${CHANNEL_NAME} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --sequence ${CC_SEQUENCE} \
        --init-required \
        --peerAddresses peer0.state.gov.in:7051 \
        --peerAddresses peer0.district.gov.in:9051
    
    print_color "info" "Chaincode committed successfully."
}

# Initialize chaincode
init_chaincode() {
    print_color "info" "Initializing chaincode..."
    
    docker exec -e CORE_PEER_LOCALMSPID=StateElectionOfficeMSP \
        -e CORE_PEER_TLS_ENABLED=false \
        -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto-config/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp \
        -e CORE_PEER_ADDRESS=peer0.state.gov.in:7051 \
        cli peer chaincode invoke \
        -o orderer.election-commission.gov.in:7050 \
        -C ${CHANNEL_NAME} \
        -n ${CC_NAME} \
        --isInit \
        -c '{"function":"InitLedger","Args":[]}' \
        --peerAddresses peer0.state.gov.in:7051 \
        --peerAddresses peer0.district.gov.in:9051
    
    print_color "info" "Chaincode initialized successfully."
}

# Deploy identity chaincode
deploy_identity_chaincode() {
    print_color "info" "Deploying identity chaincode..."
    
    export CC_NAME="identity"
    package_chaincode
    install_chaincode
    query_installed_chaincode
    approve_chaincode
    check_commit_readiness
    commit_chaincode
    init_chaincode
    
    print_color "info" "Identity chaincode deployed successfully."
}

# Deploy voting chaincode
deploy_voting_chaincode() {
    print_color "info" "Deploying voting chaincode..."
    
    export CC_NAME="voting"
    package_chaincode
    install_chaincode
    query_installed_chaincode
    approve_chaincode
    check_commit_readiness
    commit_chaincode
    init_chaincode
    
    print_color "info" "Voting chaincode deployed successfully."
}

# Main function
main() {
    print_color "info" "Starting chaincode deployment for Blockchain-Based Voting System..."
    
    set_env_vars
    deploy_voting_chaincode
    
    print_color "info" "Chaincode deployment completed successfully."
}

# Run main function
main
