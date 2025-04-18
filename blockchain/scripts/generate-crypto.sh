#!/bin/bash

# Generate crypto materials for the Blockchain-Based Voting System
# This script generates the crypto materials for the organizations

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
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PWD/../../bin:$PATH
    
    print_color "info" "Environment variables set successfully."
}

# Create directories for crypto materials
create_crypto_dirs() {
    print_color "info" "Creating directories for crypto materials..."
    
    mkdir -p ../organizations/fabric-ca/election-commission
    mkdir -p ../organizations/fabric-ca/state
    mkdir -p ../organizations/fabric-ca/district
    
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/msp/cacerts
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/tls
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer2.election-commission.gov.in/msp
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer2.election-commission.gov.in/tls
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer3.election-commission.gov.in/msp
    mkdir -p ../organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer3.election-commission.gov.in/tls
    
    mkdir -p ../organizations/peerOrganizations/state.gov.in/msp/cacerts
    mkdir -p ../organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/msp
    mkdir -p ../organizations/peerOrganizations/state.gov.in/peers/peer0.state.gov.in/tls
    mkdir -p ../organizations/peerOrganizations/state.gov.in/peers/peer1.state.gov.in/msp
    mkdir -p ../organizations/peerOrganizations/state.gov.in/peers/peer1.state.gov.in/tls
    mkdir -p ../organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp
    
    mkdir -p ../organizations/peerOrganizations/district.gov.in/msp/cacerts
    mkdir -p ../organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/msp
    mkdir -p ../organizations/peerOrganizations/district.gov.in/peers/peer0.district.gov.in/tls
    mkdir -p ../organizations/peerOrganizations/district.gov.in/peers/peer1.district.gov.in/msp
    mkdir -p ../organizations/peerOrganizations/district.gov.in/peers/peer1.district.gov.in/tls
    mkdir -p ../organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp
    
    mkdir -p ../system-genesis-block
    mkdir -p ../channel-artifacts
    
    print_color "info" "Directories created successfully."
}

# Generate crypto materials using cryptogen
generate_crypto() {
    print_color "info" "Generating crypto materials using cryptogen..."
    
    # Check if cryptogen is available
    if ! command -v cryptogen &> /dev/null; then
        print_color "error" "cryptogen command not found. Make sure Hyperledger Fabric binaries are installed."
        exit 1
    fi
    
    # Generate crypto materials using crypto-config.yaml
    cryptogen generate --config=../config/crypto-config.yaml --output="../organizations"
    
    print_color "info" "Crypto materials generated successfully."
}

# Create genesis block
create_genesis_block() {
    print_color "info" "Creating genesis block..."
    
    # Check if configtxgen is available
    if ! command -v configtxgen &> /dev/null; then
        print_color "error" "configtxgen command not found. Make sure Hyperledger Fabric binaries are installed."
        exit 1
    fi
    
    # Set FABRIC_CFG_PATH to the directory containing configtx.yaml
    export FABRIC_CFG_PATH=$PWD/../config
    
    # Create a simple configtx.yaml file that doesn't rely on TLS certificates
    cat > "$FABRIC_CFG_PATH/simple-configtx.yaml" << 'EOF'
---
Organizations:
    - &OrdererOrg
        Name: ElectionCommissionMSP
        ID: ElectionCommissionMSP
        MSPDir: ../organizations/ordererOrganizations/election-commission.gov.in/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('ElectionCommissionMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('ElectionCommissionMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('ElectionCommissionMSP.admin')"

    - &StateElectionOffice
        Name: StateElectionOfficeMSP
        ID: StateElectionOfficeMSP
        MSPDir: ../organizations/peerOrganizations/state.gov.in/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('StateElectionOfficeMSP.admin', 'StateElectionOfficeMSP.peer', 'StateElectionOfficeMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('StateElectionOfficeMSP.admin', 'StateElectionOfficeMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('StateElectionOfficeMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('StateElectionOfficeMSP.peer')"

    - &DistrictElectionOffice
        Name: DistrictElectionOfficeMSP
        ID: DistrictElectionOfficeMSP
        MSPDir: ../organizations/peerOrganizations/district.gov.in/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('DistrictElectionOfficeMSP.admin', 'DistrictElectionOfficeMSP.peer', 'DistrictElectionOfficeMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('DistrictElectionOfficeMSP.admin', 'DistrictElectionOfficeMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('DistrictElectionOfficeMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('DistrictElectionOfficeMSP.peer')"

Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Orderer: &OrdererCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_0: true

Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
    Capabilities:
        <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
    OrdererType: solo
    Addresses:
        - orderer.election-commission.gov.in:7050
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"

Channel: &ChannelDefaults
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
    Capabilities:
        <<: *ChannelCapabilities

Profiles:
    VotingOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            VotingConsortium:
                Organizations:
                    - *StateElectionOffice
                    - *DistrictElectionOffice

    VotingChannel:
        Consortium: VotingConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *StateElectionOffice
                - *DistrictElectionOffice
            Capabilities:
                <<: *ApplicationCapabilities
EOF
    
    # Create genesis block for the ordering service using the simple config
    configtxgen -configPath $FABRIC_CFG_PATH -profile VotingOrdererGenesis -channelID system-channel -outputBlock ../system-genesis-block/genesis.block
    
    print_color "info" "Genesis block created successfully."
}

# Create channel transaction
create_channel_tx() {
    print_color "info" "Creating channel transaction..."
    
    # Set FABRIC_CFG_PATH to the directory containing simple-configtx.yaml
    export FABRIC_CFG_PATH=$PWD/../config
    
    # Create channel transaction for the voting channel
    configtxgen -configPath $FABRIC_CFG_PATH -profile VotingChannel -outputCreateChannelTx ../channel-artifacts/votingchannel.tx -channelID votingchannel
    
    # Create anchor peer transactions for each organization
    configtxgen -configPath $FABRIC_CFG_PATH -profile VotingChannel -outputAnchorPeersUpdate ../channel-artifacts/StateElectionOfficeMSPanchors.tx -channelID votingchannel -asOrg StateElectionOfficeMSP
    configtxgen -configPath $FABRIC_CFG_PATH -profile VotingChannel -outputAnchorPeersUpdate ../channel-artifacts/DistrictElectionOfficeMSPanchors.tx -channelID votingchannel -asOrg DistrictElectionOfficeMSP
    
    print_color "info" "Channel transaction created successfully."
}

# Main function
main() {
    print_color "info" "Starting crypto material generation for Blockchain-Based Voting System..."
    
    set_env_vars
    create_crypto_dirs
    generate_crypto
    create_genesis_block
    create_channel_tx
    
    print_color "info" "Crypto material generation completed successfully."
}

# Run main function
main
