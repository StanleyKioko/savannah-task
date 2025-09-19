import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import useAuthStore from '@/stores/authStore';
import useCartStore from '@/stores/cartStore';
import { productAPI } from '@/lib/productApi';
import { AlertCircle, CheckCircle, ShoppingCart, Phone, Mail } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { cart, getSubtotal, getTotal, clearCartLocal } = useCartStore();
  
  // Handle direct order from product page
  const directOrderData = location.state as {
    directOrder?: boolean;
    product?: {
      id: number;
      name: string;
      price: number;
      sale_price?: number;
      image_url?: string;
      sku?: string;
    };
    quantity?: number;
  } | null;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: user ? `${user.first_name} ${user.last_name}` : '',
    customerEmail: user ? user.email : '',
    customerPhone: '',
    shippingAddress: '',
    preferredDate: '',
    preferredTime: '',
    notifications: {
      sms: true,
      email: true,
    },
  });
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1];
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [notificationKey]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };
  
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    const hasCartItems = cart && cart.items && cart.items.length > 0;
    const hasDirectOrder = directOrderData?.directOrder && directOrderData.product;
    
    if (!hasCartItems && !hasDirectOrder) {
      toast.error('No items to order');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare order items
      let orderItems;
      
      if (directOrderData?.directOrder && directOrderData.product) {
        // Direct order from product page
        orderItems = [{
          product: directOrderData.product.id,
          qty: directOrderData.quantity || 1,
          unit_price: directOrderData.product.sale_price || directOrderData.product.price
        }];
      } else {
        // Order from cart
        orderItems = cart.items.map(item => ({
          product: parseInt(item.product.id),
          qty: item.quantity,
          unit_price: item.price
        }));
      }
      
      // Prepare order data
      const orderData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        shipping_address: formData.shippingAddress,
        ...(formData.preferredDate && { preferred_date: formData.preferredDate }),
        ...(formData.preferredTime && { preferred_time: formData.preferredTime }),
        notifications: formData.notifications,
        items: orderItems
      };

      console.log('Order data being sent:', orderData); // Debug logging
      
      // Call API to create order
      const response = await productAPI.createOrder(orderData) as { id: string | number };
      
      // Clear cart after successful order (only if ordering from cart)
      if (!directOrderData?.directOrder) {
        clearCartLocal();
      }
      
      // Show success message
      toast.success('Order placed successfully!');
      
      // Redirect to order confirmation page
      navigate(`/order-confirmation/${response.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check if we have items to checkout
  const hasCartItems = cart && cart.items && cart.items.length > 0;
  const hasDirectOrder = directOrderData?.directOrder && directOrderData.product;
  
  if (!hasCartItems && !hasDirectOrder) {
    return (
      <>
        <Helmet>
          <title>Checkout - No Items to Order</title>
        </Helmet>
        <div className="container-fluid py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-6">
                Add some products to your cart before proceeding to checkout.
              </p>
              <Button onClick={() => navigate('/products')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue Shopping
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
        <title>Checkout - Complete Your Order</title>
        <meta name="description" content="Complete your purchase and place your order." />
      </Helmet>
      
      <div className="container-fluid py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {directOrderData?.directOrder 
                    ? "Direct order from product page"
                    : `${cart.items.length} ${cart.items.length === 1 ? 'item' : 'items'} in your cart`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {directOrderData?.directOrder && directOrderData.product ? (
                  // Direct order display
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{directOrderData.product.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {directOrderData.quantity || 1} x ${(directOrderData.product.sale_price || directOrderData.product.price).toFixed(2)}
                      </p>
                      {directOrderData.product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {directOrderData.product.sku}</p>
                      )}
                    </div>
                    <span>${((directOrderData.quantity || 1) * (directOrderData.product.sale_price || directOrderData.product.price)).toFixed(2)}</span>
                  </div>
                ) : (
                  // Cart items display
                  cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.product.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))
                )}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${directOrderData?.directOrder && directOrderData.product 
                      ? ((directOrderData.quantity || 1) * (directOrderData.product.sale_price || directOrderData.product.price)).toFixed(2)
                      : getSubtotal().toFixed(2)
                    }</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between mt-2 font-bold">
                    <span>Total</span>
                    <span>${directOrderData?.directOrder && directOrderData.product 
                      ? ((directOrderData.quantity || 1) * (directOrderData.product.sale_price || directOrderData.product.price)).toFixed(2)
                      : getTotal().toFixed(2)
                    }</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Checkout Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>
                  Enter your details to complete your order
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitOrder}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Full Name</Label>
                      <Input 
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input 
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input 
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress">Shipping Address</Label>
                    <Textarea 
                      id="shippingAddress"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      placeholder="Enter your full shipping address"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Delivery Date</Label>
                      <Input 
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Preferred Delivery Time</Label>
                      <Input 
                        id="preferredTime"
                        name="preferredTime"
                        type="time"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  {/* Notification Preferences */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-base font-medium">Order Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose how you'd like to receive updates about your order
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="smsNotifications"
                          name="notifications.sms"
                          checked={formData.notifications.sms}
                          onCheckedChange={(checked) => 
                            handleInputChange({
                              target: { 
                                name: 'notifications.sms', 
                                checked,
                                type: 'checkbox'
                              }
                            } as any)
                          }
                        />
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <Label 
                            htmlFor="smsNotifications" 
                            className="text-sm font-normal cursor-pointer"
                          >
                            Send SMS updates to my phone
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="emailNotifications"
                          name="notifications.email"
                          checked={formData.notifications.email}
                          onCheckedChange={(checked) => 
                            handleInputChange({
                              target: { 
                                name: 'notifications.email', 
                                checked,
                                type: 'checkbox'
                              }
                            } as any)
                          }
                        />
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Label 
                            htmlFor="emailNotifications" 
                            className="text-sm font-normal cursor-pointer"
                          >
                            Send email confirmations and updates
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      You'll receive order confirmations, shipping updates, and delivery notifications based on your preferences above.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;