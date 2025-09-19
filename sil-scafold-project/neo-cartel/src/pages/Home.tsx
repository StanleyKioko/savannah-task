import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/ProductCard';
import { Product, Category } from '@/types';

const mockFeaturedProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
    short_description: 'Premium wireless headphones with noise cancellation',
    sku: 'WH-001',
    price: 299.99,
    sale_price: 249.99,
    category: { id: '1', name: 'Electronics', slug: 'electronics' } as Category,
    categories: [],
    images: [{ id: '1', image: '/placeholder.svg', alt_text: 'Wireless Headphones', is_primary: true, sort_order: 1 }],
    featured_image: '/placeholder.svg',
    in_stock: true,
    stock_quantity: 50,
    attributes: [],
    rating: 4.8,
    review_count: 324,
    is_featured: true,
    is_digital: false,
    tags: ['electronics', 'audio', 'wireless'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracking with heart rate monitoring and GPS.',
    short_description: 'Smart fitness watch with health monitoring',
    sku: 'FW-002',
    price: 199.99,
    category: { id: '1', name: 'Electronics', slug: 'electronics' } as Category,
    categories: [],
    images: [{ id: '2', image: '/placeholder.svg', alt_text: 'Fitness Watch', is_primary: true, sort_order: 1 }],
    featured_image: '/placeholder.svg',
    in_stock: true,
    stock_quantity: 25,
    attributes: [],
    rating: 4.6,
    review_count: 198,
    is_featured: true,
    is_digital: false,
    tags: ['electronics', 'fitness', 'wearable'],
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
  },
];

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets and electronic devices',
    image: '/placeholder.svg',
    product_count: 156,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel for all occasions',
    image: '/placeholder.svg',
    product_count: 289,
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Everything for your home and garden',
    image: '/placeholder.svg',
    product_count: 178,
    is_active: true,
    sort_order: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '4',
    name: 'Sports',
    slug: 'sports',
    description: 'Sports equipment and accessories',
    image: '/placeholder.svg',
    product_count: 134,
    is_active: true,
    sort_order: 4,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setFeaturedProducts(mockFeaturedProducts);
      setCategories(mockCategories);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { icon: Users, label: 'Happy Customers', value: '50,000+' },
    { icon: ShoppingBag, label: 'Products Sold', value: '1M+' },
    { icon: Award, label: 'Awards Won', value: '25' },
    { icon: TrendingUp, label: 'Years Experience', value: '10' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container-fluid py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  🚀 New Collection Available
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Discover Amazing
                  <span className="block text-accent"> Products</span>
                </h1>
                <p className="text-xl text-white/90 max-w-lg">
                  Shop the latest trends with unbeatable prices and exceptional quality. 
                  Your satisfaction is our priority.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="accent" size="xl" className="btn-hover-lift">
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link to="/categories">
                    Browse Categories
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative animate-scale-in">
              <div className="aspect-square rounded-2xl gradient-card p-8 shadow-2xl">
                <div className="h-full bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center space-y-4">
                    <ShoppingBag className="w-24 h-24 mx-auto text-white" />
                    <h3 className="text-2xl font-bold">Premium Shopping Experience</h3>
                    <p className="text-white/80">Quality products, fast shipping, excellent service</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-foreground">4.9/5</div>
                    <div className="text-sm text-muted-foreground">Customer Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-fluid">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto gradient-primary rounded-full flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Link key={category.id} to={`/categories/${category.slug}`}>
                  <Card className="product-card group cursor-pointer border-0 shadow-sm hover:shadow-lg">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={category.image || '/placeholder.svg'}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <Badge className="bg-white/20 text-white border-white/30">
                          {category.product_count} products
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-fluid">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-muted-foreground text-lg">
                Hand-picked products that our customers love most
              </p>
            </div>
            <Button asChild variant="outline" className="hidden lg:flex">
              <Link to="/products?featured=true">
                View All Featured
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} variant="featured" />
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8 lg:hidden">
                <Button asChild variant="outline">
                  <Link to="/products?featured=true">
                    View All Featured
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container-fluid text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">Stay Updated</h2>
            <p className="text-xl text-white/90">
              Be the first to know about new products, exclusive deals, and special offers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Button variant="accent" className="px-8">
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-white/70">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;