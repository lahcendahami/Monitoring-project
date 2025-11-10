// inventory-service/server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3002;

// In-memory inventory
let inventory = [
  { id: 1, name: 'Laptop', quantity: 50, price: 999.99, reserved: 0 },
  { id: 2, name: 'Mouse', quantity: 200, price: 29.99, reserved: 0 },
  { id: 3, name: 'Keyboard', quantity: 150, price: 79.99, reserved: 0 },
  { id: 4, name: 'Monitor', quantity: 75, price: 299.99, reserved: 0 },
  { id: 5, name: 'Headphones', quantity: 100, price: 149.99, reserved: 0 }
];

// Metrics
let inventoryChecks = 0;
let inventoryUpdates = 0;
let lowStockAlerts = 0;
let outOfStockCount = 0;
let totalInventoryValue = 0;

// Calculate inventory metrics
function calculateMetrics() {
  totalInventoryValue = inventory.reduce((sum, item) => 
    sum + (item.quantity * item.price), 0
  );
  
  outOfStockCount = inventory.filter(item => item.quantity === 0).length;
  lowStockAlerts = inventory.filter(item => 
    item.quantity > 0 && item.quantity < 20
  ).length;
}

calculateMetrics();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

// Get all inventory
app.get('/inventory', (req, res) => {
  inventoryChecks++;
  calculateMetrics();
  res.json(inventory);
});

// Get inventory item by ID
app.get('/inventory/:id', (req, res) => {
  inventoryChecks++;
  const item = inventory.find(i => i.id === parseInt(req.params.id));
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json(item);
});

// Update inventory item
app.put('/inventory/:id', (req, res) => {
  inventoryUpdates++;
  const item = inventory.find(i => i.id === parseInt(req.params.id));
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const { quantity, reserved } = req.body;
  
  if (quantity !== undefined) {
    item.quantity = quantity;
  }
  
  if (reserved !== undefined) {
    item.reserved = reserved;
  }
  
  calculateMetrics();
  res.json(item);
});

// Reserve inventory
app.post('/inventory/:id/reserve', (req, res) => {
  inventoryUpdates++;
  const item = inventory.find(i => i.id === parseInt(req.params.id));
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const { quantity } = req.body;
  
  if (item.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient inventory' });
  }
  
  item.quantity -= quantity;
  item.reserved += quantity;
  
  calculateMetrics();
  res.json(item);
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  calculateMetrics();
  
  let itemMetrics = '';
  inventory.forEach(item => {
    itemMetrics += `inventory_item_quantity{item="${item.name}",id="${item.id}"} ${item.quantity}\n`;
    itemMetrics += `inventory_item_reserved{item="${item.name}",id="${item.id}"} ${item.reserved}\n`;
  });

  const metrics = `
# HELP inventory_checks_total Total number of inventory checks
# TYPE inventory_checks_total counter
inventory_checks_total ${inventoryChecks}s
# HELP inventory_updates_total Total number of inventory updates
# TYPE inventory_updates_total counter
inventory_updates_total ${inventoryUpdates}

# HELP inventory_total_value Total value of all inventory
# TYPE inventory_total_value gauge
inventory_total_value ${totalInventoryValue.toFixed(2)}

# HELP inventory_low_stock_alerts Number of items with low stock
# TYPE inventory_low_stock_alerts gauge
inventory_low_stock_alerts ${lowStockAlerts}

# HELP inventory_out_of_stock Number of items out of stock
# TYPE inventory_out_of_stock gauge
inventory_out_of_stock ${outOfStockCount}

# HELP inventory_item_quantity Current quantity of each inventory item
# TYPE inventory_item_quantity gauge
${itemMetrics.trim()}

# HELP inventory_service_up Inventory service status
# TYPE inventory_service_up gauge
inventory_service_up 1
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics.trim());
});

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
});