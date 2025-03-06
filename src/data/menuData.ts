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

const API_URL = 'http://localhost:3001/api/menu';

export const loadMenuData = async (): Promise<MenuData> => {
  try {
    const response = await fetch(API_URL);
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
    const response = await fetch(API_URL, {
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
    const response = await fetch(`${API_URL}/items`, {
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
    const response = await fetch(`${API_URL}/items/${item.id}`, {
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
    const response = await fetch(`${API_URL}/items/${id}`, {
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
    const response = await fetch(`${API_URL}/categories`, {
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
    const response = await fetch(`${API_URL}/categories/${category.id}`, {
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
    const response = await fetch(`${API_URL}/categories/${id}`, {
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
