import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import useCartStore from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
}

export const ProductCard = ({ product, variant = 'default' }: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      await addItem(product, 1);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} has been ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'fill-rating text-rating' 
            : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const discountPercentage = product.sale_price 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const currentPrice = product.sale_price || product.price;
  const originalPrice = product.sale_price ? product.price : null;

  if (variant === 'compact') {
    return (
      <Card className="product-card group cursor-pointer border-0 shadow-sm hover:shadow-md">
        <Link to={`/products/${product.slug}`} className="block">
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={product.featured_image || product.images[0]?.image || '/placeholder.svg'}
              alt={product.images[0]?.alt_text || product.name}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {discountPercentage > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute top-2 left-2 animate-scale-in"
              >
                -{discountPercentage}%
              </Badge>
            )}
            {!product.in_stock && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2"
              >
                Out of Stock
              </Badge>
            )}
          </div>
          <CardContent className="p-3">
            <h3 className="font-semibold text-sm truncate mb-1">{product.name}</h3>
            <div className="flex items-center gap-1 mb-2">
              <span className="price text-sm font-bold">${currentPrice.toFixed(2)}</span>
              {originalPrice && (
                <span className="price-original text-xs">${originalPrice.toFixed(2)}</span>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="product-card group cursor-pointer gradient-card border-0 shadow-lg hover:shadow-xl">
        <Link to={`/products/${product.slug}`} className="block">
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={product.featured_image || product.images[0]?.image || '/placeholder.svg'}
              alt={product.images[0]?.alt_text || product.name}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            {discountPercentage > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute top-3 left-3 text-base px-3 py-1 animate-scale-in"
              >
                -{discountPercentage}% OFF
              </Badge>
            )}
            {product.is_featured && (
              <Badge 
                className="absolute top-3 right-3 gradient-primary text-white"
              >
                Featured
              </Badge>
            )}
            {!product.in_stock && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-3 left-3"
              >
                Out of Stock
              </Badge>
            )}
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">{product.category.name}</Badge>
              <div className="flex items-center gap-1">
                {renderStars(Math.floor(product.rating))}
                <span className="text-sm text-muted-foreground ml-1">
                  ({product.review_count})
                </span>
              </div>
            </div>
            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {product.short_description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="price text-2xl font-bold">${currentPrice.toFixed(2)}</span>
                {originalPrice && (
                  <span className="price-original text-lg">${originalPrice.toFixed(2)}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWishlistToggle}
                  className="hover:text-destructive"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-destructive' : ''}`} />
                </Button>
                <Button 
                  variant="cart" 
                  onClick={handleAddToCart}
                  disabled={!product.in_stock || isLoading}
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="product-card group cursor-pointer border-0 shadow-sm hover:shadow-lg">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={product.featured_image || product.images[0]?.image || '/placeholder.svg'}
            alt={product.images[0]?.alt_text || product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="animate-scale-in">
                -{discountPercentage}%
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="gradient-primary text-white">
                Featured
              </Badge>
            )}
          </div>
          
          {!product.in_stock && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3"
            >
              Out of Stock
            </Badge>
          )}

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleWishlistToggle}
              className="hover:text-destructive bg-white/90 backdrop-blur-sm"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-destructive' : ''}`} />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {product.category.name}
            </Badge>
            <div className="flex items-center gap-1">
              {renderStars(Math.floor(product.rating))}
              <span className="text-xs text-muted-foreground ml-1">
                ({product.review_count})
              </span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {product.short_description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="price text-xl font-bold">${currentPrice.toFixed(2)}</span>
              {originalPrice && (
                <span className="price-original">${originalPrice.toFixed(2)}</span>
              )}
            </div>
            
            <Button 
              variant="cart" 
              size="sm"
              onClick={handleAddToCart}
              disabled={!product.in_stock || isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ProductCard;