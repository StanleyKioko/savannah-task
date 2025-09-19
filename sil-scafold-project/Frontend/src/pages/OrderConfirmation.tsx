import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { productAPI } from '@/lib/productApi';
import { Order } from '@/types';

interface NotificationStatus {
  sms: boolean;
  email: boolean;
}

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (orderId === 'success') {
          // Handle the case where we don't have the order ID but know it was successful
          setLoading(false);
          return;
        }
        
        // Try to fetch the order details if we have an ID
        if (orderId && orderId !== 'success') {
          const data = await productAPI.getOrder(parseInt(orderId)) as Order;
          setOrder(data);
          
          // Fetch notification status
          try {
            const notificationData = await productAPI.getOrderNotificationStatus(parseInt(orderId)) as NotificationStatus;
            setNotificationStatus(notificationData);
            
            // Update order with notification status
            setOrder(prevOrder => {
              if (prevOrder) {
                return {
                  ...prevOrder,
                  notifications: notificationData
                };
              }
              return prevOrder;
            });
          } catch (notificationErr) {
            console.warn('Could not fetch notification status:', notificationErr);
            // Set default notification status if the endpoint fails
            setNotificationStatus({ sms: false, email: true });
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to load order details. The order was processed successfully.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  return (
    <>
      <Helmet>
        <title>Order Confirmation - Thank You!</title>
        <meta name="description" content="Your order has been successfully placed." />
      </Helmet>
      
      <div className="container-fluid py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-fit">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">Thank You for Your Order!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Your order {orderId !== 'success' ? `#${orderId}` : ''} has been successfully placed.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">{error}</p>
                </div>
              ) : (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Order Information</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Order ID: {orderId}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Date: {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: Processing
                    </p>
                  </div>
                  
                  {order && (
                    <>
                      <div>
                        <h3 className="font-semibold mb-2">Order Summary</h3>
                        <div className="space-y-2">
                          {order.items && order.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <div>
                                <span className="font-medium">{item.product.name}</span>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} x ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <span>${(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span>Shipping</span>
                            <span>{order.shipping > 0 ? `$${order.shipping.toFixed(2)}` : 'Free'}</span>
                          </div>
                          <div className="flex justify-between mt-2 font-bold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {order.shipping_address && (
                        <div>
                          <h3 className="font-semibold mb-2">Shipping Information</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {typeof order.shipping_address === 'string' 
                              ? order.shipping_address 
                              : JSON.stringify(order.shipping_address)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm">
                      We've sent a confirmation email with all the details of your order.
                      You will receive updates on your order status via email.
                    </p>
                  </div>
                  
                  {order && order.notifications && (
                    <div className="p-4 rounded-lg border border-border">
                      <h3 className="font-semibold mb-3">Notifications Sent</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                            order.notifications.email ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {order.notifications.email ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">×</span>
                            )}
                          </div>
                          <span className="text-sm">
                            {order.notifications.email 
                              ? 'Confirmation email sent successfully' 
                              : 'Email notification delivery pending'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                            order.notifications.sms ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {order.notifications.sms ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">!</span>
                            )}
                          </div>
                          <span className="text-sm">
                            {order.notifications.sms 
                              ? 'SMS confirmation sent to your phone' 
                              : 'SMS notification not available in test mode'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link to="/products">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              <Button asChild>
                <Link to="/profile">
                  <Package className="mr-2 h-4 w-4" />
                  View My Orders
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmation;