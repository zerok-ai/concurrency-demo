#!/bin/bash

kubectl apply -f config.yaml

sleep 2
./restart_envoy.sh
