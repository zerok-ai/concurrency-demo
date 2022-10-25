#!/bin/bash

helpFunction()
{
   echo ""
   echo -e "Usage: ./install.sh 
        -p [gke|minikube] !Required 
        -a (for setting up everything) 
        -d (for setting up commons) 
        -s (for setting up services) 
        -k (for setting up k6) "
   echo ""
   exit 1 # Exit script after printing help
}

INSTALL_CLUSTER=0
DEFAULTS=0
SERVICES=0
K6=0

# while getopts "hac:dsk" opt
while getopts "hp:akcsd" opt
do
   case "$opt" in
      a ) DEFAULTS=1; SERVICES=1; K6=1 ;; # Setup everything
      k ) K6=1 ;; # Setup K6
      c ) INSTALL_CLUSTER=1 ;; # Install cluster
      s ) SERVICES=1 ;; # Print helpFunction in case parameter is non-existent
      d ) DEFAULTS=1 ;; # Print helpFunction in case parameter is non-existent
      p ) clusterProvider="$OPTARG" ;;#clusterProvider="$OPTARG" ;; # Print helpFunction in case parameter is non-existent
      h ) helpFunction ;; # Print helpFunction in case parameter is non-existent
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

export setupfolder=${PWD}

if [[ -z "$clusterProvider" || ( "$clusterProvider" != "gke"  &&  "$clusterProvider" != "minikube") ]]
then
    helpFunction
    exit 1;
fi

if [ $INSTALL_CLUSTER == 1 ]
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

    # install commons
    sh $setupfolder/common/install.sh
fi

if [[ $SERVICES == 1 ]]; then
    echo "installing service"
    cd $setupfolder/application
    ./setup.sh apply
    cd $setupfolder
fi

if [[ $K6 == 1 ]]; then
    # install loadtest
    kubectl apply -k load-test-gke
fi

