import http from 'k6/http';
import { optionsBase, createOptions } from './script.js';

export const options = createOptions('zk-spill-checkout', 'zk-spill-coupons');

export function checkout() {
  // http.get('http://demo-app-zerok-spill.getanton.com/checkout');
  http.get('http://svc-app-zerok-spill.zerok.svc.cluster.local/checkout');
}

export function coupons() {
  // http.get('http://demo-app-zerok-spill.getanton.com/coupons');
  http.get('http://svc-app-zerok-spill.zerok.svc.cluster.local/coupons');
}