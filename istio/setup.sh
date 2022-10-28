kubectl label namespace zerok "istio-injection=enabled" --overwrite
kubectl apply -f config.yaml
kubectl -n zerok rollout restart deploy