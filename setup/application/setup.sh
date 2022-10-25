#! /bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 [apply|delete]"
   exit 1 # Exit script after printing help
}

# while getopts "a:b:c:" opt
while getopts "h" opt
do
   case "$opt" in
      h ) helpFunction ;; # Print helpFunction in case parameter is non-existent
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

if [ -z "$1" ]
then
   helpFunction
   exit 1;
fi

if [ "$1" != "apply" ] && [ "$1" != "delete" ]
then
    helpFunction
    exit 1;
fi

if [ "$1" = "delete" ]
then
   kubectl delete namespace myapp
   kubectl delete namespace zerok
   exit 1;
fi

# app with 3 replicas in ns:- default
kubectl apply -k status-quo

# app with 3 replicas in anton - default setup in ns:- zerok
kubectl apply -k zerok