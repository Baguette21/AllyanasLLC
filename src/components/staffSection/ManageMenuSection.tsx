import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  MenuItem,
  Category,
  loadMenuData,
  saveMenuData,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  reorderMenuItems
} from '../../data/menuData';

interface EditableMenuItem extends MenuItem {
  isEditing: boolean;
}

interface ManageMenuSectionProps {
  onBack: () => void;
}

export const ManageMenuSection = ({ onBack }: ManageMenuSectionProps) => {
  const [draftItems, setDraftItems] = useState<EditableMenuItem[]>([]);
  const [draftCategories, setDraftCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemDescription, setNewItemDescription] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Category editing states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadMenuData();
        setDraftItems(
          data.items.map(item => ({
            ...item,
            isEditing: false
          }))
        );
        setDraftCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].name);
          setNewItemCategory(data.categories[0].name);
        }
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleMenuUpdate = async () => {
      try {
        const data = await loadMenuData();
        setDraftItems(
          data.items.map(item => ({
            ...item,
            isEditing: false
          }))
        );
        setDraftCategories(data.categories);
      } catch (error) {
        console.error('Error handling menu update:', error);
      }
    };

    window.addEventListener('menu-data-updated', handleMenuUpdate);
    return () => window.removeEventListener('menu-data-updated', handleMenuUpdate);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;
    if (source.index === destination.index) return;

    if (type === 'category') {
      // Handle category reordering
      const updatedCategories = Array.from(draftCategories);
      const [movedCategory] = updatedCategories.splice(source.index, 1);
      updatedCategories.splice(destination.index, 0, movedCategory);

      // Update order values
      updatedCategories.forEach((cat, index) => {
        cat.order = index;
      });

      setDraftCategories(updatedCategories);
      if (movedCategory.name === selectedCategory) {
        setSelectedCategory(movedCategory.name);
      }
      await reorderCategories(updatedCategories);
    } else {
      // Handle menu item reordering within a category
      const categoryName = editingItemId ? draftItems.find(item => item.id === editingItemId)?.category : selectedCategory;
      const categoryItems = draftItems
        .filter(item => item.category === categoryName)
        .sort((a, b) => a.itemOrder - b.itemOrder);

      const [movedItem] = categoryItems.splice(source.index, 1);
      categoryItems.splice(destination.index, 0, movedItem);

      // Update order values
      categoryItems.forEach((item, index) => {
        item.itemOrder = index;
      });

      // Create new array with updated items
      const updatedMenuItems = draftItems.map(item => {
        if (item.category === categoryName) {
          const updatedItem = categoryItems.find(ci => ci.id === item.id);
          return updatedItem || item;
        }
        return item;
      });

      // Update state and save to storage
      setDraftItems(updatedMenuItems);
      await reorderMenuItems(updatedMenuItems);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await addCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      const updatedCategory = await updateCategory(editingCategory);
      
      // Update categories in state
      setDraftCategories(prevCategories => 
        prevCategories.map(cat => cat.id === editingCategory.id ? updatedCategory : cat)
      );

      // Update items with the old category name to use the new category name
      const oldName = draftCategories.find(cat => cat.id === editingCategory.id)?.name;
      if (oldName && oldName !== updatedCategory.name) {
        setDraftItems(prevItems =>
          prevItems.map(item =>
            item.category === oldName
              ? { ...item, category: updatedCategory.name }
              : item
          )
        );
      }

      // Update selected category if it was renamed
      if (selectedCategory === oldName) {
        setSelectedCategory(updatedCategory.name);
      }

      setEditingCategory(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? All items in this category will need to be reassigned.')) {
      return;
    }

    try {
      const categoryToDelete = draftCategories.find(cat => cat.id === categoryId);
      if (!categoryToDelete) return;

      await deleteCategory(categoryId);

      // Update categories in state
      setDraftCategories(prevCategories => 
        prevCategories.filter(cat => cat.id !== categoryId)
      );

      // Set selected category to first available category
      const remainingCategories = draftCategories.filter(cat => cat.id !== categoryId);
      if (selectedCategory === categoryToDelete.name && remainingCategories.length > 0) {
        setSelectedCategory(remainingCategories[0].name);
      }

      setEditingCategory(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemCategory) return;

    try {
      const newItem = await addMenuItem({
        name: newItemName,
        price: Number(newItemPrice),
        category: newItemCategory,
        categoryOrder: newItemCategory,
        description: newItemDescription,
        image: newItemImage || 'blank.png',
        isAvailable: true
      });

      // Update the UI with the new item
      setDraftItems(prevItems => [...prevItems, { ...newItem, isEditing: false }]);
      
      // Reset form
      setNewItemName('');
      setNewItemPrice(0);
      setNewItemDescription('');
      setNewItemImage(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleSaveItem = async (itemId: string) => {
    const editedItem = draftItems.find(item => item.id === itemId);
    if (!editedItem) return;

    try {
      const savedItem = await updateMenuItem(editedItem);
      setDraftItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === itemId
            ? { ...savedItem, isEditing: false }
            : prevItem
        )
      );
      setEditingItemId(null);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleEditItem = (itemId: string) => {
    setEditingItemId(itemId);
  };

  const handleToggleAvailability = (itemId: string) => {
    setDraftItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, isAvailable: !item.isAvailable }
          : item
      )
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuItem(itemId);
        setDraftItems(prev => prev.filter(item => item.id !== itemId));
        setEditingItemId(null);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setIsEditMode(true);
    setEditingCategory(category);
  };

  const filteredItems = draftItems.filter(item => item.category === selectedCategory);

  const handleUpdateMenu = async () => {
    try {
      const cleanItems = draftItems.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
        categoryOrder: item.categoryOrder,
        description: item.description || '',
        image: item.image || 'blank.png',
        isAvailable: item.isAvailable ?? true,
        itemOrder: item.itemOrder
      }));

      await saveMenuData({
        items: cleanItems,
        categories: draftCategories,
        lastUpdated: new Date().toISOString()
      });
      
      alert('Menu updated successfully!');
    } catch (error) {
      console.error('Error updating menu:', error);
      alert('Failed to update menu');
    }
  };

  const handleUpdateItem = (itemId: string, updates: Partial<MenuItem>) => {
    setDraftItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, ...updates, isEditing: false }
          : item
      )
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[#F5F2EE]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-center text-gray-800">
              Manage Menu
            </h1>
            <button
              onClick={handleUpdateMenu}
              className="px-4 py-2 bg-[#473E1D] text-white rounded-lg hover:bg-[#5C4F26] transition-colors"
            >
              Update Menu
            </button>
          </div>

          {/* Menu Actions */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
            <button
              onClick={() => setIsAddingCategory(true)}
              className="bg-[#473E1D] text-white px-6 py-3 rounded-lg text-sm"
            >
              Add New Food Section
            </button>
            <button
              onClick={() => setIsAddingNew(true)}
              className="bg-[#473E1D] text-white px-6 py-3 rounded-lg text-sm"
            >
              Add New Food
            </button>
            <button
              onClick={() => setIsReorderingCategories(!isReorderingCategories)}
              className="bg-[#473E1D] text-white px-6 py-3 rounded-lg text-sm"
            >
              {isReorderingCategories ? 'Done Reordering' : 'Edit Category Order'}
            </button>
            <button
              onClick={() => {
                const category = draftCategories.find(c => c.name === selectedCategory);
                if (category) {
                  setEditingCategory(category);
                  setIsEditMode(true);
                }
              }}
              className="bg-[#473E1D] text-white px-6 py-3 rounded-lg text-sm"
            >
              Edit Current Section
            </button>
          </div>

          {/* Categories */}
          {isReorderingCategories ? (
            <div className="bg-[#473E1D] rounded-lg p-6 mb-6">
              <h2 className="text-white text-xl mb-4">Arrange Menu Sections</h2>
              <Droppable droppableId="categories" direction="vertical" type="category">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    className="space-y-2"
                    {...provided.droppableProps}
                  >
                    {draftCategories.map((category, index) => (
                      <Draggable
                        key={category.id}
                        draggableId={category.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-[#5C4F26] text-white p-4 rounded-lg cursor-grab active:cursor-grabbing"
                          >
                            {category.name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-4">
              {draftCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`
                    px-4 py-2 rounded-lg whitespace-nowrap
                    ${selectedCategory === category.name
                      ? 'bg-[#473E1D] text-white'
                      : 'bg-white text-[#473E1D] hover:bg-[#473E1D] hover:text-white'
                    }
                  `}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Menu Items */}
          {(isReorderingCategories || isEditMode) ? (
            <Droppable droppableId="menu-items" type="menuItem">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {filteredItems
                    .sort((a, b) => a.itemOrder - b.itemOrder)
                    .map((item, index) => (
                      <Draggable 
                        key={item.id} 
                        draggableId={item.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.5 : 1
                            }}
                            className={`bg-white rounded-lg p-4 flex items-center justify-between ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-[#473E1D]">{item.name}</h3>
                                <p className="text-sm text-gray-600">₱ {item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAvailability(item.id)}
                                className={`px-3 py-1 rounded-lg text-sm ${
                                  item.isAvailable
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </button>
                              <button
                                onClick={() => handleEditItem(item.id)}
                                className="text-[#473E1D] hover:text-[#F4B63F]"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="space-y-3">
              {filteredItems
                .sort((a, b) => a.itemOrder - b.itemOrder)
                .map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#473E1D]">{item.name}</h3>
                        <p className="text-sm text-gray-600">₱ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => handleEditItem(item.id)}
                        className="text-[#473E1D] hover:text-[#F4B63F]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Add Category Modal */}
          {isAddingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddingCategory(false)} />
              <div className="relative bg-[#473E1D] w-[600px] rounded-lg p-6">
                <button
                  onClick={() => setIsAddingCategory(false)}
                  className="absolute left-4 top-4 text-white flex items-center gap-2 text-lg"
                >
                  ← Back
                </button>
                
                <div className="mt-12">
                  <input
                    type="text"
                    placeholder="Food Section Name"
                    className="w-full bg-transparent text-white text-2xl outline-none border-b border-white/20 pb-2"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  
                  <button
                    onClick={handleAddCategory}
                    className="mt-6 w-full bg-white text-[#473E1D] rounded-lg px-4 py-2"
                  >
                    Add Section
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Category Modal */}
          {editingCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => {
                setIsEditMode(false);
                setEditingCategory(null);
              }} />
              <div className="relative bg-white rounded-lg p-7 max-w-xl w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setEditingCategory(null);
                    }}
                    className="text-[#473E1D] flex items-center gap-2 text-lg"
                  >
                    ← Back
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDeleteCategory(editingCategory.id)}
                      className="bg-red-600 text-white px-5 py-2 rounded-lg"
                    >
                      Delete Section
                    </button>
                    <button
                      onClick={handleUpdateCategory}
                      className="bg-[#473E1D] text-white px-5 py-2 rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="bg-[#473E1D] rounded-lg p-7">
                  <input
                    type="text"
                    placeholder="Food Section Name"
                    className="w-full bg-transparent text-white text-2xl outline-none border-b border-white/20 pb-2 mb-6"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                  
                  <h3 className="text-white text-xl mb-5">Arrange Menu Items</h3>
                  <Droppable droppableId="menu-items" type="menuItem">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-2.5"
                      >
                        {draftItems
                          .filter(item => item.category === editingCategory.name)
                          .sort((a, b) => a.itemOrder - b.itemOrder)
                          .map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-[#5C4F26] text-white p-4 rounded-lg cursor-grab active:cursor-grabbing"
                                >
                                  {item.name}
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
          )}

          {/* Edit Item Modal */}
          {editingItemId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingItemId(null)} />
              <div className="relative bg-[#473E1D] w-[800px] rounded-lg">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => setEditingItemId(null)}
                      className="text-white flex items-center gap-2 text-lg"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => handleDeleteItem(editingItemId)}
                      className="bg-red-600 text-white px-4 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex">
                    {/* Square Image Container on Left */}
                    <div className="w-[250px] h-[250px] bg-white rounded-lg mr-6">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="edit-item-image"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64String = reader.result as string;
                              setDraftItems(prevItems =>
                                prevItems.map(prevItem =>
                                  prevItem.id === editingItemId
                                    ? { ...prevItem, image: base64String }
                                    : prevItem
                                )
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="edit-item-image"
                        className="w-full h-full flex items-center justify-center cursor-pointer text-[#473E1D]"
                      >
                        {draftItems.find(item => item.id === editingItemId)?.image ? (
                          <img
                            src={draftItems.find(item => item.id === editingItemId)?.image}
                            alt="Item"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-xl">Add Image</span>
                        )}
                      </label>
                    </div>

                    {/* Form Container on Right */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <input
                          type="text"
                          placeholder="Add Name"
                          className="w-full bg-transparent text-white text-2xl outline-none border-b border-white/20 pb-2"
                          value={draftItems.find(item => item.id === editingItemId)?.name || ''}
                          onChange={(e) => {
                            setDraftItems(prevItems =>
                              prevItems.map(prevItem =>
                                prevItem.id === editingItemId
                                  ? { ...prevItem, name: e.target.value }
                                  : prevItem
                              )
                            );
                          }}
                        />
                        <div className="flex items-center text-white whitespace-nowrap ml-4">
                          <span>₱</span>
                          <input
                            type="number"
                            className="bg-transparent text-white w-24 outline-none border-b border-white/20 pb-2 px-2"
                            value={draftItems.find(item => item.id === editingItemId)?.price || ''}
                            onChange={(e) => {
                              setDraftItems(prevItems =>
                                prevItems.map(prevItem =>
                                  prevItem.id === editingItemId
                                    ? { ...prevItem, price: parseFloat(e.target.value) || 0 }
                                    : prevItem
                                )
                              );
                            }}
                          />
                        </div>
                      </div>

                      <textarea
                        placeholder="Add Description"
                        className="w-full bg-transparent text-white outline-none resize-none h-32 border-b border-white/20 mb-6"
                        value={draftItems.find(item => item.id === editingItemId)?.description || ''}
                        onChange={(e) => {
                          setDraftItems(prevItems =>
                            prevItems.map(prevItem =>
                              prevItem.id === editingItemId
                                ? { ...prevItem, description: e.target.value }
                                : prevItem
                            )
                          );
                        }}
                      />

                      <div className="flex gap-4 mt-6">
                        <select
                          className="flex-1 bg-white text-[#473E1D] rounded-lg px-4 py-2"
                          value={draftItems.find(item => item.id === editingItemId)?.category}
                          onChange={(e) => {
                            setDraftItems(prevItems =>
                              prevItems.map(prevItem =>
                                prevItem.id === editingItemId
                                  ? { ...prevItem, category: e.target.value }
                                  : prevItem
                              )
                            );
                          }}
                        >
                          <option disabled>Food Section</option>
                          {draftCategories.map(category => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveItem(editingItemId)}
                          className="flex-1 bg-white text-[#473E1D] rounded-lg px-4 py-2"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add New Item Modal */}
          {isAddingNew && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddingNew(false)} />
              <div className="relative bg-[#473E1D] w-[800px] rounded-lg">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="text-white flex items-center gap-2 text-lg"
                    >
                      ← Back
                    </button>
                  </div>

                  <div className="flex">
                    {/* Square Image Container on Left */}
                    <div className="w-[250px] h-[250px] bg-white rounded-lg mr-6">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="new-item-image"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64String = reader.result as string;
                              setNewItemImage(base64String);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="new-item-image"
                        className="w-full h-full flex items-center justify-center cursor-pointer text-[#473E1D]"
                      >
                        {newItemImage ? (
                          <img
                            src={newItemImage}
                            alt="New Item"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-xl">Add Image</span>
                        )}
                      </label>
                    </div>

                    {/* Form Container on Right */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <input
                          type="text"
                          placeholder="Add Name"
                          className="w-full bg-transparent text-white text-2xl outline-none border-b border-white/20 pb-2"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                        />
                        <div className="flex items-center text-white whitespace-nowrap ml-4">
                          <span>₱</span>
                          <input
                            type="number"
                            className="bg-transparent text-white w-24 outline-none border-b border-white/20 pb-2 px-2"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <textarea
                        placeholder="Add Description"
                        className="w-full bg-transparent text-white outline-none resize-none h-32 border-b border-white/20 mb-6"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                      />

                      <div className="flex gap-4 mt-6">
                        <select
                          className="flex-1 bg-white text-[#473E1D] rounded-lg px-4 py-2"
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                        >
                          <option disabled>Food Section</option>
                          {draftCategories.map(category => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddItem}
                          className="flex-1 bg-white text-[#473E1D] rounded-lg px-4 py-2"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};
