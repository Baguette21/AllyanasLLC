import React, { useState, useRef, useEffect } from "react";
import { useCart } from '../../context/CartContext';
import { Cart } from '../Cart';
import { API_BASE_URL } from '@/config/api';

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
  isBestseller?: boolean;
}

interface CartItem {
  item_name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
  quantity?: number;
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
  const { addToCart, clearCart } = useCart();

  // Load session data if exists
  useEffect(() => {
    const savedSession = sessionStorage.getItem('currentOrder');
    if (savedSession) {
      const { items, category } = JSON.parse(savedSession);
      items.forEach((item: any) => addToCart(item));
      if (category) setSelectedCategory(category);
    }
  }, []);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/menu`);
        const data = await response.json() as MenuData;
        
        // Sort categories by their order
        const categories = data.categories
          .sort((a, b) => a.order - b.order)
          .map(c => c.name.toUpperCase());
        
        // Sort items by category order and then by item order
        const sortedItems = data.items.sort((a, b) => {
          const categoryA = data.categories.find(c => c.name === a.category);
          const categoryB = data.categories.find(c => c.name === b.category);
          if (categoryA?.order !== categoryB?.order) {
            return (categoryA?.order || 0) - (categoryB?.order || 0);
          }
          return a.itemOrder - b.itemOrder;
        });
        
        setCategories(categories);
        setMenuItems(sortedItems);
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };

    fetchMenuData();
  }, []);

  // Save to session storage whenever cart changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('currentOrder', JSON.stringify({
        items: Array.from(document.querySelectorAll('[data-cart-item]')).map(el => ({
          item_name: el.getAttribute('data-name'),
          price: Number(el.getAttribute('data-price')),
          quantity: Number(el.getAttribute('data-quantity')),
          category: el.getAttribute('data-category'),
          description: el.getAttribute('data-description'),
          image: el.getAttribute('data-image'),
          isAvailable: el.getAttribute('data-available') === 'true'
        })),
        category: selectedCategory
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedCategory]);

  // Scroll handlers for category navigation
  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const filteredItems = menuItems.filter(item => 
    item.category.toUpperCase() === selectedCategory
  );

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    const cartItem: CartItem = {
      item_name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      isAvailable: item.isAvailable
    };
    addToCart(cartItem);
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
          <button 
            onClick={() => scrollCategories('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#473E1D] text-white p-2 rounded-full z-10 hover:bg-[#5c4f26]"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            ←
          </button>
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-2 pb-4 px-2 scrollbar-hide"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  flex-none px-4 py-2 rounded-md whitespace-nowrap transition-all text-sm font-medium min-w-[100px] text-center
                  ${selectedCategory === category
                    ? 'bg-[#F5A623] text-white'
                    : 'bg-[#F5A623] text-white opacity-90 hover:opacity-100'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
          <button 
            onClick={() => scrollCategories('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#473E1D] text-white p-2 rounded-full z-10 hover:bg-[#5c4f26]"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            →
          </button>
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
              <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
                <img
                  src={item.image === 'blank.png' ? '/placeholder-food.jpg' : item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-food.jpg';
                  }}
                />
                {item.isBestseller && (
                  <div 
                    className="absolute z-10"
                    style={{
                      top: '-23px',
                      left: '-12px',
                      width: '100px',
                      height: '100px',
                      overflow: 'visible'
                    }}
                  >
                    <img 
                      src={`${API_BASE_URL}/bestseller.png`}
                      alt="Bestseller" 
                      style={{
                        width: '100%',
                        height: 'auto'
                      }}
                    />
                  </div>
                )}
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
