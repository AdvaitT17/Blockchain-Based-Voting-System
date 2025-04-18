#!/bin/bash

# Script to set up Admin certificates for Hyperledger Fabric network
# This script creates the necessary Admin certificates for both organizations

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

# Create directories for Admin certificates
create_admin_dirs() {
    print_color "info" "Creating directories for Admin certificates..."
    
    # Create base directories first
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations"
    
    # StateElectionOffice organization
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/keystore"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/signcerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/tlscacerts"
    
    # DistrictElectionOffice organization
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/keystore"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/signcerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/tlscacerts"
    
    print_color "info" "Directories created successfully."
}

# Create Admin certificates
create_admin_certs() {
    print_color "info" "Creating Admin certificates..."
    
    # Check if User1 certificates exist for StateElectionOffice organization
    if [ ! -f "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/User1@state.gov.in/msp/signcerts/User1@state.gov.in-cert.pem" ]; then
        print_color "error" "User1 certificate not found for StateElectionOffice organization"
        print_color "info" "Please run generate-crypto.sh first to create the necessary certificates"
        exit 1
    fi
    
    # Check if User1 certificates exist for DistrictElectionOffice organization
    if [ ! -f "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/User1@district.gov.in/msp/signcerts/User1@district.gov.in-cert.pem" ]; then
        print_color "error" "User1 certificate not found for DistrictElectionOffice organization"
        print_color "info" "Please run generate-crypto.sh first to create the necessary certificates"
        exit 1
    fi
    
    # Copy User1 certificates to Admin certificates for StateElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/User1@state.gov.in/msp/signcerts/User1@state.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/signcerts/Admin@state.gov.in-cert.pem"
    
    # Copy User1 private key to Admin private key for StateElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/User1@state.gov.in/msp/keystore"/* \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/keystore/priv_sk"
    
    # Copy User1 certificates to Admin certificates for DistrictElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/User1@district.gov.in/msp/signcerts/User1@district.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/signcerts/Admin@district.gov.in-cert.pem"
    
    # Copy User1 private key to Admin private key for DistrictElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/User1@district.gov.in/msp/keystore"/* \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/keystore/priv_sk"
    
    # Copy CA certificates to cacerts and tlscacerts directories for StateElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/cacerts/ca.state.gov.in-cert.pem"
    
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/tlscacerts/ca.state.gov.in-cert.pem"
    
    # Copy CA certificates to cacerts and tlscacerts directories for DistrictElectionOffice organization
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/cacerts/ca.district.gov.in-cert.pem"
    
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" \
       "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/tlscacerts/ca.district.gov.in-cert.pem"
    
    print_color "info" "Admin certificates created successfully."
}

# Create config.yaml files
create_config_yaml() {
    print_color "info" "Creating config.yaml files..."
    
    # Create config.yaml for StateElectionOffice organization
    cat > "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/users/Admin@state.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.state.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.state.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.state.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.state.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
    
    # Create config.yaml for DistrictElectionOffice organization
    cat > "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/users/Admin@district.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.district.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.district.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.district.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.district.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
    
    print_color "info" "Config.yaml files created successfully."
}

# Main function
main() {
    print_color "info" "Starting Admin certificate setup for Blockchain-Based Voting System..."
    
    create_admin_dirs
    create_admin_certs
    create_config_yaml
    
    print_color "info" "Admin certificate setup completed successfully."
}

# Run main function
main
