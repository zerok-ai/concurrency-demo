#!/bin/bash
ulimit -n 65536

service=$1
initialVUs=$2
maxVUs=$3
rate=$4
stages=$5
duration=$6
timeunit=$7
HOST="script.js"

case $service in

  app)
    HOST='svc-app.myapp.svc.cluster.local';
    ;;

  zk)
    HOST='svc-app-zerok.zerok.svc.cluster.local';
    ;;

  zk_spill)
    HOST='svc-app-zerok-spill.zerok.svc.cluster.local';
    ;;

  zk_soak)
    HOST='svc-app-zerok-soak.zerok.svc.cluster.local';
    ;;

  *)
    echo -n "unknown"
    exit 1;
    ;;
esac

PROM_URL=http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090/api/v1/write

K6_PROMETHEUS_REMOTE_URL=$PROM_URL \
./k6 run -e TIMEUNIT=$timeunit -e DURATION=$duration -e STAGES=$stages -e RATE=$rate -e PROMETHEUS_REMOTE_URL=$PROM_URL -e INITIAL_VUS=$initialVUs -e MAX_VUS=$maxVUs -e HOST=$HOST -e CHECKOUT_SCENARIO=$1_checkout -e COUPONS_SCENARIO=$1_coupons script.js \
    -o output-prometheus-remote \
    --tag run=$(date +%F_%H-%M-%S)
