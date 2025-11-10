import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, BarChart3, RefreshCw, Zap } from 'lucide-react';

export default function MicroservicesApp() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [autoGenerate, setAutoGenerate] = useState(false);

  const API_GATEWAY = 'http://localhost:3000';

  useEffect(() => {
    fetchInventory();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (autoGenerate) {
      const interval = setInterval(() => {
        generateRandomOrder();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoGenerate, inventory]);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/inventory`);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_GATEWAY}/api/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const generateRandomOrder = async () => {
    if (inventory.length === 0) return;

    const randomItems = inventory
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(item => ({
        itemId: item.id,
        name: item.name,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: item.price
      }));

    const totalAmount = randomItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = {
      customerId: `customer_${Math.floor(Math.random() * 1000)}`,
      items: randomItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };

    await createOrder(order);
  };

  const createOrder = async (orderData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_GATEWAY}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      await res.json();
      await fetchOrders();
    } catch (err) {
      console.error('Failed to create order:', err);
    }
    setLoading(false);
  };

  const handleManualOrder = async (e) => {
    e.preventDefault();
    await generateRandomOrder();
  };

  const StatsCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="text-gray-400" size={32} />
      </div>
    </div>
  );

  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 size={36} />
            Microservices Dashboard
          </h1>
          <p className="mt-2 text-blue-100">Order & Inventory Management System</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            icon={ShoppingCart}
            title="Total Orders"
            value={orders.length}
            color="#3b82f6"
          />
          <StatsCard 
            icon={Package}
            title="Completed"
            value={completedOrders}
            color="#10b981"
          />
          <StatsCard 
            icon={RefreshCw}
            title="Pending"
            value={pendingOrders}
            color="#f59e0b"
          />
          <StatsCard 
            icon={BarChart3}
            title="Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            color="#8b5cf6"
          />
        </div>

        {/* Traffic Generator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap size={24} className="text-yellow-500" />
            Traffic Generator
          </h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleManualOrder}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Creating...' : 'Generate Order'}
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-gray-700">Auto-generate (every 2s)</span>
            </label>

            <button
              onClick={() => {
                fetchOrders();
                fetchInventory();
              }}
              className="ml-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'inventory'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Inventory ({inventory.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'orders' ? (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders yet. Generate some traffic!</p>
                ) : (
                  orders.slice().reverse().map(order => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">Customer: {order.customerId}</p>
                          <p className="text-sm text-gray-600">
                            Items: {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{item.name}</p>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                        <p className="text-xl font-bold text-blue-600 mt-2">${item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          item.quantity === 0 ? 'text-red-600' :
                          item.quantity < 20 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">in stock</p>
                        {item.reserved > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Reserved: {item.reserved}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">📊 Prometheus Metrics Available</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-800">API Gateway</p>
              <p className="text-blue-700">http://localhost:3000/metrics</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Order Service</p>
              <p className="text-blue-700">http://localhost:3001/metrics</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Inventory Service</p>
              <p className="text-blue-700">http://localhost:3002/metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}