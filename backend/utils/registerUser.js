'use strict';

const fabricConnection = require('./fabric-connection');

/**
 * Register users for both organizations
 */
async function main() {
    try {
        // Initialize fabric connection utilities
        const initResult = fabricConnection.initialize();
        if (initResult.error) {
            console.error(`Failed to initialize: ${initResult.error}`);
            return;
        }
        
        // Register users for StateElectionOffice
        console.log('Registering users for StateElectionOffice...');
        
        // Register identity-api user
        const identityApiResult = await fabricConnection.registerUser('StateElectionOffice', 'identity-api-user');
        if (identityApiResult.error) {
            console.error(`Failed to register identity-api-user: ${identityApiResult.error}`);
        } else {
            console.log('Successfully registered identity-api-user');
        }
        
        // Register admin-api user
        const adminApiResult = await fabricConnection.registerUser('StateElectionOffice', 'admin-api-user');
        if (adminApiResult.error) {
            console.error(`Failed to register admin-api-user: ${adminApiResult.error}`);
        } else {
            console.log('Successfully registered admin-api-user');
        }
        
        // Register voter-api user
        const voterApiResult = await fabricConnection.registerUser('StateElectionOffice', 'voter-api-user');
        if (voterApiResult.error) {
            console.error(`Failed to register voter-api-user: ${voterApiResult.error}`);
        } else {
            console.log('Successfully registered voter-api-user');
        }
        
        // Register users for DistrictElectionOffice
        console.log('Registering users for DistrictElectionOffice...');
        
        // Register district-identity-api user
        const districtIdentityApiResult = await fabricConnection.registerUser('DistrictElectionOffice', 'district-identity-api-user');
        if (districtIdentityApiResult.error) {
            console.error(`Failed to register district-identity-api-user: ${districtIdentityApiResult.error}`);
        } else {
            console.log('Successfully registered district-identity-api-user');
        }
        
        // Register district-admin-api user
        const districtAdminApiResult = await fabricConnection.registerUser('DistrictElectionOffice', 'district-admin-api-user');
        if (districtAdminApiResult.error) {
            console.error(`Failed to register district-admin-api-user: ${districtAdminApiResult.error}`);
        } else {
            console.log('Successfully registered district-admin-api-user');
        }
        
        // Register district-voter-api user
        const districtVoterApiResult = await fabricConnection.registerUser('DistrictElectionOffice', 'district-voter-api-user');
        if (districtVoterApiResult.error) {
            console.error(`Failed to register district-voter-api-user: ${districtVoterApiResult.error}`);
        } else {
            console.log('Successfully registered district-voter-api-user');
        }
        
        console.log('User registration completed');
    } catch (error) {
        console.error(`Failed to register users: ${error}`);
        process.exit(1);
    }
}

main();
