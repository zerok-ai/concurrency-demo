IMAGE="zerokdemo"
TAG="latest"
docker build -t $IMAGE .
docker run -dp 3002:3000 $IMAGE