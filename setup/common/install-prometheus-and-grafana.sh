# add helm repo for prometheus
echo '---------------------- Updating helm repo for kube-prometheus-stack'
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update 

# create namespace for monitoring stack
echo '---------------------- Creating namespace - `monitoring`'
kubectl create namespace monitoring

# install kube-prometheus
echo '---------------------- Installing kube-prometheus-stack'
helm upgrade --install prom prometheus-community/kube-prometheus-stack \
	--namespace monitoring \
	--values $setupfolder/common/yaml/values/prometheus-grafana.yaml

kubectl apply -f $setupfolder/common/yaml/cluster/monitoring-ingress.yaml

# Load previously saved grafana dashboard
$setupfolder/common/install-grafana-dashboard.sh concurrency-demo

# install Promtail
# helm upgrade --install promtail grafana/promtail -f $setupfolder/common/yaml/values/promtail-values.yaml -n monitoring

# install Loki 
# helm upgrade --install loki grafana/loki-distributed -n monitoring

#Install prometheus adapter
# helm install myapp-hpa-adapter -f ./common/yaml/values/prometheus-adapter.yaml prometheus-community/prometheus-adapter --namespace myapp-hpa
# helm install myapp-hpa-adapter -f $setupfolder/common/yaml/values/prometheus-adapter.yaml prometheus-community/prometheus-adapter prometheus-community/prometheus-adapter --namespace myapp-hpa
# helm install myapp-hpa-adapter --set prometheus.url=http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local  prometheus-community/prometheus-adapter --namespace myapp-hpa