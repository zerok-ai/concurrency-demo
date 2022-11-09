#! /bin/bash

helpFunction()
{
   echo ""
   echo "Usage: -c [apply|delete] -p gke|minikube"
   exit 1 # Exit script after printing help
}

STAGE=1
clusterProvider="gke"

while [ $# -ne 0 ]; do
    case "$1" in
        -c)
             command=$2
             shift; shift
             ;;
        -p)
             clusterProvider=$2
             shift; shift
             ;;
        -h)
             helpFunction
             exit 2

             ;;
        -*)
             echo "Unknown option: $1" >&2
             helpFunction
             exit 2
             ;;
        *)
             break
             ;;
    esac
done

if [ -z "$command" ]
then
   helpFunction
   exit 1;
fi

if [ "$command" != "apply" ] && [ "$command" != "delete" ]
then
    helpFunction
    exit 1;
fi

if [ "$1" = "delete" ]
then
   kubectl delete namespace myapp
   kubectl delete namespace myapp-hpa
   kubectl delete namespace zerok
   exit 1;
fi

# app with 3 replicas in ns:- default
kubectl apply -k status-quo-$clusterProvider

# # app with 3 replicas in ns:- myapp-hpa
# # kubectl apply -k status-quo-hpa 

# # app with 3 replicas in anton - default setup in ns:- zerok
kubectl apply -k zerok-$clusterProvider

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
      kubectl apply -k zerok-soak-$clusterProvider
      kubectl apply -k zerok-spill-$clusterProvider

      echo ""
      echo "--- marking the pods for soak"
      kubectl label pod -n zerok $soakPod zk-route-mark=soak --overwrite

      echo "--- marking the pods for spill"
      kubectl label pod -n zerok $spillPod zk-route-mark=spill --overwrite

   else
      echo "[Error] Unable to mark pods! Only one pod found."
   fi

fi