import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import useCartStore from '@/stores/cartStore';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeItemLocal, updateItemQuantityLocal, getSubtotal, getTotal } = useCartStore();
  
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    updateItemQuantityLocal(itemId, quantity);
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeItemLocal(itemId);
  };
  
  const handleCheckout = () => {
    navigate('/checkout');
  };
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Your Cart - Empty</title>
          <meta name="description" content="Your shopping cart is currently empty" />
        </Helmet>
        <div className="container-fluid py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-6">
                Add some products to your cart to see them here.
              </p>
              <Button onClick={() => navigate('/products')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Start Shopping
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{`Your Cart - ${cart?.items?.length || 0} items`}</title>
        <meta name="description" content="Review your shopping cart items" />
      </Helmet>
      <div className="container-fluid py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({cart.items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 pb-6 border-b last:border-b-0 last:pb-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md overflow-hidden">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={item.product.images[0].image} 
                          alt={item.product.images[0].alt_text || item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : item.product.featured_image ? (
                        <img 
                          src={item.product.featured_image} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product.sku}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
                        <div className="flex items-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 sm:mt-0 flex items-center justify-between sm:justify-end gap-4">
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/products')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;