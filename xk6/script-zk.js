import http from 'k6/http';
import { optionsBase } from './script.js';

export const options = optionsBase;

export function checkout() {
  // http.get('http://demo-app-zerok.getanton.com/checkout');
  http.get('http://svc-app-zerok.zerok.svc.cluster.local/checkout');
}

export function coupons() {
  // http.get('http://demo-app-zerok.getanton.com/coupons');
  http.get('http://svc-app-zerok.zerok.svc.cluster.local/coupons');
}