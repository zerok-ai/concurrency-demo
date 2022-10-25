#!/bin/bash

helpFunction()
{
   echo ""
   echo -e "Usage: ./install.sh
        -c [gke|minikube] !Required
        -a (for setting up everything) 
        -d (for setting up commons) 
        -s (for setting up services) 
        -k (for setting up k6) "
   echo ""
   exit 1 # Exit script after printing help
}

DEFAULTS=0
SERVICES=0
K6=0

# while getopts "hac:dsk" opt
while getopts "hc:dska" opt
do
   case "$opt" in
      a ) DEFAULTS=1; SERVICES=1; K6=1 ;; # Setup everything
      k ) K6=1 ;; # Setup K6
      s ) SERVICES=1 ;; # Print helpFunction in case parameter is non-existent
      d ) DEFAULTS=1 ;; # Print helpFunction in case parameter is non-existent
      c ) clusterProvider="$OPTARG" ;;#clusterProvider="$OPTARG" ;; # Print helpFunction in case parameter is non-existent
      h ) helpFunction ;; # Print helpFunction in case parameter is non-existent
      ? ) echo "popopo" ;; # Print helpFunction in case parameter is non-existent
   esac
done

export setupfolder=${PWD}

# if [ -z "$clusterProvider" ]
# then
#     helpFunction
#     exit 1;
# fi

if [ "$clusterProvider" = "gke" ] || [ "$clusterProvider" = "minikube" ]
then
    # install cluster
    sh ./$clusterProvider/install.sh
fi

if [[ $DEFAULTS == 1 ]]; then
    if [ "$clusterProvider" != "minikube" ] 
    then
        echo '###################### Installing addons'
        sh $setupfolder/common/install-and-configure-kubernetes-addons.sh
    fi

    install commons
    sh $setupfolder/common/install.sh
fi


if [[ $SERVICES == 1 ]]; then
    # install services
    cd $setupfolder/application
    ./setup.sh apply
    cd $setupfolder
fi

if [[ $K6 == 1 ]]; then
    # install loadtest
    kubectl apply -k load-test-gke
fi

