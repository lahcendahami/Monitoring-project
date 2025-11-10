// order-service/server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

// In-memory storage
let orders = [];
let orderIdCounter = 1;

// Metrics
let totalOrders = 0;
let ordersProcessed = 0;
let ordersFailed = 0;
let ordersByStatus = {
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0
};
let totalRevenue = 0;
let processingTimeSum = 0;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

// Create order
app.post('/orders', (req, res) => {
  const startTime = Date.now();
  
  try {
    const { customerId, items, totalAmount } = req.body;
    
    if (!customerId || !items || !totalAmount) {
      ordersFailed++;
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = {
      id: orderIdCounter++,
      customerId,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(order);
    totalOrders++;
    ordersByStatus.pending++;

    // Simulate order processing
    setTimeout(() => {
      const ord = orders.find(o => o.id === order.id);
      if (ord) {
        ord.status = 'processing';
        ordersByStatus.pending--;
        ordersByStatus.processing++;
        
        setTimeout(() => {
          ord.status = 'completed';
          ordersByStatus.processing--;
          ordersByStatus.completed++;
          ordersProcessed++;
          totalRevenue += totalAmount;
          
          const processingTime = Date.now() - startTime;
          processingTimeSum += processingTime;
        }, 1000);
      }
    }, 500);

    res.status(201).json(order);
  } catch (error) {
    ordersFailed++;
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders
app.get('/orders', (req, res) => {
  res.json(orders);
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  const avgProcessingTime = ordersProcessed > 0 
    ? processingTimeSum / ordersProcessed 
    : 0;

  const metrics = `
# HELP orders_total Total number of orders created
# TYPE orders_total counter
orders_total ${totalOrders}

# HELP orders_processed_total Total number of orders successfully processed
# TYPE orders_processed_total counter
orders_processed_total ${ordersProcessed}

# HELP orders_failed_total Total number of failed orders
# TYPE orders_failed_total counter
orders_failed_total ${ordersFailed}

# HELP orders_by_status Current orders by status
# TYPE orders_by_status gauge
orders_by_status{status="pending"} ${ordersByStatus.pending}
orders_by_status{status="processing"} ${ordersByStatus.processing}
orders_by_status{status="completed"} ${ordersByStatus.completed}
orders_by_status{status="failed"} ${ordersByStatus.failed}

# HELP orders_revenue_total Total revenue from completed orders
# TYPE orders_revenue_total counter
orders_revenue_total ${totalRevenue}

# HELP orders_processing_time_ms Average order processing time in milliseconds
# TYPE orders_processing_time_ms gauge
orders_processing_time_ms ${avgProcessingTime.toFixed(2)}

# HELP order_service_up Order service status
# TYPE order_service_up gauge
order_service_up 1
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics.trim());
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});