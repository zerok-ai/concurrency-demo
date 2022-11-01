#!/bin/bash

for i in {0..3}
do
  pod=$(kubectl -n zerok get pods --output=jsonpath="{.items[$i].metadata.name}")
  echo $pod
  kubectl exec -n zerok --container istio-proxy -it $pod -- /bin/bash -c "curl -sf -XPOST http://127.0.0.1:15020/quitquitquit"
done
