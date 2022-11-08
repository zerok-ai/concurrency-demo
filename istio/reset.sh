#!/bin/bash

kubectl rollout restart deploy -n zerok
kubectl rollout restart deploy -n myapp

echo "waiting for pods to restart"
sleep 60

./tag_pods.sh
