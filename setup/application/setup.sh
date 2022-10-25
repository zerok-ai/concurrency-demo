#! /bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 [apply|delete]"
   exit 1 # Exit script after printing help
}

STAGE=1

while getopts "hs" opt
do
   case "$opt" in
      s ) STAGE="$OPTARG" ;;#clusterProvider="$OPTARG" ;; # Print helpFunction in case parameter is non-existent
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
# kubectl kustomize zerok 

if [ $STAGE == 1 ]
then
   
   # mark pods
   # soakPod=$(kubectl -n zerok get pods --output=jsonpath={.items..metadata.name})
   # echo ${soakPod}

   # index=0
   # for pod in $(kubectl -n zerok get pods --output=jsonpath={.items..metadata.name});
   # do
   #    echo "pod Name: ${pod}"
   #    echo  
   # done

   soakPod=$(kubectl -n zerok get pods --output=jsonpath={.items[0].metadata.name})
   spillPod=$(kubectl -n zerok get pods --output=jsonpath={.items[1].metadata.name})

   if [ $soakPod != $spillPod ]
   then
      
      echo ""
      echo "--- starting soak and spill service"
      kubectl apply -k zerok-soak
      kubectl apply -k zerok-spill

      echo ""
      echo "--- marking the pods for soak and spill"
      kubectl label pod -n zerok $soakPod zk-route-mark=soak --overwrite
      kubectl label pod -n zerok $spillPod zk-route-mark=spill --overwrite

   else
      echo "[Error] Unable to mark pods! Only one pod found."
   fi

fi