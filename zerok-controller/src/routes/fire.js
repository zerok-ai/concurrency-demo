var express = require('express');

var { fireGauge } = require('../utils/prometheus');
var { ipconfig, hostname } = require('../utils/sysinfo');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  var gauge = req.query.gauge;

  if (!gauge) {
    gauge = "4";
  }

  let ts = Date.now();
  let date = new Date(ts);

  fireGauge.set(parseInt(gauge));
  res.send({
    api: 'fire',
    count: gauge,
    date
  });
});

module.exports = router;
