import { getCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.3.0/index.js';
import { sleep } from 'k6';
import http from 'k6/http';
import { Gauge, Trend } from 'k6/metrics';

const INITIAL_VUS = (__ENV.INITIAL_VUS) ? __ENV.INITIAL_VUS : 1000;
const MAX_VUS = (__ENV.MAX_VUS) ? __ENV.MAX_VUS : 1000;
const PROMETHEUS_REMOTE_URL = __ENV.PROMETHEUS_REMOTE_URL;
const RATE = __ENV.RATE;
const STAGES = __ENV.STAGES;
const DURATION = __ENV.DURATION;
const TIMEUNIT = __ENV.TIMEUNIT;
const SERVICE = __ENV.SERVICE;
const CONCURRENCY = __ENV.CONCURRENCY;
// const STAGE_TAGS = __ENV.STAGE_TAGS;

const initialVUs = INITIAL_VUS;
const maxVUs = MAX_VUS;
const duration = DURATION;
const timeUnit = TIMEUNIT;

var scenarioStage = undefined;
var stageTags = {};
var stageToRateLimit = {};
var concurrencies = [];

function parseStages() {
  if (scenarioStage) {
    return;
  }

  if (CONCURRENCY && CONCURRENCY.length > 0) {
    const concurrencyStrings = CONCURRENCY.split('_');
    concurrencyStrings.map(concurrencyString => {
      concurrencies.push(parseInt(concurrencyString));
    });

  }

  //1_300-2_300
  scenarioStage = [];
  var stages = STAGES.split('-');
  var index = 0;
  stages.map(stageString => {
    var stage = stageString.split('_');
    var duration = stage[0];
    var requestssString = stage[1];
    var requests = parseInt(requestssString);
    var iterations = requests;
    if (stage.length > 2) {
      var rateLimit = stage[2];
      stageToRateLimit[index + ''] = rateLimit;
    }
    const transformedStage = { duration: duration, target: iterations };
    scenarioStage.push(transformedStage);
    index++;
  });
}

// 3200 - per API
// 6400 - app
// 6400/4 - pod

const HOST = __ENV.HOST;
const CHECKOUT_SCENARIO = __ENV.CHECKOUT_SCENARIO;//app-checkout, zk-checkout
const COUPONS_SCENARIO = __ENV.COUPONS_SCENARIO;//app-coupons, zk-coupons

var myTrend = {};
var myGauge = new Gauge('concurrency');
const scenarioMetrics = ['waiting', 'duration']

function createScenarios() {

  parseStages();

  //Checkout
  var key = `${CHECKOUT_SCENARIO}`;
  scenarioMetrics.forEach((metric) => {
    myTrend[key] = myTrend[key] || {};
    myTrend[key][metric] = new Trend(`custom_${metric}`);
  })

  //Coupons
  key = `${COUPONS_SCENARIO}`;
  scenarioMetrics.forEach((metric) => {
    myTrend[key] = myTrend[key] || {};
    myTrend[key][metric] = new Trend(`custom_${metric}`);
  })

  const checkoutScenario = {
    executor: 'ramping-arrival-rate',
    exec: 'checkout',
    preAllocatedVUs: initialVUs,
    maxVUs: maxVUs,
    timeUnit: timeUnit,
    stages: scenarioStage,
    startRate: 1,
    startTime: '0s'
  };
  const couponsScenario = {
    executor: 'ramping-arrival-rate',
    exec: 'coupons',
    preAllocatedVUs: initialVUs,
    maxVUs: maxVUs,
    timeUnit: timeUnit,
    stages: scenarioStage,
    startRate: 1,
    startTime: '0s'
  };

  const scenariosMap = {};
  scenariosMap[CHECKOUT_SCENARIO] = checkoutScenario;
  // scenariosMap[COUPONS_SCENARIO] = couponsScenario;

  return scenariosMap;
}

export const options = {
  discardResponseBodies: true,
  scenarios: createScenarios(),
  ext: {
    loadimpact: {
      apm: [
        {
          provider: 'prometheus',
          remoteWriteURL: PROMETHEUS_REMOTE_URL,
          includeDefaultMetrics: true,
          includeTestRunId: true,
          resampleRate: 3,
        },
      ],
    },
  }
};

const verticalScaleCount = {
  // Count variable to control Mem consumed by each highmem API call.
  'coupons': 15,  // 1 * 1MB
  // Count variable to control CPU consumed by each highcpu API call.
  'checkout': 333 * 1000,
}


function processStageIndex() {
  var stageIndex = getCurrentStageIndex();
  if (concurrencies[stageIndex]) {
    myGauge.add(concurrencies[stageIndex]);
  }
  return stageIndex;
}

export function checkout() {
  const stageIndex = processStageIndex();
  const params = {};
  if (stageToRateLimit[stageIndex + '']) {
    params['headers'] = {
      'rate-limit': stageToRateLimit[stageIndex + ''] + ''
    }
  }
  const res = http.get('http://' + HOST + '/checkout?count=' + verticalScaleCount['checkout'], params);
  scenarioMetrics.forEach((metric) => {
    myTrend[CHECKOUT_SCENARIO][metric].add(res.timings[metric], {});
  })
  sleep(1);
}

export function coupons() {
  const stageIndex = processStageIndex();
  const params = {};
  if (stageToRateLimit[stageIndex + '']) {
    params['headers'] = {
      'rate-limit': stageToRateLimit[stageIndex + ''] + ''
    }
  }
  const res = http.get('http://' + HOST + '/coupons?count=' + verticalScaleCount['coupons'], params);
  scenarioMetrics.forEach((metric) => {
    myTrend[COUPONS_SCENARIO][metric].add(res.timings[metric], {});
  })
  sleep(1);
}

export function teardown(data) {
  // 4. teardown code
  //SERVICE
  console.log('Tearing down test started for ' + SERVICE);
  scenarioMetrics.forEach((metric) => {
    myTrend[CHECKOUT_SCENARIO][metric].add(0, {});
    myTrend[COUPONS_SCENARIO][metric].add(0, {});
  })
  const res = http.get('http://demo-load-generator.getanton.com/mark-closed/' + SERVICE);
  console.log(res);
}