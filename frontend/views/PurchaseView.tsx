import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HistoryModal from './HistoryModal';

interface CoupleProfile {
  id: string;
  partner1: string;
  email: string;
  phone: string;
  address: string;
  ring: string;
  sku: string;
  price: number;
  purchaseDate: string;
  ringImage?: string;
}

interface SelectedRing {
  name: string;
  sku: string;
  type: string;
  size: string;
  price: number;
  stock: number;
  image: string;
  id?: number;
}

const PurchaseView: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Form states - Simplified for single person
  const [customerName, setCustomerName] = useState<string>('Alex Rivera');
  const [anniversary, setAnniversary] = useState<string>('2023-06-15');
  const [email, setEmail] = useState<string>('customer@bondkeeper.com');
  const [phone, setPhone] = useState<string>('+855 12 345 678');
  const [address, setAddress] = useState<string>('#123, Street 456, Phnom Penh');
  const [city, setCity] = useState<string>('Phnom Penh');
  const [zip, setZip] = useState<string>('12101');
  const [country, setCountry] = useState<string>('Cambodia');

  // Ring data from sessionStorage
  const [ringData, setRingData] = useState<SelectedRing>({
    name: 'Twin Souls Silver B',
    sku: 'TSS-002-X9',
    type: 'Sterling Silver',
    size: '7 (adjustable)',
    price: 899,
    stock: 3,
    image: 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900'
  });

  // Load ring data from sessionStorage
  useEffect(() => {
    const purchaseRing = sessionStorage.getItem('purchaseRing');
    if (purchaseRing) {
      try {
        const parsedRing = JSON.parse(purchaseRing);
        setRingData({
          name: parsedRing.name || parsedRing.ring_name || 'Twin Souls Silver B',
          sku: parsedRing.sku || parsedRing.ring_identifier || 'TSS-002-X9',
          type: parsedRing.material || 'Sterling Silver',
          size: parsedRing.size || '7 (adjustable)',
          price: parsedRing.price || 899,
          stock: parsedRing.stock || 3,
          image: parsedRing.image || parsedRing.image_url || parsedRing.img || 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900',
          id: parsedRing.id
        });
      } catch (e) {
        console.error('Error parsing purchase ring:', e);
      }
    } else {
      const currentRing = sessionStorage.getItem('currentRing');
      if (currentRing) {
        try {
          const parsedRing = JSON.parse(currentRing);
          setRingData({
            name: parsedRing.name || parsedRing.ring_name || 'Twin Souls Silver B',
            sku: parsedRing.sku || parsedRing.ring_identifier || 'TSS-002-X9',
            type: parsedRing.material || 'Sterling Silver',
            size: parsedRing.size || '7 (adjustable)',
            price: parsedRing.price || 899,
            stock: parsedRing.stock || 3,
            image: parsedRing.image || parsedRing.image_url || parsedRing.img || 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900',
            id: parsedRing.id
          });
        } catch (e) {
          console.error('Error parsing current ring:', e);
        }
      }
    }
  }, []);

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

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // Navigation functions
  const showStep = (step: number) => {
    setCurrentStep(step);
  };

  // Save order to history function
  const saveOrderToHistory = () => {
    try {
      const subtotal = ringData.price;
      const shipping_cost = 25;
      const tax = Math.round(subtotal * 0.08);
      const total = subtotal + shipping_cost + tax;

      const order = {
        id: Date.now(),
        order_number: `BK-${Date.now()}`,
        user_id: 1,
        subtotal,
        shipping_cost,
        tax,
        total,
        payment_method: 'Credit Card',
        payment_status: 'completed',
        order_status: 'confirmed',
        shipping_name: customerName,
        shipping_phone: phone,
        shipping_address: `${address}, ${city}, ${country}`,
        created_at: new Date().toISOString(),
        items: [{
          ring_id: ringData.id || 1,
          ring_identifier: ringData.sku,
          ring_name: ringData.name,
          material: ringData.type,
          size: ringData.size,
          quantity: 1,
          price: ringData.price,
          image_url: ringData.image
        }],
        user: {
          full_name: customerName,
          email: email,
          phone: phone
        }
      };

      const existingOrders = JSON.parse(localStorage.getItem('purchase_history') || '[]');
      existingOrders.unshift(order);
      localStorage.setItem('purchase_history', JSON.stringify(existingOrders));
      
      return true;
    } catch (error) {
      console.error('Error saving order:', error);
      return false;
    }
  };

  // Step 1 validation
  const validateStep1 = (): boolean => {
    if (!customerName || !email) {
      showNotification('Please fill your name and email.', 'error');
      return false;
    }
    return true;
  };

  // Step 2 validation
  const validateStep2 = (): boolean => {
    if (!phone || !address || !city || !country) {
      showNotification('Please fill all required delivery fields.', 'error');
      return false;
    }
    return true;
  };

  // Handle step navigation
  const handleToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      showStep(2);
    }
  };

  const handleBackToStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    showStep(1);
  };

  // Handle final purchase
  const handleFinalPurchase = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    if (ringData.stock <= 0) {
      showNotification('❌ Sorry, this ring is out of stock.', 'error');
      return;
    }

    // Save to history
    const saved = saveOrderToHistory();
    if (!saved) {
      showNotification('Error processing order', 'error');
      return;
    }

    const newStock = ringData.stock - 1;

    // Store couple profile
    const coupleProfile: CoupleProfile = {
      id: 'CP' + Math.floor(Math.random() * 10000),
      partner1: customerName,
      email,
      phone,
      address: `${address}, ${city}, ${country}`,
      ring: ringData.name,
      sku: ringData.sku,
      price: ringData.price,
      purchaseDate: new Date().toLocaleDateString(),
      ringImage: ringData.image
    };

    sessionStorage.setItem('bondKeeper_couple', JSON.stringify(coupleProfile));
    sessionStorage.setItem('showThankYou', 'true');
    sessionStorage.setItem('newStock', newStock.toString());
    localStorage.removeItem('cart');

    setModalData({
      customerName,
      ring: ringData.name,
      sku: ringData.sku,
      price: ringData.price,
      newStock,
      date: new Date().toLocaleDateString(),
      ringImage: ringData.image
    });

    setShowModal(true);

    setTimeout(() => {
      window.location.href = '/profile';
    }, 3000);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleModalBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Calculate order totals
  const subtotal = ringData.price;
  const shipping = 25;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  const getStepCircleClass = (step: number): string => {
    const baseClass = "step w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2";
    if (currentStep >= step) {
      return `${baseClass} bg-primary text-white border-primary shadow-md`;
    }
    return `${baseClass} bg-white border border-slate-300 text-slate-500`;
  };

  const getStepDescription = (): string => {
    switch (currentStep) {
      case 1: return 'Step 1: Ring & customer information';
      case 2: return 'Step 2: Delivery & final confirmation';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal">
      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />

      {/* STICKY HEADER with History */}
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
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {/* History Button */}
            <button 
              onClick={() => setIsHistoryModalOpen(true)} 
              className="relative text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors group"
            >
              <span className="material-symbols-outlined">history</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Purchase History
              </span>
            </button>
            
            <button onClick={toggleDarkMode} className="text-charcoal/60 dark:text-cream/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            
            <Link to="/cart" className="relative">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <div className="flex items-center gap-3 pl-2 border-l border-primary/20">
              <span className="text-sm font-medium hidden sm:inline">{customerName}</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* SUCCESS MODAL */}
      {showModal && modalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop opacity-100 pointer-events-auto transition-opacity duration-300"
          onClick={handleModalBackdropClick}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white dark:bg-charcoal rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-primary/20 modal-content opacity-100 translate-y-0 transition-all duration-300">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-5xl">celebration</span>
              </div>
            </div>

            <h2 className="heading-serif text-4xl font-bold text-center text-primary">Thank you!</h2>
            <p className="text-center text-slate-600 dark:text-cream/70 mt-2">Your bond is now forever registered.</p>

            {modalData.ringImage && (
              <div className="mt-4 flex justify-center">
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-primary/20">
                  <img 
                    src={modalData.ringImage} 
                    alt={modalData.ring}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Ring';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 bg-primary/5 rounded-2xl p-6 space-y-3 text-sm border border-primary/10">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-bold">{modalData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ring</span>
                <span className="font-bold">{modalData.ring} ({modalData.sku})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total paid</span>
                <span className="font-bold text-primary">${modalData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock left</span>
                <span className="font-bold">{modalData.newStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase date</span>
                <span className="font-bold">{modalData.date}</span>
              </div>
            </div>

            <div className="mt-6 text-center text-slate-500 dark:text-cream/60 italic">
              “Every great love story starts with a single step.<br /> Yours is now etched in eternity.”
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to="/profile"
                className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-primary/80 transition-all flex items-center gap-2 shadow-lg"
              >
                <span>View your couple profile</span>
                <span className="material-symbols-outlined">favorite</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Step indicator - Only 2 steps */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Secure checkout</span>
          <h1 className="heading-serif text-5xl font-light mt-2">Purchase & verify your bond</h1>

          <div className="flex justify-center items-center gap-4 mt-8">
            <div className="flex flex-col items-center">
              <div className={getStepCircleClass(1)}>1</div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= 1 ? 'text-primary' : 'text-slate-500'}`}>
                Ring & customer info
              </span>
            </div>
            <span className="material-symbols-outlined text-primary/40">chevron_right</span>
            <div className="flex flex-col items-center">
              <div className={getStepCircleClass(2)}>2</div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= 2 ? 'text-primary' : 'text-slate-500'}`}>
                Delivery & confirm
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-6">{getStepDescription()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: Ring Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-pink-100 rounded-3xl p-6 border border-primary/10 shadow-premium sticky top-28">
              <h3 className="heading-serif text-2xl font-semibold mb-4 flex items-center gap-2 font-bold text-pink-90 dark:text-pink-600">
                <span className="material-symbols-outlined">diamond</span> Your selection
              </h3>
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-5">
                <img
                  src={ringData.image}
                  className="w-full h-full object-cover"
                  alt={ringData.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+not+available';
                  }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Ring name</span>
                  <span className="font-bold text-primary">{ringData.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">SKU</span>
                  <span className="font-mono text-sm text-primary">{ringData.sku}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="font-bold text-primary">{ringData.type}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Size</span>
                  <span className="font-bold text-primary">{ringData.size}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Price</span>
                  <span className="text-xl font-bold text-primary">$ {ringData.price}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Available stock</span>
                  <span className="font-bold text-green-600">{ringData.stock} left</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl">
                <p className="text-xs flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-primary text-lg">verified</span>
                  After purchase, this ring will be linked to your profile and stock will decrease.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Step Forms */}
          <div className="lg:col-span-2">
            {/* STEP 1 FORM */}
            {currentStep === 1 && (
              <div className="step-form space-y-8">
                <div className="bg-white dark:bg-pink-100 rounded-3xl p-8 border border-primary/10 shadow-premium">
                  <h3 className="heading-serif text-2xl font-semibold mb-4 flex items-center gap-2 font-bold text-pink-90 dark:text-pink-600">
                    <span className="material-symbols-outlined text-primary">person</span> Customer Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Anniversary Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={anniversary}
                        onChange={(e) => setAnniversary(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                      />
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-orange-900/20 border border-amber-100 dark:border-orange-300 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-orange-600">info</span>
                      <p className="text-xs text-orange-300 dark:text-orange-700">
                        This information will be used to create your couple profile and verify your purchase.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleToStep2}
                    className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-primary/80 transition-all flex items-center gap-2"
                  >
                    Continue to delivery <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 FORM - Delivery & Confirmation */}
            {currentStep === 2 && (
              <div className="step-form space-y-8">
                <div className="bg-white dark:bg-pink-100 rounded-3xl p-8 border border-primary/10 shadow-premium">
                  <h3 className="heading-serif text-2xl font-semibold mb-4 flex items-center gap-2 font-bold text-pink-90 dark:text-pink-600">
                    <span className="material-symbols-outlined text-primary">local_shipping</span> Delivery Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-primary/5 rounded-2xl p-6 mt-6">
                      <h4 className="font-bold mb-4 flex items-center gap-2 text-primary text-lg">
                        <span className="material-symbols-outlined text-primary">shopping_bag</span> Order Summary
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            {ringData.name} ({ringData.type}, {ringData.size})
                          </span>
                          <span className="font-bold">${subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Shipping & handling</span>
                          <span className="font-bold">${shipping}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Tax (estimated)</span>
                          <span className="font-bold">${tax}</span>
                        </div>
                        <div className="border-t border-primary/10 pt-3 flex justify-between font-bold text-lg text-primary">
                          <span>Total</span>
                          <span className="text-primary">${total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm mt-4">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={true}
                        onChange={() => {}}
                        className="text-primary h-5 w-5 rounded border-slate-300"
                      />
                      <label htmlFor="terms" className="text-primary">
                        I agree to the <Link to="/terms" className="text-primary underline">Terms</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={handleBackToStep1}
                    className="px-8 py-4 border border-primary/30 rounded-full font-bold hover:bg-primary/5 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">arrow_back</span> Back
                  </button>
                  <button
                    onClick={handleFinalPurchase}
                    className="bg-primary text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl hover:bg-primary/80 transition-all flex items-center gap-3"
                  >
                    <span>Complete purchase</span>
                    <span className="material-symbols-outlined">lock</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notification */}
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

      {/* Footer */}
      <footer className="bg-white dark:bg-black/10 border-t border-primary/10 mt-20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-400">
          <p>© BondKeeper · Secure checkout. All rights reserved.</p>
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
        
        .animate-slide-up-bottom {
          animation: slideUpBottom 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PurchaseView;