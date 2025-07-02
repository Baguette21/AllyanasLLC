import React, { useState, useEffect } from "react";
import { CompletedOrder } from '@/types/order';
import { API_BASE_URL } from '@/config/api';

interface PaidOrdersProps {
  onBack: () => void;
}

export const PaidOrders: React.FC<PaidOrdersProps> = ({ onBack }) => {
  const [paidOrders, setPaidOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchPaidOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      // Get paid orders from the paidOrders array
      const paidOrdersData = data.paidOrders || [];
      setPaidOrders(paidOrdersData);
    } catch (error) {
      console.error('Error fetching paid orders:', error);
    }
  };

  useEffect(() => {
    fetchPaidOrders();
  }, []);

  const handleViewOrder = (order: CompletedOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleMarkAsUnpaid = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/mark-unpaid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as unpaid');
      }

      await fetchPaidOrders();
      if (isViewModalOpen) handleCloseModal();
    } catch (error) {
      console.error('Error marking order as unpaid:', error);
      alert('Failed to mark order as unpaid. Please try again.');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      await fetchPaidOrders();
      if (isViewModalOpen) handleCloseModal();
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please try again.');
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
          const price = isObjectItem ? (item as any).price : 0;
          
          return (
            <div key={index} className="flex justify-between py-1">
              <span>{quantity}× {itemName}</span>
              {price > 0 && <span>${(price * quantity).toFixed(2)}</span>}
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

  const calculateOrderTotal = (items: any) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const isObjectItem = typeof item === 'object' && item !== null;
      const price = isObjectItem ? (item as any).price || 0 : 0;
      const quantity = isObjectItem ? (item as any).quantity || 1 : 1;
      return total + (price * quantity);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#473e1d] p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Paid Orders</h1>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-md shadow-md flex items-center gap-2">
            <span className="text-xl">💰</span>
            <div>
              <p className="text-base font-semibold">{paidOrders.length}</p>
              <p className="text-gray-500 text-xs">Paid Orders</p>
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
        {paidOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-lg p-6 shadow-lg space-y-4 border-l-4 border-green-500"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    PAID
                  </span>
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
              <p className="text-gray-600">
                Completed: {new Date(order.completedAt as string).toLocaleString()}
              </p>
              <p className="text-gray-600">
                Paid: {order.paidAt ? new Date(order.paidAt as string).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items:</h3>
              {renderOrderItems(order.items)}
            </div>

            <div className="bg-green-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Total Amount:</span>
                <span className="font-bold text-green-800">
                  ${calculateOrderTotal(order.items).toFixed(2)}
                </span>
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
                onClick={() => handleCompleteOrder(order.id)}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() => handleMarkAsUnpaid(order.id)}
                className="flex-1 bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Mark as Unpaid
              </button>
            </div>
          </div>
        ))}
      </div>

      {paidOrders.length === 0 && (
        <div className="text-center text-white mt-12">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-2xl font-semibold mb-2">No Paid Orders</h2>
          <p className="text-gray-300">Paid orders will appear here once customers complete payment.</p>
        </div>
      )}

      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">Order #{selectedOrder.id}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500">{selectedOrder.orderType}</p>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    PAID
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-medium">Customer: {selectedOrder.customerName}</p>
                <p className="text-gray-600">
                  {selectedOrder.table ? `Table: ${selectedOrder.table}` : `Contact: ${selectedOrder.contactNumber}`}
                </p>
                <p className="text-gray-600">
                  Order Time: {new Date(selectedOrder.timeOfOrder as string).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Completed: {new Date(selectedOrder.completedAt as string).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Paid: {selectedOrder.paidAt ? new Date(selectedOrder.paidAt as string).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Items:</h3>
                {renderOrderItems(selectedOrder.items, 50)}
              </div>

              <div className="bg-green-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">Total Amount:</span>
                  <span className="font-bold text-green-800">
                    ${calculateOrderTotal(selectedOrder.items).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedOrder.additionalInfo && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="font-medium mb-1 text-sm">Additional Notes:</h3>
                  <p className="text-gray-600 text-sm">{selectedOrder.additionalInfo}</p>
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleMarkAsUnpaid(selectedOrder.id)}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Mark as Unpaid
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 