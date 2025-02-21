import React, { useState, useRef, useEffect } from "react";
import { useCart } from '../../context/CartContext';
import { Cart } from '../Cart';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryOrder: string;
  description: string;
  image: string;
  isAvailable: boolean;
  itemOrder: number;
}

interface MenuData {
  items: MenuItem[];
  categories: { id: string; name: string; order: number; }[];
}

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

export const MenuSection = ({ orderInfo, onBack, onCheckout }: MenuSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Fetch menu data when component mounts
    const fetchMenuData = async () => {
      try {
        console.log('Fetching menu data...');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/menu/get-menu`);
        console.log('Response status:', response.status);
        const data = await response.json() as MenuData;
        console.log('Menu data:', data);
        
        // Get unique categories from the categories array
        const categories = data.categories
          .sort((a, b) => a.order - b.order)
          .map(c => c.name.toUpperCase());
        
        console.log('Categories:', categories);
        setCategories(categories);
        setMenuItems(data.items);
        if (categories.length > 0) {
          setSelectedCategory(categories[0]); // Select first category by default
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };

    fetchMenuData();
  }, []);

  // Filter menu items by selected category
  const filteredItems = menuItems.filter(item => 
    item.category.toUpperCase() === selectedCategory
  ).sort((a, b) => a.itemOrder - b.itemOrder);

  console.log('Filtered items:', filteredItems);

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    addToCart({
      item_name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      isAvailable: item.isAvailable
    });
  };

  return (
    <section className="bg-[rgba(245,242,238,1)] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button and Order Info */}
        <div className="flex justify-between items-start mb-6">
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
            className="bg-[#473E1D] text-white px-6 py-2 rounded-lg hover:bg-[#5c4f26] transition-colors"
          >
            Back
          </button>
        </div>

        {/* Category Carousel */}
        <div className="relative mb-8">
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
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  flex-none px-6 py-2 rounded-full whitespace-nowrap transition-all
                  ${selectedCategory === category
                    ? 'bg-[#473E1D] text-white'
                    : 'bg-white text-[#473E1D] hover:bg-[#473E1D] hover:text-white'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !item.isAvailable ? 'opacity-75' : ''
              }`}
            >
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={item.image === 'blank.png' ? '/placeholder-food.jpg' : item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-food.jpg';
                  }}
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-[#473E1D]">{item.name}</h3>
                  <span className="text-lg font-bold">₱{item.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                {!item.isAvailable ? (
                  <div className="bg-red-100 text-red-800 text-center py-2 rounded">
                    Currently Unavailable
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-[#473E1D] text-white py-2 rounded hover:bg-[#5c4f26] transition-colors"
                  >
                    Add to Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Component */}
        <Cart onCheckout={onCheckout} />
      </div>
    </section>
  );
};
