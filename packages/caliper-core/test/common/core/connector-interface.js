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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const sinon = require('sinon');
const ConnectorInterface = require('../../../lib/common/core/connector-interface');

class TestConnectorInterface extends ConnectorInterface {
}

describe('When extending a ConnectorInterface', () => {
    let connector;

    beforeEach(() => {
        connector = new TestConnectorInterface();
    });

    it('should throw an error when getType is called if not implemented', () => {
        expect(() => connector.getType()).to.throw(
            'Method "getType" is not implemented for this connector'
        );
    });

    it('should throw an error when getWorkerIndex is called if not implemented', () => {
        expect(() => connector.getWorkerIndex()).to.throw(
            'Method "getWorkerIndex" is not implemented for this connector'
        );
    });

    it('should throw an error when init is called if not implemented', () => {
        expect(connector.init(true)).to.be.rejectedWith(
            'Method "init" is not implemented for this connector'
        );
    });

    it('should throw an error when installSmartContract is called if not implemented', () => {
        expect(connector.installSmartContract()).to.be.rejectedWith(
            'Method "installSmartContract" is not implemented for this connector'
        );
    });

    it('should throw an error when prepareWorkerArguments is called if not implemented', () => {
        expect(connector.prepareWorkerArguments(1)).to.be.rejectedWith(
            'Method "prepareWorkerArguments" is not implemented for this connector'
        );
    });

    it('should throw an error when getContext is called if not implemented', () => {
        expect(connector.getContext(0, {})).to.be.rejectedWith(
            'Method "getContext" is not implemented for this connector'
        );
    });

    it('should throw an error when releaseContext is called if not implemented', () => {
        expect(connector.releaseContext()).to.be.rejectedWith(
            'Method "releaseContext" is not implemented for this connector'
        );
    });

    it('should throw an error when sendRequests is called if not implemented', () => {
        expect(connector.sendRequests([])).to.be.rejectedWith(
            'Method "sendRequests" is not implemented for this connector'
        );
    });
});
