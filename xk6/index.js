const express = require('express')
const pkill = require('pkill');
const fs = require('fs');
const app = express()
const port = 3000

const execute = require('child_process').exec
var running = false;
var paused = false;
app.get('/start', (req, res) => {
    if (paused && running) {
        res.send('Tests are in paused state. Try resuming them!');
        return;
    }
    if (running) {
        status((data) => res.send(data.toString()));
        return;
    }
    running = true;
    try {
        startK6();
        res.send('Started');
    } catch (error) {
        running = false;
        res.send(error);
        return;
    }
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
    running = false;
    pkill.full('k6');
    res.send("Reset done");
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

app.get('/status', (req, res) => {
    status((data) => res.send(data.toString()));
})



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

async function startK6() {
    try {
        console.log("init test run");
        // const passwdContent = await execute("cat /etc/passwd");
        execute('sh ./run_xk6.sh', (err, stdout, stderr) => {
            console.log(err, stdout, stderr)
            if (err != null) {
                console.log("Error occured while running");
                running = false;
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

async function status(callback) {
    fs.readFile('./lastrun.log', function read(err, data) {
        if (err) {
            throw err;
        }
        content = data;
        const template = "<html><body><pre> " + content + "</pre></body></html>";
        callback(template);
    });
}