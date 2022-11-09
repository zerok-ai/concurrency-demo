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
ISTIO=0
POST_SERVICE_INSTALL_CLUSTER=0

# while getopts "hac:dsk" opt
while getopts "hp:akcsdit" opt
do
   case "$opt" in
      p ) clusterProvider="$OPTARG" ;;
      a ) INSTALL_CLUSTER=1; DEFAULTS=1; SERVICES=1; K6=1; ISTIO=1; POST_SERVICE_INSTALL_CLUSTER=1 ;; # Setup everything
      c ) INSTALL_CLUSTER=1 ;; # Install cluster
      d ) DEFAULTS=1 ;; 
      i ) ISTIO=1 ;; 
      k ) K6=1 ;; # Setup K6
      s ) SERVICES=1 ;; 
      t ) POST_SERVICE_INSTALL_CLUSTER=1 ;;
      h ) helpFunction ;; 
      ? ) helpFunction ;; 
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
    if [ "$clusterProvider" = "eks" ] 
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

if [[ $ISTIO == 1 ]]; then

    # install istio configs
    sh $setupfolder/istio/setup.sh

    # Enable istio on app and zk namespaces
    sh $setupfolder/istio/enable-istio.sh

fi

if [[ $POST_SERVICE_INSTALL_CLUSTER == 1 ]]; then
    echo "installing post-service installation"
    sh ./$clusterProvider/postservice-install.sh
fi

