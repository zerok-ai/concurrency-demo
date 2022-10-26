import http from 'k6/http';
import { optionsBase, createOptions } from './script.js';

export const options = createOptions('zk-soak-checkout', 'zk-soak-coupons');

export function checkout() {
  // http.get('http://demo-app-zerok-soak.getanton.com/checkout');
  http.get('http://svc-app-zerok-soak.zerok.svc.cluster.local/checkout');
}

export function coupons() {
  // http.get('http://demo-app-zerok-soak.getanton.com/coupons');
  http.get('http://svc-app-zerok-soak.zerok.svc.cluster.local/coupons');
}