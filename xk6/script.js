import http from 'k6/http';

const initialVUs = 1000;
const maxVUs = 1000;
const duration = '5m';

export function createOptions(checkoutScenarioName, couponsScenarioName) {
  const checkoutScenario = {
    executor: 'externally-controlled',
    exec: 'checkout',
    vus: initialVUs,
    maxVUs: maxVUs,
    duration: duration,
  };
  const couponsScenario = {
    executor: 'externally-controlled',
    exec: 'coupons',
    vus: initialVUs,
    maxVUs: maxVUs,
    duration: duration,
  };
  const scenariosMap = {};
  scenariosMap[checkoutScenarioName] = checkoutScenario;
  scenariosMap[couponsScenarioName] = couponsScenario;

  return {
    discardResponseBodies: true,
    scenarios: scenariosMap,
    ext: {
      loadimpact: {
        apm: [
          {
            provider: 'prometheus',
            remoteWriteURL: 'http://localhost:9090/api/v1/write',
            includeDefaultMetrics: true,
            includeTestRunId: true,
            resampleRate: 3,
          },
        ],
      },
    }
  }
}

// export const optionsBase = {
//   discardResponseBodies: true,
//   scenarios: {
//     checkout: {
//       executor: 'externally-controlled',
//       exec: 'checkout',
//       vus: initialVUs,
//       maxVUs: maxVUs,
//       duration: duration,
//     },
//     coupons: {
//       executor: 'externally-controlled',
//       exec: 'coupons',
//       vus: initialVUs,
//       maxVUs: maxVUs,
//       duration: duration,
//     },
//   },
//   ext: {
//     loadimpact: {
//       apm: [
//         {
//           provider: 'prometheus',
//           remoteWriteURL: 'http://localhost:9090/api/v1/write',
//           includeDefaultMetrics: true,
//           includeTestRunId: true,
//           resampleRate: 3,
//         },
//       ],
//     },
//   }
// };
