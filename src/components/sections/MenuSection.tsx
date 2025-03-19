import React, { useState, useRef, useEffect } from "react";

import { useCart } from '../../context/CartContext';
import { Cart } from '../Cart';
import { Header } from '@/components/layout/Header'; 
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
  const { addToCart } = useCart();

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
        const sortedCategories = data.categories
          .sort((a, b) => a.order - b.order)
          .map((c) => c.name.toUpperCase());

        // Sort items by category order and then by item order
        const sortedItems = data.items.sort((a, b) => {
          const categoryA = data.categories.find((c) => c.name === a.category);
          const categoryB = data.categories.find((c) => c.name === b.category);
          if ((categoryA?.order || 0) !== (categoryB?.order || 0)) {
            return (categoryA?.order || 0) - (categoryB?.order || 0);
          }
          return a.itemOrder - b.itemOrder;
        });

        setCategories(sortedCategories);
        setMenuItems(sortedItems);
        if (sortedCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(sortedCategories[0]);
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
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  const filteredItems = menuItems.filter(
    (item) => item.category.toUpperCase() === selectedCategory
  );

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    const cartItem: CartItem = {
      item_name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      isAvailable: item.isAvailable,
    };
    addToCart(cartItem);
  };

  return (
    <>
      <Header isSticky />
      <section className="bg-[#F5F2EE] min-h-screen pt-1">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-normal text-[#473E1D] mb-0">Our Menu</p>
              {orderInfo.selectedType === "dine-in" && (
                <p className="text-lg">Table: {orderInfo.tableNumber}</p>
              )}
            </div>
            <button
              onClick={onBack}
              className="bg-[#473E1D] text-[#F5F2EE] text-sm px-3 py-1 rounded-xl hover:bg-[#5c4f26] transition-colors"
            >
              ←
            </button>
          </div>

          {orderInfo.selectedType === "pick-up" && (
            <div className="text-lg mb-2">
              <p>Name: {orderInfo.fullName}</p>
              <p>Phone: {orderInfo.phoneNumber}</p>
            </div>
          )}

          <div className="relative mb-2">
            <button 
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#473E1D] text-[#F5F2EE] p-2 rounded-full z-10 hover:bg-[#5c4f26] ml-2 flex items-center justify-center w-8 h-8"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              ←
            </button>
            <div
              ref={scrollContainerRef}
              className="flex items-center overflow-x-auto gap-2 pb-2 px-2 scrollbar-hide ml-8"
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
                  className={`flex-none px-4 py-2 rounded-md whitespace-nowrap transition-all text-sm font-medium min-w-[100px] text-center
                    ${selectedCategory === category
                      ? 'bg-[#F5A623] text-white'
                      : 'bg-[#F5A623] text-white opacity-90 hover:opacity-100'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <button 
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#473E1D] text-white p-3 rounded-full z-10 hover:bg-[#5c4f26] mr-2 flex items-center justify-center w-8 h-8"
              style={{ transform: 'translate(50%, -50%)' }}
            >
              →
            </button>
          </div>

          <div className="flex justify-center items-center w-full ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex bg-transparent rounded-lg shadow-md overflow-hidden items-center p-5 ${!item.isAvailable ? 'opacity-75' : ''} border border-[#473E1D]`}
                  style={{ height: 'auto', position: 'relative' }} 
                >
                  <div
                    className="relative bg-[#473E1D] flex items-center justify-center rounded-2xl"
                    style={{ width: '160px', height: '110px', padding: '8px', minWidth: '160px', minHeight: '110px' }}
                  >
                    {item.isBestseller && (
                      <img 
                        src="/bestseller.png" 
                        alt="Bestseller" 
                        className="absolute z-20" 
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          top: '0',
                          left: '0',
                          transform: 'translate(-10px, -10px)'
                        }}
                      />
                    )}
                    <div
                      className="absolute top-1/2 left-1/2 flex-shrink-0 overflow-hidden rounded-full transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#F5F2EE]"
                      style={{ width: '130px', height: '130px' }}
                    >
                      <img
                        src={item.image === 'blank.png' ? '/placeholder-food.jpg' : item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-food.jpg';
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="flex-grow ml-4 pr-4 ml-6"
                    style={{
                      minWidth: '0',
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                    }}
                  >
                    <h3 className="text-xl text-[#473E1D]">{item.name}</h3>
                    <p className="text-gray-600 text-xs text-[#473E1D]">{item.description}</p>
                    <span className="block text-sm font-bold mb-2 text-[#473E1D]">₱{item.price}</span>

                    {!item.isAvailable ? (
                      <div className="bg-red-100 text-red-800 text-center py-1 rounded text-sm">
                        Currently Unavailable
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-[#473E1D] text-white px-16 py-2 rounded text-xs hover:bg-[#5c4f26] transition-colors"
                      >
                        Add to Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Cart onCheckout={onCheckout} />
        </div>
      </section>
    </>
  );
};
