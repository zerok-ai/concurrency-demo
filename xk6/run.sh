#!/bin/bash
ulimit -n 65536

service=$1
script="script.js"

case $service in

  app)
    script="script-app.js"
    ;;

  zk)
    script="script-zk.js"
    ;;

  zk-spill)
    script="script-zk-spill.js"
    ;;

  zk-soak)
    script="script-zk-soak.js"
    ;;

  *)
    echo -n "unknown"
    exit 1;
    ;;
esac

# k6 run $script

K6_PROMETHEUS_REMOTE_URL=http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090/api/v1/write \
./k6 run $script \
    -o output-prometheus-remote \
    --tag run=$(date +%F_%H-%M-%S)
