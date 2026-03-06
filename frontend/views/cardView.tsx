import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Types
interface CartItem {
  id: number;
  name: string;
  sku: string;
  type: string;
  material: string;
  size: string;
  ringId: string;
  price: number;
  quantity: number;
  image: string;
  inStock: boolean;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'Twin Souls Silver B',
      sku: 'TSS-002',
      type: 'Sterling Silver',
      material: 'Sterling Silver',
      size: '7',
      ringId: '#R784',
      price: 899,
      quantity: 1,
      image: 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900',
      inStock: true
    },
    {
      id: 2,
      name: 'Midnight Sapphire',
      sku: 'MS-119',
      type: 'Platinum',
      material: 'Platinum',
      size: '8.5',
      ringId: '#R932',
      price: 1450,
      quantity: 2,
      image: 'https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225',
      inStock: true
    },
    {
      id: 3,
      name: 'Rose Pavé Morganite',
      sku: 'RPM-22',
      type: 'Rose gold',
      material: 'Rose gold',
      size: '6.5',
      ringId: '#R105',
      price: 1090,
      quantity: 1,
      image: 'https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938',
      inStock: true
    },
    {
      id: 4,
      name: 'Platinum Solitaire',
      sku: 'PS-88',
      type: 'Platinum',
      material: 'Platinum',
      size: '9',
      ringId: '#R421',
      price: 797,
      quantity: 1,
      image: 'https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg',
      inStock: true
    }
  ]);

  const [cartCount, setCartCount] = useState<number>(4);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

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

  // Update cart count in localStorage and dispatch event
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
      
      // Dispatch event for header to update
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

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
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + shipping + tax;

  // Handle quantity change
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Handle remove item
  const removeItem = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Handle continue to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add some rings before checkout.');
      return;
    }
    navigate('/purchase');
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Page heading + cart summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Review your items</span>
          <h1 className="heading-serif text-5xl font-light mt-2">
            Shopping cart <span className="text-primary">· {itemCount} {itemCount === 1 ? 'ring' : 'rings'}</span>
          </h1>
          <p className="text-slate-500 mt-2">Complete your purchase to register the relationship.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Subtotal:</span>
          <span className="text-3xl font-bold text-primary" id="cart-total">$ {subtotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Cart items grid (all rings after add to cart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT: cart items list (2/3 width) */}
        <div className="lg:col-span-2 space-y-5">
          {cartItems.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark/80 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">shopping_cart</span>
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
                    src={item.image} 
                    className="w-full h-full object-cover" 
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&fit=crop';
                    }}
                  />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>SKU: {item.sku}</span>
                      <span>Type: {item.type}</span>
                      <span>Size: {item.size}</span>
                      <span>Ring ID: {item.ringId}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-semibold text-primary">$ {item.price}</span>
                      {item.inStock && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">in stock</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-full">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors"
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
              <span className="material-symbols-outlined text-lg">arrow_back</span> Continue shopping
            </Link>
          </div>
        </div>

        {/* RIGHT: order summary + relationship preview */}
        <div className="lg:col-span-1 space-y-6">
          {/* summary card */}
          <div className="bg-white dark:bg-surface-dark/80 rounded-3xl p-8 border border-primary/10 shadow-premium sticky top-28">
            <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_cart</span> Order summary
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="font-bold">$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="font-bold">$ {shipping}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax (est.)</span>
                <span className="font-bold">$ {tax}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">$ {total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span> Includes lifetime warranty & certificate
            </p>
            <button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`w-full bg-primary text-white text-center py-4 rounded-2xl font-bold text-lg hover:bg-primary/80 transition-all shadow-lg flex items-center justify-center gap-2 ${
                cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>Checkout</span>
              <span className="material-symbols-outlined">lock</span>
            </button>
            <div className="mt-6 p-4 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">favorite</span>
                <span className="text-xs font-medium">Your relationship will be verified after purchase.</span>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Ring stock decreases</span>
                <span>✓</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Couple profile generated</span>
                <span>✓</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Duplicate protection</span>
                <span>✓</span>
              </div>
            </div>
          </div>
          {/* help card */}
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-primary/10">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">help</span> Need help?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Contact our bond concierge at <span className="text-primary">support@bondkeeper.com</span>
            </p>
          </div>
        </div>
      </div>

      {/* You may also like (upsell) */}
      {cartItems.length > 0 && (
        <section className="mt-20 border-t border-primary/10 pt-12">
          <h3 className="heading-serif text-3xl font-light mb-8 flex items-center gap-4">
            <span className="w-12 h-px bg-primary/30"></span> You may also like
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {upsellItems.map((item) => (
              <Link 
                key={item.id} 
                to="/shop"
                onClick={() => {
                  // You could add to cart functionality here
                  alert(`${item.name} added to cart!`);
                }}
                className="group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop';
                    }}
                  />
                </div>
                <p className="mt-2 font-medium">{item.name}</p>
                <p className="text-primary text-sm">$ {item.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default Cart;