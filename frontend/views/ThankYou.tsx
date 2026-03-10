import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Types
interface PurchaseData {
  partner1: string;
  partner2: string;
  ring: string;
  sku: string;
  price: number;
  newStock: number;
  date: string;
}

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

const ThankYou: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [simulateDisabled, setSimulateDisabled] = useState<boolean>(false);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Check if we have purchase data from previous page
  useEffect(() => {
    try {
      const storedCouple = sessionStorage.getItem('bondKeeper_couple');
      if (storedCouple) {
        const coupleData: CoupleProfile = JSON.parse(storedCouple);
        
        // Check if we have a pending purchase to show
        const showThankYou = sessionStorage.getItem('showThankYou') === 'true';
        
        if (showThankYou) {
          setPurchaseData({
            partner1: coupleData.partner1,
            partner2: coupleData.partner2,
            ring: coupleData.ring,
            sku: coupleData.sku,
            price: coupleData.price,
            newStock: parseInt(sessionStorage.getItem('newStock') || '0'),
            date: coupleData.purchaseDate
          });
          
          // Show modal automatically
          setTimeout(() => {
            setShowModal(true);
          }, 500);
          
          // Clear the flag
          sessionStorage.removeItem('showThankYou');
        }
      }
    } catch (e) {
      console.error('Error loading purchase data:', e);
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

  // Function to show modal with custom data
  const showThankYouModal = (data: PurchaseData) => {
    setPurchaseData(data);
    setShowModal(true);
    setSimulateDisabled(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Simulate purchase (for demo)
  const handleSimulatePurchase = () => {
    const ringPrice = 899;
    const newStock = 2; // after decrease

    // Mock data that would come from your form
    const coupleProfile: CoupleProfile = {
      id: 'CP' + Math.floor(Math.random() * 10000),
      partner1: 'Alex Rivera',
      partner2: 'Sam Rivera',
      email: 'couple@bondkeeper.com',
      phone: '+855 12 345 678',
      address: '#123, Street 456, Phnom Penh, Cambodia',
      ring: 'Twin Souls Silver B',
      sku: 'TSS-002-X9',
      price: ringPrice,
      purchaseDate: new Date().toLocaleDateString(),
    };

    // Store in session
    sessionStorage.setItem('bondKeeper_couple', JSON.stringify(coupleProfile));
    localStorage.removeItem('cart');

    // Show the beautiful modal
    showThankYouModal({
      partner1: coupleProfile.partner1,
      partner2: coupleProfile.partner2,
      ring: coupleProfile.ring,
      sku: coupleProfile.sku,
      price: coupleProfile.price,
      newStock: newStock,
      date: coupleProfile.purchaseDate,
    });
  };

  return (
    <>
      {/* SUCCESS MODAL */}
      {showModal && purchaseData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop opacity-100 pointer-events-auto transition-opacity duration-300"
          onClick={handleBackdropClick}
        >
          {/* backdrop with blur */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          {/* modal card */}
          <div className="relative bg-white dark:bg-charcoal rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-primary/20 modal-content opacity-100 translate-y-0 transition-all duration-300">
            {/* close button (optional) */}
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

            {/* purchase details (dynamic) */}
            <div className="mt-8 bg-primary/5 rounded-2xl p-6 space-y-3 text-sm border border-primary/10">
              <div className="flex justify-between">
                <span className="text-slate-500">Couple</span>
                <span className="font-bold">{purchaseData.partner1} & {purchaseData.partner2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ring</span>
                <span className="font-bold">{purchaseData.ring} ({purchaseData.sku})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total paid</span>
                <span className="font-bold text-primary">${purchaseData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock left</span>
                <span className="font-bold">{purchaseData.newStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase date</span>
                <span className="font-bold">{purchaseData.date}</span>
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

      {/* Main content */}
      <main className="min-h-screen flex items-center justify-center bg-cream dark:bg-charcoal">
        <div className="text-center p-12">
          <div className="mb-8">
            <span className="material-symbols-outlined text-8xl text-primary/20">diamond</span>
          </div>
          
          <h1 className="heading-serif text-5xl font-light mb-4 dark:text-white">
            Thank You Modal Demo
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            This page demonstrates the beautiful thank you modal that appears after a successful purchase.
            Click the button below to see it in action.
          </p>
          
          <button 
            onClick={handleSimulatePurchase}
            disabled={simulateDisabled}
            className={`bg-primary text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl hover:bg-primary/80 transition-all flex items-center gap-3 mx-auto ${
              simulateDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>{simulateDisabled ? 'Purchase completed' : 'Simulate purchase'}</span>
            <span className="material-symbols-outlined">
              {simulateDisabled ? 'check_circle' : 'arrow_forward'}
            </span>
          </button>
          
          {!simulateDisabled && (
            <p className="text-slate-400 dark:text-slate-500 mt-6 text-sm">
              Click to see the beautiful thank‑you modal.
            </p>
          )}

          {simulateDisabled && (
            <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 max-w-md mx-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ✨ The modal has been displayed. You can close it and click again to see it once more.
              </p>
              <button 
                onClick={() => setSimulateDisabled(false)}
                className="mt-3 text-primary hover:underline text-sm font-medium"
              >
                Reset demo
              </button>
            </div>
          )}

          {/* Integration Guide */}
          <div className="mt-16 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-primary/10 text-left max-w-2xl mx-auto">
            <h3 className="heading-serif text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">code</span>
              Integration Guide
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              To integrate this modal into your purchase flow, replace your alert with:
            </p>
            <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-xs overflow-x-auto">
{`// Import the showThankYouModal function or use the component
// In your Purchase component, after successful purchase:

const purchaseData = {
  partner1: "Alex Rivera",
  partner2: "Sam Rivera", 
  ring: "Twin Souls Silver B",
  sku: "TSS-002-X9",
  price: 899,
  newStock: 2,
  date: new Date().toLocaleDateString()
};

// Store data in sessionStorage and redirect
sessionStorage.setItem('bondKeeper_couple', JSON.stringify(coupleProfile));
sessionStorage.setItem('showThankYou', 'true');
sessionStorage.setItem('newStock', newStock.toString());

// Redirect to ThankYou page
navigate('/thank-you');`}
            </pre>
          </div>
        </div>
      </main>
    </>
  );
};

export default ThankYou;