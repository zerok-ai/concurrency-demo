#!/bin/bash

kubectl label namespace zerok "istio-injection=enabled" --overwrite
kubectl label namespace myapp "istio-injection=enabled" --overwrite

kubectl -n zerok rollout restart deploy
kubectl -n myapp rollout restart deploy

sleep 60
./tag_pods.sh
