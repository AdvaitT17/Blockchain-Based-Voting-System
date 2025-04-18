/**
 * Registers API users for each of our backend services
 * This script should be run after enrollAdmin.js and before starting the API servers
 */

'use strict';

const fabricConnection = require('../utils/fabric-connection');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Starting API user registration process...');
    
    // Register identity-api user (StateElectionOffice organization)
    console.log('\nRegistering identity-api-user for StateElectionOffice...');
    const identityApiUserResult = await fabricConnection.registerUser('StateElectionOffice', 'identity-api-user');
    if (identityApiUserResult.error) {
      console.error(`Failed to register identity-api-user: ${identityApiUserResult.error}`);
      process.exit(1);
    }
    console.log('identity-api-user registered successfully');
    
    // Register admin-api user (StateElectionOffice organization)
    console.log('\nRegistering admin-api-user for StateElectionOffice...');
    const adminApiUserResult = await fabricConnection.registerUser('StateElectionOffice', 'admin-api-user');
    if (adminApiUserResult.error) {
      console.error(`Failed to register admin-api-user: ${adminApiUserResult.error}`);
      process.exit(1);
    }
    console.log('admin-api-user registered successfully');
    
    // Register voter-api user (DistrictElectionOffice organization)
    console.log('\nRegistering voter-api-user for DistrictElectionOffice...');
    const voterApiUserResult = await fabricConnection.registerUser('DistrictElectionOffice', 'voter-api-user');
    if (voterApiUserResult.error) {
      console.error(`Failed to register voter-api-user: ${voterApiUserResult.error}`);
      process.exit(1);
    }
    console.log('voter-api-user registered successfully');
    
    console.log('\nAPI user registration completed successfully');
  } catch (error) {
    console.error(`Failed to register API users: ${error}`);
    process.exit(1);
  }
}

main();
