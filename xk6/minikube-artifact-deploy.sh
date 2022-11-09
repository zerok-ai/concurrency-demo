LOCATION="us-central1"
PROJECT_ID="zerok-dev"
REPOSITORY="multi-stage-demo"
IMAGE="xk6-api"
TAG="latest"
ART_Repo_URI="$LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:$TAG"
docker build -t $IMAGE .
docker tag $IMAGE $ART_Repo_URI
echo "------------------"
echo "Docker build done"
echo "Pushing $ART_Repo_URI to minikube"
minikube image load $ART_Repo_URI