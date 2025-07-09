import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Header } from '@/components/layout/Header'; 
import { API_BASE_URL } from '@/config/api';
import { formatPrice } from '@/lib/utils';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [gcashReferenceNumber, setGcashReferenceNumber] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Auto-select GCash for pick-up orders
  React.useEffect(() => {
    if (orderInfo.selectedType === 'pick-up' && selectedPaymentMethod !== 'gcash') {
      setSelectedPaymentMethod('gcash');
    }
  }, [orderInfo.selectedType, selectedPaymentMethod]);

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

    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return false;
    }

    if (selectedPaymentMethod === 'gcash' && !gcashReferenceNumber.trim()) {
      alert('Please enter the GCash reference number');
      return false;
    }

    if (selectedPaymentMethod === 'card') {
      // Card validation will be handled by PayMongo
      return true;
    }

    return true;
  };

  const handleCardPayment = async (orderData: any) => {
    try {
      setIsProcessingPayment(true);
      
      // Process payment through PayMongo
      const paymentResponse = await fetch('https://us-central1-allyanas-llc.cloudfunctions.net/processPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'PHP',
          description: `Order #${Date.now()} - ${orderData.customerName}`,
          paymentMethod: 'card'
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Payment processing failed');
      }

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // For now, we'll show the payment intent details and let the user proceed
      // In production, you'd integrate with PayMongo's payment form
      const proceed = confirm(
        `Payment initiated successfully!\n\n` +
        `Amount: ${formatPrice(total)}\n` +
        `Payment ID: ${paymentResult.paymentIntent.id}\n\n` +
        `Click OK to complete the order, or Cancel to abort.`
      );

      if (!proceed) {
        throw new Error('Payment cancelled by user');
      }

      return {
        success: true,
        paymentId: paymentResult.paymentIntent.id,
        clientKey: paymentResult.clientKey
      };

    } catch (error) {
      console.error('Card payment error:', error);
      throw error;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (isProcessing) return;
    if (!validateOrder()) return;

    setIsProcessing(true);

    try {
      const orderData: any = {
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
        additionalInfo: orderInfo.additionalInfo,
        paymentMethod: selectedPaymentMethod,
        gcashReferenceNumber: selectedPaymentMethod === 'gcash' ? gcashReferenceNumber : null
      };

      // Handle card payment processing
      if (selectedPaymentMethod === 'card') {
        const paymentResult = await handleCardPayment(orderData);
        orderData.paymentId = paymentResult.paymentId;
        orderData.paymentStatus = 'completed';
      }

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
      }\n\nTotal: ${formatPrice(total)}`);

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
    <>
    <Header isSticky />
    <section className="bg-[#F5F2EE] min-h-[836px]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#473E1D]">Checkout</h2>
          <button
            onClick={onBack}
            className="text-[#473E1D] px-6 py-2 rounded-lg hover:bg-[#E3E2E1] transition-colors"
          >
            Add More Items
          </button>
        </div>

        <div className="bg-[#F5F2EE] rounded-lg shadow-md p-6 mb-8 border-2 border-[#473E1D]">
          <h3 className="text-xl font-semibold mb-4 text-[#473E1D]">Order Summary</h3>
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
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.item_name}-${index}`} className="flex justify-between">
                  <span>
                    {item.item_name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="pt-4 border-t">
              <h4 className="text-lg font-semibold mb-3 text-[#473E1D]">Payment Option</h4>
              
              {/* Show note for pick-up orders */}
              {orderInfo.selectedType === 'pick-up' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Pick-up orders:</span> Payment must be completed online via GCash or Card before Order is processed.
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {/* Only show Cash option for dine-in orders */}
                {orderInfo.selectedType === 'dine-in' && (
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      value="cash"
                      checked={selectedPaymentMethod === 'cash'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-[#473E1D] border-gray-300 focus:ring-[#473E1D]"
                    />
                    <label htmlFor="cash" className="ml-3 text-gray-700 font-medium">
                      Cash
                    </label>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="gcash"
                    name="paymentMethod"
                    value="gcash"
                    checked={selectedPaymentMethod === 'gcash'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-[#473E1D] border-gray-300 focus:ring-[#473E1D]"
                  />
                  <label htmlFor="gcash" className="ml-3 text-gray-700 font-medium">
                    GCash
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={selectedPaymentMethod === 'card'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-[#473E1D] border-gray-300 focus:ring-[#473E1D]"
                  />
                  <label htmlFor="card" className="ml-3 text-gray-700 font-medium">
                    Credit/Debit Card
                  </label>
                </div>
              </div>

              {/* Cash Payment Details */}
              {selectedPaymentMethod === 'cash' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="text-lg font-semibold mb-4 text-[#473E1D]">Cash Payment</h5>
                  
                  <div className="text-center mb-4">
                    <div className="text-2xl mb-2">💵</div>
                    <p className="text-lg font-medium text-[#473E1D]">
                      Please ask for a waitress to collect payment
                    </p>
                  </div>

                  {/* Cash Payment Instructions */}
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">Payment Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Call for a waitress or raise your hand</li>
                      <li>Inform them you're ready to pay for your order</li>
                      <li>Total amount to pay: {formatPrice(total)}</li>
                      <li>Complete your cash payment with the waitress</li>
                      <li>Keep your receipt for reference</li>
                    </ol>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">Note:</span> Please ensure you have the exact amount or sufficient change will be provided.
                    </p>
                  </div>
                </div>
              )}

              {/* GCash Payment Details */}
              {selectedPaymentMethod === 'gcash' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-lg font-semibold mb-4 text-[#473E1D]">GCash Payment</h5>
                  
                  {/* QR Code Section */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 mb-3">
                      Scan this QR code with your GCash app to pay {formatPrice(total)}
                    </p>
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-300">
                      <img 
                        src="/GCASHQR.jpg" 
                        alt="GCash QR Code for Payment"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-[#473E1D] mt-2">
                      Amount: {formatPrice(total)}
                    </p>
                  </div>

                  {/* Payment Instructions */}
                  <div className="mb-4 text-sm text-gray-700">
                    <p className="font-medium mb-2">Payment Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open your GCash app</li>
                      <li>Scan the QR code above</li>
                      <li>If QR is Invalid send payment to 09********</li>
                      <li>Confirm the payment amount ({formatPrice(total)})</li>
                      <li>Complete the payment</li>
                      <li>Enter the reference number below</li>
                    </ol>
                  </div>

                  {/* Reference Number Input */}
                  <div>
                    <label htmlFor="gcashRef" className="block text-sm font-medium text-gray-700 mb-2">
                      GCash Reference Number *
                    </label>
                    <input
                      type="text"
                      id="gcashRef"
                      value={gcashReferenceNumber}
                      onChange={(e) => setGcashReferenceNumber(e.target.value)}
                      placeholder="Enter reference number from GCash transaction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#473E1D] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This reference number serves as proof of payment
                    </p>
                  </div>
                </div>
              )}

              {/* Card Payment Details */}
              {selectedPaymentMethod === 'card' && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="text-lg font-semibold mb-4 text-[#473E1D]">Card Payment</h5>
                  
                  <div className="text-center mb-6">
                    <div className="text-2xl mb-2">💳</div>
                    <p className="text-lg font-medium text-[#473E1D]">
                      Secure Card Payment via PayMongo
                    </p>
                  </div>

                  <div className="mb-4 text-sm text-gray-700">
                    <p className="font-medium mb-2">Accepted Cards:</p>
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="bg-white px-3 py-2 rounded border text-center font-medium">VISA</div>
                      <div className="bg-white px-3 py-2 rounded border text-center font-medium">Mastercard</div>
                      <div className="bg-white px-3 py-2 rounded border text-center font-medium">JCB</div>
                    </div>
                    
                    <p className="font-medium mb-2">Payment Process:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Click "Confirm Order" to proceed with card payment</li>
                      <li>You'll be redirected to secure PayMongo payment form</li>
                      <li>Enter your card details safely</li>
                      <li>Complete payment verification if required</li>
                      <li>Your order will be confirmed automatically</li>
                    </ol>
                  </div>

                  <div className="bg-white p-3 rounded-md border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-purple-800">Total Amount:</span>
                      <span className="font-bold text-purple-800 text-lg">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">🔒 Secure Payment:</span> Your card information is processed securely through PayMongo's encrypted payment system.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          {/* Only show Confirm Order button if payment method is selected and requirements are met */}
          {(selectedPaymentMethod === 'cash' || 
           (selectedPaymentMethod === 'gcash' && gcashReferenceNumber.trim()) ||
           selectedPaymentMethod === 'card') && (
                          <button
                onClick={handleConfirmOrder}
                disabled={isProcessing || isProcessingPayment}
                className={`
                  bg-[#473E1D] text-white px-8 py-3 rounded-lg text-lg
                  ${(isProcessing || isProcessingPayment) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5c4f26]'}
                  transition-colors
                `}
              >
                {isProcessingPayment ? 'Processing Payment...' : 
                 isProcessing ? 'Confirming Order...' : 
                 selectedPaymentMethod === 'card' ? 'Pay with Card' : 'Confirm Order'}
              </button>
          )}
        </div>
      </div>
    </section>
    </>
  );
};
