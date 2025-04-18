/**
 * Fabric Connection Pool Utility
 * Manages a pool of connections to the Hyperledger Fabric network
 * Improves performance by reusing connections and reducing connection overhead
 */

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const genericPool = require('generic-pool');

// Configuration
const MAX_CONNECTIONS = process.env.FABRIC_MAX_CONNECTIONS || 10;
const MIN_CONNECTIONS = process.env.FABRIC_MIN_CONNECTIONS || 2;
const CONNECTION_TIMEOUT = process.env.FABRIC_CONNECTION_TIMEOUT || 30000; // 30 seconds
const IDLE_TIMEOUT = process.env.FABRIC_IDLE_TIMEOUT || 60000; // 60 seconds
const ACQUIRE_TIMEOUT = process.env.FABRIC_ACQUIRE_TIMEOUT || 30000; // 30 seconds

// Path to connection profile
const CONNECTION_PROFILE_PATH = process.env.CONNECTION_PROFILE_PATH || 
    path.resolve(__dirname, '../blockchain/connection-profile.json');

// Path to wallet
const WALLET_PATH = process.env.WALLET_PATH || 
    path.resolve(__dirname, '../blockchain/wallet');

// Identity to use
const IDENTITY = process.env.FABRIC_IDENTITY || 'admin';

// Chaincode names
const CHAINCODE_NAMES = {
    votingChaincode: process.env.VOTING_CHAINCODE_NAME || 'votingChaincode',
    identityChaincode: process.env.IDENTITY_CHAINCODE_NAME || 'identityChaincode'
};

// Channel name
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'votingchannel';

/**
 * Factory for creating and destroying Gateway connections
 */
const fabricConnectionFactory = {
    /**
     * Create a new Gateway connection
     * @returns {Promise<Object>} Gateway connection object
     */
    create: async () => {
        try {
            // Load connection profile
            const connectionProfile = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));
            
            // Load wallet
            const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
            
            // Check if identity exists
            const identity = await wallet.get(IDENTITY);
            if (!identity) {
                throw new Error(`Identity ${IDENTITY} not found in wallet`);
            }
            
            // Create gateway connection
            const gateway = new Gateway();
            
            await gateway.connect(connectionProfile, {
                wallet,
                identity: IDENTITY,
                discovery: { enabled: true, asLocalhost: process.env.NODE_ENV !== 'production' },
                eventHandlerOptions: {
                    strategy: null // Disable event handling for better performance
                }
            });
            
            // Get network
            const network = await gateway.getNetwork(CHANNEL_NAME);
            
            // Get contracts
            const contracts = {};
            for (const [key, chaincodeName] of Object.entries(CHAINCODE_NAMES)) {
                contracts[key] = network.getContract(chaincodeName);
            }
            
            logger.debug(`Created new Fabric connection [${Date.now()}]`);
            
            return {
                gateway,
                network,
                contracts
            };
        } catch (error) {
            logger.error(`Error creating Fabric connection: ${error.message}`);
            throw error;
        }
    },
    
    /**
     * Destroy a Gateway connection
     * @param {Object} connection Gateway connection object
     * @returns {Promise<void>}
     */
    destroy: async (connection) => {
        try {
            // Disconnect gateway
            if (connection && connection.gateway) {
                await connection.gateway.disconnect();
                logger.debug(`Destroyed Fabric connection [${Date.now()}]`);
            }
        } catch (error) {
            logger.error(`Error destroying Fabric connection: ${error.message}`);
        }
    },
    
    /**
     * Validate a Gateway connection
     * @param {Object} connection Gateway connection object
     * @returns {Promise<boolean>} True if connection is valid
     */
    validate: async (connection) => {
        try {
            if (!connection || !connection.gateway || !connection.network || !connection.contracts) {
                return false;
            }
            
            // Try a simple query to validate connection
            const contract = connection.contracts.votingChaincode;
            await contract.evaluateTransaction('GetVersion');
            
            return true;
        } catch (error) {
            logger.warn(`Invalid Fabric connection: ${error.message}`);
            return false;
        }
    }
};

/**
 * Create connection pool
 */
const connectionPool = genericPool.createPool(fabricConnectionFactory, {
    max: MAX_CONNECTIONS,
    min: MIN_CONNECTIONS,
    testOnBorrow: true,
    acquireTimeoutMillis: ACQUIRE_TIMEOUT,
    idleTimeoutMillis: IDLE_TIMEOUT,
    evictionRunIntervalMillis: 30000, // Check for idle connections every 30 seconds
    numTestsPerEvictionRun: 3, // Test 3 connections per eviction run
    autostart: true
});

