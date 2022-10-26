import http from 'k6/http';
import { optionsBase, createOptions } from './script.js';

export const options = createOptions('app-checkout', 'app-coupons');

export function checkout() {
  // http.get('http://demo-app.getanton.com/checkout');
  http.get('http://svc-app.myapp.svc.cluster.local/checkout');
}

export function coupons() {
  // http.get('http://demo-app.getanton.com/coupons');
  http.get('http://svc-app.myapp.svc.cluster.local/coupons');
}