import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 25 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<1500'], // ML inference can be slower, so we set a higher threshold
  },
};

const ML_SERVICE_URL = __ENV.ML_URL || 'http://localhost:8002';

// Sample data for the ML model
const payload = JSON.stringify({
  user: {
    id: "user_123",
    skills: ["JavaScript", "React"],
    learningGoals: ["Python", "Machine Learning"]
  },
  candidates: [
    { id: "cand_1", skills: ["Python"], learningGoals: ["React"] },
    { id: "cand_2", skills: ["Java"], learningGoals: ["C++"] },
    { id: "cand_3", skills: ["Machine Learning", "Python"], learningGoals: ["JavaScript"] },
    { id: "cand_4", skills: ["UI/UX"], learningGoals: ["Figma"] },
    { id: "cand_5", skills: ["Python"], learningGoals: ["React"] },
  ]
});

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${ML_SERVICE_URL}/recommend`, payload, params);
  
  check(res, {
    'recommendation status is 200': (r) => r.status === 200,
    'returns recommendations list': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.recommendations);
      } catch (e) {
        return false;
      }
    }
  });

  sleep(1);
}
