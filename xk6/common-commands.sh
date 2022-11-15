# -------------------------------------------------------------------------------------------
# To build promethueus-K6 for ubuntu. 
# 1. Login to a remote ubuntu machine
# 2. build prometheus k6
# -------------------------------------------------------------------------------------------
project="black-scope-358204"
cluster="multi-stage-demo"
zone="us-central1-c"

#  ssh to a node on GKE
k6node=($(kubectl get nodes --no-headers | grep 'k6' | awk '{print $1}'))
gcloud compute ssh "$k6node" --zone "$zone" --project "$project"

mkdir temp
cd /tmp

# find latest version using curl or by manually looking at download page
go_latest=$(curl -s https://go.googlesource.com/go | grep -Po "<li class=\"RefList-item\"><a href=\"/go/\+/refs/tags/go\d\.\d*\">go\K(\d\.\d*)</a></li>" | cut -d'<' -f1)
echo "Latest go release: $go_latest"

# download archive
wget https://storage.googleapis.com/golang/go${go_latest}.linux-amd64.tar.gz

# remove any older versions, extract new version
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go${go_latest}.linux-amd64.tar.gz

# check version
/usr/local/go/bin/go version

export GOPATH=$HOME/work
export PATH=/usr/local/go/bin:$PATH

go install go.k6.io/xk6/cmd/xk6@latest
export PATH=$(go env GOPATH)/bin:$PATH


# ------------------------------------------------------------------------------------
# copy generated k6 to local folder (RUN ON LOCAL MACHINE)
# ------------------------------------------------------------------------------------
project="black-scope-358204"
cluster="multi-stage-demo"
zone="us-central1-c"
k6node=($(kubectl get nodes --no-headers | grep 'k6' | awk '{print $1}'))
gcloud compute scp --zone "$zone" --project "$project" "$k6node":~/work/k6 .
