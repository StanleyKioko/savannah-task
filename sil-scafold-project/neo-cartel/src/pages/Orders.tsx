import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, MapPin, DollarSign } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

const Orders = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const orders: Order[] = [
    {
      id: 1,
      order_number: 'ORD-001',
      status: 'delivered',
      total_amount: 75.50,
      created_at: '2025-09-15T10:30:00Z',
      items: [
        { id: 1, product_name: 'Bread Bun', quantity: 2, price: 12.50 },
        { id: 2, product_name: 'Chocolate Cookie', quantity: 5, price: 8.00 }
      ],
      shipping_address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip_code: '12345'
      }
    }
  ];

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Orders</h1>
          <p className="text-gray-600 mb-6">Please log in to view your orders.</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">When you place your first order, it will appear here.</p>
          <Button onClick={() => navigate('/products')}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      Order #{order.order_number}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-3">Items Ordered</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{order.shipping_address.street}</p>
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  )}
                  {(order.status === 'pending' || order.status === 'processing') && (
                    <Button variant="outline" size="sm">
                      Track Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;