import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HistoryModal from './HistoryModal';
import { api } from '../lib/api';
import { getUserScopedLocalStorageItem, setUserScopedLocalStorageItem, removeUserScopedLocalStorageItem } from '../lib/userStorage';

const PURCHASED_RING_STORAGE_KEY = 'bondKeeper_purchased_ring';
const PAYMENT_WAIT_SECONDS = 5 * 60;
const RECEIPT_TIMESTAMP_WINDOW_MS = 5 * 60 * 1000;

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
  collection?: string;
  source?: 'cart' | 'ring' | 'direct';
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function buildQrMatrix(seed: string) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const normalizedSeed = String(seed || 'bondkeeper').split('').reduce((acc, char, index) => {
    return (acc + char.charCodeAt(0) * (index + 11)) % 10007;
  }, 17);

  const paintFinder = (rowStart: number, colStart: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const onBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const inCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        matrix[rowStart + row][colStart + col] = onBorder || inCenter;
      }
    }
  };

  paintFinder(0, 0);
  paintFinder(0, size - 7);
  paintFinder(size - 7, 0);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inFinderArea =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);

      if (inFinderArea) {
        continue;
      }

      const value = (row * 37 + col * 19 + normalizedSeed) % 11;
      const diagonal = (row + col + normalizedSeed) % 7 === 0;
      matrix[row][col] = value < 4 || diagonal;
    }
  }

  return matrix;
}

