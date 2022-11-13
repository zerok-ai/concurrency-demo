# set variables 
project="black-scope-358204"
cluster="multi-stage-demo"
zone="us-central1-c"


# Check whether GKE cluster is up
gcloud container clusters describe "$cluster" --zone "$zone" --project "$project"


#  ssh to a node on GKE
k6node=($(kubectl get nodes --no-headers | grep 'k6' | awk '{print $1}'))
gcloud compute ssh "$k6node" --zone "$zone" --project "$project"

