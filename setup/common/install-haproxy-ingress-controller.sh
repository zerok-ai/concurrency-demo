#----------- Install HAProxy proxy based ingress ----------- 

# Add the Helm chart for HAProxy Ingress
echo '---------------------- Updating helm repo for haproxy-ingress'
helm repo add haproxy-ingress https://haproxy-ingress.github.io/charts
helm repo update

# Create namespace
echo '---------------------- Creating namespace `ingress-haproxy`'
kubectl create namespace ingress-haproxy

# Install the Helm (v3) chart for HAProxy ingress controller
echo '---------------------- Installing helm chart of haproxy-ingress'
helm install app-ingress haproxy-ingress/haproxy-ingress\
  --namespace ingress-haproxy\
  --version 0.13.7\
  -f $setupfolder/common/yaml/values/haproxy-ingress-values.yaml

# Print the Ingress Controller public IP address
kubectl get services --namespace ingress-haproxy

#----------- 
# helm upgrade app-ingress haproxy-ingress/haproxy-ingress \
# 	--namespace ingress-haproxy \
# 	-f $setupfolder/common/yaml/values/haproxy-ingress-values.yaml