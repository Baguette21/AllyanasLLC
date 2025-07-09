import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import completedOrdersData from "@/data/CompletedOrders.json";
import { formatPrice } from "@/lib/utils";

//THIS IS WHERE THE BACK BUTTON STARTS
interface SalesProps {
  onBack: () => void;
}

export const SalesDataSection: React.FC<SalesProps>= ({ onBack }) => {
  const navigate = useNavigate();
  
  // Date filtering states
  const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Sales data states
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [productsSold, setProductsSold] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [dineInSales, setDineInSales] = useState(0);
  const [pickUpSales, setPickUpSales] = useState(0);

  // Helper function to get date range based on filter type
  const getDateRange = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    switch (filterType) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        return { start: yesterdayStr, end: yesterdayStr };
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 6);
        return { start: last7Days.toISOString().split("T")[0], end: todayStr };
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 29);
        return { start: last30Days.toISOString().split("T")[0], end: todayStr };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  // Main effect to calculate sales data based on filter
  useEffect(() => {
    const { start, end } = getDateRange();
    
    if (!start || !end) {
      setFilteredOrders([]);
      setTotalSales(0);
      setTotalOrders(0);
      setProductsSold(0);
      setDineInSales(0);
      setPickUpSales(0);
      setRevenueData([]);
      return;
    }

    // Filter orders based on date range
    const filtered = completedOrdersData.completedOrders.filter(order => {
      const orderDate = order.timeCompleted.split("T")[0];
      return orderDate >= start && orderDate <= end;
    });

    setFilteredOrders(filtered);

    // Calculate totals
    const totalSalesAmount = filtered.reduce((acc, order) => acc + order.price, 0);
    const dineInAmount = filtered.filter(order => order.orderType === "dine-in").reduce((acc, order) => acc + order.price, 0);
    const pickUpAmount = filtered.filter(order => order.orderType === "pick-up").reduce((acc, order) => acc + order.price, 0);
    const totalProductsSold = filtered.reduce((acc, order) => acc + order.items.reduce((sum, item) => sum + item.quantity, 0), 0);

    setTotalSales(totalSalesAmount);
    setTotalOrders(filtered.length);
    setProductsSold(totalProductsSold);
    setDineInSales(dineInAmount);
    setPickUpSales(pickUpAmount);

    // Generate chart data for the date range
    const startDate = new Date(start);
    const endDate = new Date(end);
    const chartData = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOrders = filtered.filter(order => order.timeCompleted.startsWith(dateStr));
      
      chartData.push({
        date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        revenuePickup: dayOrders.filter(order => order.orderType === "pick-up").reduce((acc, order) => acc + order.price, 0),
        revenueDineIn: dayOrders.filter(order => order.orderType === "dine-in").reduce((acc, order) => acc + order.price, 0),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setRevenueData(chartData);
  }, [filterType, customStartDate, customEndDate]);

  const exportCSV = () => {
    const { start, end } = getDateRange();
    
    // Format date and time helper function
    const formatDateTime = (isoString: string) => {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    // Generate filename based on filter type
    let filename = "Sales_Report";
    if (filterType === 'custom') {
      filename += `_${start}_to_${end}`;
    } else {
      filename += `_${filterType}`;
    }
    filename += `.csv`;

    const csvData = [
      ["Sales Report - " + filterType.toUpperCase().replace(/([A-Z])/g, ' $1').trim()],
      [`Date Range: ${start} to ${end}`],
      [`Total Orders: ${totalOrders}`],
      [`Total Sales: ${formatPrice(totalSales)}`],
      [`Dine-in Sales: ${formatPrice(dineInSales)}`],
      [`Pick-up Sales: ${formatPrice(pickUpSales)}`],
      [`Products Sold: ${productsSold}`],
      [], // Empty row
      ["Order ID", "Order Type", "Customer Name", "Price", "Time Completed", "Items"],
      ...filteredOrders.map(order => [
        order.id,
        order.orderType,
        order.customerName,
        formatPrice(order.price),
        formatDateTime(order.timeCompleted),
        order.items.map((item: any) => `${item.quantity}x ${item.name}`).join('; ')
      ]),
      [], // Empty row for spacing
      ["SUMMARY"],
      ["Dine In Sales", "", "", formatPrice(dineInSales), "", ""],
      ["Pick Up Sales", "", "", formatPrice(pickUpSales), "", ""],
      ["Total Sales", "", "", formatPrice(totalSales), "", ""],
      ["Total Orders", "", "", totalOrders, "", ""],
      ["Products Sold", "", "", productsSold, "", ""]
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-mt-6 p-6 bg-[#5A1E16] rounded-lg">
      {/* Header with Controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>
        <div className="flex gap-4">
          <button 
            onClick={onBack} 
            className="bg-white text-[#473e1d] px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={exportCSV} 
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Date Filter</h2>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Quick Filter Buttons */}
          <div className="flex gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'last7days', label: 'Last 7 Days' },
              { key: 'last30days', label: 'Last 30 Days' },
              { key: 'custom', label: 'Custom' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === filter.key
                    ? 'bg-[#473e1d] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {filterType === 'custom' && (
            <div className="flex gap-2 items-center ml-4">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>

        {/* Current Filter Display */}
        <div className="mt-3 text-sm text-gray-600">
          {(() => {
            const { start, end } = getDateRange();
            if (!start || !end) return 'Please select a valid date range';
            return `Showing data from ${start} to ${end} (${filteredOrders.length} orders)`;
          })()}
        </div>
      </div>

      {/* Charts and Statistics */}
      <div className="flex flex-wrap gap-6 h-screen">
        {/* Revenue Chart */}
        <div className="p-4 bg-white rounded-lg shadow-md flex-1 h-full">
          <h2 className="text-lg font-bold text-black mb-2">
            Revenue Chart - {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace(/([A-Z])/g, ' $1')}
          </h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={revenueData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatPrice(value)} />
              <Legend />
              <Bar dataKey="revenuePickup" fill="#D98E04" name="Pick-up Sales" />
              <Bar dataKey="revenueDineIn" fill="#3E5423" name="Dine-in Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Boxes */}
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center w-full md:w-[25%]">
          <h1 className="text-2xl font-bold mb-4">Sales Summary</h1>
          <div className="grid grid-cols-1 gap-4 w-full h-full">
            <div className="bg-[#3E5423] p-4 rounded-lg flex flex-col items-center justify-center flex-1 min-h-[20%] w-full">
              <h2 className="text-lg font-bold text-center text-white">Total Sales</h2>
              <p className="text-4xl text-center font-bold text-white">{formatPrice(totalSales)}</p>
              <p className="text-sm text-green-200">Filtered Period</p>
            </div>

            <div className="bg-[#D98E04] p-4 rounded-lg flex flex-col items-center justify-center flex-1 min-h-[20%] w-full">
              <h2 className="text-lg font-bold text-center text-white">Total Orders</h2>
              <p className="text-4xl text-center font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-yellow-200">Orders</p>
            </div>

            <div className="bg-[#8B5A2B] p-4 rounded-lg flex flex-col items-center justify-center flex-1 min-h-[20%] w-full">
              <h2 className="text-lg font-bold text-center text-white">Products Sold</h2>
              <p className="text-4xl text-center font-bold text-white">{productsSold}</p>
              <p className="text-sm text-orange-200">Items</p>
            </div>

            <div className="bg-[#2C5F2D] p-4 rounded-lg flex flex-col items-center justify-center flex-1 min-h-[20%] w-full">
              <h2 className="text-lg font-bold text-center text-white">Avg Order Value</h2>
              <p className="text-4xl text-center font-bold text-white">
                {totalOrders > 0 ? formatPrice(totalSales / totalOrders) : formatPrice(0)}
              </p>
              <p className="text-sm text-green-200">Per Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Sales Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dine-in Sales:</span>
              <span className="font-bold text-[#3E5423]">{formatPrice(dineInSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pick-up Sales:</span>
              <span className="font-bold text-[#D98E04]">{formatPrice(pickUpSales)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total Sales:</span>
              <span className="font-bold text-lg">{formatPrice(totalSales)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Order Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dine-in Orders:</span>
              <span className="font-bold text-[#3E5423]">
                {filteredOrders.filter(order => order.orderType === 'dine-in').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pick-up Orders:</span>
              <span className="font-bold text-[#D98E04]">
                {filteredOrders.filter(order => order.orderType === 'pick-up').length}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total Orders:</span>
              <span className="font-bold text-lg">{totalOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDataSection;
