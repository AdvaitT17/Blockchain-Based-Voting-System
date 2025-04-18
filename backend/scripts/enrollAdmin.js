/**
 * Enrolls admin users for both organizations (StateElectionOffice and DistrictElectionOffice)
 * This script should be run before starting the API servers
 */

'use strict';

const fabricConnection = require('../utils/fabric-connection');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  try {
    console.log('Starting admin enrollment process...');
    
    // Initialize the fabric connection utilities
    const initResult = fabricConnection.initialize();
    if (initResult.error) {
      console.error(`Failed to initialize fabric connection: ${initResult.error}`);
      process.exit(1);
    }
    
    // Create connection profile if it doesn't exist
    const connectionProfilePath = path.resolve(__dirname, '../../blockchain/connection-profile.json');
    if (!fs.existsSync(connectionProfilePath)) {
      console.log('Creating connection profile...');
      const result = fabricConnection.createConnectionProfile();
      if (result.error) {
        console.error(`Failed to create connection profile: ${result.error}`);
        process.exit(1);
      }
      console.log('Connection profile created successfully');
    }
    
    // Enroll admin for StateElectionOffice
    console.log('\nEnrolling admin for StateElectionOffice...');
    const stateAdminResult = await fabricConnection.enrollAdmin('StateElectionOffice');
    if (stateAdminResult.error) {
      console.error(`Failed to enroll admin for StateElectionOffice: ${stateAdminResult.error}`);
      process.exit(1);
    }
    console.log('StateElectionOffice admin enrolled successfully');
    
    // Enroll admin for DistrictElectionOffice
    console.log('\nEnrolling admin for DistrictElectionOffice...');
    const districtAdminResult = await fabricConnection.enrollAdmin('DistrictElectionOffice');
    if (districtAdminResult.error) {
      console.error(`Failed to enroll admin for DistrictElectionOffice: ${districtAdminResult.error}`);
      process.exit(1);
    }
    console.log('DistrictElectionOffice admin enrolled successfully');
    
    console.log('\nAdmin enrollment completed successfully');
  } catch (error) {
    console.error(`Failed to enroll admin users: ${error}`);
    process.exit(1);
  }
}

main();
