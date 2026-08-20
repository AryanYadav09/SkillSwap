import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 concurrent socket connections
    { duration: '20s', target: 150 }, // Ramp up to 150
    { duration: '20s', target: 300 }, // Ramp up to 300
    { duration: '10s', target: 0 },   // Scale down
  ],
  thresholds: {
    // Thresholds can be added here
  },
};

const BASE_WS_URL = __ENV.WS_URL || 'ws://localhost:5000';
// Wait, socket.io uses a specific protocol path (e.g. /socket.io/?EIO=4&transport=websocket)
const WS_URL = `${BASE_WS_URL}/socket.io/?EIO=4&transport=websocket`;

export default function () {
  const res = ws.connect(WS_URL, null, function (socket) {
    socket.on('open', function () {
      // Once connected, wait a bit
      sleep(10); // Hold the connection open for 10 seconds to simulate a live user
      socket.close();
    });

    socket.on('error', function (e) {
      if (e.error() !== "websocket: close sent") {
        console.log('An unexpected error occurred: ', e.error());
      }
    });

    socket.setTimeout(function () {
      socket.close();
    }, 15000);
  });

  check(res, { 'status is 101 (Switching Protocols)': (r) => r && r.status === 101 });
  sleep(1);
}
