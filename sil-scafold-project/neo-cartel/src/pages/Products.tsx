import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { ProductList } from '@/components/products/ProductList';
import { CategoryTreeView } from '@/components/products/CategoryTreeView';
import { useCategoryTree } from '@/hooks/use-categories';

const Products = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { categories, loading: loadingCategories } = useCategoryTree();

  return (
    <>
      <Helmet>
        <title>Products - EStore | All Products</title>
        <meta name="description" content="Browse all products at EStore. Find the best deals on electronics, clothing, books, and more." />
      </Helmet>
      <div className="container-fluid py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {selectedCategoryId ? 'Category Products' : 'All Products'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Category sidebar */}
          <div className="md:col-span-1">
            {loadingCategories ? (
              <div className="p-4 text-center">Loading categories...</div>
            ) : (
              <CategoryTreeView 
                categories={categories} 
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            )}
          </div>
          
          {/* Product listing */}
          <div className="md:col-span-3">
            <ProductList categoryId={selectedCategoryId} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Products;