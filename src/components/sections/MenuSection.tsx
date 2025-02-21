import React, { useState, useRef, useEffect } from "react";
import { MenuItem, parseMenuData } from '../../utils/menuData';
import { useCart } from '../../context/CartContext';
import { Cart } from '../Cart';

interface MenuSectionProps {
  orderInfo: {
    selectedType?: "dine-in" | "pick-up";
    tableNumber?: string;
    fullName?: string;
    phoneNumber?: string;
    additionalInfo?: string;
  };
  onBack: () => void;
  onCheckout: () => void;
}

// Categories in the desired order
const CATEGORIES = [
  "HOUSE SPECIALTY",
  "CHICKEN",
  "BEEF",
  "PORK",
  "SHRIMP",
  "SQUID",
  "SIZZLING",
  "FISH",
  "VEGETABLES",
  "ASADO",
  "SOUP",
  "NOODLES",
  "RICE TOPPINGS",
  "RICE",
  "DRINKS"
];

export const MenuSection = ({ orderInfo, onBack, onCheckout }: MenuSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Parse the CSV data when component mounts
    const parsedData = parseMenuData();
    setMenuItems(parsedData);
  }, []);

  // Filter menu items by selected category
  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  return (
    <section className="bg-[rgba(245,242,238,1)] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button and Order Info */}
        <div className="flex justify-between items-start">
          <div className="text-lg">
            {orderInfo.selectedType === "dine-in" ? (
              <p>Table: {orderInfo.tableNumber}</p>
            ) : (
              <div>
                <p>Name: {orderInfo.fullName}</p>
                <p>Phone: {orderInfo.phoneNumber}</p>
              </div>
            )}
          </div>
          <button
            onClick={onBack}
            className="bg-[#473E1D] text-white px-6 py-2 rounded-lg hover:bg-[#473E1D] transition-colors ml-4"
          >
            Back
          </button>
        </div>

        {/* Category Carousel */}
        <div className="relative mb-16 mt-4">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 no-scrollbar pb-4 -mx-4 px-4 md:mx-0"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx global>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  flex-none px-6 py-2 rounded-full whitespace-nowrap transition-all
                  ${
                    selectedCategory === category
                      ? "bg-[rgba(148,51,45,1)] text-white"
                      : "bg-[rgba(238,167,51,1)] text-black hover:bg-[rgba(148,51,45,0.8)] hover:text-white"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Scroll Indicators and Buttons - Hide on Mobile */}
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft -= 200;
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors hidden md:block"
            style={{ top: '60%' }}
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft += 200;
              }
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors hidden md:block"
            style={{ top: '60%' }}
            aria-label="Scroll right"
          >
            →
          </button>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.item_name} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{item.item_name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">₱{item.price.toFixed(2)}</span>
                <button 
                  onClick={() => {
                    addToCart(item);
                  }}
                  className="bg-[rgba(148,51,45,1)] text-white px-4 py-2 rounded-full hover:bg-[rgba(148,51,45,0.8)]"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping Cart */}
        <Cart onCheckout={onCheckout} />
      </div>
    </section>
  );
};
