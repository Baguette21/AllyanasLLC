import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import completedOrdersData from "@/data/CompletedOrders.json";

//THIS IS WHERE THE BACK BUTTON STARTS
interface SalesProps {
  onBack: () => void;
}

export const SalesDataSection: React.FC<SalesProps>= ({ onBack }) => {
  const navigate = useNavigate();
  const [totalSalesToday, setTotalSalesToday] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [productsSold, setProductsSold] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [last7DaysSales, setLast7DaysSales] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = completedOrdersData.completedOrders.filter(order =>
      order.timeCompleted.startsWith(today)
    );
    const totalToday = todayOrders.reduce((acc, order) => acc + order.price, 0);

    setTotalSalesToday(totalToday);
    setTotalOrders(completedOrdersData.completedOrders.length);
    setProductsSold(
      completedOrdersData.completedOrders.reduce(
        (acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      )
    );

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        revenuePickup: 0,
        revenueDineIn: 0,
      };
    }).reverse();

    completedOrdersData.completedOrders.forEach(order => {
      const orderDate = new Date(order.timeCompleted);
      const formattedDate = `${orderDate.getMonth() + 1}-${orderDate.getDate()}`;

      const dayEntry = last7Days.find(d => d.date === formattedDate);
      if (dayEntry) {
        if (order.orderType === "pick-up") {
          dayEntry.revenuePickup += order.price;
        } else if (order.orderType === "dine-in") {
          dayEntry.revenueDineIn += order.price;
        }
      }
    });

    setRevenueData(last7Days);
    setLast7DaysSales(last7Days.reduce((acc, day) => acc + day.revenuePickup + day.revenueDineIn, 0));
  }, []);

  const exportCSV = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = completedOrdersData.completedOrders.filter(order =>
      order.timeCompleted.startsWith(today)
    );

    const csvData = [
      ["Order ID", "Order Type", "Customer Name", "Price", "Time Completed"],
      ...todayOrders.map(order => [
        order.id,
        order.orderType,
        order.customerName,
        order.price,
        order.timeCompleted,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Today's_Orders_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-mt-6 p-6 bg-[#5A1E16] rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <button 
            onClick={onBack} 
            className="bg-white text-[#473e1d] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
          <button onClick={exportCSV} className="bg-green-500 px-4 py-2 rounded-md hover:bg-green-600">
            Export CSV
          </button>
        </div>
      </div>

      {/*The four boxes*/}
      <div className="flex items-start gap-6 h-screen">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold">Today's Sales</h1>
            <div className="grid grid-cols-2 gap-4 w-fit">
              <div className="bg-[#3E5423] p-4 rounded-lg flex flex-col justify-between h-full">
                <h2 className="text-xl font-bold">Total Sales Today</h2>
                <p className="text-3xl">₱{totalSalesToday}</p>
                <p className="text-sm text-green-400">dont hardcode this</p>
            </div>

            <div className="bg-[#D98E04] p-4 rounded-lg flex flex-col justify-between h-full">
              <h2 className="text-xl font-bold">Total Orders</h2>
              <p className="text-3xl">{totalOrders}</p>
              <p className="text-sm text-yellow-400">dont hardcode this</p>
            </div>

            <div className="bg-[#D98E04] p-4 rounded-lg flex flex-col justify-between h-full">
              <h2 className="text-xl font-bold">Products Sold</h2>
              <p className="text-3xl">{productsSold}</p>
              <p className="text-sm text-orange-400">dont hardcode this</p>
            </div>

            <div className="bg-[#3E5423] p-4 rounded-lg flex flex-col justify-between h-full">
              <h2 className="text-xl font-bold">Sales (Last 7 Days)</h2>
              <p className="text-3xl">₱{last7DaysSales}</p>
              <p className="text-sm text-blue-400">Total revenue from past week</p>
            </div>
          </div>
        </div>

        {/*The bar chart*/}
        <div className="p-4 bg-white rounded-lg shadow-md flex-1 h-full">
          <h2 className="text-lg font-bold text-black">Total Revenue (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height="90%">
            <BarChart data={revenueData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenuePickup" fill="#D98E04" name="Pick-up Sales" />
              <Bar dataKey="revenueDineIn" fill="#3E5423" name="Dine-in Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesDataSection;
