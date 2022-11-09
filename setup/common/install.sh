# install prometheus and grafana
# echo '###################### Installing prometheus and grafana'
sh $setupfolder/common/install-prometheus-and-grafana.sh

# install ingress controller
echo '###################### Installing ingress controller'
sh $setupfolder/common/install-ingress-controller.sh

# install istio
sh $setupfolder/common/install-istio.sh