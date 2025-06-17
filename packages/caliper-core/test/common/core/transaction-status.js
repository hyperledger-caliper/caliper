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

const chai = require('chai');
chai.should();
const sinon = require('sinon');


const TxStatus = require('../../../lib/common/core/transaction-status');

describe('the transaction status', () => {

    let sandbox;
    let clock;

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        clock = sandbox.useFakeTimers();
    });

    afterEach(function() {
        sandbox.restore();
    });


    it('should create a default time creation', () => {
        clock.tick(500);
        const txStatus = new TxStatus();
        txStatus.GetTimeCreate().should.be.greaterThan(0);
        txStatus.GetStatus().should.equal('created');
    });

    it('should allow changing of the default time creation', () => {
        const txStatus = new TxStatus();
        const orgTimeCreate = txStatus.GetTimeCreate();
        clock.tick(60000);
        const newTimeCreate = Date.now();
        txStatus.SetTimeCreate(newTimeCreate);
        txStatus.GetTimeCreate().should.not.equal(orgTimeCreate);
        txStatus.GetTimeCreate().should.equal(newTimeCreate);
    });

    it('should set the id on construction if provided', () => {
        const txStatus = new TxStatus('myid');
        txStatus.GetID().should.equal('myid');
    });

    it('should be able to set the id later', () => {
        const txStatus = new TxStatus();
        txStatus.SetID('myid');
        txStatus.GetID().should.equal('myid');
    });

    it('should be able to set and retrieve the result', () => {
        const txStatus = new TxStatus();
        txStatus.SetResult('myresult');
        txStatus.GetResult().should.equal('myresult');
    });

    it('should be able to set and retrieve flags', () => {
        const txStatus = new TxStatus();
        txStatus.SetFlag('myflags');
        txStatus.GetFlag().should.equal('myflags');
    });

    it('should be able to set and retrieve verification', () => {
        const txStatus = new TxStatus();
        txStatus.IsVerified().should.equal(false);
        txStatus.SetVerification(true);
        txStatus.IsVerified().should.equal(true);
    });

    it('should be able to set success status with provided timestamp', () => {
        const txStatus = new TxStatus();
        const successTime = Date.now() + 60000;
        txStatus.SetStatusSuccess(successTime);
        txStatus.GetStatus().should.equal('success');
        txStatus.IsCommitted().should.equal(true);
        txStatus.GetTimeFinal().should.equal(successTime);
    });

    it('should be able to set success status without a timestamp', () => {
        clock.tick(40000)
        const txStatus = new TxStatus();
        txStatus.SetStatusSuccess();
        txStatus.GetStatus().should.equal('success');
        txStatus.IsCommitted().should.equal(true);
        txStatus.GetTimeFinal().should.equal(Date.now());
    });

    it('should be able to set failure status with provided timestamp', () => {
        const txStatus = new TxStatus();
        clock.tick(1000);
        txStatus.SetStatusFail();
        txStatus.GetStatus().should.equal('failed');
        txStatus.IsCommitted().should.equal(false);
        txStatus.GetTimeFinal().should.equal(Date.now());
    });

    it('should be able to set a series of error messages', () => {
        const txStatus = new TxStatus();
        txStatus.SetErrMsg(0, 'myerror1');
        txStatus.SetErrMsg(1, 'myerror2');
        txStatus.SetErrMsg(2, 'myerror3');
        txStatus.SetErrMsg(3, 'myerror4');
        txStatus.GetErrMsg().should.deep.equal(['myerror1', 'myerror2', 'myerror3', 'myerror4']);
    });

    it('should be able to get the complete status as an object', () => {
        const txStatus = new TxStatus('tomarshal');
        const status = txStatus.Marshal();
        status.id.should.equal('tomarshal');
        status.status.should.equal('created');
        status.time_create.should.equal(txStatus.GetTimeCreate());
        status.time_final.should.equal(0);
        status.verified.should.equal(false);
        status.flags.should.equal(0);
    });

    it('should be able to set and get custom data', () => {
        const txStatus = new TxStatus();
        txStatus.Set('mykey', 'mydata');
        txStatus.Get('mykey').should.equal('mydata');
    });

    it('should be able to get all the custom data', () => {
        const txStatus = new TxStatus();
        txStatus.Set('mykey', 'mydata');
        txStatus.Get('mykey').should.equal('mydata');
        txStatus.Set('mykey2', 'mydata2');
        txStatus.Get('mykey2').should.equal('mydata2');
        const map = txStatus.GetCustomData();
        map.get('mykey').should.equal('mydata');
        map.get('mykey2').should.equal('mydata2');
    });
});
