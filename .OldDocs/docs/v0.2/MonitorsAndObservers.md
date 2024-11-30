---
layout: v0.2
title:  "Monitors and Observers"
categories: reference
permalink: /v0.2/caliper-monitors/
order: 5
---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Monitors](#monitors)
  - [Process Monitor](#process-monitor)
  - [Docker Monitor](#docker-monitor)
  - [Prometheus Monitor](#prometheus-monitor)
    - [Configuring The Prometheus Monitor](#configuring-the-prometheus-monitor)
    - [Obtaining a Prometheus Enabled Network](#obtaining-a-prometheus-enabled-network)
- [Observers](#observers)
  - [None Observer](#none-observer)
  - [Local Observer](#local-observer)
  - [Prometheus Observer](#prometheus-observer)
  - [Grafana Visualization](#grafana-visualization)

## Overview
Caliper monitors are used to collect statistics on resource utilization during benchmarking, the statistics are collated into a report at the culmination of the benchmark process. Caliper also enables real time reporting of current transaction status through observers, or enhanced data visualization using Prometheus and Grafana.

## Monitors
The type of monitoring to be performed during a benchmark is declared in the `benchmark configuration file` through the specification one or more monitor types in an array under the label `monitor.type`. The integer interval at which monitors fetch information from their targets, in seconds, is specified as an integer under the label `monitor.interval`.

Permitted monitors are:
- **None:** The `none` monitor declares that no monitors are to be used during the benchmark.
- **Process:** The `process` monitor enables monitoring of a named process on the host machine, and is most typically used to monitor the resources consumed by the running clients. This monitor will retrieve statistics on: [memory(max), memory(avg), CPU(max), CPU(avg), Network I/O, Disc I/O]
- **Docker:** The `docker` monitor enables monitoring of specified Docker containers on the host or a remote machine, through using the Docker Remote API to retrieve container statistics. This monitor will retrieve statistics on: [memory(max), memory(avg), CPU(max), CPU(avg), Network I/O, Disc I/O]
- **Prometheus:** The `prometheus` monitor enables the retrieval of data from Prometheus. This monitor will only report based on explicit user provided queries that are issued to Prometheus. If defined, the provision of a Prometheus server will cause Caliper to default to using the Prometheus PushGateway.

The following declares the use of no monitors:
```
monitor:
  type:
  - none
```

The following declares the use of docker, process and prometheus monitors:
```
monitor:
  type:
  - docker
  - process
  - prometheus
```

Each declared monitor must be accompanied by a block that describes the required configuration of the monitor.

### Process Monitor
The process monitor definition consists of an array of `[command, arguments, multiOutput]` key:value pairs.
- command: names the parent process to monitor
- arguments: filters on the parent process being monitored
- multiOutput: enables handling of the discovery of multiple processes and may be one of:
  - avg: take the average of process values discovered under `command/name`
  - sum: sum all process values discovered under `command/name`

The following declares the monitoring of all local `node` processes that match `fabricClientWorker.js`, with the average of all discovered processes being taken.
```
monitor:
  type:
  - process
  process:
  - command: node
    arguments: fabricClientWorker.js
    multiOutput: avg
```
### Docker Monitor
The docker monitor definition consists of an array of container names that may relate to local or remote docker containers that are listed under a name label. If all local docker containers are to be monitored, this may be achieved by providing `all` as a name

The following declares the monitoring of two named docker containers; one local and the other remote.
```
monitor:
  type:
  - docker
  docker:
    name:
    - peer0.org1.example.com
    - http://192.168.1.100:2375/orderer.example.com
```

The following declares the monitoring of all local docker containers:
```
monitor:
  type:
  - docker
  docker:
    name:
    - all
```

### Prometheus Monitor
[Prometheus](https://prometheus.io/docs/introduction/overview/) is an open-source systems monitoring and alerting toolkit that scrapes metrics from instrumented jobs, either directly or via an intermediary push gateway for short-lived jobs. It stores all scraped samples locally and runs rules over this data to either aggregate and record new time series from existing data or generate alerts. [Grafana](https://grafana.com/) or other API consumers can be used to visualize the collected data.

Caliper clients may use a Prometheus [PushGateway](https://prometheus.io/docs/practices/pushing/) in order to publish transaction statistics, as an alternative to reporting statistics locally. By doing so we enable all Caliper clients to publish to a remote URL and gain access to the capabilities of Prometheus, which includes the ability to scrape data from configured targets. If a Prometheus monitor is specified, Caliper will default to publishing all transaction statistics to the Prometheus PushGateway.

All data stored on Prometheus may be queried by Caliper using the Prometheus query [HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/). At a minimum this may be used to perform aggregate queries in order to report back the transaction statistics, though it is also possible to perform custom queries in order to report back information that has been scraped from other connected sources. Queries issued are intended to generate reports and so are expected to result in either a single value, or a vector that can be condensed into a single value through the application of a statistical routine. It is advisable to create required queries using Grafana to ensure correct operation before transferring the query into the monitor. Please see [Prometheus](https://prometheus.io) and [Grafana](https://grafana.com/grafana) documentation for more information.

#### Configuring The Prometheus Monitor
The prometheus monitor definition consists of:
- url: The Prometheus URL, used for direct queries
- push_url: The Prometheus Push Gateway URL
- metrics: The queries to be run for inclusion within the Caliper report, comprised of to keys: `ignore` and `include`.
  - `ignore` a string array that is used as a denylist for report results. Any results where the component label matches an item in the list, will *not* be included in a generated report.
  - `include` a series of blocks that describe the queries that are to be run at the end of each Caliper test.

The `include` block is defined by:
- query: the query to be issued to the Prometheus server at the end of each test. Note that Caliper will add time bounding for the query so that only results pertaining to the test round are included.
- step: the timing step size to use within the range query
- label: a string to match on the returned query and used when populating the report
- statistic: if multiple values are returned, for instance if looking at a specific resource over a time range, the statistic will condense the values to a single result to enable reporting. Permitted options are:
  - max: return the maximum from all values
  - min: return the minimum from all values
  - avg: return the average from all values
- multiplier: An optional multiplier that may be used to convert exported metrics into a more convenient value (such as converting bytes to GB)

The following declares a Prometheus monitor that will run two bespoke queries between each test within the benchmark
```
monitor:
  type:
  - prometheus
  prometheus:
	url: "http://localhost:9090"
	push_url: "http://localhost:9091"
  metrics:
	  ignore: [prometheus, pushGateway, cadvisor, grafana, node-exporter]
	  include:
	    Endorse Time (s):
		    query: rate(endorser_propsal_duration_sum{chaincode="marbles:v0"}[5m])/rate(endorser_propsal_duration_count{chaincode="marbles:v0"}[5m])
		    step: 1
		    label: instance
		    statistic: avg
	    Max Memory (MB):
		    query: sum(container_memory_rss{name=~".+"}) by (name)
		    step: 10
		    label: name
		    statistic: max
		    multiplier: 0.000001
```
The two queries above will be listed in the generated report as "Endorse Time (s)" and "Max Memory (MB)" respectively:
 - **Endorse Time (s):** Runs the listed query with a step size of 1; filters on return tags using the `instance` label; exclude the result if the instance value matches any of the string values provided in the `ignore` array; if the instance does not match an exclude option, then determine the average of all return results and return this value to be reported under "Endorse Time (s)".
 - **Max Memory (MB):** Runs the listed query with a step size of 10; filter return tags using the `name` label; exclude the result if the instance value matches any of the string values provided in the `ignore` array; if the instance does not match an exclude option, then determine the maximum of all return results; multiply by the provided multiplier and return this value to be reported under "Max Memory (MB)".


#### Obtaining a Prometheus Enabled Network
A sample network that includes a docker-compose file for standing up a Prometheus server, a Prometheus PushGateway and a linked Grafana analytics container, is available within the companion [caliper-benchmarks repository](https://github.com/hyperledger/caliper-benchmarks/tree/v0.2.0/networks/prometheus-grafana).


## Observers
The type of observer to use during a benchmark is declared in the `benchmark configuration file` through the specification a supported observer type in under the label `observer.type`. The integer interval at which observers fetch information from their targets, in seconds, is specified as an integer under the label `observer.interval`; this is a required property for local and prometheus observers.

Permitted observers are:
 - none
 - local
 - prometheus

### None Observer
A `none` observer is used to ignore all transaction submissions of all clients. The following specifies the use of a none observer that will omit the console display of any transaction statistics during the benchmark process.

```
observer:
  type: none
```

### Local Observer
A `local` observer is used to view current transaction submissions of all clients on a local host machine. The following specifies the use of a local observer that collects and reports current transaction status at 1 second intervals.

```
observer:
  type: local
  interval: 1
```

If a Prometheus monitor is in use, then a Prometheus observer should also be used.

### Prometheus Observer
A `prometheus` observer is used to view current transaction submissions of all clients that are reporting transactions to a Prometheus server. The following specifies the use of a Prometheus observer that collects and reports current transaction status at 5 second intervals.

```
observer:
  type: prometheus
  interval: 5
```

Use of a Prometheus observer is predicated on the availability and use of a Prometheus monitor. The observer will extract required URL information from the relevant sections under the Prometheus monitor specification.

### Grafana Visualization
Grafana is an analytics platform that may be used to query and visualize metrics collected by Prometheus. Caliper clients will send the following to the PushGateway:
 - caliper_tps
 - caliper_latency
 - caliper_send_rate
 - caliper_txn_submitted
 - caliper_txn_success
 - caliper_txn_failure
 - caliper_txn_pending

 Each of the above are sent to the PushGateway, tagged with the following labels:
  - instance: the current test label
  - round: the current test round
  - client: the client identifier that is sending the information

 We are currently working on a Grafana dashboard to give you immediate access to the metrics published above, but in the interim please feel free to create custom queries to view the above metrics that are accessible in real time.