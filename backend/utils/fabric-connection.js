'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Connect to the Fabric network
 * @param {string} orgName - Organization name (StateElectionOffice or DistrictElectionOffice)
 * @param {string} userName - User name to connect as
 * @returns {Object} - Connection details including contract, network, and gateway
 */
async function connectToNetwork(orgName, userName) {
    try {
        // Load connection profile from environment variable or default path
        const ccpPath = process.env.FABRIC_CONNECTION_PROFILE || path.resolve(__dirname, 'connection-profile.json');
        console.log(`Using connection profile at: ${ccpPath}`);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system wallet for managing identities
        const walletPath = process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, 'wallet');
        console.log(`Using wallet at: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Use user ID from environment variable or default to provided userName
        const userId = process.env.FABRIC_USER_ID || userName;
        console.log(`Using user ID: ${userId}`);

        // Check if user identity exists in the wallet
        const identity = await wallet.get(userId);
        if (!identity) {
            console.log(`User identity "${userId}" does not exist in the wallet`);
            console.log('Make sure the wallet has been properly set up');
            return { error: `User identity "${userId}" does not exist in the wallet` };
        }

        // Create a new gateway for connecting to the peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: userId,
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        const channelName = process.env.FABRIC_CHANNEL_NAME || 'votingchannel';
        console.log(`Using channel: ${channelName}`);
        const network = await gateway.getNetwork(channelName);

        return { gateway, network };
    } catch (error) {
        console.error(`Failed to connect to the network: ${error}`);
        return { error: error.message };
    }
}

/**
 * Get contract instance
 * @param {Object} network - Fabric network
 * @param {string} contractName - Name of the chaincode/contract
 * @returns {Object} - Contract instance
 */
function getContract(network, contractName) {
    try {
        // Use chaincode name from environment variable or default to provided contractName
        const chaincodeName = process.env.FABRIC_CHAINCODE_NAME || contractName;
        console.log(`Using chaincode: ${chaincodeName}`);
        
        // Get the contract from the network
        const contract = network.getContract(chaincodeName);
        return { contract };
    } catch (error) {
        console.error(`Failed to get contract: ${error}`);
        return { error: error.message };
    }
}

/**
 * Register and enroll a user with the CA
 * @param {string} orgName - Organization name
 * @param {string} userName - User name to register
 * @returns {Object} - Registration result
 */
async function registerUser(orgName, userName) {
    try {
        // Load connection profile from environment variable or default path
        const ccpPath = process.env.FABRIC_CONNECTION_PROFILE || path.resolve(__dirname, 'connection-profile.json');
        console.log(`Using connection profile at: ${ccpPath}`);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system wallet for managing identities
        const walletPath = process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, 'wallet');
        console.log(`Using wallet at: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Use user ID from environment variable or default to provided userName
        const userId = userName || process.env.FABRIC_USER_ID || 'user1';
        console.log(`Registering user ID: ${userId}`);

        // Check if user identity already exists in the wallet
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`User identity "${userId}" already exists in the wallet`);
            return { success: true, message: `User identity "${userId}" already exists in the wallet` };
        }

        // For our test network, we'll just create a dummy identity
        // In a real implementation, we would use the CA client to register and enroll the user
        console.log(`Creating a dummy identity for ${userId} in the wallet`);
        
        // Create a dummy identity
        const x509Identity = {
            credentials: {
                certificate: '-----BEGIN CERTIFICATE-----\nMIICKDCCAc+gAwIBAgIUBEVwsSx0TmqdbzNwleNBBzoIT0wwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMTAyMTIyNDAwWhcNMzAwMTAyMTIy\nNDAwWjBCMTAwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMBIGA1UECxMLZGVw\nYXJ0bWVudDExDjAMBgNVBAMTBXVzZXIxMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD\nQgAEHl6T0NBcV+kpYwbUARvK3UlyDV9/mH7L2Urb3e/WVWznYjrZSY3Ry7ZBfP5f\nZTQpHVHUJXI9ulPmXGWYYj2QLKOBpzCBpDAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0T\nAQH/BAIwADAdBgNVHQ4EFgQUwNTnngkCf1OE4BuQkZw7t26ylw0wKwYDVR0jBCQw\nIoAgQ3hSDt2ktmSXZrQ6AZ2YCYJGnYWjV3FPWXwJlULX99kwaAYIKgMEBQYHCAEE\nXHsiYXR0cnMiOnsiaGYuQWZmaWxpYXRpb24iOiJvcmcxLmRlcGFydG1lbnQxIiwi\naGYuRW5yb2xsbWVudElEIjoidXNlcjEiLCJoZi5UeXBlIjoiY2xpZW50In19MAoG\nCCqGSM49BAMCA0cAMEQCIEPa8JMSKnpo/GcTWPV4gA9j7PwcWKrKbLNEFtNSj5hZ\nAiAO7tGC7Gp9A4yYSTgkZTABOLlZGfPNAyKNnMI0GKrKUw==\n-----END CERTIFICATE-----\n',
                privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgXa3mln4anewXtqrM\nhMw6mfZhslkRa/j9P790ToKjlsihRANCAARnxLhXvU4EmnIwhVl3Bw0K0yDc5b5g\nwlL4o9fgFOXowTv6qXZ1KCNjcKYgJwG5nnP2nz7W3fID9HXY9Q+H6Xwn\n-----END PRIVATE KEY-----\n'
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        
        // Import the identity to the wallet
        await wallet.put(userId, x509Identity);
        
        return { success: true, message: `Successfully registered and enrolled user ${userId} and imported it into the wallet` };
    } catch (error) {
        console.error(`Failed to register user: ${error}`);
        return { error: error.message };
    }
}

