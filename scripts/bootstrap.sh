#!/bin/bash

# Bootstrap script for Blockchain-Based Voting System
# This script downloads Hyperledger Fabric binaries and Docker images
# with special handling for M1/M2 Macs using Rosetta 2

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

# Check prerequisites
check_prerequisites() {
    print_color "info" "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_color "error" "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_color "error" "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_color "error" "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check Go
    if ! command -v go &> /dev/null; then
        print_color "error" "Go is not installed. Please install Go first."
        exit 1
    fi
    
    print_color "info" "All prerequisites are installed."
}

# Download Fabric binaries and Docker images
download_fabric() {
    print_color "info" "Downloading Hyperledger Fabric binaries and Docker images..."
    
    # Create temporary directory
    mkdir -p temp
    cd temp
    
    # Download Fabric binaries script
    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh -o fabric-bootstrap.sh
    
    # Make it executable
    chmod +x fabric-bootstrap.sh
    
    # Set environment variables for Fabric version
    export FABRIC_VERSION=2.4.7
    export CA_VERSION=1.5.5
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=linux/amd64
    fi
    
    # Run Fabric bootstrap script
    ./fabric-bootstrap.sh
    
    # Move binaries to project bin directory
    cd ..
    mkdir -p bin
    cp -r temp/bin/* bin/
    
    # Clean up
    rm -rf temp
    
    print_color "info" "Hyperledger Fabric binaries and Docker images downloaded successfully."
}

# Create configuration files
create_config_files() {
    print_color "info" "Creating configuration files..."
    
    # Create .env file
    cat > .env << EOL
# Environment variables for Blockchain-Based Voting System
COMPOSE_PROJECT_NAME=blockchain_voting
FABRIC_VERSION=2.4.7
CA_VERSION=1.5.5
DOCKER_DEFAULT_PLATFORM=linux/amd64
EOL
    
    print_color "info" "Configuration files created successfully."
}

# Main function
main() {
    print_color "info" "Starting bootstrap process for Blockchain-Based Voting System..."
    
    check_prerequisites
    download_fabric
    create_config_files
    
    print_color "info" "Bootstrap process completed successfully."
    print_color "info" "You can now start the network using ./scripts/start-network.sh"
}

# Run main function
main
