'use strict';

const fabricConnection = require('./fabric-connection');

/**
 * Enroll admin for both organizations
 */
async function main() {
    try {
        // Initialize fabric connection utilities
        const initResult = fabricConnection.initialize();
        if (initResult.error) {
            console.error(`Failed to initialize: ${initResult.error}`);
            return;
        }
        
        console.log('Enrolling admin for StateElectionOffice...');
        const stateResult = await fabricConnection.enrollAdmin('StateElectionOffice');
        if (stateResult.error) {
            console.error(`Failed to enroll admin for StateElectionOffice: ${stateResult.error}`);
        } else {
            console.log('Successfully enrolled admin for StateElectionOffice');
        }
        
        console.log('Enrolling admin for DistrictElectionOffice...');
        const districtResult = await fabricConnection.enrollAdmin('DistrictElectionOffice');
        if (districtResult.error) {
            console.error(`Failed to enroll admin for DistrictElectionOffice: ${districtResult.error}`);
        } else {
            console.log('Successfully enrolled admin for DistrictElectionOffice');
        }
        
        console.log('Admin enrollment completed');
    } catch (error) {
        console.error(`Failed to enroll admin users: ${error}`);
        process.exit(1);
    }
}

main();