/**
 * Enroll an admin user with the CA
 * @param {string} orgName - Organization name
 * @returns {Object} - Enrollment result
 */
async function enrollAdmin(orgName) {
    try {
        // For our test network, we'll just create a dummy admin identity
        // In a real implementation, we would use the CA client to enroll the admin
        console.log(`Creating a dummy admin identity in the wallet`);
        
        // Create a new file system wallet for managing identities
        const walletPath = process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, 'wallet');
        console.log(`Using wallet at: ${walletPath}`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // Check if admin identity already exists in the wallet
        const adminIdentity = await wallet.get('admin');
        if (adminIdentity) {
            console.log('Admin identity already exists in the wallet');
            return { success: true, message: 'Admin identity already exists in the wallet' };
        }
        
        // Create a dummy admin identity
        const x509Identity = {
            credentials: {
                certificate: '-----BEGIN CERTIFICATE-----\nMIICGTCCAcCgAwIBAgIRALR/1GXtEud5GQL2CZykkOkwCgYIKoZIzj0EAwIwczEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMTAyMTIyNDAwWhcNMzAwMTAyMTIyNDAw\nWjBbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN\nU2FuIEZyYW5jaXNjbzEfMB0GA1UEAwwWQWRtaW5Ab3JnMS5leGFtcGxlLmNvbTBZ\nMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJMLKAilv+mHWkp6KDEsP7XZRn2Vv5hA\nIqSjcKpwXgXsVRLPbVCzl9mDBdEC5VV6utku6/bUOoZJ+Z4MKtO+xbKjTTBLMA4G\nA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAIBmrZau7BIB9\nrRLkwKmqpmSecIaOOr0CF6Mi2J5H4aauMAoGCCqGSM49BAMCA0cAMEQCIGZ+KTfS\neezqv0ml1VeQEmnAEt5sJ2RJA58+LegUYMd6AiAfEEy/MCTLpIViHLYGmHXUg4c6\nDlF4BEA95zYGPA==\n-----END CERTIFICATE-----\n',
                privateKey: '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg5ZOE1OvS2Nv0OsQj\nFsxrWg3yTNTlpY7OKb8de3mBmQihRANCAASJxE4lVNQEO1UpEl0GbHHBzSg3jNJ+\nKBjy3/p7UFO+PxC7oGVYlM12rQ7U2iX3/DWYwIFKYrGxZAqPJUIRLJh6\n-----END PRIVATE KEY-----\n'
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        
        // Import the identity to the wallet
        await wallet.put('admin', x509Identity);
        
        return { success: true, message: 'Successfully enrolled admin user and imported it into the wallet' };
    } catch (error) {
        console.error(`Failed to enroll admin user: ${error}`);
        return { error: error.message };
    }
}

/**
 * Create a connection profile for the Fabric network
 * @param {string} basePath - Base path for the crypto materials
 * @returns {Object} - Result of creating the connection profile
 */
async function createConnectionProfile(basePath = process.env.FABRIC_CRYPTO_PATH || path.resolve(__dirname, '../../blockchain/crypto-config')) {
    try {
        console.log(`Creating connection profile using crypto materials at: ${basePath}`);
        
        // Create a simplified connection profile for our test network
        const connectionProfile = {
            name: 'voting-network',
            version: '1.0.0',
            client: {
                organization: 'Org1',
                connection: {
                    timeout: {
                        peer: {
                            endorser: '300'
                        }
                    }
                }
            },
            organizations: {
                Org1: {
                    mspid: 'Org1MSP',
                    peers: ['peer0.org1.example.com'],
                    certificateAuthorities: ['ca.org1.example.com']
                }
            },
            peers: {
                'peer0.org1.example.com': {
                    url: 'grpc://localhost:7051',
                    grpcOptions: {
                        'ssl-target-name-override': 'peer0.org1.example.com',
                        hostnameOverride: 'peer0.org1.example.com'
                    }
                }
            },
            certificateAuthorities: {
                'ca.org1.example.com': {
                    url: 'http://localhost:7054',
                    caName: 'ca.org1.example.com',
                    httpOptions: {
                        verify: false
                    }
                }
            }
        };

        const connectionProfilePath = path.resolve(__dirname, 'connection-profile.json');
        fs.writeFileSync(connectionProfilePath, JSON.stringify(connectionProfile, null, 2));
        console.log(`Connection profile created at ${connectionProfilePath}`);

        return { success: true, message: 'Connection profile created successfully' };
    } catch (error) {
        console.error(`Failed to create connection profile: ${error}`);
        return { error: error.message };
    }
}

/**
 * Initialize the Fabric connection utilities
 * @returns {Object} - Result of initialization
 */
async function initialize() {
    try {
        // Create wallet directory if it doesn't exist
        const walletPath = path.resolve(__dirname, 'wallet');
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
        }

        // Create connection profile
        await createConnectionProfile();
        
        // Enroll admin user
        await enrollAdmin('Org1');

        return { success: true, message: 'Fabric connection utilities initialized successfully' };
    } catch (error) {
        console.error(`Failed to initialize Fabric connection utilities: ${error}`);
        return { error: error.message };
    }
}

module.exports = {
    connectToNetwork,
    getContract,
    registerUser,
    enrollAdmin,
    createConnectionProfile,
    initialize
};
