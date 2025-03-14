import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { API_BASE_URL } from '@/config/api';

interface CheckoutSectionProps {
  onBack: () => void;
  orderInfo: {
    selectedType?: "dine-in" | "pick-up";
    tableNumber?: string;
    fullName?: string;
    phoneNumber?: string;
    additionalInfo?: string;
  };
}

export const CheckoutSection: React.FC<CheckoutSectionProps> = ({ onBack, orderInfo }) => {
  const { items, total, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateOrder = () => {
    if (!orderInfo.selectedType) {
      alert('Please select an order type');
      return false;
    }

    if (orderInfo.selectedType === 'dine-in') {
      if (!orderInfo.tableNumber?.trim()) {
        alert('Please enter a table number');
        return false;
      }
    } else if (orderInfo.selectedType === 'pick-up') {
      if (!orderInfo.fullName?.trim()) {
        alert('Please enter your name');
        return false;
      }
      if (!orderInfo.phoneNumber?.trim()) {
        alert('Please enter your contact number');
        return false;
      }
      // Basic phone number validation
      const phoneRegex = /^\d{10,}$/;
      if (!phoneRegex.test(orderInfo.phoneNumber.replace(/[^\d]/g, ''))) {
        alert('Please enter a valid contact number (at least 10 digits)');
        return false;
      }
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return false;
    }

    return true;
  };

  const handleConfirmOrder = async () => {
    if (isProcessing) return;
    if (!validateOrder()) return;

    setIsProcessing(true);

    try {
      const orderData = {
        orderType: orderInfo.selectedType,
        customerName: orderInfo.fullName || 'Table Order',
        table: orderInfo.selectedType === 'dine-in' ? orderInfo.tableNumber : null,
        contactNumber: orderInfo.selectedType === 'pick-up' ? orderInfo.phoneNumber : null,
        timeOfOrder: new Date().toISOString(),
        price: total,
        items: items.map(item => ({
          name: item.item_name,
          quantity: item.quantity
        })),
        additionalInfo: orderInfo.additionalInfo
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const orderResponse = await response.json();
      const orderId = orderResponse.id; // Get the sequential order ID

      // Clear session storage and cart
      sessionStorage.removeItem('currentOrder');
      clearCart();

      // Show success message with order details
      alert(`Order #${orderId} placed successfully!\n\nOrder Details:\n${
        orderInfo.selectedType === 'dine-in'
          ? `Table: ${orderInfo.tableNumber}`
          : `Name: ${orderInfo.fullName}\nContact: ${orderInfo.phoneNumber}`
      }\n\nTotal: ₱${total.toFixed(2)}`);

      // Redirect back to menu
      onBack();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="bg-[rgba(245,242,238,1)] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button
            onClick={onBack}
            className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45a049] transition-colors"
          >
            Back to Menu
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
          <div className="space-y-4">
            {/* Order Info */}
            <div className="pb-4 border-b">
              <p className="font-medium">Order Type: {orderInfo.selectedType}</p>
              {orderInfo.selectedType === 'dine-in' ? (
                <p>Table Number: {orderInfo.tableNumber}</p>
              ) : (
                <>
                  <p>Name: {orderInfo.fullName}</p>
                  <p>Phone: {orderInfo.phoneNumber}</p>
                </>
              )}
              {orderInfo.additionalInfo && (
                <p>Additional Info: {orderInfo.additionalInfo}</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.item_name}-${index}`} className="flex justify-between">
                  <span>
                    {item.item_name} x {item.quantity}
                  </span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Order Button */}
        <div className="flex justify-end">
          <button
            onClick={handleConfirmOrder}
            disabled={isProcessing}
            className={`
              bg-[#473E1D] text-white px-8 py-3 rounded-lg text-lg
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5c4f26]'}
              transition-colors
            `}
          >
            {isProcessing ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </section>
  );
};
