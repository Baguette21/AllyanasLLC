import React, { useState, useEffect } from "react";
import { Order } from '@/types/order';
import { API_BASE_URL } from '@/config/api';
import { formatPrice } from '@/lib/utils';

interface CheckOrdersProps {
  onBack: () => void;
}

export const CheckOrders: React.FC<CheckOrdersProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as paid');
      }

      await fetchOrders();
      if (isViewModalOpen) handleCloseModals();
    } catch (error) {
      console.error('Error marking order as paid:', error);
      alert('Failed to mark order as paid. Please try again.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      await fetchOrders();
      if (isViewModalOpen) handleCloseModals();
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const renderOrderItems = (items: any, maxItems = 5) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <p className="text-gray-500 text-sm">No items in this order</p>;
    }
    
    const displayItems = items.slice(0, maxItems);
    const hasMoreItems = items.length > maxItems;
    
    return (
      <div className="bg-gray-50 p-3 rounded-md">
        {displayItems.map((item, index) => {
          const isObjectItem = typeof item === 'object' && item !== null;
          const itemName = isObjectItem ? (item as any).name : item;
          const quantity = isObjectItem ? (item as any).quantity : 1;
          
          return (
            <div key={index} className="flex justify-between py-1">
              <span>{quantity}× {itemName}</span>
            </div>
          );
        })}
        
        {hasMoreItems && (
          <p className="text-sm text-gray-500 mt-2">
            + {items.length - maxItems} more items...
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#473e1d] p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Incoming Orders</h1>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-md shadow-md flex items-center gap-2">
            <span className="text-xl">🕒</span>
            <div>
              <p className="text-base font-semibold">{orders.length}</p>
              <p className="text-gray-500 text-xs">Orders</p>
            </div>  
          </div>
          <button
            onClick={onBack}
            className="bg-white text-[#473e1d] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg p-6 shadow-lg space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                </div>
                <p className="text-gray-600">{order.orderType}</p>
              </div>
              <button
                onClick={() => handleViewOrder(order)}
                className="text-[#473e1d] hover:text-[#5c4f26] font-medium"
              >
                View Details
              </button>
            </div>

            <div>
              <p className="font-medium">Customer: {order.customerName}</p>
              <p className="text-gray-600">
                {order.table ? `Table: ${order.table}` : `Contact: ${order.contactNumber}`}
              </p>
              <p className="text-gray-600">Time: {new Date(order.timeOfOrder as string).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items:</h3>
              {renderOrderItems(order.items)}
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-800">Total Amount:</span>
                <span className="font-bold text-blue-800 text-lg">{formatPrice(order.price)}</span>
              </div>
            </div>

            {order.additionalInfo && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="font-medium mb-1 text-sm">Additional Notes:</h3>
                <p className="text-gray-600 text-sm">{order.additionalInfo}</p>
              </div>
            )}

            {order.paymentMethod && (
              <div className={`p-3 rounded-md ${order.paymentMethod === 'cash' ? 'bg-green-50' : 'bg-blue-50'}`}>
                <h3 className="font-medium mb-1 text-sm">Payment Method:</h3>
                <p className="text-gray-600 text-sm capitalize">{order.paymentMethod}</p>
                {order.gcashReferenceNumber && (
                  <div className="mt-2">
                    <h4 className="font-medium text-sm">Reference Number:</h4>
                    <p className="text-gray-800 text-sm font-mono bg-white px-2 py-1 rounded border">
                      {order.gcashReferenceNumber}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleMarkAsPaid(order.id)}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Paid
              </button>
              <button
                onClick={() => handleCancelOrder(order.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-xl font-bold">Order #{selectedOrder.id}</h2>
                <p className="text-gray-500">{selectedOrder.orderType}</p>
              </div>
              <button 
                onClick={handleCloseModals} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-1">Customer Details</h3>
                <p className="text-sm">Customer: {selectedOrder.customerName}</p>
                {selectedOrder.table ? (
                  <p className="text-sm">Table: {selectedOrder.table}</p>
                ) : (
                  <p className="text-sm">Contact: {selectedOrder.contactNumber}</p>
                )}
                <p className="text-sm text-gray-500">Ordered: {new Date(selectedOrder.timeOfOrder as string).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">Order Items</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => {
                    const isObjectItem = typeof item === 'object' && item !== null;
                    const itemName = isObjectItem ? (item as any).name : item;
                    const quantity = isObjectItem ? (item as any).quantity : 1;
                    
                    return (
                      <div key={index} className="flex justify-between py-1">
                        <span>{quantity}× {itemName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">Order Total</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800">Total Amount:</span>
                    <span className="font-bold text-blue-800 text-lg">{formatPrice(selectedOrder.price)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.additionalInfo && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Additional Notes</h3>
                  <p className="text-xs bg-gray-50 p-3 rounded-md">{selectedOrder.additionalInfo}</p>
                </div>
              )}

              {selectedOrder.paymentMethod && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Payment Information</h3>
                  <div className={`p-3 rounded-md ${selectedOrder.paymentMethod === 'cash' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <p className="text-sm font-medium">Method: <span className="capitalize">{selectedOrder.paymentMethod}</span></p>
                    {selectedOrder.gcashReferenceNumber && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Reference Number:</p>
                        <p className="text-sm font-mono bg-white px-2 py-1 rounded border mt-1">
                          {selectedOrder.gcashReferenceNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => handleMarkAsPaid(selectedOrder.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Paid
              </button>
              <button 
                onClick={() => handleCancelOrder(selectedOrder.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCloseModals} 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
