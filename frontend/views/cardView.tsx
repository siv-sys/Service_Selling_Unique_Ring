import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Types
interface CartItem {
  id: number;
  ringId: number;
  ring_name: string;
  ring_identifier: string;
  material: string;
  price: number;
  size: string;
  image_url: string;
  quantity: number;
  addedAt: string;
}

interface UpsellItem {
  id: number;
  name: string;
  price: number;
  image: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Upsell items
  const upsellItems: UpsellItem[] = [
    {
      id: 5,
      name: 'Celestial Opal',
      price: 1290,
      image: 'https://img.kwcdn.com/product/open/2023-09-05/1693914328872-5ec4896063854249a6f2609cca8c9a22-goods.jpeg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp'
    },
    {
      id: 6,
      name: 'Vintage Marquise',
      price: 2100,
      image: 'https://i.pinimg.com/736x/0e/21/48/0e2148ac9639fa9f608f95c7584f4f98.jpg'
    },
    {
      id: 7,
      name: 'Art Deco Baguette',
      price: 1850,
      image: 'https://www.tajjewels.com/cdn/shop/products/19_FRONT_RoseGold_1080x.jpg?v=1650544247'
    },
    {
      id: 8,
      name: 'Sunburst Citrine',
      price: 890,
      image: 'https://img.kwcdn.com/product/fancy/d42a9fc0-5d2e-4728-a4fc-7edb6afb62b7.jpg'
    }
  ];

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load cart from backend on mount
  useEffect(() => {
    fetchCart();

    // Listen for cart updates from shop
    const handleCartUpdate = () => {
      console.log('Cart updated event received');
      fetchCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const sessionId = localStorage.getItem('sessionId') || 'guest';
      
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      console.log('Cart loaded from backend:', data);
      
      setCartItems(data.data || []);
      setCartCount(data.data?.length || 0);
    } catch (e) {
      console.error('Error loading cart:', e);
      showNotification('Error loading cart', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item quantity
  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const sessionId = localStorage.getItem('sessionId') || 'guest';
      
      const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
      
      await fetchCart(); // Refresh cart
      showNotification('Cart updated', 'success');
    } catch (e) {
      console.error('Error updating quantity:', e);
      showNotification('Error updating cart', 'error');
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: number) => {
    try {
      const sessionId = localStorage.getItem('sessionId') || 'guest';
      
      const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      
      await fetchCart(); // Refresh cart
      showNotification('Item removed from cart', 'success');
    } catch (e) {
      console.error('Error removing item:', e);
      showNotification('Error removing item', 'error');
    }
  };

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    showNotification('No new notifications', 'info');
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = 25;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  // Handle continue to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showNotification('Your cart is empty. Add some rings before checkout.', 'error');
      return;
    }
    navigate('/purchase');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
        <div className="flex items-center justify-center py-20">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Page heading + cart summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Review your items</span>
          <h1 className="heading-serif text-5xl font-light mt-2">
            Shopping cart <span className="text-primary">· {itemCount} {itemCount === 1 ? 'ring' : 'rings'}</span>
          </h1>
          <p className="text-slate-500 mt-2">
            {cartItems.length > 0 
              ? 'Complete your purchase to register the relationship.'
              : 'Add rings from the shop to start your collection.'}
          </p>
        </div>
        {cartItems.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Subtotal:</span>
            <span className="text-3xl font-bold text-primary">$ {subtotal.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Cart items grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT: cart items list */}
        <div className="lg:col-span-2 space-y-5">
          {cartItems.length === 0 ? (
            <div className="bg-background-light dark:bg-surface-dark/80 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">shopping_cart</span>
              <h3 className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-30">Your cart is empty</h3>
              <p className="text-slate-500 mb-6">Start adding some beautiful rings to your collection.</p>
              <Link 
                to="/shop" 
                className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/80 transition-all"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.id}
                className="cart-item bg-white dark:bg-surface-dark/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-5 transition-all hover:shadow-md"
              >
                <div className="sm:w-28 sm:h-28 rounded-xl bg-slate-100 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    className="w-full h-full object-cover" 
                    alt={item.ring_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{item.ring_name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>SKU: {item.ring_identifier}</span>
                      <span>Type: {item.material}</span>
                      <span>Size: {item.size}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-semibold text-primary">$ {item.price}</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">in stock</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ">
                    <div className="flex items-center border border-black dark:border-pink-60 rounded-full overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors text-slate-400"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors text-slate-400"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* continue shopping link */}
          <div className="pt-4 flex items-center gap-2 text-sm">
            <Link to="/shop" className="text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-lg text-primary">arrow_back</span> Continue shopping
            </Link>
          </div>
        </div>

        {/* RIGHT: order summary */}
        {cartItems.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
            {/* summary card */}
            <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium sticky top-28">
              <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-primary">shopping_cart</span> Order summary
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="text-slate-500">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-bold text-lg">$ {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-bold">$ {shipping}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="text-slate-500">Tax (est.)</span>
                  <span className="font-bold">$ {tax}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between text-lg text-primary font-bold">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">$ {total.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span> Includes lifetime warranty & certificate
              </p>
              <button 
                onClick={handleCheckout}
                className="w-full bg-primary text-white text-center py-4 rounded-2xl font-bold text-lg hover:bg-primary/80 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>Checkout</span>
                <span className="material-symbols-outlined">lock</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Pink Notification */}
      {notification && (
        <div 
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up-bottom
            ${notification.type === 'success' ? 'bg-primary' : notification.type === 'error' ? 'bg-red-500' : 'bg-primary'}
            text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 min-w-[280px] max-w-md`}
        >
          <span className="material-symbols-outlined text-sm">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <p className="text-sm font-medium flex-1">{notification.message}</p>
          <button 
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
            onClick={() => setNotification(null)}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Add animations */}
      <style>{`
        @keyframes slideUpBottom {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        
        @keyframes slideDownBottom {
          from {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          to {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
        }
        
        .animate-slide-up-bottom {
          animation: slideUpBottom 0.3s ease-out forwards;
        }
        
        .animate-slide-down-bottom {
          animation: slideDownBottom 0.3s ease-out forwards;
        }

        .loading-spinner {
          border: 3px solid rgba(255,42,162,0.1);
          border-top: 3px solid #ff2aa2;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
};

export default Cart;