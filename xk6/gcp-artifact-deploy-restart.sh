sh ./gcp-artifact-deploy.sh
kubectl -n k6 rollout restart deploy
