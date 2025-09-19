import React, { useEffect, useState } from 'react';
import { productAPI } from '@/lib/productApi';
import { BackendCategory } from '@/types/backend';

export function CategoryList() {
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await productAPI.getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading categories...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (categories.length === 0) {
    return <div className="p-4 text-center">No categories found.</div>;
  }

  // Group categories by parent
  const categoriesByParent: { [key: string]: BackendCategory[] } = {};
  categories.forEach(cat => {
    const parentId = cat.parent === null ? 'root' : cat.parent.toString();
    if (!categoriesByParent[parentId]) {
      categoriesByParent[parentId] = [];
    }
    categoriesByParent[parentId].push(cat);
  });

  // Get top-level categories
  const topLevelCategories = categoriesByParent['root'] || [];

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {topLevelCategories.map((category) => (
          <div 
            key={category.id} 
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-sm text-gray-500">{category.product_count} products</p>
            
            {/* Show subcategories if they exist */}
            {categoriesByParent[category.id.toString()] && (
              <div className="mt-2 pl-2 border-l-2 border-gray-200">
                {categoriesByParent[category.id.toString()].map(subcat => (
                  <div key={subcat.id} className="text-sm py-1 hover:text-blue-600">
                    {subcat.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}