import http from 'k6/http';
import { check } from 'k6';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const INITIAL_VUS = (__ENV.INITIAL_VUS) ? __ENV.INITIAL_VUS : 1000;
const MAX_VUS = (__ENV.MAX_VUS) ? __ENV.MAX_VUS : 1000;
const PROMETHEUS_REMOTE_URL = __ENV.PROMETHEUS_REMOTE_URL;
const RATE = __ENV.RATE;
const STAGES = __ENV.STAGES;

const initialVUs = INITIAL_VUS;
const maxVUs = MAX_VUS;
const duration = '5m';

var scenarioStage = undefined;

function parseStages() {
  if (scenarioStage) {
    return;
  }

  //1_300-2_300
  scenarioStage = [];
  var stages = STAGES.split('-');
  stages.map(stageString => {
    var stage = stageString.split('_');
    var duration = stage[0];
    var iterations = stage[1];
    const transformedStage = { duration: duration, target: parseInt(iterations) };
    scenarioStage.push(transformedStage);
  });
}

const HOST = __ENV.HOST;
const CHECKOUT_SCENARIO = __ENV.CHECKOUT_SCENARIO;//app-checkout, zk-checkout
const COUPONS_SCENARIO = __ENV.COUPONS_SCENARIO;//app-coupons, zk-coupons

var myTrend = {};
const scenarioMetrics = ['waiting', 'duration']

function createScenarios() {

  parseStages();

  //Checkout
  var key = `${CHECKOUT_SCENARIO}`;
  scenarioMetrics.forEach((metric) => {
    myTrend[key] = myTrend[key] || {};
    myTrend[key][metric] = new Trend(`custom_${CHECKOUT_SCENARIO}_${metric}`);
  })

  //Coupons
  key = `${COUPONS_SCENARIO}`;
  scenarioMetrics.forEach((metric) => {
    myTrend[key] = myTrend[key] || {};
    myTrend[key][metric] = new Trend(`custom_${COUPONS_SCENARIO}_${metric}`);
  })

  // const scenarioStage = [
  //   // { duration: '1m', target: 100 },
  //   { duration: '1m', target: 250 },
  //   { duration: '1m', target: 400 },
  //   { duration: '1m', target: 350 },
  //   // { duration: '1m', target: 625 },
  // ]

  const checkoutScenario = {
    executor: 'ramping-arrival-rate',
    exec: 'checkout',
    preAllocatedVUs: initialVUs,
    maxVUs: maxVUs,
    timeUnit: '1m',
    stages: scenarioStage,
    startRate: 50
  };
  const couponsScenario = {
    executor: 'ramping-arrival-rate',
    exec: 'coupons',
    preAllocatedVUs: initialVUs,
    maxVUs: maxVUs,
    timeUnit: '1m',
    stages: scenarioStage,
    startRate: 50
  };

  // const checkoutScenario = {
  //   executor: 'constant-arrival-rate',
  //   exec: 'checkout',
  //   preAllocatedVUs: initialVUs,
  //   maxVUs: maxVUs,
  //   duration: duration,
  //   rate: RATE,
  //   timeUnit: '1m',
  // };
  // const couponsScenario = {
  //   executor: 'constant-arrival-rate',
  //   exec: 'coupons',
  //   preAllocatedVUs: initialVUs,
  //   maxVUs: maxVUs,
  //   duration: duration,
  //   rate: RATE,
  //   timeUnit: '1m',
  // };

  // //Externally controlled
  // const checkoutScenario = {
  //   executor: 'externally-controlled',
  //   exec: 'checkout',
  //   vus: initialVUs,
  //   maxVUs: maxVUs,
  //   duration: duration,
  // };
  // const couponsScenario = {
  //   executor: 'externally-controlled',
  //   exec: 'coupons',
  //   vus: initialVUs,
  //   maxVUs: maxVUs,
  //   duration: duration,
  // };
  const scenariosMap = {};
  scenariosMap[CHECKOUT_SCENARIO] = checkoutScenario;
  scenariosMap[COUPONS_SCENARIO] = couponsScenario;

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

export function checkout() {
  const res = http.get('http://' + HOST + '/checkout?count=' + verticalScaleCount['checkout']);
  scenarioMetrics.forEach((metric) => {
    myTrend[CHECKOUT_SCENARIO][metric].add(res.timings[metric], { tag: `${CHECKOUT_SCENARIO}_${metric}` });
  })
  sleep(1);
}

export function coupons() {
  const res = http.get('http://' + HOST + '/coupons?count=' + verticalScaleCount['coupons']);
  scenarioMetrics.forEach((metric) => {
    myTrend[COUPONS_SCENARIO][metric].add(res.timings[metric], { tag: `${COUPONS_SCENARIO}_${metric}` });
  })
  sleep(1);
}

// function prepareExecFn(identifier, scenarioName, host) {
//   const hostname = hosts[host];
//   const key = `${identifier}_${scenarioName}`;
//   return () => {
//     const res = http.get('http://' + hostname + '/load-test/' + scenarioName + '?count=' + verticalScaleCount[scenarioName]);
//     check(res, {
//       'verify homepage text': (r) =>
//         r.body.includes(scenarioName),
//     });
//     scenarioMetrics.forEach((metric) => {
//       myTrend[key][metric].add(res.timings[metric], { tag: `${scenarioName}_${metric}` });
//     })
//     sleep(1);
//   }
// }