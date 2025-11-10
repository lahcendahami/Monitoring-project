// api-gateway/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';

// Metrics
let totalRequests = 0;
let requestsByService = {
  order: 0,
  inventory: 0
};
let errorCount = 0;
let requestDurations = [];

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  totalRequests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    requestDurations.push(duration);
    if (requestDurations.length > 1000) requestDurations.shift();
  });
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Route to order service
app.post('/api/orders', async (req, res) => {
  try {
    requestsByService.order++;
    const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, req.body);
    res.json(response.data);
  } catch (error) {
    errorCount++;
    res.status(500).json({ error: 'Order service unavailable' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    requestsByService.order++;
    const response = await axios.get(`${ORDER_SERVICE_URL}/orders`);
    res.json(response.data);
  } catch (error) {
    errorCount++;
    res.status(500).json({ error: 'Order service unavailable' });
  }
});

// Route to inventory service
app.get('/api/inventory', async (req, res) => {
  try {
    requestsByService.inventory++;
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/inventory`);
    res.json(response.data);
  } catch (error) {
    errorCount++;
    res.status(500).json({ error: 'Inventory service unavailable' });
  }
});

app.put('/api/inventory/:itemId', async (req, res) => {
  try {
    requestsByService.inventory++;
    const response = await axios.put(
      `${INVENTORY_SERVICE_URL}/inventory/${req.params.itemId}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    errorCount++;
    res.status(500).json({ error: 'Inventory service unavailable' });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  const avgDuration = requestDurations.length > 0
    ? requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length
    : 0;

  const metrics = `
# HELP gateway_requests_total Total number of requests to the API gateway
# TYPE gateway_requests_total counter
gateway_requests_total ${totalRequests}

# HELP gateway_requests_by_service Total requests routed to each service
# TYPE gateway_requests_by_service counter
gateway_requests_by_service{service="order"} ${requestsByService.order}
gateway_requests_by_service{service="inventory"} ${requestsByService.inventory}

# HELP gateway_errors_total Total number of gateway errors
# TYPE gateway_errors_total counter
gateway_errors_total ${errorCount}

# HELP gateway_request_duration_ms Average request duration in milliseconds
# TYPE gateway_request_duration_ms gauge
gateway_request_duration_ms ${avgDuration.toFixed(2)}

# HELP gateway_up Gateway service status
# TYPE gateway_up gauge
gateway_up 1
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics.trim());
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});