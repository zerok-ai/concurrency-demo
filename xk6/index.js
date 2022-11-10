const express = require('express')
const pkill = require('pkill');
const fs = require('fs');
const app = express()
const port = 3000

const PROM_URL='http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090/api/v1/write'
const execute = require('child_process').exec
var running = false;
var paused = false;
// const POSSIBLE_SERVICES = ['app', 'zk', 'zk-spill', 'zk-soak'];
const POSSIBLE_SERVICES = {
    'app': false,
    'zk': false,
    'zk_spill': false,
    'zk_soak': false,
};

const HOST={
    "app":'svc-app.myapp.svc.cluster.local',
    "zk":'svc-app-zerok.zerok.svc.cluster.local',
    "zk_spill":'svc-app-zerok-spill.zerok.svc.cluster.local',
    "zk_soak":'svc-app-zerok-soak.zerok.svc.cluster.local'
};

//app, zk, zk-spill, zk-soak
app.get('/start-concurrent-tests', (req, res) => {

    const queryParams = req.query;
    const initialVUs = (queryParams.vus) ? queryParams.vus : 1000;
    const maxVUs = (queryParams.mvus) ? queryParams.mvus : 1000;
    const rate = (queryParams.rate) ? queryParams.rate : 220;
    const duration = (queryParams.duration) ? queryParams.duration : '5m';
    const timeunit = (queryParams.timeunit) ? queryParams.timeunit : '1m';
    const concurrency = (queryParams.concurrency) ? queryParams.concurrency : "";
    const testTag = (queryParams.tag) ? queryParams.tag : "none";
    
    /**
     * sample =  vus=2000&mvus=2000&rate=1800&stages=[[time]_[requests]_[ratelimit]]-[[time]_[requests]_[ratelimit]]_...
     * where ratelimit is defined as -> [Rate For Checkout]:[Rate For Coupon]
     */
   
    var testAttempted = false;
    if (queryParams.sapp){
        testAttempted = true;
        var service = 'app';
        runTestForService({ service, initialVUs, maxVUs, rate, stages: queryParams.sapp, duration, timeunit, concurrency, testTag }, (data) => {});
    }
 
    if (queryParams.szk) {
        testAttempted = true;
        var service = 'zk';
        runTestForService({ service, initialVUs, maxVUs, rate, stages: queryParams.szk, duration, timeunit, concurrency, testTag }, (data) => {});    

    } 
    
    if (queryParams.ssoak) {
        testAttempted = true;
        var service = 'zk_soak';
        runTestForService({ service, initialVUs, maxVUs, rate, stages: queryParams.ssoak, duration, timeunit, concurrency, testTag }, (data) => {});

    }

    if (queryParams.sspill) {
        testAttempted = true;
        var service = 'zk_spill';
        runTestForService({ service, initialVUs, maxVUs, rate, stages: queryParams.sspill, duration, timeunit, concurrency, testTag }, (data) => {});
        
    }

    if (!testAttempted){
        console.log(`no test in query parameters`)
    }

    res.send('started');
})


function runTestForService(params, callback) {

    const { service, initialVUs, maxVUs, rate, stages, duration, timeunit, concurrency, testTag } = params;
    if (paused && POSSIBLE_SERVICES[service]) {
        callback('Tests are in paused state. Try resuming them!');
        return;
    }
    console.log('start/service - ' + service);

    const isServiceValid = validateService(service);
    if (!isServiceValid) {
        callback('Invalid service name')
        return;
    }

    if (POSSIBLE_SERVICES[service]) {
        status(service, (data) => {
            callback(data);
        });
        return;
    }

    POSSIBLE_SERVICES[service] = true;
    try {
        startK6(params);
        callback('Started');
    } catch (error) {
        POSSIBLE_SERVICES[service] = false;
        callback(error);
        return;
    }
}

//app, zk, zk-spill, zk-soak
app.get('/start/:service', (req, res) => {
    const service = req.params.service;
    const queryParams = req.query;
    const initialVUs = (queryParams.vus) ? queryParams.vus : 1000;
    const maxVUs = (queryParams.mvus) ? queryParams.mvus : 1000;
    const rate = (queryParams.rate) ? queryParams.rate : 220;
    const stages = (queryParams.stages) ? queryParams.stages : '1_300-1_400';
    const duration = (queryParams.duration) ? queryParams.duration : '5m';
    const timeunit = (queryParams.timeunit) ? queryParams.timeunit : '1m';
    const concurrency = (queryParams.concurrency) ? queryParams.concurrency : "";
    const testTag = (queryParams.tag) ? queryParams.tag : "none";

    runTestForService({ service, initialVUs, maxVUs, rate, stages, duration, timeunit, concurrency, testTag }, (data) => {
        res.send(data);
    });
})

