import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CoupleProfile {
  id: string;
  partner1: string;
  partner2: string;
  email: string;
  phone: string;
  address: string;
  ring: string;
  sku: string;
  price: number;
  purchaseDate: string;
}

interface ExistingRelationship {
  partner1: string;
  partner2: string;
}

const PurchaseView: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any>(null);
  
  // Form states
  const [partner1, setPartner1] = useState<string>('Alex Rivera');
  const [partner2, setPartner2] = useState<string>('Sam Rivera');
  const [anniversary, setAnniversary] = useState<string>('2023-06-15');
  const [email, setEmail] = useState<string>('couple@bondkeeper.com');
  
  const [phone, setPhone] = useState<string>('+855 12 345 678');
  const [altPhone, setAltPhone] = useState<string>('+855 98 765 432');
  const [address, setAddress] = useState<string>('#123, Street 456, Phnom Penh');
  const [city, setCity] = useState<string>('Phnom Penh');
  const [zip, setZip] = useState<string>('12101');
  const [country, setCountry] = useState<string>('Cambodia');
  const [nc1, setNc1] = useState<string>('N-123456789');
  const [nc2, setNc2] = useState<string>('N-987654321');
  
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [cardNumber, setCardNumber] = useState<string>('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState<string>('12/28');
  const [cvc, setCvc] = useState<string>('123');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // Ring data (could come from cart or session)
  const [ringData] = useState({
    name: 'Twin Souls Silver B',
    sku: 'TSS-002-X9',
    type: 'Sterling Silver',
    size: '7 (adjustable)',
    price: 899,
    stock: 3,
    image: 'https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900'
  });

  // Existing relationships (for duplicate check)
  const [existingRelationships] = useState<ExistingRelationship[]>([]);

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
    alert('No new notifications');
  };

  // Navigation functions
  const showStep = (step: number) => {
    setCurrentStep(step);
  };

  // Step 1 validation
  const validateStep1 = (): boolean => {
    if (!partner1 || !partner2 || !email) {
      alert('Please fill partner names and email.');
      return false;
    }
    return true;
  };

  // Step 2 validation
  const validateStep2 = (): boolean => {
    if (!phone || !address || !city || !country || !nc1 || !nc2) {
      alert('Please fill all required delivery and ID fields.');
      return false;
    }
    return true;
  };

  // Step 3 validation
  const validateStep3 = (): boolean => {
    if (!termsAccepted) {
      alert('You must agree to the Terms and Privacy Policy.');
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

  const handleToStep3 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      showStep(3);
    }
  };

  const handleBackToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    showStep(2);
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
  };

  // Handle final purchase
  const handleFinalPurchase = (e: React.MouseEvent) => {
    e.preventDefault();

    // Final validations
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    // Stock check
    if (ringData.stock <= 0) {
      alert('❌ Sorry, this ring is out of stock.');
      return;
    }

    // Duplicate check
    const duplicate = existingRelationships.some(rel => 
      (rel.partner1 === partner1 && rel.partner2 === partner2) || 
      (rel.partner1 === partner2 && rel.partner2 === partner1)
    );
    
    if (duplicate) {
      alert('❌ Relationship already exists. Duplicate bond not allowed.');
      return;
    }

    // Simulate stock decrease
    const newStock = ringData.stock - 1;
    
    // Record relationship
    const newRelationship = { partner1, partner2 };
    existingRelationships.push(newRelationship);

    // Store couple profile
    const coupleProfile: CoupleProfile = {
      id: 'CP' + Math.floor(Math.random()*10000),
      partner1,
      partner2,
      email,
      phone,
      address: `${address}, ${city}, ${country}`,
      ring: ringData.name,
      sku: ringData.sku,
      price: ringData.price,
      purchaseDate: new Date().toLocaleDateString(),
    };
    
    // Store data in sessionStorage for the Thank You page
    sessionStorage.setItem('bondKeeper_couple', JSON.stringify(coupleProfile));
    sessionStorage.setItem('showThankYou', 'true');
    sessionStorage.setItem('newStock', newStock.toString());
    localStorage.removeItem('cart'); // clear cart

    // Show beautiful modal
    setModalData({
      partner1,
      partner2,
      ring: ringData.name,
      sku: ringData.sku,
      price: ringData.price,
      newStock,
      date: new Date().toLocaleDateString(),
    });
    
    setShowModal(true);

    // Redirect to profile after modal is shown
    setTimeout(() => {
      window.location.href = '/profile';
    }, 3000);
  };

  // Handle modal backdrop click
  const handleModalBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Calculate order totals
  const subtotal = ringData.price;
  const shipping = 25;
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + shipping + tax;

  // Get step circle class
  const getStepCircleClass = (step: number): string => {
    const baseClass = "step w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2";
    if (currentStep >= step) {
      return `${baseClass} bg-primary text-white border-primary shadow-md`;
    }
    return `${baseClass} bg-white border border-slate-300 text-slate-500`;
  };

  // Get step description
  const getStepDescription = (): string => {
    switch(currentStep) {
      case 1: return 'Step 1: Choose ring & fill partner information';
      case 2: return 'Step 2: Delivery & identity verification';
      case 3: return 'Step 3: Payment & final confirmation';
      default: return '';
    }
  };

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
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleNotificationClick} className="text-charcoal/60 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications_none</span>
            </button>
            <button onClick={toggleDarkMode} className="text-charcoal/60 hover:text-primary transition-colors">
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

      {/* SUCCESS MODAL */}
      {showModal && modalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop opacity-100 pointer-events-auto transition-opacity duration-300"
          onClick={handleModalBackdropClick}
        >
          {/* backdrop with blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          {/* modal card */}
          <div className="relative bg-white dark:bg-charcoal rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-primary/20 modal-content opacity-100 translate-y-0 transition-all duration-300">
            {/* close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            {/* success icon with animation */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-5xl">celebration</span>
              </div>
            </div>

            {/* thank you heading */}
            <h2 className="heading-serif text-4xl font-bold text-center text-primary">Thank you!</h2>
            <p className="text-center text-slate-600 dark:text-cream/70 mt-2">Your bond is now forever registered.</p>

            {/* purchase details */}
            <div className="mt-8 bg-primary/5 rounded-2xl p-6 space-y-3 text-sm border border-primary/10">
              <div className="flex justify-between">
                <span className="text-slate-500">Couple</span>
                <span className="font-bold">{modalData.partner1} & {modalData.partner2}</span>
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

            {/* heartwarming message */}
            <div className="mt-6 text-center text-slate-500 dark:text-cream/60 italic">
              “Every great love story starts with a single step.<br /> Yours is now etched in eternity.”
            </div>

            {/* action button */}
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
        {/* Step indicator */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.3em] text-primary/70 font-semibold">Secure checkout</span>
          <h1 className="heading-serif text-5xl font-light mt-2">Purchase & verify your bond</h1>
          
          {/* Step circles with labels */}
          <div className="flex justify-center items-center gap-4 mt-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={getStepCircleClass(1)}>1</div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= 1 ? 'text-primary' : 'text-slate-500'}`}>
                Ring & relationship
              </span>
            </div>
            <span className="material-symbols-outlined text-primary/40">chevron_right</span>
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={getStepCircleClass(2)}>2</div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= 2 ? 'text-primary' : 'text-slate-500'}`}>
                Delivery & identity
              </span>
            </div>
            <span className="material-symbols-outlined text-primary/40">chevron_right</span>
            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={getStepCircleClass(3)}>3</div>
              <span className={`text-xs mt-2 font-medium ${currentStep >= 3 ? 'text-primary' : 'text-slate-500'}`}>
                Payment & confirm
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-6">{getStepDescription()}</p>
        </div>

        {/* Multi-step container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT: ring details (visible in all steps) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-80 rounded-3xl p-6 border border-primary/10 shadow-premium sticky top-28">
              <h3 className="heading-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">diamond</span> Your selection
              </h3>
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-5">
                <img 
                  src={ringData.image} 
                  className="w-full h-full object-cover" 
                  alt={ringData.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop';
                  }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Ring name</span>
                  <span className="font-bold dark:text-white">{ringData.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">SKU</span>
                  <span className="font-mono text-sm dark:text-white">{ringData.sku}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="font-bold dark:text-white">{ringData.type}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Size</span>
                  <span className="font-bold dark:text-white">{ringData.size}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Price</span>
                  <span className="text-xl font-bold text-primary">$ {ringData.price}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Available stock</span>
                  <span className="font-bold text-green-600" id="stock-display">
                    {ringData.stock} left
                  </span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl">
                <p className="text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">verified</span> 
                  After purchase, this ring will be linked to your couple profile and stock will decrease.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: dynamic step forms */}
          <div className="lg:col-span-2">
            {/* STEP 1 FORM */}
            {currentStep === 1 && (
              <div className="step-form space-y-8">
                <div className="bg-white dark:bg-slate-80 rounded-3xl p-8 border border-primary/10 shadow-premium">
                  <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">favorite</span> Register your relationship
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
  <label className="block text-xs font-bold uppercase tracking-widest text-pink-600 mb-2">
    Partner 1 Full Name
  </label>

  <input
    type="text"
    value={partner1}
    onChange={(e) => setPartner1(e.target.value)}
    className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
    placeholder="Enter full name"
    required
  />
</div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Partner 2 full name
                      </label>
                      <input 
                        type="text" 
                        value={partner2}
                        onChange={(e) => setPartner2(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-pink-400 mb-2">
                        Anniversary date
                      </label>
                      <input 
                        type="date" 
                        value={anniversary}
                        onChange={(e) => setAnniversary(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-pink-400 mb-2">
                        Email (both share)
                      </label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-orange-900/20 border border-amber-100 dark:border-orange-300 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-orange-600">info</span>
                    <p className="text-xs text-orange-300 dark:text-orange-700">
                      We'll check for existing relationship with the same partners. Duplicate bonds are not allowed.
                    </p>
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

            {/* STEP 2 FORM */}
            {currentStep === 2 && (
              <div className="step-form space-y-8">
                <div className="bg-white dark:bg-slate-80 rounded-3xl p-8 border border-primary/10 shadow-premium">
                  <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">contact_mail</span> Delivery & identity
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Phone number (both)
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
                          Alternative phone
                        </label>
                        <input 
                          type="tel" 
                          value={altPhone}
                          onChange={(e) => setAltPhone(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                        Street address / P.O. Box
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
                          Postal code
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Partner 1 National ID (NC)
                        </label>
                        <input 
                          type="text" 
                          value={nc1}
                          onChange={(e) => setNc1(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                          Partner 2 National ID (NC)
                        </label>
                        <input 
                          type="text" 
                          value={nc2}
                          onChange={(e) => setNc2(e.target.value)}
                          className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          required
                        />
                      </div>
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
                    onClick={handleToStep3}
                    className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-primary/80 transition-all flex items-center gap-2"
                  >
                    Continue to payment <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 FORM */}
            {currentStep === 3 && (
              <div className="step-form space-y-8">
                <div className="bg-white dark:bg-slate-80 rounded-3xl p-8 border border-primary/10 shadow-premium">
                  <h3 className="heading-serif text-2xl font-semibold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">credit_card</span> Payment & confirmation
                  </h3>
                  
                  {/* Order summary */}
                  <div className="bg-primary/5 rounded-2xl p-6 mb-8">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">shopping_bag</span> Order summary
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
                      <div className="border-t border-primary/10 pt-3 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">${total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                        Payment method
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary/50">
                          <input 
                            type="radio" 
                            name="payment" 
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-primary h-4 w-4"
                          />
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">credit_card</span> Credit card
                          </span>
                        </label>
                        <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary/50">
                          <input 
                            type="radio" 
                            name="payment" 
                            value="aba"
                            checked={paymentMethod === 'aba'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-primary h-4 w-4"
                          />
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">account_balance</span> ABA Pay
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    {paymentMethod === 'card' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                            Card number
                          </label>
                          <input 
                            type="text" 
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                            Expiry (MM/YY)
                          </label>
                          <input 
                            type="text" 
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                            CVC
                          </label>
                          <input 
                            type="text" 
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            className="w-full px-5 py-3 bg-pink-100 border border-pink-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'aba' && (
                      <div className="p-6 bg-primary/5 rounded-xl text-center">
                        <p className="text-sm mb-2">You will be redirected to ABA Pay to complete your payment.</p>
                        <p className="text-xs text-slate-500">After payment confirmation, your order will be processed.</p>
                      </div>
                    )}

                    <label className="flex items-center gap-3 text-sm">
                      <input 
                        type="checkbox" 
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="text-primary h-5 w-5 rounded border-slate-300"
                      />
                      <span className="dark:text-white">
                        I agree to the <Link to="/terms" className="text-primary underline">Terms</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button 
                    onClick={handleBackToStep2}
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

      {/* Footer */}
      <footer className="bg-white dark:bg-charcoal border-t border-primary/10 mt-20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-400">
          <p>© BondKeeper · 3‑step secure checkout. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PurchaseView;