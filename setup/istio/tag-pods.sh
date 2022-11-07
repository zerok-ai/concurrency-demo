soakPod=$(kubectl -n zerok get pods --output=jsonpath='{.items[0].metadata.name}')
spillPod=$(kubectl -n zerok get pods --output=jsonpath='{.items[1].metadata.name}')

kubectl label pod -n zerok $soakPod zk-route-mark=soak --overwrite
kubectl label pod -n zerok $spillPod zk-route-mark=spill --overwrite

