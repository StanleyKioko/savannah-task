import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import useWishlistStore from '@/stores/wishlistStore';
import useCartStore from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';

const Wishlist = () => {
  const { wishlist, removeFromWishlistLocal, clearWishlistLocal } = useWishlistStore();
  const { addItemLocal } = useCartStore();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    removeFromWishlistLocal(productId);
    toast({
      title: "Removed from Wishlist",
      description: `${productName} has been removed from your wishlist.`,
    });
  };

  const handleAddToCart = (product: any) => {
    addItemLocal(product, 1);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleClearWishlist = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearWishlistLocal();
      setIsClearing(false);
      toast({
        title: "Wishlist Cleared",
        description: "All items have been removed from your wishlist.",
      });
    }, 500);
  };

  const products = wishlist?.products || [];

  return (
    <>
      <Helmet>
        <title>My Wishlist - EStore</title>
        <meta name="description" content="View and manage your wishlist items." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {products.length === 0 
                ? "Your wishlist is empty" 
                : `${products.length} item${products.length !== 1 ? 's' : ''} in your wishlist`}
            </p>
          </div>
          
          {products.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearWishlist}
              disabled={isClearing}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? 'Clearing...' : 'Clear All'}
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="mx-auto h-24 w-24 text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Start adding items you love to your wishlist and come back to them later.
            </p>
            <Link to="/products">
              <Button size="lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  {product.featured_image && (
                    <div className="aspect-square mb-4 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={product.featured_image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.sale_price && product.sale_price < product.price && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${product.sale_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {product.in_stock ? (
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {product.sku && (
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.in_stock}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                    className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <Link to="/products">
              <Button variant="outline" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Wishlist;