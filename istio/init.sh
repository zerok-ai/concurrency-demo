#!/bin/bash

kubectl label namespace zerok "istio-injection=enabled" --overwrite

kubectl -n zerok rollout restart deploy
sleep 5
./tag_pods.sh
