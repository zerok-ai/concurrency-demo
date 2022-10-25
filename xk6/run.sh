#!/bin/bash
ulimit -n 65536

K6_PROMETHEUS_REMOTE_URL=http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090/api/v1/write \
./k6 run script.js \
    -o output-prometheus-remote \
    --tag run=$(date +%F_%H-%M-%S)
