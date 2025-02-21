import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'CARD';

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

interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export const CheckoutSection: React.FC<CheckoutSectionProps> = ({ onBack, orderInfo }) => {
  const { items, total, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPayment(method);
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19); // Limit to 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substr(0, 2) + '/' + numbers.substr(2, 2);
    }
    return numbers;
  };

  const isCardValid = () => {
    return (
      cardDetails.cardNumber.replace(/\s/g, '').length === 16 &&
      cardDetails.expiryDate.length === 5 &&
      cardDetails.cvv.length === 3 &&
      cardDetails.cardholderName.length > 0
    );
  };

  const handleConfirmPayment = () => {
    if (!selectedPayment) return;

    if (selectedPayment === 'CARD' && !isCardValid()) {
      alert('Please fill in all card details correctly');
      return;
    }

    if (selectedPayment === 'CASH') {
      const orderNumber = Math.floor(Math.random() * 1000) + 1;
      alert(`Your order number is #${orderNumber}\n\nPlease proceed to the cashier to pay ₱${total.toFixed(2)}.\nYour order will be prepared once payment is confirmed.`);
    } else {
      // For other payment methods (GCASH, MAYA, CARD)
      alert(`Processing ${selectedPayment} payment for ₱${total.toFixed(2)}`);
    }
    
    clearCart();
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
              {items.map((item) => (
                <div key={item.item_name} className="flex justify-between">
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

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['CASH', 'GCASH', 'MAYA', 'CARD'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => handlePaymentSelect(method)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${
                    selectedPayment === method
                      ? 'border-[rgba(148,51,45,1)] bg-[rgba(148,51,45,0.1)]'
                      : 'border-gray-200 hover:border-[rgba(148,51,45,0.5)]'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {method === 'CASH' ? '💵' : 
                     method === 'GCASH' ? '📱' : 
                     method === 'MAYA' ? '💳' :
                     '💳'}
                  </div>
                  <div className="font-medium">
                    {method === 'CARD' ? 'VISA/MASTERCARD' : method}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Payment Instructions */}
          {selectedPayment === 'CASH' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  ⚠️
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Cash Payment Instructions
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>1. Note your order number (will be provided after confirmation)</p>
                    <p>2. Proceed to the cashier with your order number</p>
                    <p>3. Pay the total amount of ₱{total.toFixed(2)}</p>
                    <p>4. Your order will be handed over once payment is confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Details Form */}
          {selectedPayment === 'CARD' && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
                  }}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      const formatted = formatExpiryDate(e.target.value);
                      setCardDetails(prev => ({ ...prev, expiryDate: formatted }));
                    }}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '');
                      setCardDetails(prev => ({ ...prev, cvv: numbers }));
                    }}
                    placeholder="123"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={cardDetails.cardholderName}
                  onChange={handleCardInputChange}
                  placeholder="JOHN DOE"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Payment Button */}
        <button
          onClick={handleConfirmPayment}
          disabled={!selectedPayment || (selectedPayment === 'CARD' && !isCardValid())}
          className={`
            w-full py-4 rounded-lg text-white text-lg font-medium transition-all
            ${
              selectedPayment && (selectedPayment !== 'CARD' || isCardValid())
                ? 'bg-[rgba(148,51,45,1)] hover:bg-[rgba(148,51,45,0.8)]'
                : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          Confirm Payment
        </button>
      </div>
    </section>
  );
};
