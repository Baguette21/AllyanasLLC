export interface MenuItem {
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

export interface Category {
  id: string;
  name: string;
  order: number;
}

interface MenuData {
  items: MenuItem[];
  categories: Category[];
  lastUpdated: string;
}

interface CategoryUpdateRequest {
  category: Category;
  oldCategoryName: string;
}

import { API_BASE_URL } from '@/config/api';
const API_URL = `${API_BASE_URL}/api`;

const MAX_BULK_ITEMS = 50;

const validateMenuItem = (item: Partial<MenuItem>): string[] => {
  const errors: string[] = [];
  if (!item.name?.trim()) errors.push('Name is required');
  if (typeof item.price !== 'number' || item.price < 0) errors.push('Valid price is required');
  if (!item.category?.trim()) errors.push('Category is required');
  return errors;
};

export const loadMenuData = async (): Promise<MenuData> => {
  try {
    const response = await fetch(`${API_URL}/menu`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to load menu data: ${error}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading menu data:', error);
    return {
      items: [],
      categories: [],
      lastUpdated: new Date().toISOString()
    };
  }
};

export const saveMenuData = async (data: Partial<MenuData>): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save menu data: ${error}`);
    }
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
  } catch (error) {
    console.error('Error saving menu data:', error);
    throw error;
  }
};

export const addMenuItem = async (item: Omit<MenuItem, 'id' | 'itemOrder'>): Promise<MenuItem> => {
  try {
    const response = await fetch(`${API_URL}/menu/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add menu item: ${error}`);
    }
    const newItem = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return newItem;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
};

export const updateMenuItem = async (item: MenuItem): Promise<MenuItem> => {
  try {
    const response = await fetch(`${API_URL}/menu/items/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update menu item: ${error}`);
    }
    const updatedItem = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return updatedItem;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/menu/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete menu item: ${error}`);
    }
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

export const addCategory = async (category: Omit<Category, 'id' | 'order'>): Promise<Category> => {
  try {
    const response = await fetch(`${API_URL}/menu/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add category: ${error}`);
    }
    const newCategory = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (category: Category, oldCategoryName: string): Promise<Category> => {
  try {
    const response = await fetch(`${API_URL}/menu/categories/${category.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category, oldCategoryName }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update category: ${error}`);
    }
    const updatedCategory = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return updatedCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/menu/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete category: ${error}`);
    }
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const reorderCategories = async (categories: Category[]): Promise<void> => {
  try {
    await saveMenuData({ categories });
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};

export const reorderMenuItems = async (items: MenuItem[]): Promise<void> => {
  try {
    await saveMenuData({ items });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    throw error;
  }
};

export const bulkAddMenuItems = async (items: Omit<MenuItem, 'id' | 'itemOrder'>[]): Promise<MenuItem[]> => {
  if (!items.length) throw new Error('No items provided');
  if (items.length > MAX_BULK_ITEMS) throw new Error(`Cannot add more than ${MAX_BULK_ITEMS} items at once`);
  
  const allErrors = items.map((item, index) => {
    const errors = validateMenuItem(item);
    return errors.length ? { index, errors } : null;
  }).filter(Boolean);
  
  if (allErrors.length) {
    throw new Error(`Validation failed:\n${allErrors.map(e => 
      `Item ${e!.index}: ${e!.errors.join(', ')}`).join('\n')}`);
  }

  try {
    const response = await fetch(`${API_URL}/menu/items/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to bulk add menu items: ${error}`);
    }
    const newItems = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return newItems;
  } catch (error) {
    console.error('Error bulk adding menu items:', error);
    throw error;
  }
};

export const bulkUpdateMenuItems = async (items: MenuItem[]): Promise<MenuItem[]> => {
  if (!items.length) throw new Error('No items provided');
  if (items.length > MAX_BULK_ITEMS) throw new Error(`Cannot update more than ${MAX_BULK_ITEMS} items at once`);
  
  const allErrors = items.map((item, index) => {
    const errors = validateMenuItem(item);
    if (!item.id) errors.push('ID is required');
    return errors.length ? { index, errors } : null;
  }).filter(Boolean);
  
  if (allErrors.length) {
    throw new Error(`Validation failed:\n${allErrors.map(e => 
      `Item ${e!.index}: ${e!.errors.join(', ')}`).join('\n')}`);
  }

  try {
    const response = await fetch(`${API_URL}/menu/items/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to bulk update menu items: ${error}`);
    }
    const updatedItems = await response.json();
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
    return updatedItems;
  } catch (error) {
    console.error('Error bulk updating menu items:', error);
    throw error;
  }
};

export const bulkDeleteMenuItems = async (ids: string[]): Promise<void> => {
  if (!ids.length) throw new Error('No IDs provided');
  if (ids.length > MAX_BULK_ITEMS) throw new Error(`Cannot delete more than ${MAX_BULK_ITEMS} items at once`);
  if (ids.some(id => !id?.trim())) throw new Error('Invalid ID provided');
  
  try {
    const response = await fetch(`${API_URL}/menu/items/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to bulk delete menu items: ${error}`);
    }
    window.dispatchEvent(new CustomEvent('menu-data-updated'));
  } catch (error) {
    console.error('Error bulk deleting menu items:', error);
    throw error;
  }
};

export interface OrderDetails {
  id: string;
  orderType: 'pickup' | 'dine-in';
  customerName: string;
  table?: string;
  contactNumber?: string;
  timeOfOrder: string;
  price: number;
  items: string[];
}

interface SessionOrder {
  items: MenuItem[];
  total: number;
}

let currentSessionOrder: SessionOrder = {
  items: [],
  total: 0
};

export const addToOrder = (item: MenuItem): void => {
  currentSessionOrder.items.push(item);
  currentSessionOrder.total += item.price;
  window.dispatchEvent(new CustomEvent('order-updated', { 
    detail: currentSessionOrder 
  }));
};

export const removeFromOrder = (itemId: string): void => {
  const index = currentSessionOrder.items.findIndex(item => item.id === itemId);
  if (index !== -1) {
    currentSessionOrder.total -= currentSessionOrder.items[index].price;
    currentSessionOrder.items.splice(index, 1);
    window.dispatchEvent(new CustomEvent('order-updated', { 
      detail: currentSessionOrder 
    }));
  }
};

export const getCurrentOrder = (): SessionOrder => {
  return { ...currentSessionOrder };
};

export const clearOrder = (): void => {
  currentSessionOrder = {
    items: [],
    total: 0
  };
  window.dispatchEvent(new CustomEvent('order-updated', { 
    detail: currentSessionOrder 
  }));
};

const generateOrderId = (): string => {
  return `ORD${String(Date.now()).slice(-6)}`;
};

export const checkout = async (orderDetails: Omit<OrderDetails, 'id' | 'price' | 'items' | 'timeOfOrder'>): Promise<void> => {
  if (!currentSessionOrder.items.length) {
    throw new Error('No items in order');
  }

  if (orderDetails.orderType === 'dine-in' && !orderDetails.table) {
    throw new Error('Table number is required for dine-in orders');
  }

  if (orderDetails.orderType === 'pickup' && !orderDetails.contactNumber) {
    throw new Error('Contact number is required for pickup orders');
  }

  const newOrder: OrderDetails = {
    ...orderDetails,
    id: generateOrderId(),
    price: currentSessionOrder.total,
    items: currentSessionOrder.items.map(item => item.name),
    timeOfOrder: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newOrder),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save order: ${error}`);
    }

    sessionStorage.removeItem('currentOrder');
    clearOrder();
    window.dispatchEvent(new CustomEvent('order-completed', { 
      detail: newOrder 
    }));
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};
