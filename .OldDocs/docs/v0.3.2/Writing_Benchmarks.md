---
layout: v0.3.2
title:  "Writing Benchmarks"
categories: reference
permalink: /v0.3.2/writing-benchmarks/
order: 1
---
## Write your own benchmarks
Caliper provides a set of nodejs NBIs (North Bound Interfaces) for applications to interact with backend blockchain system. Check the [*packages/caliper-core/lib/blockchain.js*](./packages/caliper-core/lib/blockchain.js) to learn about the NBIs. Multiple *Adaptors* are implemented to translate the NBIs to different blockchain protocols. So developers can write a benchmark once, and run it with different blockchain systems.

Generally speaking, to write a new caliper benchmark, you need to:
* Write smart contracts for systems you want to test
* Write a testing flow using caliper NBIs. Caliper provides a default benchmark engine, which is pluggable and configurable to integrate new tests easily. For more details, please refer to [Benchmark Engine](./Architecture.md).
* Write a configuration file to define the backend network and benchmark arguments.

### Directory Structure

**Directory** | **Description**
------------------ | --------------
/benchmark | Samples of the blockchain benchmarks
/docs | Documents
/network | Boot configuration files used to deploy some predefined blockchain network under test.
/src | Souce code of the framework
/src/contract | Smart contracts for different blockchain systems

## License
The Caliper codebase is released under the [Apache 2.0 license](./LICENSE.md). Any documentation developed by the Caliper Project is licensed under the Creative Commons Attribution 4.0 International License. You may obtain a copy of the license, titled CC-BY-4.0, at http://creativecommons.org/licenses/by/4.0/.