// Add event listeners
connectionPool.on('factoryCreateError', (error) => {
    logger.error(`Error creating Fabric connection: ${error.message}`);
});

connectionPool.on('factoryDestroyError', (error) => {
    logger.error(`Error destroying Fabric connection: ${error.message}`);
});

/**
 * Fabric Connection Pool
 */
class FabricConnectionPool {
    /**
     * Initialize connection pool
     */
    constructor() {
        this.pool = connectionPool;
        
        // Warm up the pool by creating minimum connections
        this.warmUp();
        
        // Register process exit handler
        process.on('SIGINT', async () => {
            await this.drain();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            await this.drain();
            process.exit(0);
        });
    }
    
    /**
     * Warm up the pool by creating minimum connections
     */
    async warmUp() {
        try {
            logger.info(`Warming up Fabric connection pool with ${MIN_CONNECTIONS} connections`);
            
            const promises = [];
            for (let i = 0; i < MIN_CONNECTIONS; i++) {
                promises.push(
                    this.pool.acquire()
                        .then(connection => this.pool.release(connection))
                        .catch(error => logger.error(`Error warming up connection: ${error.message}`))
                );
            }
            
            await Promise.all(promises);
            logger.info('Fabric connection pool warmed up successfully');
        } catch (error) {
            logger.error(`Error warming up connection pool: ${error.message}`);
        }
    }
    
    /**
     * Get pool statistics
     * @returns {Object} Pool statistics
     */
    getStats() {
        return {
            spareResourceCapacity: this.pool.spareResourceCapacity,
            size: this.pool.size,
            available: this.pool.available,
            borrowed: this.pool.borrowed,
            pending: this.pool.pending,
            max: this.pool.max,
            min: this.pool.min
        };
    }
    
    /**
     * Drain the pool (close all connections)
     * @returns {Promise<void>}
     */
    async drain() {
        try {
            logger.info('Draining Fabric connection pool');
            await this.pool.drain();
            await this.pool.clear();
            logger.info('Fabric connection pool drained successfully');
        } catch (error) {
            logger.error(`Error draining connection pool: ${error.message}`);
        }
    }
    
    /**
     * Execute a transaction with the Fabric network
     * @param {string} chaincodeName Name of the chaincode to use
     * @param {string} functionName Name of the function to call
     * @param {Array} args Arguments to pass to the function
     * @param {boolean} submit Whether to submit (write) or evaluate (read) the transaction
     * @returns {Promise<any>} Transaction result
     */
    async executeTransaction(chaincodeName, functionName, args = [], submit = false) {
        let connection = null;
        
        try {
            // Acquire connection from pool
            connection = await this.pool.acquire();
            
            // Get contract
            const contract = connection.contracts[chaincodeName];
            if (!contract) {
                throw new Error(`Contract ${chaincodeName} not found`);
            }
            
            // Execute transaction
            let result;
            if (submit) {
                // Submit transaction (write)
                result = await contract.submitTransaction(functionName, ...args);
            } else {
                // Evaluate transaction (read)
                result = await contract.evaluateTransaction(functionName, ...args);
            }
            
            // Parse result
            if (result && result.length > 0) {
                try {
                    return JSON.parse(result.toString());
                } catch (e) {
                    return result.toString();
                }
            }
            
            return null;
        } catch (error) {
            logger.error(`Error executing Fabric transaction: ${error.message}`);
            throw error;
        } finally {
            // Release connection back to pool
            if (connection) {
                await this.pool.release(connection);
            }
        }
    }
    
    /**
     * Query the Fabric network (read-only)
     * @param {string} chaincodeName Name of the chaincode to use
     * @param {string} functionName Name of the function to call
     * @param {Array} args Arguments to pass to the function
     * @returns {Promise<any>} Query result
     */
    async query(chaincodeName, functionName, args = []) {
        return this.executeTransaction(chaincodeName, functionName, args, false);
    }
    
    /**
     * Submit a transaction to the Fabric network (write)
     * @param {string} chaincodeName Name of the chaincode to use
     * @param {string} functionName Name of the function to call
     * @param {Array} args Arguments to pass to the function
     * @returns {Promise<any>} Transaction result
     */
    async submit(chaincodeName, functionName, args = []) {
        return this.executeTransaction(chaincodeName, functionName, args, true);
    }
}

// Export singleton instance
module.exports = new FabricConnectionPool();
