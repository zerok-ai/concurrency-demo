kubectl label namespace zerok "istio-injection=enabled" --overwrite

# kubectl -n zerok rollout restart deploy

soakPod=$(kubectl -n zerok get pods --output=jsonpath='{.items[0].metadata.name}')
spillPod=$(kubectl -n zerok get pods --output=jsonpath='{.items[1].metadata.name}')

kubectl label pod -n zerok $soakPod zk-route-mark=soak --overwrite
kubectl label pod -n zerok $spillPod zk-route-mark=spill --overwrite

kubectl apply -f config.yaml

kubectl exec -n zerok --container istio-proxy -it $soakPod -- /bin/bash -c "curl -sf -XPOST http://127.0.0.1:15020/quitquitquit"
