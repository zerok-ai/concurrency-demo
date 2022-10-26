import http from 'k6/http';

const initialVUs = 1000;
const maxVUs = 1000;
const duration = '5m';

export const optionsBase = {
  discardResponseBodies: true,
  scenarios: {
    checkout: {
      executor: 'externally-controlled',
      exec: 'checkout',
      vus: initialVUs,
      maxVUs: maxVUs,
      duration: duration,
    },
    coupons: {
      executor: 'externally-controlled',
      exec: 'coupons',
      vus: initialVUs,
      maxVUs: maxVUs,
      duration: duration,
    },
  },
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
};
