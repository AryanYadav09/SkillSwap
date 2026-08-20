import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<800'], // P95 < 800ms (workflow involves ML which is slower)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api';
const EMAIL = __ENV.TEST_EMAIL || 'testuser@example.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'password123';

export default function () {
  // 1. Authentication (Login)
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: EMAIL,
    password: PASSWORD,
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && body.data.accessToken;
      } catch (e) {
        return false;
      }
    },
  });

  // Extract token for authenticated requests
  let token;
  try {
    token = JSON.parse(loginRes.body).data.accessToken;
  } catch (e) {
    // If login failed, skip rest of the iteration
    return;
  }

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  sleep(1);

  // 2. Fetch Profile
  const profileRes = http.get(`${BASE_URL}/auth/me`, params);
  check(profileRes, { 'profile status is 200': (r) => r.status === 200 });

  sleep(1);

  // 3. Fetch Dashboard (DB Heavy + Recommendations)
  const dashboardRes = http.get(`${BASE_URL}/dashboard`, params);
  check(dashboardRes, { 'dashboard status is 200': (r) => r.status === 200 });

  sleep(1);

  // 4. Fetch Available Slots for another user (e.g., trying to book)
  // Just testing the list of all availability to simulate finding someone
  const usersRes = http.get(`${BASE_URL}/users`, params);
  check(usersRes, { 'users status is 200': (r) => r.status === 200 });

  let targetUserId;
  try {
    const usersData = JSON.parse(usersRes.body).data;
    const usersList = usersData.items || usersData;
    if (usersList.length > 0) {
      targetUserId = usersList[0].id;
    }
  } catch(e) {}

  if (targetUserId) {
    sleep(0.5);
    const slotsRes = http.get(`${BASE_URL}/users/${targetUserId}/available-slots`, params);
    check(slotsRes, { 'available slots status is 200': (r) => r.status === 200 });
  }

  sleep(1);
}
