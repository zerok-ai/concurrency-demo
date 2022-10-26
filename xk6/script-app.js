import http from 'k6/http';
import { optionsBase, createScenarios, checkout, coupons } from './script.js';

export const options = createScenarios('svc-app.myapp.svc.cluster.local', 'app-checkout', 'app-coupons');

export function checkout = checkout;

export function coupons() {
  http.get('http://demo-app.getanton.com/coupons');
  // http.get('http://svc-app.myapp.svc.cluster.local/coupons');
}

// export function checkout() {
//   http.get('http://demo-app.getanton.com/checkout');
//   // http.get('http://svc-app.myapp.svc.cluster.local/checkout');
// }

// export function coupons() {
//   http.get('http://demo-app.getanton.com/coupons');
//   // http.get('http://svc-app.myapp.svc.cluster.local/coupons');
// }