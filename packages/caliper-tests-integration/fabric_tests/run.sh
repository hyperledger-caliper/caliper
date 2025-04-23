#!/bin/bash
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Print all commands.
set -v

# Grab the parent (fabric_tests) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"

if [[ ! -d "fabric-samples" ]]; then
  curl -sSL -k https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- 2.5.9
fi

# back to this dir
cd ${DIR}

# change default settings (add config paths too)
export CALIPER_PROJECTCONFIG=../caliper.yaml

TEST_NETWORK_DIR=${DIR}/fabric-samples/test-network

dispose () {
    docker ps -a
    ${CALL_METHOD} launch manager --caliper-workspace phase6 --caliper-flow-only-end

    pushd ${TEST_NETWORK_DIR}
    ./network.sh down
    popd
}

# Create Fabric network
pushd ${TEST_NETWORK_DIR}
# patch network.sh to workaround bug in fabric-samples script.
sed -i "s|\[\[ \$len -lt 4 \]\]|\[\[ \$len -lt 3 \]\]|g" network.sh
./network.sh up -s couchdb
./network.sh createChannel -c mychannel
./network.sh createChannel -c yourchannel
./network.sh deployCC -ccn mymarbles -c mychannel -ccp ${DIR}/src/marbles/go -ccl go -ccv v0 -ccep "OR('Org1MSP.member','Org2MSP.member')"
./network.sh deployCC -ccn yourmarbles -c yourchannel -ccp ${DIR}/src/marbles/go -ccl go -ccv v0 -ccep "OR('Org1MSP.member','Org2MSP.member')"
popd

# PHASE 1: just starting the network
${CALL_METHOD} launch manager --caliper-workspace phase1 --caliper-flow-only-start
rc=$?
if [[ ${rc} != 0 ]]; then
    echo "Failed CI step 1";
    dispose;
    exit ${rc};
fi

# BIND with 2.2 SDK, using the package dir as CWD
# Note: do not use env variables for unbinding settings, as subsequent launch calls will pick them up and bind again
# Note: Fabric 2.2 binding is cached in CI
export FABRIC_VERSION=2.2.20
export NODE_PATH="$SUT_DIR/cached/v$FABRIC_VERSION/node_modules"
if [[ "${BIND_IN_PACKAGE_DIR}" = "true" ]]; then
    mkdir -p $SUT_DIR/cached/v$FABRIC_VERSION
    pushd $SUT_DIR/cached/v$FABRIC_VERSION
    ${CALL_METHOD} bind --caliper-bind-sut fabric:$FABRIC_VERSION
    popd
fi

# PHASE 2: testing through the gateway API (v2 SDK)
${CALL_METHOD} launch manager --caliper-workspace phase2 --caliper-flow-only-test
rc=$?
if [[ ${rc} != 0 ]]; then
    echo "Failed CI step 2";
    dispose;
    exit ${rc};
fi

# BIND with gateway SDK (which is the same as 2.4, 2.5, 3), using the package dir as CWD
# Note: do not use env variables for unbinding settings, as subsequent launch calls will pick them up and bind again
# Note: Fabric gateway binding is NOT cached in CI. This binding is lightweight so doesn't take much time and allows the gateway binding to be modified in the config.yaml binding file
export FABRIC_VERSION=gateway
export NODE_PATH="$SUT_DIR/uncached/v$FABRIC_VERSION/node_modules"
if [[ "${BIND_IN_PACKAGE_DIR}" = "true" ]]; then
    mkdir -p $SUT_DIR/uncached/v$FABRIC_VERSION
    pushd $SUT_DIR/uncached/v$FABRIC_VERSION
    ${CALL_METHOD} bind --caliper-bind-sut fabric:$FABRIC_VERSION
    popd
fi

# PHASE 3: testing through the peer gateway API (fabric-gateway SDK)
${CALL_METHOD} launch manager --caliper-workspace phase3 --caliper-flow-only-test
rc=$?
if [[ ${rc} != 0 ]]; then
    echo "Failed CI step 3";
    dispose;
    exit ${rc};
fi

# PHASE 4: just disposing of the network
${CALL_METHOD} launch manager --caliper-workspace phase4 --caliper-flow-only-end
rc=$?
if [[ ${rc} != 0 ]]; then
    echo "Failed CI step 4";
    exit ${rc};
fi

# Cleanup Fabric network
pushd ${TEST_NETWORK_DIR}
./network.sh down
popd
