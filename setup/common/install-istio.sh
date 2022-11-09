echo 'i--- get the helm chart'
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
kubectl create namespace istio-system

echo 'i--- Install the Istio base chart which contains cluster-wide resources used by the Istio control plane'
helm install istio-base istio/base -n istio-system

echo 'i--- Install the Istio discovery chart which deploys the istiod service'
helm install istiod istio/istiod -n istio-system --wait


# delete istio
# helm delete istiod -n istio-system
# helm delete istio-base -n istio-system
# kubectl delete namespace istio-system
