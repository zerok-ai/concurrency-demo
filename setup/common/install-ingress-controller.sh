#----------- Install NGINX proxy based ingress ----------- 

# Add the Helm chart for Nginx Ingress
echo '---------------------- Updating helm repo for ingress-nginx'
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install the Helm (v3) chart for nginx ingress controller
echo '---------------------- Installing helm chart of ingress-nginx'
helm upgrade --install app-ingress ingress-nginx/ingress-nginx \
	--create-namespace --namespace app-ingress \
	--values $setupfolder/common/yaml/values/app-nginx-ingress-values.yaml

# Print the Ingress Controller public IP address
kubectl get services --namespace app-ingress
#----------- 
# helm upgrade app-ingress ingress-nginx/ingress-nginx \
# 	--namespace ingress \
# 	-f ./yaml/values/nginx-ingress-values.yaml