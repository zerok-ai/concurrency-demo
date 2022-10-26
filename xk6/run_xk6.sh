
service=$1
script="script.js"
logfile="lastrun.app.log"

case $service in

  app)
    script="script-app.js"
    logfile="lastrun-app.log"
    rm lastrun-app.log
    ;;

  zk)
    script="script-zk.js"
    logfile="lastrun-zk.log"
    rm lastrun-zk.log
    ;;

  zk-spill)
    script="script-zk-spill.js"
    logfile="lastrun-zk-spill.log"
    rm lastrun-zk-spill.log
    ;;

  zk-soak)
    script="script-zk-soak.js"
    logfile="lastrun-zk-soak.log"
    rm lastrun-zk-soak.log
    ;;

  *)
    echo -n "unknown"
    exit 1;
    ;;
esac

./run.sh $1 2>&1 | tee $logfile