# Load Testing Instructions

Because Grafana `k6` is a low-level load testing tool that requires administrative privileges to install on Windows (and modifies system environment paths), it must be run directly on your host machine.

Follow these simple steps to run the tests and generate the capacity report.

## 1. Install k6 (Windows)

Open a **new** PowerShell or Command Prompt window (run as Administrator if possible) and run:

```bash
winget install k6 --source winget
```

After installation completes, **close and reopen your terminal** so the `k6` command is recognized.

Verify installation by running:
```bash
k6 version
```

## 2. Start Your Servers

Before running any load tests, make sure your application is actually running!

Open a terminal and start the main Node.js backend:
```bash
cd server
npm run dev
```

Open a second terminal and start the ML service:
```bash
cd server/ml_service
# Activate venv if needed
python main.py
```

## 3. Run the Tests

Navigate to the root of the project where this `load-tests/` folder is located:

```bash
cd "C:\PERSONAL\Web Development\AIML\Barter System"
```

### Test A: API Throughput Test
Tests the raw request-handling capacity of the Express.js server and database connection pool.
```bash
k6 run load-tests/api-load-test.js
```

### Test B: Real User Workflow Test
Simulates realistic users logging in, fetching profiles, loading dashboards, and checking availability.

> **Note**: You must provide a valid test user's email and password!
> Replace the email/password below with a user that exists in your local database.

```bash
$env:TEST_EMAIL="your_real_test_email@example.com"
$env:TEST_PASSWORD="your_real_password"
k6 run load-tests/workflow-test.js
```

### Test C: AI Recommendation Test
Tests the capacity of the FastAPI/ML service independently.
```bash
k6 run load-tests/recommendation-test.js
```

### Test D: Socket.IO Real-Time Test
Tests how many concurrent WebSockets the server can handle without dropping connections.
```bash
k6 run load-tests/socket-test.js
```

## 4. Send the Results

After running the tests, `k6` will print a summary block in the terminal that looks like this:

```text
    checks.........................: 100.00% ✓ 12345      ✗ 0
    data_received..................: 10 MB   500 kB/s
    data_sent......................: 2 MB    100 kB/s
    http_req_duration..............: avg=120ms  min=10ms   med=100ms  max=600ms  p(90)=150ms  p(95)=180ms
    http_req_failed................: 0.00%   ✓ 0          ✗ 12345
    iterations.....................: 12345   100/s
    vus............................: 200     min=10       max=200
```

**Please copy and paste the summary blocks for the tests you ran back into our chat.**
I will analyze the output (latency, throughput, bottlenecks, error rates) and write the final teacher-ready capacity report for you.
