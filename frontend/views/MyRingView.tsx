import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RingData {
  ring_name?: string;
  name?: string;
  ring_identifier?: string;
  identifier?: string;
  model_image?: string;
  image_url?: string;
  img?: string;
  material?: string;
  price?: number;
  size?: string;
  status?: string;
  model_name?: string;
  collection_name?: string;
  created_at?: string;
}

const RingInformation: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [ringData, setRingData] = useState<RingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [coupleName, setCoupleName] = useState<string>('Alex & Jamie');
  const [cartCount, setCartCount] = useState<number>(0);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

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

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // Load ring data on page load
  useEffect(() => {
    loadRingData();
  }, []);

  const loadRingData = async () => {
    showLoading();
    
    try {
      // Try to get from sessionStorage first (from shop)
      const storedRing = sessionStorage.getItem('currentRing');
      
      if (storedRing) {
        const ring = JSON.parse(storedRing);
        displayRingData(ring);
        hideLoading();
        return;
      }
      
      // If no ring in sessionStorage, fetch from API
      // In a real app, you would get the user's owned ring ID from their profile
      const ringId = 1; // Default to first ring for demo
      
      const response = await fetch(`${API_BASE_URL}/rings/${ringId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        displayRingData(data.data);
      } else {
        throw new Error('Ring not found');
      }
      
    } catch (error) {
      console.error('Error loading ring:', error);
      showError(error instanceof Error ? error.message : 'Failed to load ring data');
    }
  };

  const displayRingData = (ring: any) => {
    setRingData(ring);
    setLoading(false);
  };

  const showLoading = () => {
    setLoading(true);
    setError(null);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const showError = (message: string) => {
    setError(message);
    setLoading(false);
  };

  // Show notification function
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

  // Handle category tag click
  const handleCategoryClick = (tag: string) => {
    console.log('Category clicked:', tag);
    showNotification(`Browsing ${tag} rings`, 'info');
    // Navigate to shop with filter
    navigate(`/shop?filter=${encodeURIComponent(tag)}`);
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate random values for demo
  const getCompletionDate = (createdAt?: string): Date => {
    const date = createdAt ? new Date(createdAt) : new Date();
    date.setMonth(date.getMonth() + 2);
    return date;
  };

  const getWorkshopNumber = (): number => Math.floor(Math.random() * 10) + 1;
  const getCertNumber = (): number => Math.floor(Math.random() * 9000) + 1000;
  const getEditionNumber = (): number => Math.floor(Math.random() * 50) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-charcoal">
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
                <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
                <Link to="/myring" className="text-primary border-b border-primary/40 pb-1">My Ring</Link>
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
                <span className="text-sm font-medium hidden sm:inline">{coupleName}</span>
                <Link to="/profile">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading your ring information...</span>
        </div>
      </div>
    );
  }

  if (error || !ringData) {
    return (
      <div className="min-h-screen bg-cream dark:bg-charcoal">
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
                <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
                <Link to="/myring" className="text-primary border-b border-primary/40 pb-1">My Ring</Link>
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
                <span className="text-sm font-medium hidden sm:inline">{coupleName}</span>
                <Link to="/profile">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Error State */}
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
          <p className="text-red-500 mb-4">{error || 'Failed to load ring data'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
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
      </div>
    );
  }

  // Derived data
  const ringName = ringData.ring_name || ringData.name || 'Eternal Promise';
  const ringIdentifier = ringData.ring_identifier || ringData.identifier || 'BK-EP-2024-001';
  const ringImage = ringData.model_image || ringData.image_url || ringData.img || 'https://www.loville.co/cdn/shop/products/CPR5013FANTASY-1_600x600.jpg?v=1586341339';
  const material = ringData.material || 'Platinum';
  const price = ringData.price || 15000;
  const size = ringData.size || '6.5';
  const createdDate = ringData.created_at ? new Date(ringData.created_at) : new Date();
  const completionDate = getCompletionDate(ringData.created_at);
  const certNumber = getCertNumber();
  const editionNumber = getEditionNumber();
  const insuranceValue = Math.round(price * 1.2);

  const categories = [
    material,
    ringData.model_name || 'Signature',
    ringData.collection_name || 'Classic',
    ringData.status || 'Available',
    'Ethical',
    'Handcrafted'
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal">
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
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/myring" className="text-primary border-b border-primary/40 pb-1">My Ring</Link>
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
              <span className="text-sm font-medium hidden sm:inline">{coupleName}</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 py-4">
        {/* Ring Title */}
        <div className="mb-6">
          <h1 className="heading-serif text-4xl font-bold text-primary">{ringName}</h1>
          <p className="text-primary/70 dark:text-primary/60">Ring ID: {ringIdentifier}</p>
        </div>

        {/* Image Gallery - Main Image */}
        <div className="glass-panel rounded-3xl p-4 diamond-shine mb-16">
          <img 
            id="ringImage" 
            src={ringImage} 
            alt={ringName}
            className="w-full h-[500px] object-cover rounded-2xl ring-image-premium"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://www.loville.co/cdn/shop/products/CPR5013FANTASY-1_600x600.jpg?v=1586341339';
            }}
          />
        </div>

        {/* All Information in One Place */}
        <div className="glass-panel rounded-3xl p-8">
          
          {/* Quick Specs Row */}
          <div id="quickSpecs" className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-6 border-b border-primary/10 mb-6">
            <div>
              <p className="text-xs text-primary/60 dark:text-primary/40">MATERIAL</p>
              <p className="font-semibold text-primary">{material}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 dark:text-primary/40">PRICE</p>
              <p className="font-semibold text-primary">${price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 dark:text-primary/40">SIZE</p>
              <p className="font-semibold text-primary">{size} US</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 dark:text-primary/40">STATUS</p>
              <p className="font-semibold text-primary">{ringData.status || 'Available'}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 dark:text-primary/40">MODEL</p>
              <p className="font-semibold text-primary">{ringData.model_name || 'Signature'}</p>
            </div>
          </div>
          
          {/* Creation Timeline */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <h3 className="heading-serif text-xl font-bold text-primary">Creation Timeline</h3>
            </div>
            <div id="timeline" className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-primary/60 dark:text-primary/40">Created</p>
                <p className="font-medium text-primary">{formatDate(createdDate.toISOString())}</p>
              </div>
              <div>
                <p className="text-sm text-primary/60 dark:text-primary/40">Completed</p>
                <p className="font-medium text-primary">{formatDate(completionDate.toISOString())}</p>
              </div>
              <div>
                <p className="text-sm text-primary/60 dark:text-primary/40">Origin</p>
                <p className="font-medium text-primary">Antwerp, Belgium</p>
              </div>
              <div>
                <p className="text-sm text-primary/60 dark:text-primary/40">Workshop</p>
                <p className="font-medium text-primary">BondKeeper Studio #{getWorkshopNumber()}</p>
              </div>
            </div>
          </div>

          {/* History & Provenance */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">history</span>
              <h3 className="heading-serif text-xl font-bold text-primary">History & Provenance</h3>
            </div>
            <p id="historyText" className="text-charcoal/70 dark:text-cream/70 leading-relaxed mb-3">
              The "{ringName}" collection was inspired by timeless love stories spanning generations. This particular piece features a {material} ring hand-selected by our master craftsmen for its exceptional quality and beauty.
            </p>
            <div id="certification" className="bg-primary/5 p-3 rounded-lg inline-block">
              <p className="text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">verified</span>
                Certified by International Gemological Institute (IGI #{certNumber}-2024)
              </p>
            </div>
          </div>

          {/* Categories / Tags */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">local_offer</span>
              <h3 className="heading-serif text-xl font-bold text-primary">Categories</h3>
            </div>
            <div id="categories" className="flex flex-wrap">
              {categories.map((cat, index) => (
                <span 
                  key={index}
                  onClick={() => handleCategoryClick(cat)}
                  className="category-tag cursor-pointer"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* How to Wear & Care Combined */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">hand_gesture</span>
              <h3 className="heading-serif text-xl font-bold text-primary">How to Wear & Care</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wear Instructions */}
              <div>
                <p className="font-medium mb-3 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  Daily Wear
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Perfect for everyday elegance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Traditional left ring finger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Keep in original box when not wearing</span>
                  </li>
                </ul>
                
                <p className="font-medium mt-4 mb-3 flex items-center gap-2 text-amber-600">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Avoid
                </p>
                <p id="avoidList" className="text-sm dark:text-cream/80">Heavy sports, gardening, swimming, harsh chemicals</p>
              </div>
              
              {/* Care Instructions */}
              <div>
                <p className="font-medium mb-3 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-primary text-sm">cleaning_services</span>
                  Cleaning
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Wipe with soft lint-free cloth after wearing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Remove when applying lotions or perfumes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Professional cleaning every 6 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">circle</span>
                    <span className="dark:text-cream/80">Annual inspection and prong tightening</span>
                  </li>
                </ul>
                
                <p className="font-medium mt-4 mb-3 flex items-center gap-2 text-red-500">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Do NOT Use
                </p>
                <p id="doNotUseList" className="text-sm bg-red-500 dark:bg-red-900/20 p-3 rounded-lg dark:text-orange-500">
                  Ultrasonic cleaners, harsh chemicals, toothpaste, baking soda, or abrasive materials
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="heading-serif text-xl font-bold text-primary">Additional Information</h3>
            </div>
            
            <div id="additionalInfo" className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-primary/60 dark:text-primary/40">Warranty</p>
                <p className="font-medium text-primary">Lifetime</p>
              </div>
              <div>
                <p className="text-xs text-primary/60 dark:text-primary/40">Insurance Value</p>
                <p className="font-medium text-primary">${insuranceValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-primary/60 dark:text-primary/40">Resizing</p>
                <p className="font-medium text-primary">Free 1st year</p>
              </div>
              <div>
                <p className="text-xs text-primary/60 dark:text-primary/40">Collection</p>
                <p className="font-medium text-primary">{ringData.collection_name || '2024'}</p>
              </div>
              <div>
                <p className="text-xs text-primary/60 dark:text-primary/40">Edition</p>
                <p className="font-medium text-primary">#{editionNumber} of 100</p>
              </div>
            </div>
          </div>
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
      <footer className="bg-white dark:bg-charcoal border-t border-primary/10 mt-28 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">diamond</span>
              <span className="heading-serif text-xl font-semibold">BondKeeper</span>
            </div>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 leading-relaxed">Eternal rings, eternal story. Crafted for bonds that last beyond time.</p>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Experience</h4>
            <ul className="flex flex-col gap-3 text-sm text-charcoal/60 dark:text-cream/60">
              <li><Link to="/shop" className="hover:text-primary transition-colors">Browse rings</Link></li>
              <li><Link to="/myring" className="hover:text-primary transition-colors">My ring</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors">Couple profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Support</h4>
            <ul className="flex flex-col gap-3 text-sm text-charcoal/60 dark:text-cream/60">
              <li><Link to="/sizing" className="hover:text-primary transition-colors">Sizing guide</Link></li>
              <li><Link to="/returns" className="hover:text-primary transition-colors">Shipping & returns</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ / help</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Mailing list</h4>
            <div className="flex gap-2">
              <input className="flex-1 bg-transparent border border-primary/20 rounded-full px-5 py-2.5 text-sm placeholder:text-charcoal/40 dark:placeholder:text-cream/40 focus:border-primary/70" placeholder="your@email.com" />
              <button className="bg-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors">join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-charcoal/40 dark:text-cream/40">
          <p>© BondKeeper · Eternal Rings. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition">Terms</Link>
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

export default RingInformation;