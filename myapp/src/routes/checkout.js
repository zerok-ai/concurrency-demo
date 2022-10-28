var express = require('express');

var { highcpuCounter } = require('../utils/prometheus');
var { ipconfig, hostname } = require('../utils/sysinfo');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  var recCount = (req.query.count || 10);
  var finalData = 1; // hackySack(jsondata, recCount);

  for (var i = 0; i < recCount; i++) {
    finalData += 1;
    Math.random();
    // finalData += Math.random()*recCount; //fibonacci(i);
  }

  let ts = Date.now();
  let date = new Date(ts);

  highcpuCounter.inc({ code: 200 });
  res.send({
    api: 'checkout',
    count: finalData,
    date
  });
});

module.exports = router;
