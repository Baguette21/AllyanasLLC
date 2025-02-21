import React from "react";

interface HomepageSectionProps {
  onCheckOrder: () => void;
  onSalesData: () => void;
  onManageMenu: () => void;
}

export const HomepageSection: React.FC<HomepageSectionProps> = ({
    onCheckOrder,
    onSalesData,
    onManageMenu,
}) => {
    return (
        <section className="bg-[#94332d] flex items-center justify-center py-8 px-4 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full max-w-7xl min-h-[78vh]">
                <button
                    onClick={onManageMenu}
                    className="px-7 py-9 bg-[#F5F2EE] text-[#473e1d] text-5xl font-bold rounded-lg hover:bg-[#e0e0e0] transition-colors">
                        Manage Menu
                </button>
                <button
                    onClick={onCheckOrder}
                    className="px-7 py-9 bg-[#F5F2EE] text-[#473e1d] text-5xl font-bold rounded-lg hover:bg-[#e0e0e0] transition-colors">
                        Check Orders
                </button>
                <button
                    onClick={onSalesData}
                    className="px-7 py-9 bg-[#F5F2EE] text-[#473e1d] text-5xl font-bold rounded-lg hover:bg-[#e0e0e0] transition-colors">
                        Sales Data
                </button>
            </div>
        </section>
    );
};
