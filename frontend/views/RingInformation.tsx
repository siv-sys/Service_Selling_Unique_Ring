import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RingData {
  name: string;
  price: number;
  metal: string;
  cert: string;
  img: string;
  isNew?: boolean;
  sku?: string;
  size?: string;
  ringId?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const MyRingView: React.FC = () => {
  const navigate = useNavigate();
  const [ringData, setRingData] = useState<RingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedMetal, setSelectedMetal] = useState<string>('18k White Gold');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load cart count
  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Fetch cart count from backend
  const fetchCartCount = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) return;
      
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          'x-session-id': sessionId
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.data?.length || 0);
      }
    } catch (e) {
      console.error('Error fetching cart count:', e);
    }
  };

  useEffect(() => {
    try {
      // Retrieve ring data from sessionStorage (set by shop page "See More" button)
      const storedRing = sessionStorage.getItem('currentRing');
      
      if (!storedRing) {
        setRingData(null);
        setLoading(false);
        return;
      }

      const parsedRing = JSON.parse(storedRing);
      setRingData(parsedRing);
      setSelectedMetal(parsedRing.metal || '18k White Gold');
      setLoading(false);
    } catch (error) {
      console.error('Error parsing ring data', error);
      setLoading(false);
    }
  }, []);

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
    showBottomNotification('No new notifications', 'info');
  };

  // Add to cart function with backend API
  const addToCart = async () => {
    if (!ringData) return;
    
    try {
      // Get existing session ID or null
      let sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'x-session-id': sessionId })
        },
        body: JSON.stringify({
          ringId: ringData.id || Date.now(),
          quantity: 1,
          size: selectedSize || ringData.size || '7',
          material: selectedMetal || ringData.metal
        })
      });
      
      const data = await response.json();
      console.log('Add to cart response:', data);
      
      if (response.ok) {
        // Save the session ID from server if it's new
        if (data.sessionId && !sessionId) {
          localStorage.setItem('sessionId', data.sessionId);
        }
        
        // Update cart count
        setCartCount(data.data.length);
        
        // Show success notification
        showBottomNotification(`${ringData.name} added to cart!`, 'success');
        
        // Dispatch event for header and cart page to update
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        throw new Error(data.message || 'Failed to add to cart');
      }
    } catch (e) {
      console.error('Error adding to cart:', e);
      showBottomNotification('Error adding to cart', 'error');
    }
  };

  // Small bottom notification function
  const showBottomNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-up-bottom';
    
    let bgColor = 'bg-[#ff2aa2]';
    if (type === 'error') bgColor = 'bg-red-500';
    else if (type === 'info') bgColor = 'bg-blue-500';
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    
    notification.innerHTML = `
      <div class="${bgColor} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 min-w-[240px] max-w-sm text-sm">
        <span class="material-symbols-outlined text-sm">${icon}</span>
        <span class="flex-1">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slide-down-bottom 0.2s ease-out forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 200);
      }
    }, 2000);
  };

  // Handle book consultation
  const handleBookConsultation = () => {
    navigate('/purchase');
  };

  // Helper function to get stone details based on certification
  const getStoneCarats = (cert: string): string => {
    const certLower = cert.toLowerCase();
    if (certLower.includes('diamond')) return '2.0 Carats';
    if (certLower.includes('sapphire')) return '1.8 Carats';
    if (certLower.includes('opal')) return '1.5 Carats';
    return 'Certified';
  };

  // Helper function to get material details
  const getMaterialDetail = (metal: string): string => {
    if (metal.includes('Platinum')) return 'Rare & Precious';
    if (metal.includes('Gold')) return 'Sustainably Sourced';
    return 'Premium Quality';
  };

  // Helper function to get certification details
  const getCertDetail = (cert: string): string => {
    return cert.includes('GIA') ? 'Internationally Certified' : 'Authenticity Guaranteed';
  };

  // Generate story text based on ring data
  const getStoryText = (): { main: string; detail: string } => {
    if (!ringData) return { main: '', detail: '' };
    
    const nameLower = ringData.name.toLowerCase();
    const certLower = ringData.cert.toLowerCase();

    if (nameLower.includes('halo') || nameLower.includes('diamond') || certLower.includes('diamond')) {
      return {
        main: `The ${ringData.name} features a breathtaking center ${ringData.cert}, selected for its exceptional brilliance and fire. The 'Ideal Brilliant' cut ensures that every facet captures and reflects light in a celestial dance.`,
        detail: `Set in ${ringData.metal}, this piece symbolizes a love that is both enduring and luminous.`
      };
    } else if (nameLower.includes('sapphire') || certLower.includes('sapphire')) {
      return {
        main: `The ${ringData.name} showcases a rare ${ringData.cert}, prized for its deep blue hue and exceptional clarity.`,
        detail: `Crafted in ${ringData.metal}, this piece embodies timeless elegance and sophisticated charm.`
      };
    } else if (nameLower.includes('opal') || certLower.includes('opal')) {
      return {
        main: `The ${ringData.name} features a mesmerizing ${ringData.cert} that displays a play of colors, each stone unique as a fingerprint.`,
        detail: `Mounted in ${ringData.metal}, this ring captures the ethereal beauty of nature.`
      };
    } else {
      return {
        main: `The ${ringData.name} is a masterpiece of modern romance. Each curve of the ${ringData.metal} band is meticulously handcrafted by our master artisans.`,
        detail: `The ${ringData.cert} at its center is certified for its exceptional quality.`
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
        {/* Navbar */}
        <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
                <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
                <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/shop" className="text-primary border-b border-primary/40 pb-1">Couple Shop</Link>
                <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
                <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={handleNotificationClick} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications_none</span>
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

        {/* Loading spinner */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading ring details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ringData) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
        {/* Navbar */}
        <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
                <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
                <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/shop" className="text-primary border-b border-primary/40 pb-1">Couple Shop</Link>
                <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
                <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={handleNotificationClick} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications_none</span>
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

        {/* No ring message */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center p-12 max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl shadow-2xl">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">dangerous</span>
            <h1 className="text-2xl font-bold mb-4 text-slate-900 text-black">No Ring Selected</h1>
            <p className="mb-8 text-slate-600 dark:text-slate-400">Please select a ring from the Eternal Rings catalog first.</p>
            <Link 
              to="/shop" 
              className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-all inline-block font-bold"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const story = getStoryText();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="text-primary border-b border-primary/40 pb-1">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleNotificationClick} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications_none</span>
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
        {/* BREADCRUMBS */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/shop" className="hover:text-primary">back to shop</Link>
          <span className="material-symbols-outlined text-xs">chevron_left</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">{ringData.name}</span>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-6">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-4 order-last md:order-first">
              <div className="size-20 rounded-lg overflow-hidden border-2 border-primary cursor-pointer">
                <img className="w-full h-full object-cover" src={ringData.img} alt="thumb main" />
              </div>
              <div className="size-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-pointer">
                <img className="w-full h-full object-cover" src="https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225" alt="alternate angle" />
              </div>
              <div className="size-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-pointer">
                <img className="w-full h-full object-cover" src="https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938" alt="detail" />
              </div>
              <div className="size-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-pointer flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <span className="material-symbols-outlined text-3xl text-primary">360</span>
              </div>
            </div>
            {/* Main image */}
            <div className="flex-1 rounded-xl overflow-hidden aspect-[4/5] bg-white dark:bg-slate-800 border border-primary/5 shadow-xl shadow-primary/5">
              <img className="w-full h-full object-cover" src={ringData.img || 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900'} alt={ringData.name} />
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="sticky top-32">
              <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">
                BondKeeper · Eternal
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-pink-90 text-pink mb-4 leading-tight">
                {ringData.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex text-primary">
                  <span className="material-symbols-outlined">star</span>
                  <span className="material-symbols-outlined">star</span>
                  <span className="material-symbols-outlined">star</span>
                  <span className="material-symbols-outlined">star</span>
                  <span className="material-symbols-outlined">star_half</span>
                </div>
                <span className="text-sm text-slate-500 font-medium">(124 Reviews)</span>
              </div>
              
              <p className="text-3xl font-extrabold text-primary mb-8 tracking-tight">
                ${ringData.price.toLocaleString()}
              </p>
              
              <div className="space-y-8">
                {/* Metal selection */}
                <div>
                  <span className="text-sm font-bold text-pink-90 text-pink mb-4 block uppercase tracking-wider">
                    Metal / Material
                  </span>
                  <div className="flex gap-4 flex-wrap">
                    <button 
                      onClick={() => setSelectedMetal(ringData.metal)}
                      className={`px-6 py-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        selectedMetal === ringData.metal 
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                      }`}
                    >
                      <div className="size-4 rounded-full bg-slate-300 border border-slate-400"></div>
                      <span className="text-sm font-bold">{ringData.metal}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedMetal('Yellow Gold')}
                      className={`px-6 py-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        selectedMetal === 'Yellow Gold'
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                      }`}
                    >
                      <div className="size-4 rounded-full bg-yellow-400 border border-yellow-500"></div>
                      <span className="text-sm font-bold">Yellow Gold</span>
                    </button>
                    <button 
                      onClick={() => setSelectedMetal('Rose Gold')}
                      className={`px-6 py-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        selectedMetal === 'Rose Gold'
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                      }`}
                    >
                      <div className="size-4 rounded-full bg-amber-100 border border-amber-300"></div>
                      <span className="text-sm font-bold">Rose Gold</span>
                    </button>
                  </div>
                </div>
                
                {/* Size selection */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-pink-90 text-pink uppercase tracking-wider">
                      Ring Size (US)
                    </span>
                    <button className="text-xs font-bold text-primary underline underline-offset-4">
                      Size Guide
                    </button>
                  </div>
                  <select 
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full bg-transparent border-slate-200 dark:border-slate-800 rounded-lg py-3 focus:ring-primary focus:border-primary font-medium"
                  >
                    <option value="">Select Size</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={addToCart}
                    className="w-full py-5 bg-primary text-white font-black text-lg rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined">shopping_cart</span> 
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBookConsultation}
                    className="w-full py-5 border-2 border-primary text-primary font-black text-lg rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined">calendar_month</span> 
                    Book Consultation
                  </button>
                </div>
                
                {/* Highlights */}
                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                      Lifetime Warranty
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                      Insured Overnight
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Story */}
        <div className="mt-32 space-y-24">
          {/* Specs Grid */}
          <section>
            <h3 className="text-2xl font-black mb-12 flex items-center gap-4">
              Product Specifications
              <div className="h-px flex-1 bg-primary/10"></div>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="p-8 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs font-bold text-primary uppercase mb-2 block">Stone / Cert</span>
                <p className="text-xl font-bold">
                  {ringData.cert.split(' ').slice(0,2).join(' ') || ringData.cert}
                </p>
                <p className="text-sm text-slate-500 mt-1">{getStoneCarats(ringData.cert)}</p>
              </div>
              <div className="p-8 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs font-bold text-primary uppercase mb-2 block">Material</span>
                <p className="text-xl font-bold">{ringData.metal}</p>
                <p className="text-sm text-slate-500 mt-1">{getMaterialDetail(ringData.metal)}</p>
              </div>
              <div className="p-8 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs font-bold text-primary uppercase mb-2 block">Certification</span>
                <p className="text-xl font-bold">{ringData.cert}</p>
                <p className="text-sm text-slate-500 mt-1">{getCertDetail(ringData.cert)}</p>
              </div>
              <div className="p-8 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs font-bold text-primary uppercase mb-2 block">Collection</span>
                <p className="text-xl font-bold">{ringData.isNew ? 'New Arrival' : 'Signature Piece'}</p>
                <p className="text-sm text-slate-500 mt-1">{ringData.isNew ? '2024 Collection' : 'Timeless Classic'}</p>
              </div>
            </div>
          </section>

          {/* Story - Now using the ring's own image */}
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h3 className="text-4xl font-black mb-8">The Story</h3>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-6 leading-relaxed text-lg">
                <p>{story.main}</p>
                <p className="font-medium text-primary/80">{story.detail}</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video shadow-2xl relative">
              <img 
                className="w-full h-full object-cover" 
                src={ringData.img || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                alt={ringData.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              <div className="absolute bottom-8 left-8">
                <p className="text-white font-bold text-xl">Handcrafted Excellence</p>
                <p className="text-white/80 text-sm">Paris, France Atelier</p>
              </div>
            </div>
          </div>

          {/* Shipping & Returns */}
          <section className="border-t border-slate-200 dark:border-slate-800 pt-24">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
                  <h4 className="text-xl font-bold">Shipping & Presentation</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Your Lumière creation arrives in a signature velvet-lined mahogany box, protected by discreet, fully insured overnight shipping.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">assignment_return</span>
                  <h4 className="text-xl font-bold">Returns & Exchanges</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  If you are not completely enchanted, we offer a 30-day bespoke return policy.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
            <footer className="bg-white dark:bg-black/10 border-t border-primary/10 pt-20 pb-10 mt-20">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary">diamond</span>
                    <h2 className="text-lg font-extrabold tracking-widest uppercase">Lumina Luxe</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Redefining luxury through ethical craftsmanship and timeless design. Every ring tells a story.</p>
                  <div className="flex gap-4">
                    <a className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all" href="#">
                      <span className="material-symbols-outlined text-lg">share</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Experience</h4>
                  <ul className="flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <li><Link to="/shop" className="hover:text-primary transition-colors">Our Showroom</Link></li>
                    <li><Link to="/bespoke" className="hover:text-primary transition-colors">Bespoke Design</Link></li>
                    <li><Link to="/consultation" className="hover:text-primary transition-colors">Book Consultation</Link></li>
                    <li><Link to="/diamond-guide" className="hover:text-primary transition-colors">Diamond Guide</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Support</h4>
                  <ul className="flex flex-col gap-4 text-sm">
                    <li><Link to="/sizing" className="hover:text-primary transition-colors">Ring Sizing</Link></li>
                    <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
                    <li><Link to="/warranty" className="hover:text-primary transition-colors">Lifetime Warranty</Link></li>
                    <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-6">Mailing List</h4>
                  <p className="text-sm text-slate-500 mb-4">Be the first to hear about new collections.</p>
                  <div className="flex gap-2">
                    <input className="flex-1 bg-pink-50 bg-slate-80 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="Email address" type="email"/>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest">Join</button>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-6 border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-400">© 2025 BondKeeper · Eternal Rings. All Rights Reserved.</p>
                <div className="flex gap-6 text-xs text-slate-400 uppercase tracking-widest">
                  <Link to="/privacy" className="hover:text-primary">Privacy</Link>
                  <Link to="/terms" className="hover:text-primary">Terms</Link>
                </div>
              </div>
            </footer>

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
    </div>
  );
};

export default MyRingView;