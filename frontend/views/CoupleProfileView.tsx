import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface RingData {
  id: string;
  name: string;
  material: string;
  size: string;
  identifier: string;
  status: string;
  batteryLevel: number;
  lastPing: string;
  location: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
}

const CoupleProfileView: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [coupleName, setCoupleName] = useState<string>('Alex & Jamie');
  const [memberName, setMemberName] = useState<string>('Alex');
  const [cartCount, setCartCount] = useState<number>(4);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [proximityThreshold, setProximityThreshold] = useState<number>(50);
  const [visibilityMode, setVisibilityMode] = useState<string>('partners');
  const [cloudStorageUsed, setCloudStorageUsed] = useState<number>(6.5);
  const [cloudStorageTotal, setCloudStorageTotal] = useState<number>(10);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean; message: string; onConfirm: () => void} | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  
  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: 'Sam Richards',
    phone: '+1 (555) 000-9999'
  });

  // Ring data
  const [ringData, setRingData] = useState<RingData>({
    id: 'TSS-002',
    name: 'Twin Souls Silver B',
    material: 'Sterling Silver',
    size: '7',
    identifier: 'SHOP-TSS-002',
    status: 'SYSTEM ONLINE',
    batteryLevel: 88,
    lastPing: '2m ago',
    location: 'WAREHOUSE: Main WH'
  });

  // Show notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Show confirm dialog (replaces window.confirm)
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, message, onConfirm });
  };

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Show certification notification (replacing alert)
    if (ringData?.id === 'TSS-002') {
      showCertificationNotification();
    }
  }, [ringData?.id]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Certification notification function
  const showCertificationNotification = () => {
    showNotification('Ring certification in progress. Estimated completion: 2 weeks', 'info');
  };

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

  // Handle notification click
  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  // Handle navigation
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      showNotification(`Searching for partner with email: ${searchEmail}`, 'info');
    }
  };

  // Handle emergency contact update
  const handleEmergencyContactUpdate = () => {
    showNotification('Emergency contact updated successfully!', 'success');
  };

  // Handle test connection
  const handleTestConnection = () => {
    showNotification('Testing connection to your ring...', 'info');
  };

  // Handle unpair device
  const handleUnpairDevice = () => {
    showConfirm('Are you sure you want to unpair this device?', () => {
      showNotification('Device unpaired successfully', 'success');
    });
  };

  // Handle initialize link
  const handleInitializeLink = () => {
    showNotification('Initializing pair link...', 'info');
  };

  // Handle set reminder
  const handleSetReminder = () => {
    showNotification('Reminder set for your anniversary!', 'success');
  };

  // Handle update contact
  const handleUpdateContact = () => {
    handleEmergencyContactUpdate();
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-white-900">
      {/* STICKY HEADER - Full navbar with diamond logo */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-charcoal/80 premium-blur border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          {/* left logo + navigation */}
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-3xl">diamond</span>
              <span className="heading-serif text-2xl font-semibold tracking-wide text-primary">BondKeeper</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="hover:text-primary transition-colors">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="text-primary border-b border-primary/40 pb-1">Couple Profile</Link>
              <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
              <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
            </nav>
          </div>
          {/* right icons & member */}
          <div className="flex items-center gap-6">
            {/* Notification Button with Badge */}
            <button 
              onClick={handleNotificationClick}
              className="relative text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors group"
            >
              <span className="material-symbols-outlined">notifications_none</span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Notifications
              </span>
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

      <main className="pb-24">
        {/* Welcome Section */}
        <section className="px-4 py-6">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-pink-500 dark:text-pink-400">Welcome back, {memberName}</h2>
              <p className="text-slate-400 dark:text-slate-500 mt-1">Everything looks great today.</p>
            </div>
            <div className="w-full max-w-md">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                  <input 
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full bg-white dark:bg-pink-80 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 text-black dark:text-black"
                    placeholder="Find Email Partner"
                  />
                </div>
                <p className="text-[10px] italic text-slate-400 dark:text-slate-500 px-1 mt-1 text-right md:text-left">
                  Search by registered email address
                </p>
              </form>
            </div>
          </div>
        </section>

      {/* Relationship chronicle */}
        <section className="px-4 gap-4 mb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-white to-primary/5 dark:from-surface-dark dark:to-primary/10 rounded-3xl p-9 border border-primary/10 shadow-premium mb-16">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-9">
                <h2 className="heading-serif text-4xl font-light flex items-center gap-3 text-pink-500 dark:text-pink-400">
                  <span className="text-pink-500">✦</span> Relationship chronicle
                </h2>
                <a 
                  href="#" 
                  onClick={(e) => handleNavClick(e, 'Full Relationship Hub')}
                  className="group flex items-center gap-2 border border-primary/30 rounded-full px-6 py-3 hover:bg-primary/5 transition-all text-sm font-bold text-pink-600 dark:text-pink-400 hover:text-primary"
                >
                  <span>Open full hub</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex gap-5 items-start">
                  <span className="material-symbols-outlined text-primary/70 text-3xl">timeline</span>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-charcoal/40 dark:text-cream/40">Milestones</p>
                    <p className="text-lg font-medium mt-1 dark:text-black">Engagement · 06.09.2022</p>
                    <p className="text-lg font-medium dark:text-black">First ring scan · 12.2023</p>
                    <p className="text-sm text-charcoal/50 mt-2">➕ 3 more moments</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <span className="material-symbols-outlined text-primary/70 text-3xl">links</span>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-charcoal/40 dark:text-cream/40">Linked rings</p>
                    <p className="text-lg font-medium mt-1 dark:text-black">Hers: Elysian Halo</p>
                    <p className="text-lg font-medium dark:text-black">His: Midnight Sapphire</p>
                    <p className="ring-ID text-xs text-primary mt-2">Ring ID: {ringData.id}</p>
                    <p className="text-xs text-primary/70 mt-2">both certified · bond active</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <span className="material-symbols-outlined text-primary/70 text-3xl">celebration</span>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-charcoal/40 dark:text-cream/40">Upcoming</p>
                    <p className="text-lg font-medium mt-1 dark:text-black">3rd anniversary</p>
                    <p className="text-lg text-primary">in 94 days</p>
                    <a 
                      href="#" 
                      onClick={handleSetReminder}
                      className="text-sm text-primary/70 underline-offset-2 hover:underline"
                    >
                      set reminder
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        
        {/* Ring Status Card + Pairing Management (two columns) */}
        <section className="max-w-7xl mx-auto px-6 my-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left large card: Ring Main */}
            <div className="lg:col-span-2 bg-white dark:bg-pink-100 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-pink-200">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-slate-100 dark:bg-pink-700 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-pink-50 dark:text-white-400 text-3xl">circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-black">{ringData.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                      {ringData.material} | Size {ringData.size} | {ringData.identifier}
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 dark:bg-white-900/30 text-green-600 dark:text-green-400 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                  <span className="size-1.5 bg-green-500 rounded-full"></span> {ringData.status}
                </span>
              </div>
              {/* three info cards (location with link, battery, signal) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* location card with link to PNC Cambodia & map directions */}
                <div className="bg-slate-50/50 dark:bg-white 400/50 p-4 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3">Current Location</p>
                  <div className="flex gap-3 mb-3">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <a 
                      href="https://cambodia.passerellesnumeriques.org" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-bold hover:text-primary hover:underline transition-colors dark:text-black"
                    >
                      {ringData.location}
                    </a>
                  </div>
                  <a 
                    href="https://www.google.com/maps/dir//Passerelles+num%C3%A9riques+Cambodia+(PNC),+BP+511,+Phum+Tropeang+Chhuk+(Borey+Sorla)+Sangtak,+Street+371,+Phnom+Penh/@11.5592652,104.8828671,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x310951add5e2cd81:0x171e0b69c7c6f7ba!2m2!1d104.8830826!2d11.5508551?entry=ttu&g_ep=EgoyMDI2MDIyNC4wIKXMDSoASAFQAw%3D%3D" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block aspect-video bg-slate-200 dark:bg-slate-600 rounded-xl overflow-hidden relative group"
                  >
                    <img 
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" 
                      src="https://lh3.googleusercontent.com/gps-cs-s/AHVAweoqxMyOcpkmy2qL3HifLkO_pQ6UWZKgcaR59hJRfkXa6Bie_a8RZJ1Y1QlGdf-uXfpYIsdhQXee9GYkqgB59UTfyqLCuMsm6-O879zZRbbYJKFOuTPNXhm7WyROJf_0UgQL4ynF5g=s1360-w1360-h1020-rw" 
                      alt="cambodia map"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                      passerellesnumeriques.org ↗
                    </span>
                  </a>
                </div>
                <div className="bg-slate-50/50 dark:bg-white 400/50 p-4 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-4">Battery Level</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-green-500">battery_charging_80</span>
                    <p className="text-2xl font-bold dark:text-black">{ringData.batteryLevel}%</p>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Approx. 14 hours left</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-white 400/50 p-4 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-4">Signal Strength</p>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary rotate-45">signal_cellular_4_bar</span>
                    <p className="text-xl font-bold dark:text-black">Excellent</p>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Last ping: {ringData.lastPing}</p>
                </div>
              </div>
              {/* two action buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleTestConnection}
                  className="w-full bg-primary/10 py-4 rounded-2xl font-bold text-sm hover:bg-primary/20 transition-colors border border-primary/30 text-pink-500 dark:text-pink-400"
                >
                  Test Connection
                </button>
                <button 
                  onClick={handleUnpairDevice}
                  className="w-full bg-primary/10  py-4 rounded-2xl font-bold text-sm hover:bg-primary/30 transition-colors border border-primary/30 text-red-500 dark:text-red-400"
                >
                  Unpair Device
                </button>
              </div>
            </div>
            {/* Right card: Pairing Management */}
            <div className="bg-white dark:bg-pink-100 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-pink-200">
              <h3 className="text-lg font-bold mb-6 text-primary text-primary">Pairing Management</h3>
              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-4">
                  <span className="text-sm text-slate-400 dark:text-slate-500">Pair Selection</span>
                  <span className="text-sm font-bold text-primary text-primary">No pair linked</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-4">
                  <span className="text-sm text-slate-400 dark:text-slate-500">Pair Code</span>
                  <span className="text-sm font-bold text-primary text-primary">N/A</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-700 pb-4">
                  <span className="text-sm text-slate-400 dark:text-slate-500">Status</span>
                  <span className="text-sm font-bold text-primary text-primary">N/A</span>
                </div>
                <div className="flex justify-between items-center pb-4">
                  <span className="text-sm text-slate-400 dark:text-slate-500">Established</span>
                  <span className="text-sm font-bold text-primary text-primary">N/A</span>
                </div>
              </div>
              <button 
                onClick={handleInitializeLink}
                className="w-full border-2 border-dashed border-primary/30 py-4 rounded-2xl font-bold text-sm hover:bg-primary/5 transition-colors text-pink-500 dark:text-pink-400"
              >
                Initialize Link
              </button>
            </div>
          </div>
        </section>

        {/* TWO COLUMN LAYOUT: EMERGENCY CONTACT (left) + VISIBILITY SETTINGS (right) */}
        <div className="max-w-7xl mx-auto px-6 mb-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Emergency Contact card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">emergency</span>
                  <h3 className="text-lg font-bold text-primary text-primary">Emergency Contact</h3>
                </div>
              </div>
              <div className="bg-white dark:bg-white-800 p-8 rounded-[2rem] border border-pink-50 dark:border-pink-70 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black text-pink-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                      Contact Name
                    </label>
                    <input 
                      type="text" 
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({...emergencyContact, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-pink-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/20 text-slate-900 dark:text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-pink-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
                      Phone Number
                    </label>
                    <input 
                      type="text" 
                      value={emergencyContact.phone}
                      onChange={(e) => setEmergencyContact({...emergencyContact, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-pink-200 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/20 text-slate-900 dark:text-black"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 md:grid-cols-2 items-center gap-6">
                  <button 
                    onClick={handleUpdateContact}
                    className="w-full border-2 border-primary  py-3 rounded-2xl font-bold text-sm hover:bg-primary/5 transition-colors text-pink-500 dark:text-pink-400 col-span-5 md:col-span-1"
                  >
                    Update Contact
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Visibility Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary text-primary">Visibility Settings</h3>
              <div className="bg-white dark:bg-slate-80 rounded-3xl border border-pink-200 dark:border-pink-200 overflow-hidden">
                <label className="flex items-center px-6 py-5 border-b border-slate-50 dark:border-slate-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="public"
                    checked={visibilityMode === 'public'}
                    onChange={(e) => setVisibilityMode(e.target.value)}
                    className="text-primary focus:ring-primary h-4 w-4 border-slate-200 rounded-full"
                  />
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-black">Public Presence</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Visible to all users in range</p>
                  </div>
                </label>
                <label className="flex items-center px-6 py-5 border-2 border-primary/20 bg-primary/[0.02] cursor-pointer">
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="partners"
                    checked={visibilityMode === 'partners'}
                    onChange={(e) => setVisibilityMode(e.target.value)}
                    className="text-primary focus:ring-primary h-4 w-4 border-slate-200 rounded-full"
                  />
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-black">Partners Only</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Only your linked partner can see you</p>
                  </div>
                </label>
                <label className="flex items-center px-6 py-5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="private"
                    checked={visibilityMode === 'private'}
                    onChange={(e) => setVisibilityMode(e.target.value)}
                    className="text-primary focus:ring-primary h-4 w-4 border-slate-200 rounded-full"
                  />
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-black">Private Ghost Mode</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Invisible to everyone, even your partner</p>
                  </div>
                </label>
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

      {/* Custom Confirm Dialog (replaces window.confirm) */}
      {confirmDialog && confirmDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-charcoal rounded-2xl max-w-md w-full p-6 shadow-2xl border border-primary/20">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Confirm Action</h3>
            <p className="text-slate-600 dark:text-cream/70 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
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
        
        .animate-slide-up-bottom {
          animation: slideUpBottom 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CoupleProfileView;