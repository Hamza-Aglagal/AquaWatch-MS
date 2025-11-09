const axios = require('axios');

describe('Service Capteurs - Health endpoint', () => {
  test('GET /health returns status OK', async () => {
    const url = process.env.CAPTEURS_URL || 'http://localhost:8000/health';
    const res = await axios.get(url, { timeout: 5000 });
    expect(res.status).toBe(200);
    // service returns { status: 'OK', timestamp: '...' }
    expect(res.data).toHaveProperty('status');
    expect(res.data.status).toBeDefined();
  });
});
