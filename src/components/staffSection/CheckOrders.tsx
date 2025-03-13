import React from "react";
import ordersData from "../../data/orders.json";

interface CheckOrdersProps {
  onBack: () => void;
}

export const CheckOrders: React.FC<CheckOrdersProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#473e1d] p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="bg-[#94332d] text-white px-4 py-2 rounded-lg hover:bg-[#7a2a25] transition-colors"
          >
            Back
          </button>
          <div className="bg-[#F5F2EE] rounded-lg p-4 flex items-center gap-2">
            <span className="text-[#94332d] text-xl">₱</span>
            <span className="text-[#473e1d] text-xl font-semibold">
              Check Order Summary
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 flex flex-col items-center">
          <span className="text-4xl text-[#473e1d]">
            {ordersData.orders.length}
          </span>
          <span className="text-sm text-[#473e1d]">Number of Orders</span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ordersData.orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#473e1d]">
                Order #{order.id}
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[#94332d]">₱</span>
                <span className="text-2xl font-bold text-[#473e1d]">
                  {order.price}
                </span>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <li
                  key={index}
                  className="text-[#473e1d] flex items-center gap-2"
                >
                  <span className="text-sm">• {item}</span>
                </li>
              ))}
            </ul>
            <button className="w-full bg-[#473e1d] text-white py-2 rounded-md hover:bg-[#5c4f26] transition-colors">
              View Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
