#!/bin/bash

# Script to update the hosts file in each container with the IP addresses of all containers
# This helps resolve hostname resolution issues in the Hyperledger Fabric network

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

# Get container IP addresses
get_container_ips() {
    print_color "info" "Getting container IP addresses..."
    
    # Get orderer container IP
    ORDERER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' orderer.election-commission.gov.in)
    print_color "info" "Orderer IP: $ORDERER_IP"
    
    # Get peer container IPs
    PEER0_STATE_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' peer0.state.gov.in)
    print_color "info" "Peer0 State IP: $PEER0_STATE_IP"
    
    PEER1_STATE_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' peer1.state.gov.in)
    print_color "info" "Peer1 State IP: $PEER1_STATE_IP"
    
    PEER0_DISTRICT_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' peer0.district.gov.in)
    print_color "info" "Peer0 District IP: $PEER0_DISTRICT_IP"
    
    PEER1_DISTRICT_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' peer1.district.gov.in)
    print_color "info" "Peer1 District IP: $PEER1_DISTRICT_IP"
}

# Update hosts file in each container
update_hosts_files() {
    print_color "info" "Updating hosts file in each container..."
    
    # Create hosts entries
    HOSTS_ENTRIES="$ORDERER_IP orderer.election-commission.gov.in
$PEER0_STATE_IP peer0.state.gov.in
$PEER1_STATE_IP peer1.state.gov.in
$PEER0_DISTRICT_IP peer0.district.gov.in
$PEER1_DISTRICT_IP peer1.district.gov.in"
    
    # Update hosts file in orderer container
    print_color "info" "Updating hosts file in orderer container..."
    docker exec orderer.election-commission.gov.in bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    # Update hosts file in peer containers
    print_color "info" "Updating hosts file in peer0.state.gov.in container..."
    docker exec peer0.state.gov.in bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    print_color "info" "Updating hosts file in peer1.state.gov.in container..."
    docker exec peer1.state.gov.in bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    print_color "info" "Updating hosts file in peer0.district.gov.in container..."
    docker exec peer0.district.gov.in bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    print_color "info" "Updating hosts file in peer1.district.gov.in container..."
    docker exec peer1.district.gov.in bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    # Update hosts file in CLI container
    print_color "info" "Updating hosts file in CLI container..."
    docker exec cli bash -c "echo -e '$HOSTS_ENTRIES' >> /etc/hosts"
    
    print_color "info" "Hosts files updated successfully."
}

# Verify hosts file in each container
verify_hosts_files() {
    print_color "info" "Verifying hosts file in each container..."
    
    # Verify hosts file in orderer container
    print_color "info" "Verifying hosts file in orderer container..."
    docker exec orderer.election-commission.gov.in cat /etc/hosts
    
    # Verify hosts file in CLI container
    print_color "info" "Verifying hosts file in CLI container..."
    docker exec cli cat /etc/hosts
    
    print_color "info" "Hosts files verified successfully."
}

# Main function
main() {
    print_color "info" "Starting hosts file update for Hyperledger Fabric network..."
    
    get_container_ips
    update_hosts_files
    verify_hosts_files
    
    print_color "info" "Hosts file update completed successfully."
}

# Run main function
main
