/*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

/**
 * Workload module for querying the SUT for various marbles.
 */
class MarblesQueryWorkload extends WorkloadModuleBase {
    /**
     * Initializes the parameters of the marbles workload.
     */
    constructor() {
        super();
        this.txIndex = -1;
        this.owners = ['Alice', 'Bob', 'Claire', 'David'];
        this.setTargetChannel = false;
        this.setTargetPeers = false;
        this.setTargetOrganizations = false;
    }

    /**
     * Initialize the workload module with the given parameters.
     * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
     * @param {number} totalWorkers The total number of workers participating in the round.
     * @param {number} roundIndex The 0-based index of the currently executing round.
     * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
     * @param {ConnectorBase} sutAdapter The adapter of the underlying SUT.
     * @param {Object} sutContext The custom context object provided by the SUT adapter.
     * @async
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        this.setTargetChannel = !!this.roundArguments.setTargetChannel;

        // setting target peers or orgs for queries should generate a warning in the Fabric connector
        this.setTargetPeers = !!this.roundArguments.setTargetPeers;
        this.setTargetOrganizations = !!this.roundArguments.setTargetOrganizations;

        if (this.setTargetPeers && this.setTargetOrganizations) {
            throw new Error(`Arguments "setTargetPeers" and "setTargetOrganizations" cannot be used together. Set the one appropriate for your Fabric SDK type.`);
        }
    }

    /**
     * Assemble TXs for querying existing marbles based on their owners.
     * @return {Promise<TxStatus[]>}
     */
    async submitTransaction() {
        this.txIndex++;
        let marbleOwner = this.owners[this.txIndex % this.owners.length];

        let args = {
            contractId: this.txIndex % 2 === 0 ? 'mymarbles' : 'yourmarbles',
            contractFunction: 'queryMarblesByOwner',
            contractArguments: [marbleOwner],
            invokerIdentity: 'client0.org1.example.com',
            timeout: 10,
            readOnly: true
        };

        if (this.setTargetChannel) {
            args.channel = this.txIndex % 2 === 0 ? 'mychannel' : 'yourchannel';
        }

        if (this.setTargetPeers) {
            args.targetPeers = this.txIndex % 2 === 0 ? ['peer0.org1.example.com'] : ['peer0.org2.example.com'];
        }

        if (this.setTargetOrganizations) {
            args.targetOrganizations = this.txIndex % 2 === 0 ? ['Org1MSP'] : ['Org2MSP'];
        }

        await this.sutAdapter.sendRequests(args);
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new MarblesQueryWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
