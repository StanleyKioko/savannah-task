import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useProductsByCategory } from '@/hooks/use-categories';
import { ProductImage } from './ProductImage';
import { BackendProduct } from '@/types/backend';
import useCartStore from '@/stores/cartStore';
import useWishlistStore from '@/stores/wishlistStore';
import { useToast } from '@/hooks/use-toast';

interface ProductListProps {
  categoryId: number | null;
}

export function ProductList({ categoryId }: ProductListProps) {
  const { products, loading, error } = useProductsByCategory(categoryId);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const navigate = useNavigate();
  
  // Store hooks
  const { addItemLocal } = useCartStore();
  const { addToWishlistLocal, removeFromWishlistLocal, isInWishlist } = useWishlistStore();
  const { toast } = useToast();

  const getQuantity = (productId: number) => quantities[productId] || 1;
  
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity >= 1) {
      setQuantities(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const handleAddToCart = (product: BackendProduct) => {
    const quantity = getQuantity(product.id);
    
    // Convert BackendProduct to Product type for cart
    const cartProduct = {
      id: product.id.toString(),
      name: product.name,
      slug: product.name.toLowerCase().replace(/\s+/g, '-'),
      description: product.description || '',
      short_description: product.description || '',
      sku: product.sku || '',
      price: parseFloat(product.price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
      category: {
        id: product.category.toString(),
        name: 'Category',
        slug: 'category',
        product_count: 0,
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      categories: [],
      images: product.image_url ? [{
        id: '1',
        image: product.image_url,
        alt_text: product.name,
        is_primary: true,
        sort_order: 0,
      }] : [],
      featured_image: product.image_url,
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity,
      attributes: [],
      rating: 0,
      review_count: 0,
      is_featured: false,
      is_digital: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItemLocal(cartProduct, quantity);
    toast({
      title: "Added to Cart",
      description: `${product.name} (${quantity}) has been added to your cart.`,
    });
  };

  const handleWishlistToggle = (product: BackendProduct) => {
    const productId = product.id.toString();
    
    if (isInWishlist(productId)) {
      removeFromWishlistLocal(productId);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      // Convert BackendProduct to Product type for wishlist
      const wishlistProduct = {
        id: productId,
        name: product.name,
        slug: product.name.toLowerCase().replace(/\s+/g, '-'),
        description: product.description || '',
        short_description: product.description || '',
        sku: product.sku || '',
        price: parseFloat(product.price),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
        category: {
          id: product.category.toString(),
          name: 'Category',
          slug: 'category',
          product_count: 0,
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        categories: [],
        images: product.image_url ? [{
          id: '1',
          image: product.image_url,
          alt_text: product.name,
          is_primary: true,
          sort_order: 0,
        }] : [],
        featured_image: product.image_url,
        in_stock: product.in_stock,
        stock_quantity: product.stock_quantity,
        attributes: [],
        rating: 0,
        review_count: 0,
        is_featured: false,
        is_digital: false,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      addToWishlistLocal(wishlistProduct);
      toast({
        title: "Added to Wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleOrderNow = (product: BackendProduct) => {
    const quantity = getQuantity(product.id);
    
    // Navigate to checkout with product information
    navigate('/checkout', {
      state: {
        directOrder: true,
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
          image_url: product.image_url,
          sku: product.sku,
        },
        quantity: quantity
      }
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">No products found</h3>
        <p className="text-gray-500 mt-2">
          {categoryId 
            ? "There are no products in this category" 
            : "Please select a category to view products"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => {
        const quantity = getQuantity(product.id);
        const inWishlist = isInWishlist(product.id.toString());
        
        return (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  {!product.in_stock && (
                    <p className="text-sm text-red-500 font-medium">Out of Stock</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWishlistToggle(product)}
                  className={`ml-2 ${inWishlist ? 'text-red-500' : 'text-gray-400'}`}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProductImage 
                product={product}
                editable={false}
              />
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">
                    ${parseFloat(product.price).toFixed(2)}
                    {product.sale_price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${parseFloat(product.sale_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.in_stock && (
                    <div className="text-sm text-green-600">
                      {product.stock_quantity} in stock
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {product.in_stock ? (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => handleOrderNow(product)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Order Now
                  </Button>
                </>
              ) : (
                <Button className="w-full" disabled>
                  Out of Stock
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}