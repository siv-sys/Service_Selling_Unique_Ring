import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import { getUserScopedLocalStorageItem } from '../lib/userStorage';
import HistoryModal from './HistoryModal';

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

const Cart: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const getSessionId = () => {
    return getUserScopedLocalStorageItem('sessionId') || 'guest';
  };

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
      const sessionId = getSessionId();
      
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
      const sessionId = getSessionId();
      
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
      const sessionId = getSessionId();
      
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

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = 25;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  // Handle continue to checkout - navigate to purchase page
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showNotification('Your cart is empty. Add some rings before checkout.', 'error');
      return;
    }
    // Store cart items for purchase page
    sessionStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    sessionStorage.setItem('checkoutTotal', total.toString());
    navigate('/purchase');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
        <HistoryModal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setIsHistoryModalOpen(false)} 
        />
        <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
                <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
                <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
                <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
                <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
                <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
                <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => setIsHistoryModalOpen(true)} className="relative text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors group">
                <span className="material-symbols-outlined">history</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              </button>
              <button onClick={toggleDarkMode} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <Link to="/cart" className="relative">
                <button className="text-charcoal/60 hover:text-primary">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </button>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-3 pl-2 border-l border-primary/20">
                <span className="text-sm font-medium hidden sm:inline">Alex & Jamie</span>
                <Link to="/profile">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="loading-spinner mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
              <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsHistoryModalOpen(true)} className="relative text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined">history</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </button>
            <button onClick={toggleDarkMode} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/cart" className="relative">
              <button className="text-charcoal/60 hover:text-primary">
                <span className="material-symbols-outlined">shopping_cart</span>
              </button>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 pl-2 border-l border-primary/20">
              <span className="text-sm font-medium hidden sm:inline">Alex & Jamie</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page heading + cart summary */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Review your items</span>
            <h1 className="heading-serif text-5xl font-light mt-2 text-pink-500 dark:text-pink-400">
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
              <div className="bg-white dark:bg-surface-dark/80 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-6xl text-pink-500 mb-4">shopping_cart</span>
                <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
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
                      <h3 className="font-bold text-lg text-pink-500 dark:text-pink-400">{item.ring_name}</h3>
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full text-sm text-slate-800">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors text-lg text-black-500 dark:text-white-500"
                        >
                          −
                        </button  >
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors text-lg text-black-500 dark:text-white-500"
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
              <Link to="/shop" className="text-primary hover:underline flex items-center gap-1 text-sm text-pink-500 dark:text-pink-400">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Continue shopping
              </Link>
            </div>
          </div>

          {/* RIGHT: order summary */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1 space-y-6">
              {/* summary card */}
              <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium sticky top-28">
                <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2 text-pink-500 dark:text-pink-400">
                  <span className="material-symbols-outlined text-pink-500 dark:text-pink-400">shopping_cart</span> Order summary
                </h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm text-yellow-500 mb-2">
                    <span className="text-pink-500">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold">$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-500 mb-2">
                    <span className="text-pink-500">Shipping</span>
                    <span className="font-bold">$ {shipping}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-500 mb-4">
                    <span className="text-pink-500">Tax (est.)</span>
                    <span className="font-bold">$ {tax}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between text-lg text-pink-900 dark:text-pink-400">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">$ {total.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span> Includes lifetime warranty & certificate
                </p>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-pink-500  text-center py-4 rounded-2xl font-bold text-lg hover:bg-pink-600 transition-all shadow-lg flex items-center justify-center gap-2 text-white-50"
                >
                  <span>Checkout</span>
                  <span className="material-symbols-outlined">lock</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

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

      {/* FOOTER */}
                 <footer className="bg-white dark:bg-black  border-t border-primary/10 pt-20 pb-10 mt-20">
                   <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                     <div className="col-span-1 md:col-span-1">
                       <div className="flex items-center gap-2 mb-6">
                         <span className="material-symbols-outlined text-primary">diamond</span>
                         <h2 className="text-lg font-extrabold tracking-widest uppercase text-pink-300 dark:text-pink-300">BondKeeper</h2>
                       </div>
                       <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Eternal rings, eternal story. Crafted for bonds that last beyond time.</p>
                       <div className="flex gap-4">
                         <a className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all" href="#">
                           <span className="material-symbols-outlined text-lg">share</span>
                         </a>
                       </div>
                     </div>
                     <div>
                       <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-pink-400 dark:text-pink-300">Experience</h4>
                       <ul className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-400">
                         <li><Link to="/shop" className="hover:text-primary transition-colors">Our Showroom</Link></li>
                         <li><Link to="/bespoke" className="hover:text-primary transition-colors">Bespoke Design</Link></li>
                         <li><Link to="/consultation" className="hover:text-primary transition-colors">Book Consultation</Link></li>
                         <li><Link to="/diamond-guide" className="hover:text-primary transition-colors">Diamond Guide</Link></li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-pink-400 dark:text-pink-300">Support</h4>
                       <ul className="flex flex-col gap-4 text-sm">
                         <li><Link to="/sizing" className="hover:text-primary transition-colors">Ring Sizing</Link></li>
                         <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
                         <li><Link to="/warranty" className="hover:text-primary transition-colors">Lifetime Warranty</Link></li>
                         <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
                       </ul>
                     </div>
                     <div>
                       <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-pink-400 dark:text-pink-300">Mailing List</h4>
                       <p className="text-sm text-slate-500 mb-4">Be the first to hear about new collections.</p>
                       <div className="flex gap-2">
                         <input className="flex-1 bg-slate-50 dark:bg-slate-80 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="Email address" type="email"/>
                         <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest text-pink-400 dark:text-pink-300">Join</button>
                       </div>
                     </div>
                   </div>
                   <div className="max-w-7xl mx-auto px-6 border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                     <p className="text-xs text-slate-400">© 2025 BondKeeper · Eternal Rings. All Rights Reserved.</p>
                     <div className="flex gap-6 text-xs text-slate-400 uppercase tracking-widest">
                       <Link to="/privacy" className="hover:text-primary text-pink-400 dark:text-pink-300">Privacy</Link>
                       <Link to="/terms" className="hover:text-primary text-pink-400 dark:text-pink-300">Terms</Link>
                     </div>
                   </div>
                 </footer>
           

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
    </div>
  );
};

export default Cart;
