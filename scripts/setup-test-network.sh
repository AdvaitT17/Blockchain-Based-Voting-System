#!/bin/bash

# Setup Test Network for Blockchain-Based Voting System
# This script sets up a simplified test network for development and testing

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
    
    # If on Apple Silicon, set platform to linux/amd64
    if check_apple_silicon; then
        print_color "info" "Setting Docker platform to linux/amd64 for Apple Silicon compatibility"
        export DOCKER_DEFAULT_PLATFORM=${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    fi
    
    # Add bin directory to PATH
    export PATH=$PWD/bin:$PATH
    
    print_color "info" "Environment variables set successfully."
}

# Clean up existing network
clean_up() {
    print_color "info" "Cleaning up existing network..."
    
    # Stop and remove containers
    docker-compose -f blockchain/config/docker-compose.yaml down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove generated crypto materials
    rm -rf blockchain/organizations/ordererOrganizations
    rm -rf blockchain/organizations/peerOrganizations
    rm -rf blockchain/system-genesis-block
    rm -rf blockchain/channel-artifacts
    
    # Remove any existing docker networks
    docker network rm voting_network 2>/dev/null || true
    
    print_color "info" "Cleanup completed successfully."
}

# Create a simplified docker-compose file for the test network
create_test_network_config() {
    print_color "info" "Creating test network configuration..."
    
    mkdir -p blockchain/test-network
    
    # Create a simplified docker-compose.yaml file
    cat > blockchain/test-network/docker-compose.yaml << EOF
version: '2.4'

networks:
  test:
    name: fabric_test

volumes:
  orderer.example.com:
  peer0.org1.example.com:
  peer0.org2.example.com:

services:
  orderer.example.com:
    container_name: orderer.example.com
    image: hyperledger/fabric-orderer:${FABRIC_VERSION}
    platform: ${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_LISTENPORT=7050
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=false
      - ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:8443
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./channel-artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
      - ./crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp:/var/hyperledger/orderer/msp
      - orderer.example.com:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
      - 8443:8443
    networks:
      - test

  peer0.org1.example.com:
    container_name: peer0.org1.example.com
    image: hyperledger/fabric-peer:${FABRIC_VERSION}
    platform: ${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_test
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.org1.example.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org1.example.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9444
      - CORE_METRICS_PROVIDER=prometheus
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ./crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp:/etc/hyperledger/fabric/msp
      - peer0.org1.example.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 7051:7051
      - 9444:9444
    networks:
      - test

  peer0.org2.example.com:
    container_name: peer0.org2.example.com
    image: hyperledger/fabric-peer:${FABRIC_VERSION}
    platform: ${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_test
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_ID=peer0.org2.example.com
      - CORE_PEER_ADDRESS=peer0.org2.example.com:9051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:9051
      - CORE_PEER_CHAINCODEADDRESS=peer0.org2.example.com:9052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:9052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org2.example.com:9051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org2.example.com:9051
      - CORE_PEER_LOCALMSPID=Org2MSP
      - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9445
      - CORE_METRICS_PROVIDER=prometheus
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ./crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp:/etc/hyperledger/fabric/msp
      - peer0.org2.example.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 9051:9051
      - 9445:9445
    networks:
      - test

  cli:
    container_name: cli
    image: hyperledger/fabric-tools:${FABRIC_VERSION}
    platform: ${DOCKER_DEFAULT_PLATFORM:-linux/amd64}
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto
      - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
      - ./chaincode:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode
    networks:
      - test
EOF

    print_color "info" "Test network configuration created successfully."
}

# Generate crypto materials
generate_crypto_materials() {
    print_color "info" "Generating crypto materials..."
    
    mkdir -p blockchain/test-network/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp
    mkdir -p blockchain/test-network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp
    mkdir -p blockchain/test-network/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp
    mkdir -p blockchain/test-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    mkdir -p blockchain/test-network/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    
    # Create minimal MSP structure for each organization
    for org in ordererOrganizations/example.com/orderers/orderer.example.com \
               peerOrganizations/org1.example.com/peers/peer0.org1.example.com \
               peerOrganizations/org2.example.com/peers/peer0.org2.example.com \
               peerOrganizations/org1.example.com/users/Admin@org1.example.com \
               peerOrganizations/org2.example.com/users/Admin@org2.example.com; do
        mkdir -p blockchain/test-network/crypto-config/$org/msp/admincerts
        mkdir -p blockchain/test-network/crypto-config/$org/msp/cacerts
        mkdir -p blockchain/test-network/crypto-config/$org/msp/keystore
        mkdir -p blockchain/test-network/crypto-config/$org/msp/signcerts
        mkdir -p blockchain/test-network/crypto-config/$org/msp/tlscacerts
        
        # Create dummy files for MSP structure
        echo "dummy" > blockchain/test-network/crypto-config/$org/msp/admincerts/dummy.pem
        echo "dummy" > blockchain/test-network/crypto-config/$org/msp/cacerts/ca.example.com-cert.pem
        echo "dummy" > blockchain/test-network/crypto-config/$org/msp/keystore/priv_sk
        echo "dummy" > blockchain/test-network/crypto-config/$org/msp/signcerts/cert.pem
        echo "dummy" > blockchain/test-network/crypto-config/$org/msp/tlscacerts/tlsca.example.com-cert.pem
    done
    
    # Create channel artifacts directory
    mkdir -p blockchain/test-network/channel-artifacts
    echo "dummy" > blockchain/test-network/channel-artifacts/genesis.block
    
    # Create chaincode directory
    mkdir -p blockchain/test-network/chaincode
    
    print_color "info" "Crypto materials generated successfully."
}

# Start the test network
start_test_network() {
    print_color "info" "Starting the test network..."
    
    cd blockchain/test-network
    docker-compose up -d
    cd ../..
    
    print_color "info" "Test network started successfully."
}

# Create a connection profile for the backend
create_connection_profile() {
    print_color "info" "Creating connection profile for the backend..."
    
    mkdir -p blockchain/test-network/connection-profile
    
    cat > blockchain/test-network/connection-profile/connection-profile.json << EOF
{
    "name": "test-network",
    "version": "1.0.0",
    "client": {
        "organization": "Org1",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpc://localhost:7051",
            "tlsCACerts": {
                "pem": ""
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com",
                "hostnameOverride": "peer0.org1.example.com"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "http://localhost:7054",
            "caName": "ca-org1",
            "tlsCACerts": {
                "pem": ""
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF

    # Copy the connection profile to the backend directory
    cp blockchain/test-network/connection-profile/connection-profile.json backend/utils/
    
    print_color "info" "Connection profile created successfully."
}

# Create a wallet for the backend
create_wallet() {
    print_color "info" "Creating wallet for the backend..."
    
    mkdir -p blockchain/test-network/wallet
    
    # Create a dummy identity for testing
    mkdir -p blockchain/test-network/wallet/admin
    
    cat > blockchain/test-network/wallet/admin/credentials.json << EOF
{
    "credentials": {
        "certificate": "-----BEGIN CERTIFICATE-----\\nMIICKDCCAc+gAwIBAgIUBEVwsSx0TmqdbzNwleNBBzoIT0wwCgYIKoZIzj0EAwIw\\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMTAyMTIyNDAwWhcNMzAwMTAyMTIy\\nNDAwWjBCMTAwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMBIGA1UECxMLZGVw\\nYXJ0bWVudDExDjAMBgNVBAMTBXVzZXIxMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD\\nQgAEHl6T0NBcV+kpYwbUARvK3UlyDV9/mH7L2Urb3e/WVWznYjrZSY3Ry7ZBfP5f\\nZTQpHVHUJXI9ulPmXGWYYj2QLKOBpzCBpDAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0T\\nAQH/BAIwADAdBgNVHQ4EFgQUwNTnngkCf1OE4BuQkZw7t26ylw0wKwYDVR0jBCQw\\nIoAgQ3hSDt2ktmSXZrQ6AZ2YCYJGnYWjV3FPWXwJlULX99kwaAYIKgMEBQYHCAEE\\nXHsiYXR0cnMiOnsiaGYuQWZmaWxpYXRpb24iOiJvcmcxLmRlcGFydG1lbnQxIiwi\\naGYuRW5yb2xsbWVudElEIjoidXNlcjEiLCJoZi5UeXBlIjoiY2xpZW50In19MAoG\\nCCqGSM49BAMCA0cAMEQCIEPa8JMSKnpo/GcTWPV4gA9j7PwcWKrKbLNEFtNSj5hZ\\nAiAO7tGC7Gp9A4yYSTgkZTABOLlZGfPNAyKNnMI0GKrKUw==\\n-----END CERTIFICATE-----\\n",
        "privateKey": "-----BEGIN PRIVATE KEY-----\\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgXa3mln4anewXtqrM\\nhMw6mfZhslkRa/j9P790ToKjlsihRANCAARnxLhXvU4EmnIwhVl3Bw0K0yDc5b5g\\nwlL4o9fgFOXowTv6qXZ1KCNjcKYgJwG5nnP2nz7W3fID9HXY9Q+H6Xwn\\n-----END PRIVATE KEY-----\\n"
    },
    "mspId": "Org1MSP",
    "type": "X.509",
    "version": 1
}
EOF

    # Copy the wallet to the backend directory
    cp -r blockchain/test-network/wallet backend/
    
    print_color "info" "Wallet created successfully."
}

# Update backend environment variables
update_backend_env() {
    print_color "info" "Updating backend environment variables..."
    
    # Update the .env file for the backend APIs
    cat > backend/identity-api/.env << EOF
# Identity API Environment Variables
PORT=3001
JWT_SECRET=identity_api_secret_key
REDIS_URL=redis://localhost:6379
FABRIC_CONNECTION_PROFILE=../utils/connection-profile.json
FABRIC_WALLET_PATH=../wallet
FABRIC_CHANNEL_NAME=votingchannel
FABRIC_CHAINCODE_NAME=identity
FABRIC_USER_ID=admin
EOF

    cat > backend/admin-api/.env << EOF
# Admin API Environment Variables
PORT=3002
JWT_SECRET=admin_api_secret_key
REDIS_URL=redis://localhost:6379
FABRIC_CONNECTION_PROFILE=../utils/connection-profile.json
FABRIC_WALLET_PATH=../wallet
FABRIC_CHANNEL_NAME=votingchannel
FABRIC_CHAINCODE_NAME=voting
FABRIC_USER_ID=admin
EOF

    cat > backend/voter-api/.env << EOF
# Voter API Environment Variables
PORT=3003
JWT_SECRET=voter_api_secret_key
REDIS_URL=redis://localhost:6379
FABRIC_CONNECTION_PROFILE=../utils/connection-profile.json
FABRIC_WALLET_PATH=../wallet
FABRIC_CHANNEL_NAME=votingchannel
FABRIC_CHAINCODE_NAME=voting
FABRIC_USER_ID=admin
EOF

    print_color "info" "Backend environment variables updated successfully."
}

# Main function
main() {
    print_color "info" "Starting test network setup for Blockchain-Based Voting System..."
    
    set_env_vars
    clean_up
    create_test_network_config
    generate_crypto_materials
    start_test_network
    create_connection_profile
    create_wallet
    update_backend_env
    
    print_color "info" "Test network setup completed successfully."
    print_color "info" "You can now start the backend APIs and frontend applications."
}

# Run main function
main