function resolveSelectedRing(cartItem: any, source: SelectedRing['source']): SelectedRing {
  return {
    name: cartItem?.ring_name || cartItem?.name || '',
    sku: cartItem?.ring_identifier || cartItem?.sku || '',
    type: cartItem?.material || cartItem?.type || '',
    size: String(cartItem?.size || '7'),
    price: Number(cartItem?.price || cartItem?.base_price || 0),
    stock: Number(cartItem?.stock || cartItem?.available_units || 3),
    image: cartItem?.image_url || cartItem?.img || cartItem?.image || '',
    id: cartItem?.ringId || cartItem?.id,
    collection: cartItem?.collection_name || cartItem?.collection || '',
    source,
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4001/api';

const PurchaseView: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<1 | 2>(1);
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState<number>(PAYMENT_WAIT_SECONDS);
  const [paymentOpenedAt, setPaymentOpenedAt] = useState<number>(0);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');
  const [paymentProofName, setPaymentProofName] = useState<string>('');
  const [paymentProofTimestamp, setPaymentProofTimestamp] = useState<number>(0);
  const [proofError, setProofError] = useState<string>('');
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Form states - Simplified for single person
  const [customerName, setCustomerName] = useState<string>('');
  const [anniversary, setAnniversary] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zip, setZip] = useState<string>('');
  const [country, setCountry] = useState<string>('');

  // Ring data from sessionStorage
  const [ringData, setRingData] = useState<SelectedRing>({
    name: '',
    sku: '',
    type: '',
    size: '',
    price: 0,
    stock: 3,
    image: ''
  });

  // Load ring data from sessionStorage
  useEffect(() => {
    // First check if coming from cart
    const checkoutCart = sessionStorage.getItem('checkoutCart');
    if (checkoutCart) {
      try {
        const cartItems = JSON.parse(checkoutCart);
        if (cartItems && cartItems.length > 0) {
          const firstItem = cartItems[0];
          setRingData(resolveSelectedRing(firstItem, 'cart'));
          return;
        }
      } catch (e) {
        console.error('Error parsing checkout cart:', e);
      }
    }
    
    // Then check if coming from single ring purchase
    const purchaseRing = sessionStorage.getItem('purchaseRing');
    if (purchaseRing) {
      try {
        const parsedRing = JSON.parse(purchaseRing);
        setRingData(resolveSelectedRing(parsedRing, 'ring'));
        return;
      } catch (e) {
        console.error('Error parsing purchase ring:', e);
      }
    }

    const currentRing = sessionStorage.getItem('currentRing');
    if (currentRing) {
      try {
        const parsedCurrentRing = JSON.parse(currentRing);
        setRingData(resolveSelectedRing(parsedCurrentRing, 'direct'));
      } catch (e) {
        console.error('Error parsing current ring:', e);
      }
    }
  }, []);

  // Load user data from sessionStorage
  useEffect(() => {
    const storedName = sessionStorage.getItem('auth_name');
    const storedEmail = sessionStorage.getItem('auth_email');
    if (storedName) setCustomerName(storedName);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (!showModal || !modalData) {
      return;
    }

    setPaymentStep(1);
    setPaymentSecondsLeft(PAYMENT_WAIT_SECONDS);
    setPaymentOpenedAt(Date.now());
    setPaymentProofPreview('');
    setPaymentProofName('');
    setPaymentProofTimestamp(0);
    setProofError('');
    setIsConfirmingPayment(false);
  }, [modalData, showModal]);

  useEffect(() => {
    if (!showModal || paymentStep !== 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setPaymentSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [paymentStep, showModal]);

  // Load cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const sessionId = getUserScopedLocalStorageItem('sessionId');
        if (!sessionId) return;
        
        const response = await fetch(`${API_BASE_URL}/cart`, {
          headers: { 'x-session-id': sessionId }
        });
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.data?.length || 0);
        }
      } catch (e) {
        console.error('Error fetching cart count:', e);
      }
    };
    
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

  const buildPurchasedRingPayload = () => ({
    id: ringData.id || Date.now(),
    ring_name: ringData.name,
    name: ringData.name,
    model_name: ringData.name,
    ring_identifier: ringData.sku,
    identifier: ringData.sku,
    sku: ringData.sku,
    image_url: ringData.image,
    img: ringData.image,
    material: ringData.type,
    metal: ringData.type,
    size: ringData.size,
    price: ringData.price,
    status: 'Purchased',
    collection_name: 'Verified purchase',
    created_at: new Date().toISOString(),
    payment_proof_name: paymentProofName,
    payment_proof_timestamp: paymentProofTimestamp ? new Date(paymentProofTimestamp).toISOString() : '',
    payment_verified_at: new Date().toISOString(),
  });

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
      showNotification('Sorry, this ring is out of stock.', 'error');
      return;
    }

    const newStock = ringData.stock - 1;

    setModalData({
      customerName,
      ring: ringData.name,
      sku: ringData.sku,
      price: ringData.price,
      newStock,
      date: new Date().toLocaleDateString(),
      ringImage: ringData.image,
      total,
    });

    setShowModal(true);
  };

  const handleProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileAge = Math.abs(Date.now() - file.lastModified);
    if (fileAge > RECEIPT_TIMESTAMP_WINDOW_MS) {
      setProofError('Please upload a recent payment screenshot taken within the last 5 minutes.');
      setPaymentProofPreview('');
      setPaymentProofName('');
      setPaymentProofTimestamp(0);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setProofError('Could not read the uploaded screenshot.');
        return;
      }

      setProofError('');
      setPaymentProofPreview(reader.result);
      setPaymentProofName(file.name);
      setPaymentProofTimestamp(file.lastModified);
    };
    reader.onerror = () => {
      setProofError('Could not read the uploaded screenshot.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    if (!paymentProofPreview || !paymentProofName || !paymentProofTimestamp) {
      setProofError('Upload your payment screenshot before continuing.');
      return;
    }

    const timestampGap = Math.abs(Date.now() - paymentProofTimestamp);
    if (timestampGap > RECEIPT_TIMESTAMP_WINDOW_MS) {
      setProofError('The screenshot timestamp is too old. Please upload a recent screenshot.');
      return;
    }

    setIsConfirmingPayment(true);

    try {
      const saved = saveOrderToHistory();
      if (!saved) {
        showNotification('Error processing order', 'error');
        return;
      }

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
      sessionStorage.setItem('newStock', String(Math.max(0, ringData.stock - 1)));
      sessionStorage.setItem('pendingPaymentProof', JSON.stringify({
        fileName: paymentProofName,
        timestamp: new Date(paymentProofTimestamp).toISOString(),
        verifiedAt: new Date().toISOString(),
      }));

      setUserScopedLocalStorageItem(PURCHASED_RING_STORAGE_KEY, JSON.stringify(buildPurchasedRingPayload()));

      try {
        await api.post('/notifications/payment-received', {
          customerName,
          ringName: ringData.name,
          sku: ringData.sku,
          total,
          orderNumber: `BK-${Date.now()}`,
          paymentMethod: 'Bank transfer',
          paidAt: new Date().toISOString(),
        });
      } catch (notificationError) {
        console.warn('Payment alert could not be saved:', notificationError);
      }

      removeUserScopedLocalStorageItem('cart');
      const sessionId = getUserScopedLocalStorageItem('sessionId');
      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/cart`, {
            method: 'DELETE',
            headers: {
              'x-session-id': sessionId,
            },
          });
        } catch {
          // Ignore cart cleanup failures and continue to My Ring.
        }
      }
      sessionStorage.removeItem('checkoutCart');
      sessionStorage.removeItem('purchaseRing');

      setShowModal(false);
      navigate('/myring');
    } catch (error) {
      console.error('Error confirming payment:', error);
      showNotification('Payment verification failed.', 'error');
    } finally {
      setIsConfirmingPayment(false);
    }
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

  const qrMatrix = React.useMemo(() => {
    const seed = modalData ? `${modalData.sku || 'bondkeeper'}-${modalData.total || modalData.price || 0}` : 'bondkeeper';
    return buildQrMatrix(seed);
  }, [modalData]);

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal">
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
              <span className="text-sm font-medium hidden sm:inline">{customerName || 'Guest'}</span>
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Step indicator */}
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
                  <span className="font-bold text-primary">{ringData.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">SKU</span>
                  <span className="font-mono text-sm text-primary">{ringData.sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Type</span>
                  <span className="font-bold text-primary">{ringData.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Size</span>
                  <span className="font-bold text-primary">{ringData.size || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-sm text-slate-500">Price</span>
                  <span className="text-xl font-bold text-primary">$ {ringData.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl">
                <p className="text-xs flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-primary text-lg">verified</span>
                  {ringData.source === 'cart'
                    ? 'This is the exact ring currently in your cart.'
                    : 'After purchase, this ring will be linked to your profile.'}
                </p>
                {ringData.collection ? (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Collection: {ringData.collection}
                    {ringData.source ? ` · Source: ${ringData.source}` : ''}
                  </p>
                ) : null}
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
                        Full Name *
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
                        Email Address *
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
                    className="bg-pink-500  px-10 py-4 rounded-full font-bold hover:bg-pink-600 transition-all flex items-center gap-2 text-white shadow-lg"
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
                        Phone Number *
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
                        Street Address *
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
                          City *
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
                          Country *
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
                        defaultChecked={true}
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
                    className="px-8 py-4 border border-primary/30 rounded-full font-bold hover:bg-primary/5 transition-colors flex items-center gap-2 bg-pink-600 text-white-700"
                  >
                    <span className="material-symbols-outlined">arrow_back</span> Back
                  </button>
                  <button
                    onClick={handleFinalPurchase}
                    className="  px-12 py-5 rounded-full text-lg font-bold shadow-xl hover:bg-primary/80 transition-all flex items-center gap-3 bg-green-500 text-white"
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

      {/* PAYMENT MODAL */}
      {showModal && modalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop opacity-100 pointer-events-auto transition-opacity duration-300"
          onClick={handleModalBackdropClick}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white dark:bg-charcoal rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-primary/20 modal-content opacity-100 translate-y-0 transition-all duration-300 max-h-[92vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {paymentStep === 1 ? (
              <div className="pt-4">
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-5xl">qr_code_2</span>
                  </div>
                </div>

                <p className="text-center text-[11px] tracking-[0.28em] uppercase font-bold text-primary/60">Scan To Pay</p>
                <h2 className="heading-serif text-4xl font-bold text-center text-primary mt-2">Payment QR</h2>
                <p className="text-center text-slate-600 dark:text-cream/70 mt-2 max-w-xl mx-auto">
                  Scan the QR code below to complete payment. This payment code is valid for {formatCountdown(paymentSecondsLeft)}.
                </p>

                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-sm rounded-[2rem] bg-white border border-slate-200 shadow-xl p-5">
                    <div className="rounded-[1.5rem] overflow-hidden border border-slate-100 bg-white p-4 relative">
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] font-bold text-slate-900">
                        <span>KHQR</span>
                        <span className="text-primary">BondKeeper</span>
                      </div>
                      <div className="mt-8 rounded-2xl bg-slate-50 p-4">
                        <div
                          className="grid aspect-square gap-1"
                          style={{ gridTemplateColumns: `repeat(${qrMatrix.length}, minmax(0, 1fr))` }}
                        >
                          {qrMatrix.map((row, rowIndex) =>
                            row.map((filled, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className={filled ? 'bg-black rounded-[2px]' : 'bg-white'}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="font-semibold text-slate-900">{modalData.customerName}</p>
                        <p className="text-sm text-slate-500">{modalData.ring} · ${modalData.total}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <p className="font-medium text-primary">Step 1 of 2</p>
                    <p className="mt-1">Open your banking app, scan the QR, and save a screenshot of the payment receipt.</p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-white/70 dark:bg-charcoal/60 p-4">
                    <p className="font-medium text-primary">Time window</p>
                    <p className="mt-1">
                      You have five minutes to pay. The next step unlocks when the timer reaches 00:00.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPaymentStep(2)}
                    disabled={paymentSecondsLeft > 0}
                    className={`px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all ${
                      paymentSecondsLeft > 0
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/80'
                    }`}
                  >
                    <span>{paymentSecondsLeft > 0 ? `Wait ${formatCountdown(paymentSecondsLeft)}` : 'Next'}</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-5xl">upload</span>
                  </div>
                </div>

                <p className="text-center text-[11px] tracking-[0.28em] uppercase font-bold text-primary/60">Upload Proof</p>
                <h2 className="heading-serif text-4xl font-bold text-center text-primary mt-2">Send your receipt</h2>
                <p className="text-center text-slate-600 dark:text-cream/70 mt-2 max-w-xl mx-auto">
                  Upload the screenshot you just took. We verify the file timestamp against the current time before sending you to My Ring.
                </p>

                <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-3xl border border-primary/10 bg-primary/5 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-primary/60 font-bold">Payment details</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-bold text-right">{modalData.customerName}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Ring</span>
                        <span className="font-bold text-right">{modalData.ring}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-bold text-primary text-right">${modalData.total}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Deadline</span>
                        <span className="font-bold text-right">{formatCountdown(paymentSecondsLeft)}</span>
                      </div>
                    </div>

                    {paymentProofPreview && (
                      <div className="mt-5 rounded-2xl overflow-hidden border border-primary/10 bg-white">
                        <img src={paymentProofPreview} alt="Payment proof preview" className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-primary/10 bg-white/80 dark:bg-charcoal/60 p-5">
                    <label className="block text-xs uppercase tracking-[0.25em] text-primary/60 font-bold mb-3">
                      Upload screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-primary/90"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      We only accept screenshots or photos saved within the last 5 minutes.
                    </p>
                    {paymentProofName && (
                      <p className="mt-3 text-sm font-medium text-primary break-all">
                        Selected: {paymentProofName}
                      </p>
                    )}
                    {proofError && (
                      <p className="mt-3 text-sm font-medium text-red-500">{proofError}</p>
                    )}

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-800 mb-1">Timestamp check</p>
                      <p>
                        Your screenshot file time must be close to the current time so we can confirm it was captured during payment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStep(1)}
                    className="px-8 py-4 rounded-full font-bold border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                  >
                    Back to QR
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmPayment()}
                    disabled={isConfirmingPayment}
                    className="px-8 py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{isConfirmingPayment ? 'Verifying...' : 'Verify & Go to My Ring'}</span>
                    <span className="material-symbols-outlined">verified</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          <p>Â© BondKeeper Â· Secure checkout. All rights reserved.</p>
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
