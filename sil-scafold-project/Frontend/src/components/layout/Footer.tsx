import { Link } from 'react-router-dom';
import { 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  CreditCard,
  Shield,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'New Arrivals', href: '/products?new=true' },
        { label: 'Sale Items', href: '/products?sale=true' },
        { label: 'Gift Cards', href: '/gift-cards' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/returns' },
        { label: 'Size Guide', href: '/size-guide' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'My Account', href: '/profile' },
        { label: 'Order History', href: '/orders' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'Track Order', href: '/track-order' },
        { label: 'Address Book', href: '/addresses' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'Our Story', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
        { label: 'Sustainability', href: '/sustainability' },
        { label: 'Blog', href: '/blog' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders over $99' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure transactions' },
    { icon: CreditCard, title: 'Easy Returns', description: '30-day return policy' },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      {/* Features Section */}
      <div className="container-fluid py-12 border-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-4 p-6 rounded-lg bg-card hover:bg-accent/5 transition-colors">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-fluid py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EStore
              </span>
            </Link>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your premier destination for quality products at unbeatable prices. 
              We're committed to providing exceptional customer service and a seamless shopping experience.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>123 Commerce Street, Business District, City 12345</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>support@estore.com</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t bg-muted/50">
        <div className="container-fluid py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-bold text-2xl mb-2">Stay in the Loop</h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for exclusive deals, new product announcements, and style inspiration.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1"
                required
              />
              <Button type="submit" variant="default" className="btn-hover-lift">
                Subscribe
              </Button>
            </form>
            
            {/* Social Links */}
            <div className="flex justify-center space-x-4">
              {socialLinks.map((social, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  asChild
                  className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <a 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t bg-background">
        <div className="container-fluid py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p>&copy; {currentYear} EStore. All rights reserved.</p>
              <Separator orientation="vertical" className="hidden sm:block h-4" />
              <div className="flex items-center space-x-4">
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground mr-2">We accept:</span>
              <div className="flex items-center space-x-2 opacity-60">
                <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-xs font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-xs font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-xs font-bold">
                  AMEX
                </div>
                <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-xs font-bold">
                  PP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;