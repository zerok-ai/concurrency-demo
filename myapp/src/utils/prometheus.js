/**
 * Prometheus
 */

const apiMetrics = require('prometheus-api-metrics');
const client = require('prom-client');

const Counter = client.Counter;
const Gauge = client.Gauge;
const fireGauge = new Gauge({
    name: 'fire_gauge',
    help: 'fire_gauge'
});
const highcpuCounter = new Counter({
    name: 'checkout_counter',
    help: 'checkout access counter',
    labelNames: ['code'],
});
const highmemCounter = new Counter({
    name: 'coupons_counter',
    help: 'coupons access counter',
    labelNames: ['code'],
});


module.exports = {
    fireGauge,
    highmemCounter,
    highcpuCounter,
};
