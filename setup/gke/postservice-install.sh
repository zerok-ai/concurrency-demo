#!/bin/bash -l

helpFunction()
{
   echo ""
   echo "Usage: $0 -p [Name of the project (optional parameter)]"
   exit 1 # Exit script after printing help
}

# while getopts "a:b:c:" opt
while getopts "p" opt
do
   case "$opt" in
      p ) project="$OPTARG" ;;
      h ) helpFunction ;; # Print helpFunction in case parameter is non-existent
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done


if [ -z "$project" ]
then
   project="black-scope-358204"
fi

# ------------------------------------------------------------------
# Add or update dns entries for the ingress
# ------------------------------------------------------------------
hosts=($(kubectl get ingress -A --no-headers | awk '{print $4}'))
ips=($(kubectl get ingress -A --no-headers | awk '{print $5}'))
for i in "${!hosts[@]}"; do
   domain="${hosts[i]}."
   gcloud dns --project=$project \
      record-sets update "${domain}" \
      --type="A" --zone="anton" --rrdatas="${ips[i]}" --ttl="10"
done