app.get('/pause', (req, res) => {
    if (!running) {
        res.send('No tests are running. Nothing to pause!');
        return;
    }
    if (paused) {
        res.send('Paused');
        return;
    }
    paused = true;
    try {
        pauseK6();
        res.send('Paused');
    } catch (error) {
        paused = false;
        res.send(error);
        return;
    }
})

app.get('/resume', (req, res) => {
    if (!running) {
        res.send('No tests are running. Nothing to resume!');
        return;
    }
    if (!paused && running) {
        res.send('Already running');
        return;
    }
    paused = false;
    try {
        resumeK6();
        res.send('Resumed');
    } catch (error) {
        paused = false;
        res.send(error);
        return;
    }
})

app.get('/reset', (req, res) => {
    Object.keys(POSSIBLE_SERVICES).map(key => {
        POSSIBLE_SERVICES[key] = false;
    });
    pkill.full('k6');
    res.send("Reset done");
})

app.get('/mark-closed/:service', (req, res) => {
    const service = req.params.service;
    POSSIBLE_SERVICES[service] = false;
    res.send("Marked for service " + service);
})

app.get('/scale', (req, res) => {
    const queryParams = req.query;
    const newVUs = queryParams.vus;

    if (!newVUs || newVUs === 0) {
        res.send('Invalid input!');
        return;
    }

    if (!running) {
        res.send('No tests are running. Nothing to scale!');
        return;
    }
    try {
        scaleK6(newVUs);
        res.send('Scaled');
    } catch (error) {
        res.send(error);
        return;
    }
})

app.get('/status/:service', (req, res) => {
    const service = req.params.service;
    console.log('status/service - ' + service);
    const isServiceValid = validateService(service);
    if (!isServiceValid) {
        res.send('Invalid service name')
        return;
    }

    status(service, (data) => res.send(data.toString()));
})



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

async function startK6(params) {
    const { service, initialVUs, maxVUs, rate, stages, duration, timeunit, concurrency, testTag } = params;
    //app, zk, zk-spill, zk-soak
    try {   
        let host=HOST[service];
        let date=new Date(Date.now());
        var dateString = date.getUTCFullYear() +"/"+ (date.getUTCMonth()+1) +"/"+ date.getUTCDate() + " " + date.getUTCHours() + ":" + date.getUTCMinutes() + ":" + date.getUTCSeconds();

        let command = `ulimit -n 65536;
        K6_PROMETHEUS_REMOTE_URL="${PROM_URL}" ./k6 run --no-connection-reuse -o output-prometheus-remote -e CONCURRENCY="${concurrency}"  -e SERVICE="${service}" -e TIMEUNIT="${timeunit}" -e DURATION="${duration}" -e STAGES="${stages}" -e RATE=${rate} -e PROMETHEUS_REMOTE_URL="${PROM_URL}" -e INITIAL_VUS="${initialVUs}" -e MAX_VUS="${maxVUs}" -e HOST="${host}" -e SCENARIO="${service}" -e TEST_TAG="${testTag}" --tag run="${dateString}" script.js 2>&1 | tee "lastrun-${service}.log" `;
        
        console.log("command: " + command);
        execute(command, (err, stdout, stderr) => {
                console.log(err, stdout, stderr)
                if (err != null) {
                    console.log("Error occured while running");
                    POSSIBLE_SERVICES[service] = false;
                }
            })
    } catch (error) {
        console.error(error.toString());
    }
}

async function pauseK6() {
    try {
        console.log("Pausing Tests");
        // const passwdContent = await execute("cat /etc/passwd");
        execute('sh ./pause_xk6.sh', (err, stdout, stderr) => {
            console.log(err, stdout, stderr)
            if (err != null) {
                console.log("Error occured while pausing");
                paused = false;
            }
        })
    } catch (error) {
        console.error(error.toString());
    }
}

async function resumeK6() {
    try {
        console.log("Resuming Tests");
        // const passwdContent = await execute("cat /etc/passwd");
        execute('sh ./resume_xk6.sh', (err, stdout, stderr) => {
            console.log(err, stdout, stderr)
            if (err === null) {
                console.log("Resumed successfully");
                paused = false;
            }
        })
    } catch (error) {
        console.error(error.toString());
    }
}

async function scaleK6(newVUs) {
    try {
        console.log("Scaling Tests with new VUs: " + newVUs);
        // const passwdContent = await execute("cat /etc/passwd");
        execute('sh ./scale_xk6.sh ' + newVUs, (err, stdout, stderr) => {
            console.log(err, stdout, stderr)
            if (err === null) {

            }
        })
    } catch (error) {
        console.error(error.toString());
    }
}

function validateService(service) {
    if (!service || !Object.keys(POSSIBLE_SERVICES).includes(service)) {
        return false;
    }
    return true;
}

async function status(service, callback) {
    fs.readFile('./lastrun-' + service + '.log', function read(err, data) {
        if (err) {
            content = "No status available " + err;
        } else {
            content = data;
        }
        const template = "<html><body><pre> " + content + "</pre></body></html>";
        callback(template);
    });
}


