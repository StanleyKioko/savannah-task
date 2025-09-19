import { useState, useEffect } from 'react';
import { productAPI } from '@/lib/productApi';
import { BackendCategory, BackendProduct } from '@/types/backend';

// Extended category type with children for tree structure
export interface CategoryTree extends BackendCategory {
  children: CategoryTree[];
  level: number;
}

export const useCategoryTree = () => {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getCategories();
        
        // Convert flat categories to tree structure
        const categoriesMap = new Map<number, CategoryTree>();
        
        // First pass: create map entries for all categories
        response.forEach(category => {
          categoriesMap.set(category.id, {
            ...category,
            children: [],
            level: 0
          });
        });
        
        // Second pass: build the tree
        const rootCategories: CategoryTree[] = [];
        
        response.forEach(category => {
          const categoryWithChildren = categoriesMap.get(category.id)!;
          
          if (category.parent === null) {
            // This is a root category
            rootCategories.push(categoryWithChildren);
          } else {
            // This is a child category, add it to its parent
            const parent = categoriesMap.get(category.parent);
            if (parent) {
              categoryWithChildren.level = parent.level + 1;
              parent.children.push(categoryWithChildren);
            }
          }
        });
        
        setCategories(rootCategories);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook to get products by category (including all subcategories)
export const useProductsByCategory = (categoryId: number | null) => {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategoryTree();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await productAPI.getProducts();
        
        if (categoryId === null) {
          // Return all products if no category selected
          setProducts(allProducts);
        } else {
          // Get all subcategory ids (recursively)
          const getCategoryIds = (catId: number, allCats: CategoryTree[]): number[] => {
            let result: number[] = [catId];
            
            const findChildIds = (id: number, cats: CategoryTree[]) => {
              cats.forEach(cat => {
                if (cat.parent === id) {
                  result.push(cat.id);
                  findChildIds(cat.id, cats);
                }
                findChildIds(id, cat.children);
              });
            };
            
            findChildIds(catId, allCats);
            return result;
          };
          
          // Flatten the category tree for searching
          const flattenCategories = (cats: CategoryTree[]): CategoryTree[] => {
            return cats.reduce((acc, cat) => {
              return [...acc, cat, ...flattenCategories(cat.children)];
            }, [] as CategoryTree[]);
          };
          
          const flatCategories = flattenCategories(categories);
          const categoryIds = getCategoryIds(categoryId, flatCategories);
          
          // Filter products by the category and all its subcategories
          const filteredProducts = allProducts.filter(product => 
            categoryIds.includes(product.category)
          );
          
          setProducts(filteredProducts);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    if (categories.length > 0 || categoryId === null) {
      fetchProducts();
    }
  }, [categoryId, categories]);

  return { products, loading, error };
};