import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, API_BASE_URL } from '../lib/api';
import { THEME_EVENT, isStoredDarkModeEnabled, setDarkModePreference } from '../lib/theme';
import { getStoredAuthValue, getUserScopedLocalStorageItem } from '../lib/userStorage';

const PURCHASED_RING_STORAGE_KEY = 'bondKeeper_purchased_ring';

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
  const [coupleName, setCoupleName] = useState<string>('Member');
  const [cartCount, setCartCount] = useState<number>(0);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);

  // Load dark mode preference
  useEffect(() => {
    setIsDarkMode(isStoredDarkModeEnabled());
  }, []);

  useEffect(() => {
    const syncTheme = () => setIsDarkMode(isStoredDarkModeEnabled());
    window.addEventListener('storage', syncTheme);
    window.addEventListener(THEME_EVENT, syncTheme);
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(THEME_EVENT, syncTheme);
    };
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

  // Load current user display name from database
  useEffect(() => {
    const loadDisplayName = async () => {
      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        setCoupleName(user.fullName || 'Member');
      } catch {
        setCoupleName(sessionStorage.getItem('auth_name')?.trim() || 'Member');
      }
    };

    void loadDisplayName();
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
      const sessionId = getUserScopedLocalStorageItem('sessionId');
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
      const storedRing = getUserScopedLocalStorageItem(PURCHASED_RING_STORAGE_KEY);
      
      if (storedRing) {
        const ring = JSON.parse(storedRing);
        displayRingData(ring);
        hideLoading();
        return;
      }

      setRingData(null);
      setError(null);
      setLoading(false);
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
    setDarkModePreference(newDarkMode);
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
                <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
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

  if (error) {
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
                <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
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

  if (!ringData) {
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
                <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-4 py-16 md:py-24">
          <div className="rounded-[2rem] border border-primary/15 bg-white/80 dark:bg-charcoal/50 backdrop-blur-sm shadow-[0_24px_60px_rgba(236,19,128,0.08)] p-8 md:p-12 text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">diamond</span>
            </div>
            <p className="text-[11px] tracking-[0.22em] uppercase font-bold text-primary/60 mb-3">My Ring</p>
            <h1 className="heading-serif text-3xl md:text-5xl font-bold text-primary leading-tight">
              Your ring will appear here after purchase
            </h1>
            <p className="mt-4 text-charcoal/70 dark:text-cream/70 text-base md:text-lg max-w-2xl mx-auto leading-7">
              You have not purchased a ring yet. Once you buy one from Couple Shop, this page will automatically show your ring details, images, and care information.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-white font-medium shadow-md hover:bg-primary-dark transition-colors"
              >
                Browse Couple Shop
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-primary/20 text-primary font-medium hover:bg-primary/5 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </main>

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
  const ringName = ringData.ring_name || ringData.name || 'Owned Ring';
  const ringIdentifier = ringData.ring_identifier || ringData.identifier || 'N/A';
  const ringImage = ringData.model_image || ringData.image_url || ringData.img || '';
  const material = ringData.material || 'N/A';
  const price = ringData.price || 0;
  const size = ringData.size || 'N/A';
  const createdDate = ringData.created_at ? new Date(ringData.created_at) : new Date();
  const completionDate = getCompletionDate(ringData.created_at);
  const certNumber = getCertNumber();
  const editionNumber = getEditionNumber();
  const insuranceValue = Math.round(price * 1.2);

  const categories = [
    material,
    ringData.model_name || 'Owned',
    ringData.collection_name || 'Purchased',
    ringData.status || 'Purchased',
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
              <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-4 py-6 md:py-8">
        {/* Ring Title */}
        <div className="mb-7 md:mb-8 rounded-3xl border border-primary/15 bg-white/70 dark:bg-charcoal/40 backdrop-blur-sm p-5 md:p-7 shadow-[0_20px_50px_rgba(236,19,128,0.08)]">
          <p className="text-[11px] tracking-[0.2em] uppercase font-bold text-primary/60 mb-2">Your Signature Ring</p>
          <h1 className="heading-serif text-4xl md:text-5xl font-bold text-primary leading-[1.05]">{ringName}</h1>
          <p className="text-primary/70 dark:text-primary/60 mt-2 text-sm md:text-base">Ring ID: {ringIdentifier}</p>
        </div>

        {/* Image Gallery - Main Image */}
        <div className="glass-panel rounded-3xl p-4 md:p-5 diamond-shine mb-10 md:mb-12 shadow-[0_26px_60px_rgba(2,6,23,0.14)]">
          <img 
            id="ringImage" 
            src={ringImage} 
            alt={ringName}
            className="w-full h-[340px] md:h-[500px] object-cover rounded-2xl ring-image-premium"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://www.loville.co/cdn/shop/products/CPR5013FANTASY-1_600x600.jpg?v=1586341339';
            }}
          />
        </div>

        {/* All Information in One Place */}
        <div className="glass-panel rounded-3xl p-5 md:p-8 border border-primary/10 shadow-[0_24px_50px_rgba(15,23,42,0.1)]">
          
          {/* Quick Specs Row */}
          <div id="quickSpecs" className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 pb-7 border-b border-primary/10 mb-7">
            <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
              <p className="text-xs text-primary/60 dark:text-primary/40">MATERIAL</p>
              <p className="font-semibold text-primary mt-1 text-[15px]">{material}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
              <p className="text-xs text-primary/60 dark:text-primary/40">PRICE</p>
              <p className="font-semibold text-primary mt-1 text-[15px]">${price.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
              <p className="text-xs text-primary/60 dark:text-primary/40">SIZE</p>
              <p className="font-semibold text-primary mt-1 text-[15px]">{size} US</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
              <p className="text-xs text-primary/60 dark:text-primary/40">STATUS</p>
              <p className="font-semibold text-primary mt-1 text-[15px]">{ringData.status || 'Available'}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
              <p className="text-xs text-primary/60 dark:text-primary/40">MODEL</p>
              <p className="font-semibold text-primary mt-1 text-[15px]">{ringData.model_name || 'Signature'}</p>
            </div>
          </div>
          
          {/* Creation Timeline */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <h3 className="heading-serif text-xl font-bold text-primary">Creation Timeline</h3>
            </div>
            <div id="timeline" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
                <p className="text-sm text-primary/60 dark:text-primary/40">Created</p>
                <p className="font-medium text-primary mt-1">{formatDate(createdDate.toISOString())}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
                <p className="text-sm text-primary/60 dark:text-primary/40">Completed</p>
                <p className="font-medium text-primary mt-1">{formatDate(completionDate.toISOString())}</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
                <p className="text-sm text-primary/60 dark:text-primary/40">Origin</p>
                <p className="font-medium text-primary mt-1">Antwerp, Belgium</p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-3">
                <p className="text-sm text-primary/60 dark:text-primary/40">Workshop</p>
                <p className="font-medium text-primary mt-1">BondKeeper Studio #{getWorkshopNumber()}</p>
              </div>
            </div>
          </div>

          {/* History & Provenance */}
          <div className="info-section">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">history</span>
              <h3 className="heading-serif text-xl font-bold text-primary">History & Provenance</h3>
            </div>
            <p id="historyText" className="text-charcoal/70 dark:text-cream/70 leading-7 mb-3 text-[15px]">
              The "{ringName}" collection was inspired by timeless love stories spanning generations. This particular piece features a {material} ring hand-selected by our master craftsmen for its exceptional quality and beauty.
            </p>
            <div id="certification" className="bg-primary/5 border border-primary/20 p-3 rounded-xl inline-block">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Wear Instructions */}
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-4">
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
              <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/40 p-4">
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
                <p id="doNotUseList" className="text-sm bg-red-500/90 dark:bg-red-900/30 p-3 rounded-xl text-white dark:text-orange-200">
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
