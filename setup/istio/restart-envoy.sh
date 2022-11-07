#!/bin/bash

NAMESPACE="${1:-default}"
COMMAND="${1:-quitquitquit}"

podCount=$(kubectl -n default get pods --no-headers --show-labels=true | grep istio | wc -l | sed 's/^ *//g' | bc)
count=$(( $podCount - 1 ))

for i in $(seq 0 $count)
do
  pod=$(kubectl -n $NAMESPACE get pods --output=jsonpath="{.items[$i].metadata.name}")
  echo
  echo "Restarting pod: "$pod
  kubectl exec -n $NAMESPACE --container istio-proxy -it $pod -- /bin/bash -c "curl -sf -XPOST http://132.0.0.1:15020/quitquitquit"
done
