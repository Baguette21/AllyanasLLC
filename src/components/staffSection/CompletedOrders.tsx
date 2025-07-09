import React, { useState, useEffect } from "react";
import { CompletedOrder } from '@/types/order';
import { formatPrice } from '@/lib/utils';

interface CompletedOrdersProps {
  onBack: () => void;
}

export const CompletedOrders: React.FC<CompletedOrdersProps> = ({ onBack }) => {
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdatingBestsellers, setIsUpdatingBestsellers] = useState(false);
  const [bestsellerUpdateResult, setBestsellerUpdateResult] = useState<{
    success: boolean;
    message: string;
    topItems?: { name: string; quantity: number; category?: string }[];
  } | null>(null);

  const fetchCompletedOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setCompletedOrders(data.completedOrders || []);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const handleViewOrder = (order: CompletedOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/orders/delete-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      await fetchCompletedOrders();
      if (isViewModalOpen) handleCloseModal();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const handleUpdateBestsellers = async () => {
    try {
      setIsUpdatingBestsellers(true);
      setBestsellerUpdateResult(null);
      
      // Fetch menu data
      const menuResponse = await fetch('/api/menu');
      if (!menuResponse.ok) throw new Error('Failed to fetch menu data');
      const menuData = await menuResponse.json();
      
      // Fetch completed orders
      const ordersResponse = await fetch('/api/orders');
      if (!ordersResponse.ok) throw new Error('Failed to fetch completed orders');
      const ordersData = await ordersResponse.json();
      
      // Create a map of item names to menu items for quick lookup
      const menuItemsMap = new Map();
      menuData.items.forEach((item: any) => {
        menuItemsMap.set(item.name, item);
      });
      
      // Initialize bestseller data with menu items
      const bestsellerData = {
        items: menuData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: 0,
          category: item.category
        })),
        lastUpdated: new Date().toISOString()
      };
      
      // Process completed orders
      let totalProcessedItems = 0;
      ordersData.completedOrders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((orderItem: any) => {
            // Handle different item formats
            if (typeof orderItem === 'string') {
              // Item is just a string (name)
              const itemName = orderItem;
              const menuItem = menuItemsMap.get(itemName);
              
              if (menuItem) {
                const bestsellerItem = bestsellerData.items.find((item: any) => item.name === itemName);
                if (bestsellerItem) {
                  bestsellerItem.quantity += 1; // Default quantity is 1
                  totalProcessedItems++;
                }
              }
            } else if (typeof orderItem === 'object' && orderItem !== null) {
              // Item is an object with name and quantity
              if ('name' in orderItem) {
                const itemName = orderItem.name;
                const menuItem = menuItemsMap.get(itemName);
                const quantity = orderItem.quantity || 1;
                
                if (menuItem) {
                  const bestsellerItem = bestsellerData.items.find((item: any) => item.name === itemName);
                  if (bestsellerItem) {
                    bestsellerItem.quantity += quantity;
                    totalProcessedItems++;
                  }
                }
              }
            }
          });
        }
      });
      
      // Sort items by quantity
      bestsellerData.items.sort((a: any, b: any) => b.quantity - a.quantity);
      
      // Save bestseller data
      const bestsellersResponse = await fetch('/api/bestseller/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bestsellerData)
      });
      
      if (!bestsellersResponse.ok) {
        throw new Error('Failed to save bestseller data');
      }
      
      // Get top 5 non-drink bestsellers
      const nonDrinkItems = bestsellerData.items.filter((item: any) => 
        item.category !== "Drinks" && item.quantity > 0
      );
      const top5NonDrinkItems = nonDrinkItems.slice(0, 5);
      
      // Update menu items with bestseller tags
      // First, set all items to non-bestseller
      menuData.items.forEach((item: any) => {
        item.isBestseller = false;
      });
      
      // Add bestseller tag to top 5 non-drink items
      const top5Names = top5NonDrinkItems.map((item: any) => item.name);
      let bestsellerCount = 0;
      
      menuData.items.forEach((item: any) => {
        if (top5Names.includes(item.name)) {
          item.isBestseller = true;
          bestsellerCount++;
        }
      });
      
      // Save updated menu data
      const menuUpdateResponse = await fetch('/api/menu/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData)
      });
      
      if (!menuUpdateResponse.ok) {
        throw new Error('Failed to update menu with bestseller tags');
      }
      
      // Set success result
      setBestsellerUpdateResult({
        success: true,
        message: `Bestseller data updated successfully. Processed ${totalProcessedItems} items.`,
        topItems: top5NonDrinkItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          category: item.category
        }))
      });
    } catch (error) {
      console.error('Error updating bestseller data:', error);
      setBestsellerUpdateResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update bestseller data. Please try again.'
      });
    } finally {
      setIsUpdatingBestsellers(false);
    }
  };

  const renderOrderItems = (items: any, maxItems = 5) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <p className="text-gray-500">No items in this order</p>;
    }
    
    const displayItems = items.slice(0, maxItems);
    const hasMoreItems = items.length > maxItems;
    
    return (
      <div className="bg-gray-50 p-3 rounded-md">
        {displayItems.map((item, index) => {
          const isObjectItem = typeof item === 'object' && item !== null;
          const itemName = isObjectItem ? item.name : item;
          const quantity = isObjectItem ? item.quantity : 1;
          
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
        <h1 className="text-2xl font-bold text-white">Order History</h1>
        <div className="flex gap-4">
          <button
            onClick={handleUpdateBestsellers}
            disabled={isUpdatingBestsellers}
            className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingBestsellers ? 'Updating...' : 'Update Bestsellers'}
          </button>
          <button
            onClick={onBack}
            className="bg-white text-[#473e1d] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {bestsellerUpdateResult && (
        <div className={`p-4 mb-6 rounded-lg ${bestsellerUpdateResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {bestsellerUpdateResult.success ? 'Bestseller Data Updated!' : 'Update Failed'}
              </h3>
              <p className="mb-2">{bestsellerUpdateResult.message}</p>
            </div>
            <button 
              onClick={() => setBestsellerUpdateResult(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {bestsellerUpdateResult.success && bestsellerUpdateResult.topItems && bestsellerUpdateResult.topItems.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium mb-2">Top 5 Bestsellers:</h4>
              <ul className="bg-white rounded p-3">
                {bestsellerUpdateResult.topItems.map((item, index) => (
                  <li key={index} className="flex justify-between py-1 border-b last:border-b-0 border-gray-100">
                    <span>{index + 1}. {item.name}</span>
                    <span className="font-medium">{item.quantity} sold</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedOrders.map((order) => (
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
              <p className="text-gray-600">Ordered: {new Date(order.timeOfOrder as string).toLocaleString()}</p>
              <p className="text-gray-600">Completed: {new Date(order.timeCompleted).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items:</h3>
              {renderOrderItems(order.items)}
            </div>

            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">Total Amount:</span>
                <span className="font-bold text-gray-800 text-lg">{formatPrice(order.price)}</span>
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
          </div>
        ))}
      </div>

      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Order #{selectedOrder.id}</h2>
                <p className="text-gray-500">{selectedOrder.orderType}</p>
                <p className="text-gray-500">Ordered: {new Date(selectedOrder.timeOfOrder as string).toLocaleString()}</p>
                <p className="text-gray-500">Completed: {new Date(selectedOrder.timeCompleted).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <p>Name: {selectedOrder.customerName}</p>
                {selectedOrder.table ? (
                  <p>Table: {selectedOrder.table}</p>
                ) : (
                  <p>Contact: {selectedOrder.contactNumber}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, index) => {
                    const isObjectItem = typeof item === 'object' && item !== null;
                    const itemName = isObjectItem ? (item as any).name : item;
                    const quantity = isObjectItem ? (item as any).quantity : 1;
                    
                    return (
                      <div key={index} className="mb-1">
                        <span className="text-green-600 font-medium">{quantity}x</span>{' '}
                        <span>{itemName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Total</h3>
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Total Amount:</span>
                    <span className="font-bold text-gray-800 text-lg">{formatPrice(selectedOrder.price)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.additionalInfo && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Additional Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedOrder.additionalInfo}</p>
                </div>
              )}

              {selectedOrder.paymentMethod && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Payment Information</h3>
                  <div className={`p-3 rounded-md ${selectedOrder.paymentMethod === 'cash' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <p className="font-medium">Method: <span className="capitalize">{selectedOrder.paymentMethod}</span></p>
                    {selectedOrder.gcashReferenceNumber && (
                      <div className="mt-2">
                        <p className="font-medium">Reference Number:</p>
                        <p className="font-mono bg-white px-2 py-1 rounded border mt-1">
                          {selectedOrder.gcashReferenceNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={handleCloseModal} 
                className="bg-[#473e1d] text-white px-6 py-2 rounded-md hover:bg-[#5c4f26] transition-colors"
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
