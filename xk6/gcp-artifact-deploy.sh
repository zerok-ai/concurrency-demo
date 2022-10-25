LOCATION="us-central1"
PROJECT_ID="zerok-dev"
REPOSITORY="zerok-concurrency-demo-cluster"
IMAGE="xk6-api"
TAG="latest"
ART_Repo_URI="$LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE:$TAG"
docker build -t $IMAGE .

docker tag $IMAGE $ART_Repo_URI

gcloud auth configure-docker \
    $LOCATION-docker.pkg.dev

docker push $ART_Repo_URI
