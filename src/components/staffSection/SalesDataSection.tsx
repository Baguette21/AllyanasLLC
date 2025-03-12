import React from "react";

interface SalesDataSectionProps {
  totalSales: number;
  totalOrders: number;
  productsSold: number;
  newCustomers: number;
}

export const SalesDataSection: React.FC<SalesDataSectionProps> = ({
  totalSales,
  totalOrders,
  productsSold,
  newCustomers,
}) => {
  return (
    <div className="bg-[#F5F2EE] rounded-lg p-6 shadow-md grid grid-cols-2 gap-4">
      <h1>Sales Data</h1>
      <p>Total Sales: {totalSales}</p>
      <p>Total Orders: {totalOrders}</p>
      <p>Products Sold: {productsSold}</p>
      <p>New Customers: {newCustomers}</p>
      
      {/* Total Sales */}
      <div className="bg-green-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold">Total Sales</h2>
        <p className="text-3xl">{totalSales}</p>
        <p className="text-sm text-green-700">+8% from yesterday</p>
      </div>

      {/* Total Orders */}
      <div className="bg-yellow-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold">Total Orders</h2>
        <p className="text-3xl">{totalOrders}</p>
        <p className="text-sm text-yellow-700">+5% from yesterday</p>
      </div>

      {/* Products Sold */}
      <div className="bg-orange-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold">Products Sold</h2>
        <p className="text-3xl">{productsSold}</p>
        <p className="text-sm text-orange-700">+1.2% from yesterday</p>
      </div>

      {/* New Customers */}
      <div className="bg-red-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold">New Customers</h2>
        <p className="text-3xl">{newCustomers}</p>
        <p className="text-sm text-red-700">+0.5% from yesterday</p>
      </div>
    </div>
  );
};

export default SalesDataSection;
