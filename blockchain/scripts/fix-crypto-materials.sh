#!/bin/bash

# Fix crypto materials for the Blockchain-Based Voting System
# This script ensures all necessary crypto materials are properly generated and structured

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

# Create directory structure for orderer organization
create_orderer_org() {
    print_color "info" "Creating directory structure for orderer organization..."
    
    # Create main directories
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/tlscacerts"
    
    # Create orderer directories
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/keystore"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/signcerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/tls"
    
    # Create users directories
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/keystore"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/signcerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/tlscacerts"
    
    print_color "info" "Directory structure for orderer organization created successfully."
}

# Create directory structure for peer organizations
create_peer_orgs() {
    print_color "info" "Creating directory structure for peer organizations..."
    
    # Create state.gov.in organization
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/msp/tlscacerts"
    
    # Create peers for state.gov.in
    for peer in peer0 peer1; do
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/admincerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/cacerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/keystore"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/signcerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/tlscacerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/tls"
    done
    
    # Create district.gov.in organization
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/msp/admincerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/msp/cacerts"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/msp/tlscacerts"
    
    # Create peers for district.gov.in
    for peer in peer0 peer1; do
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/admincerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/cacerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/keystore"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/signcerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/tlscacerts"
        mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/tls"
    done
    
    print_color "info" "Directory structure for peer organizations created successfully."
}

# Generate crypto materials
generate_crypto_materials() {
    print_color "info" "Generating crypto materials..."
    
    # Create CA certificates
    mkdir -p "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca"
    mkdir -p "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca"
    
    # Generate CA certificates
    openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-key.pem" 2048
    openssl req -new -key "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-key.pem" -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=election-commission.gov.in/CN=ca.election-commission.gov.in"
    
    openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-key.pem" 2048
    openssl req -new -key "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-key.pem" -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=state.gov.in/CN=ca.state.gov.in"
    
    openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-key.pem" 2048
    openssl req -new -key "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-key.pem" -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=district.gov.in/CN=ca.district.gov.in"
    
    # Copy CA certificates to appropriate locations
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/cacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/tlscacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/cacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/tlscacerts/"
    
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/msp/cacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/msp/tlscacerts/"
    
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/msp/cacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/msp/tlscacerts/"
    
    # Generate orderer certificates
    openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/keystore/priv_sk" 2048
    openssl req -new -key "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/keystore/priv_sk" -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/signcerts/orderer.election-commission.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=election-commission.gov.in/CN=orderer.election-commission.gov.in"
    
    # Generate peer certificates for state.gov.in
    for peer in peer0 peer1; do
        openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/keystore/priv_sk" 2048
        openssl req -new -key "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/keystore/priv_sk" -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/signcerts/$peer.state.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=state.gov.in/CN=$peer.state.gov.in"
        
        cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/cacerts/"
        cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/ca/ca.state.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/state.gov.in/peers/$peer.state.gov.in/msp/tlscacerts/"
    done
    
    # Generate peer certificates for district.gov.in
    for peer in peer0 peer1; do
        openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/keystore/priv_sk" 2048
        openssl req -new -key "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/keystore/priv_sk" -out "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/signcerts/$peer.district.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=district.gov.in/CN=$peer.district.gov.in"
        
        cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/cacerts/"
        cp "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/ca/ca.district.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/peerOrganizations/district.gov.in/peers/$peer.district.gov.in/msp/tlscacerts/"
    done
    
    # Generate Admin certificates
    openssl genrsa -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/keystore/priv_sk" 2048
    openssl req -new -key "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/keystore/priv_sk" -out "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/signcerts/Admin@election-commission.gov.in-cert.pem" -x509 -days 3650 -subj "/C=US/ST=California/L=San Francisco/O=election-commission.gov.in/CN=Admin@election-commission.gov.in"
    
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/cacerts/"
    cp "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/ca/ca.election-commission.gov.in-cert.pem" "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/tlscacerts/"
    
    print_color "info" "Crypto materials generated successfully."
}

# Create config.yaml files
create_config_yaml() {
    print_color "info" "Creating config.yaml files..."
    
    # Create config.yaml for orderer organization
    cat > "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
    
    # Create config.yaml for orderer
    cat > "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/orderers/orderer.election-commission.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
    
    # Create config.yaml for Admin
    cat > "$BLOCKCHAIN_DIR/organizations/ordererOrganizations/election-commission.gov.in/users/Admin@election-commission.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.election-commission.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
    
    # Create config.yaml for peer organizations
    for org in state district; do
        cat > "$BLOCKCHAIN_DIR/organizations/peerOrganizations/$org.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
        
        # Create config.yaml for peers
        for peer in peer0 peer1; do
            cat > "$BLOCKCHAIN_DIR/organizations/peerOrganizations/$org.gov.in/peers/$peer.$org.gov.in/msp/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.$org.gov.in-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
        done
    done
    
    print_color "info" "Config.yaml files created successfully."
}

# Main function
main() {
    print_color "info" "Starting crypto materials fix for Blockchain-Based Voting System..."
    
    create_orderer_org
    create_peer_orgs
    generate_crypto_materials
    create_config_yaml
    
    print_color "info" "Crypto materials fix completed successfully."
}

# Run main function
main
