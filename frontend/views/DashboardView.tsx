import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Types
interface RecentlyViewedRing {
  id: number;
  name: string;
  material: string;
  image: string;
}

const Dashboard: React.FC = () => {
  const [memberName, setMemberName] = useState<string>('Alexander');
  const [cartCount, setCartCount] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Sample recently viewed rings data
  const recentlyViewedRings: RecentlyViewedRing[] = [
    {
      id: 1,
      name: 'Elysian Halo',
      material: '18k white gold',
      image: 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900'
    },
    {
      id: 2,
      name: 'Midnight Sapphire',
      material: 'platinum',
      image: 'https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225'
    },
    {
      id: 3,
      name: 'Rose Pavé',
      material: 'rose gold',
      image: 'https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938'
    },
    {
      id: 4,
      name: 'Platinum Solitaire',
      material: '950 platinum',
      image: 'https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg'
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

  // Load cart count
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    } catch {
      setCartCount(0);
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
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

  // Handle navigation clicks (for # links)
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    console.log(`🔗 [PREMIUM] Navigation: "${section}" – link functional.`);
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
            <button className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
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
            <h1 className="heading-serif text-5xl md:text-6xl font-light tracking-tight">
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
            className="flex items-center gap-3 text-sm bg-white/70 dark:bg-charcoal/50 backdrop-blur-sm border border-primary/20 px-6 py-4 rounded-full hover:border-primary/70 transition-all shadow-premium group"
          >
            <span className="material-symbols-outlined text-primary group-hover:rotate-45 transition-transform duration-300">tune</span>
            <span className="font-medium">Account preferences</span>
          </a>
        </div>

        {/* ACCESS GRID: elevated cards linking to shop/ring/profile/settings (premium style) */}
        <h2 className="heading-serif text-3xl font-light mb-8 flex items-center gap-4">
          <span className="w-12 h-px bg-primary/40"></span>Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {/* couple shop card */}
          <Link to="/shop" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-transparent hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2">Couple shop</h3>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 mb-4">Discover matching bands, gifts &amp; certificates</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              enter boutique <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* my ring card */}
          <Link to="/ring-view" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-transparent hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">diamond</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2">My Ring</h3>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 mb-4">View certification, resizing, story</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              inspect <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* couple profile card */}
          <Link to="/profile" className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-transparent hover:border-primary/20 transition-all shadow-premium">
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">people</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2">Couple profile</h3>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 mb-4">Anniversary, story, partner details</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              manage <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </Link>
          
          {/* settings card */}
          <a 
            href="#" 
            onClick={(e) => handleNavClick(e, 'Settings')}
            className="group bg-white dark:bg-surface-dark/70 backdrop-blur-sm rounded-2xl p-8 border border-transparent hover:border-primary/20 transition-all shadow-premium"
          >
            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-5">
              <span className="material-symbols-outlined text-3xl">settings</span>
            </div>
            <h3 className="heading-serif text-2xl font-semibold mb-2">Settings</h3>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 mb-4">Notifications, privacy, linked accounts</p>
            <span className="text-primary flex items-center gap-1 text-sm font-medium">
              configure <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </span>
          </a>
        </div>

        {/* CURATED RINGS / RECENTLY VIEWED (premium gallery) */}
        <div className="border-t border-primary/10 pt-12">
          <div className="flex items-center justify-between mb-10">
            <h3 className="heading-serif text-3xl font-light flex items-center gap-3">
              <span className="w-8 h-px bg-primary/30"></span>Recently admired
            </h3>
            <Link to="/shop" className="text-primary flex items-center gap-1 text-sm border-b border-transparent hover:border-primary/50 pb-0.5 transition-all">
              explore all rings →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-7">
            {recentlyViewedRings.map((ring) => (
              <Link 
                key={ring.id} 
                to={`/ring-view`}
                onClick={() => {
                  // You can store the selected ring in sessionStorage if needed
                  sessionStorage.setItem('currentRing', JSON.stringify({
                    name: ring.name,
                    metal: ring.material,
                    img: ring.image
                  }));
                }}
                className="group ring-image-premium"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-primary/5 shadow-card">
                  <img 
                    src={ring.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                    alt={ring.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop';
                    }}
                  />
                </div>
                <div className="mt-4 flex justify-between items-start">
                  <div>
                    <p className="font-medium heading-serif text-xl">{ring.name}</p>
                    <p className="text-xs text-charcoal/50 dark:text-cream/50">{ring.material}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary/60">visibility</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER – elegant, minimal, with functional links */}
      <footer className="bg-white dark:bg-charcoal border-t border-primary/10 mt-28 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">diamond</span>
              <span className="heading-serif text-xl font-semibold">BondKeeper</span>
            </div>
            <p className="text-sm text-charcoal/60 dark:text-cream/60 leading-relaxed">
              Eternal rings, eternal story. Crafted for bonds that last beyond time.
            </p>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Experience</h4>
            <ul className="flex flex-col gap-3 text-sm text-charcoal/60 dark:text-cream/60">
              <li>
                <a href="#" onClick={(e) => handleNavClick(e, 'Bespoke atelier')} className="hover:text-primary transition-colors">
                  Bespoke atelier
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleNavClick(e, 'Ring concierge')} className="hover:text-primary transition-colors">
                  Ring concierge
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => handleNavClick(e, 'Private consultation')} className="hover:text-primary transition-colors">
                  Private consultation
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Support</h4>
            <ul className="flex flex-col gap-3 text-sm text-charcoal/60 dark:text-cream/60">
              <li>
                <Link to="/sizing-guide" className="hover:text-primary transition-colors">
                  Sizing guide
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="hover:text-primary transition-colors">
                  Shipping & returns
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  FAQ / help
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="heading-serif text-lg font-medium mb-5">Mailing list</h4>
            <div className="flex gap-2">
              <input 
                type="email"
                placeholder="your@email.com" 
                className="flex-1 bg-transparent border border-primary/20 rounded-full px-5 py-2.5 text-sm placeholder:text-charcoal/40 dark:placeholder:text-cream/40 focus:border-primary/70 focus:outline-none"
              />
              <button className="bg-primary text-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors">
                join
              </button>
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
    </>
  );
};

export default Dashboard;