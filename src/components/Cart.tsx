import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

interface CartProps {
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    onCheckout();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#473E1D] text-white p-4 rounded-full shadow-lg hover:bg-[#5c4f26] transition-colors relative"
      >
        <span className="sr-only">Shopping Cart</span>
        🛒
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#EEA733] text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 bg-[#F5F2EE] rounded-lg shadow-xl border-2 border-[#473E1D]">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#473E1D]">Your Cart</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Your cart is empty</p>
            ) : (
              <>
                <div className="max-h-96 overflow-auto">
                  {items.map((item) => (
                    <div
                      key={item.item_name}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.item_name}</h4>
                        <p className="text-sm ">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.item_name, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.item_name, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.item_name)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold">{formatPrice(total)}</span>
                  </div>
                  <button
                    className="w-full bg-[#473E1D] text-white py-2 rounded-lg hover:bg-[#5c4f26] transition-colors"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
