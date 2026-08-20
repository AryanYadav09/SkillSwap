import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 25 },  // ramp up to 25 users
    { duration: '20s', target: 50 },  // ramp up to 50 users
    { duration: '20s', target: 100 }, // ramp up to 100 users
    { duration: '20s', target: 150 }, // ramp up to 150 users
    { duration: '30s', target: 200 }, // ramp up to 200 users
    { duration: '10s', target: 0 },   // scale down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // error rate < 1%
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';

export default function () {
  // 1. Lightweight API
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Database-heavy API (Public)
  const skillsRes = http.get(`${BASE_URL}/skills`);
  check(skillsRes, {
    'skills status is 200': (r) => r.status === 200,
    'skills returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && Array.isArray(body.data.items || body.data);
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}
