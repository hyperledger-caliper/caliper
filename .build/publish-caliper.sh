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

# Exit on first error
set -e

# distribute root README file before publishing
cp ./README.md ./packages/caliper-cli/README.md
cp ./README.md ./packages/caliper-core/README.md
cp ./README.md ./packages/caliper-fabric/README.md

# distribute root package-lock file as npm-shrinkwrap file to packages before publishing
# We can't do this because caliper-cli declares dependencies on caliper-core and caliper-fabric 
# and the packaged shrinkwrap for caliper-cli will not be correct to resolve them as package-lock.json
# is mono-repo aware but the published packages won't understand it in shrinkwrap.json so will create
# invalid references. Doing this would force everyone to have to install all 3 packages manually.
#cp ./package-lock.json ./packages/caliper-cli/npm-shrinkwrap.json
#cp ./package-lock.json ./packages/caliper-core/npm-shrinkwrap.json
#cp ./package-lock.json ./packages/caliper-fabric/npm-shrinkwrap.json

cd ./packages/caliper-publish/
npm ci

./publish.js npm
./publish.js docker --publish
