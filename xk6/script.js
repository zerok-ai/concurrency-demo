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
const SCENARIO = (__ENV.SCENARIO) ? __ENV.SCENARIO : __ENV.SERVICE;
const CONCURRENCY = __ENV.CONCURRENCY;
const TEST_TAG = __ENV.TEST_TAG;

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

    //  set the rate limits if present
    if (stage.length > 2) {
      var rateLimit = stage[2];
      
      var limits = rateLimit.split(':');
      var checkoutLimit = 100;
      var couponLimit = 100;
      // if only one value is present, apply the limit to both the apis
      if (limits.length > 0) {
        checkoutLimit = limits[0];
        couponLimit = limits[1];
      }
      
      // if 2 values are present, apply the second limit to coupon
      if (limits.length > 1) {
        couponLimit = limits[1];
      }     

      stageToRateLimit[index + ''] = {"checkoutLimit":checkoutLimit, "couponLimit":couponLimit};

      console.log(stageToRateLimit[index + ''])
    }
    const transformedStage = { duration: duration, target: iterations };
    scenarioStage.push(transformedStage);
    index++;
  });
}

const HOST = __ENV.HOST;
const CHECKOUT_SCENARIO = SCENARIO + "_checkout"; //app_checkout, zk_checkout
const COUPONS_SCENARIO = SCENARIO + "_coupons";

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
  scenariosMap[COUPONS_SCENARIO] = couponsScenario;

  return scenariosMap;
}

export const options = {
  discardResponseBodies: true,
  scenarios: createScenarios(),
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
    myGauge.add(concurrencies[stageIndex], { run_id: TEST_TAG });
  }
  return stageIndex;
}

export function setup() {
  console.log(options)
}

export function checkout() {
  const stageIndex = processStageIndex();
  const params = {
      tags: {
        run_id: TEST_TAG,
      },
  };
  if (stageToRateLimit[stageIndex + '']) {
    params['headers'] = {
      'rate-limit': stageToRateLimit[stageIndex + ''].checkoutLimit + ''
    }
  }
  const res = http.get('http://' + HOST + '/checkout?count=' + verticalScaleCount['checkout'], params);
  scenarioMetrics.forEach((metric) => {
    myTrend[CHECKOUT_SCENARIO][metric].add(res.timings[metric], { run_id: TEST_TAG });
  })
  sleep(.5);
}

export function coupons() {
  const stageIndex = processStageIndex();
  const params = {
    tags: {
      run_id: TEST_TAG,
    },
  };
  if (stageToRateLimit[stageIndex + '']) {
    params['headers'] = {
      'rate-limit': stageToRateLimit[stageIndex + ''].couponLimit + ''
    }
  }
  const res = http.get('http://' + HOST + '/coupons?count=' + verticalScaleCount['coupons'], params);
  scenarioMetrics.forEach((metric) => {
    myTrend[COUPONS_SCENARIO][metric].add(res.timings[metric], { run_id: TEST_TAG });
  })
  sleep(.5);
}

export function teardown(data) {
  // 4. teardown code
  //SERVICE
  console.log('Tearing down test started for ' + SERVICE);
  scenarioMetrics.forEach((metric) => {
    myTrend[CHECKOUT_SCENARIO][metric].add(0, { run_id: TEST_TAG });
    myTrend[COUPONS_SCENARIO][metric].add(0, { run_id: TEST_TAG });
  })
  const res = http.get('http://demo-load-generator.getanton.com/mark-closed/' + SERVICE, {
    tags: {
      run_id: TEST_TAG,
    },
  });
  console.log(res);
}
