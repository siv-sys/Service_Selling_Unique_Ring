import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, resolveApiAssetUrl } from '../lib/api';
import { getStoredAuthValue, getUserScopedLocalStorageItem, setUserScopedSessionStorageItem } from '../lib/userStorage';

const PURCHASED_RING_STORAGE_KEY = 'bondKeeper_purchased_ring';

// Types
interface RecentlyViewedRing {
  id: number;
  name: string;
  material: string;
  image: string;
  price: number;
}

const Dashboard: React.FC = () => {
  const [memberName, setMemberName] = useState<string>(() => {
    const storedName = getStoredAuthValue('auth_name')?.trim();
    if (storedName) return storedName;

    const storedEmail = getStoredAuthValue('auth_email')?.trim();
    if (storedEmail) return storedEmail.split('@')[0] || storedEmail;

    return 'Member';
  });
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [featuredRings, setFeaturedRings] = useState<RecentlyViewedRing[]>([]);
  const [ringsLoading, setRingsLoading] = useState<boolean>(true);
  const cartCount = 0;
  const isDarkMode = false;
  const hasPurchasedRing =
    typeof window !== 'undefined' && Boolean(getUserScopedLocalStorageItem(PURCHASED_RING_STORAGE_KEY));

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const syncMemberName = () => {
      const storedName = getStoredAuthValue('auth_name')?.trim();
      if (storedName) {
        setMemberName(storedName);
        return;
      }

      const storedEmail = getStoredAuthValue('auth_email')?.trim();
      setMemberName(storedEmail ? storedEmail.split('@')[0] || storedEmail : 'Member');
    };

    syncMemberName();
    window.addEventListener('storage', syncMemberName);
    return () => window.removeEventListener('storage', syncMemberName);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFeaturedRings = async () => {
      setRingsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/couple-shop?sort=price&order=desc&limit=4&offset=0`);

        if (!response.ok) {
          throw new Error(`Failed to load rings (${response.status})`);
        }

        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        const nextRings = rows
          .map((ring: any) => ({
            id: Number(ring?.id || 0),
            name: String(ring?.name || ring?.model_name || ring?.ring_name || 'Ring'),
            material: String(ring?.material || ring?.collection_name || 'Unknown'),
            image: resolveApiAssetUrl(ring?.image_url || ring?.image || ring?.img || ''),
            price: Number(ring?.price || ring?.base_price || 0),
          }))
          .filter((ring: RecentlyViewedRing) => ring.id > 0)
          .sort((a: RecentlyViewedRing, b: RecentlyViewedRing) => b.price - a.price);

        if (!cancelled) {
          setFeaturedRings(nextRings);
        }
      } catch (error) {
        console.error('Error loading featured rings:', error);
        if (!cancelled) {
          setFeaturedRings([]);
        }
      } finally {
        if (!cancelled) {
          setRingsLoading(false);
        }
      }
    };

    void loadFeaturedRings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const toggleDarkMode = () => {};

  // Handle navigation clicks (for # links)
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    showNotification(`🔗 Navigation: "${section}" – link functional.`, 'info');
  };

  return (
    <>
      {/* STICKY HEADER – minimalist, luxurious, with active links */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          {/* left logo + navigation (functional) */}
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/" className="text-primary border-b border-primary/40 pb-1">Dashboard</Link>
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/ring-view" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
            </nav>
          </div>
          {/* right icons & member subtle */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => showNotification('No new notifications', 'info')} 
              className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">notifications_none</span>
            </button>
            <button 
              onClick={toggleDarkMode}
              className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <Link to="/cart">
              <button className="text-charcoal/60 hover:text-primary relative">
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
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

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        {/* PREMIUM WELCOME SECTION with user name & elegant touch */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Eternal membership</span>
              <span className="w-10 h-px bg-primary/30"></span>
            </div>
            <h1 className="heading-serif text-5xl md:text-6xl font-light tracking-tight text-pink-400 dark:text-pink-400">
              Welcome back, <span className="font-bold text-primary">{memberName}</span>
            </h1>
            <p className="text-lg text-charcoal/60 dark:text-cream/60 mt-4 max-w-2xl">
              Your bond, your rings, your story — curated with timeless elegance.
            </p>
          </div>
          {/* quick settings with refined style */}
          <a 
            href="#" 
            onClick={(e) => handleNavClick(e, 'Account preferences')}
            className="flex items-center gap-3 text-sm bg-white/70 dark:bg-charcoal/50 backdrop-blur-sm border border-primary/20 px-6 py-4 rounded-full hover:border-primary/70 transition-all shadow-premium group text-pink-600 dark:text-pink-600"
          >
            <span className="material-symbols-outlined text-pink-500 group-hover:rotate-45 transition-transform duration-300">tune</span>
            <span className="font-medium text-black-200 dark:text-pink-300">Account preferences</span>
          </a>
        </div>

        {/* ACCESS GRID: elevated cards linking to shop/ring/profile/settings (premium style) */}
        <h2 className="heading-serif text-3xl font-light mb-8 flex items-center gap-4 text-pink-900 dark:text-pink-900">
          <span className="w-8 h-px text-pink-900 dark:text-pink-900"></span>Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {/* couple shop card */}
          <Link to="/shop" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 dark:border-pink-700 hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2 text-black-200 dark:text-pink-300">Couple shop</h3>
            <p className="text-sm text-charcoal/60 dark:text-slate-400 mb-4">Discover matching bands, gifts &amp; certificates</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              enter boutique <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* my ring card */}
          <Link to="/myring" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 dark:border-pink-700 hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">diamond</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2 text-black-200 dark:text-pink-300">My Ring</h3>
            <p className="text-sm text-charcoal/60 dark:text-slate-400 mb-4">View certification, resizing, story</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              inspect <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* couple profile card */}
          <Link to="/profile" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 dark:border-pink-700 hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">people</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2 text-black-200 dark:text-pink-300">Couple profile</h3>
            <p className="text-sm text-charcoal/60 dark:text-slate-400 mb-4">Anniversary, story, partner details</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              manage <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* settings card */}
          <a 
            href="#" 
            onClick={(e) => handleNavClick(e, 'Settings')}
            className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 dark:border-pink-700 hover:border-primary/20 transition-all shadow-premium"
          >
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">settings</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2 text-black-200 dark:text-pink-300">Settings</h3>
            <p className="text-sm text-charcoal/60 dark:text-slate-400 mb-4">Notifications, privacy, linked accounts</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              configure <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </a>
        </div>

        {/* CURATED RINGS / RECENTLY VIEWED (premium gallery) */}
        <div className="border-t border-primary/10 pt-12">
          <div className="flex items-center justify-between mb-10">
            <h3 className="heading-serif text-3xl font-light flex items-center gap-3 text-pink-600 dark:text-pink-600">
              <span className="w-8 h-px bg-primary text-pink"></span>Highest priced rings
            </h3>
            <Link to="/shop" className="text-black flex items-center gap-1 text-sm border-b border-transparent hover:border-primary/50 pb-0.5 transition-all text-pink-400 dark:text-pink-300">
              explore all rings →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-sm text-pink-700 dark:text-pink-700">
            {ringsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="aspect-square overflow-hidden rounded-[24px] bg-primary/5 animate-pulse" />
                  <div className="mt-4 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-pink-100 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>
              ))
            ) : featuredRings.length > 0 ? (
              featuredRings.map((ring) => (
                <Link
                  key={ring.id}
                  to={`/shop?ring=${ring.id}`}
                  onClick={() => {
                    sessionStorage.setItem('currentRing', JSON.stringify({
                      name: ring.name,
                      metal: ring.material,
                      img: ring.image,
                      price: ring.price,
                    }));
                  }}
                  className="group"
                >
                  <div className="aspect-square overflow-hidden rounded-[24px] bg-white shadow-[0_14px_35px_rgba(15,23,42,0.08)] ring-1 ring-pink-100/60 transition-transform duration-500 group-hover:-translate-y-1">
                    <img
                      src={ring.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={ring.name}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop';
                      }}
                    />
                  </div>
                  <div className="mt-4 px-1">
                    <div>
                      <p className="heading-serif text-[18px] font-medium leading-tight text-pink-400 dark:text-pink-300">{ring.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-cream/50">{ring.material}</p>
                      <p className="mt-1 text-sm font-medium text-primary">${ring.price.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 md:col-span-4 rounded-2xl border border-pink-200 bg-white/70 p-6 text-center text-slate-500">
                No ring data found in the database.
              </div>
            )}
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
      `}</style>
    </>
  );
};

export default Dashboard;
