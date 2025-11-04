const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-sig' });
});

app.get('/', (req, res) => {
  res.send('Service API-SIG - AquaWatch');
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Service API-SIG started on port ${port}`);
});
