import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Types
interface Ring {
  id: number;
  ring_identifier: string;
  ring_name: string;
  model_id: string | null;
  batch_id: string | null;
  size: string;
  material: string;
  status: string;
  location_type: string;
  location_label: string | null;
  battery_level: number | null;
  last_seen_at: string | null;
  last_seen_lat: number | null;
  last_seen_lng: number | null;
  price: number;
  image_url: string;
  created_at: string;
  updated_at: string;
  img: string;
  name: string;
  metal: string;
  cert: string;
  type: string;
  isNew: boolean;
  model_name: string;
  collection: string;
  identifier: string;
}

interface Filters {
  material: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

// 50 Beautiful Ring Images (fallback)
const RING_IMAGES = [
  "https://jewelemarket.com/cdn/shop/products/1506902.jpg?v=1749642089&width=900",
  "https://loforay.com/cdn/shop/products/O1CN01yJYHgs1uzyLnogHKq__3222026109-0-cib.jpg?v=1677245225",
  "https://esdomera.com/cdn/shop/files/classic-pink-morganite-leaf-floral-engagement-his-and-hers-wedding-ring-pink-yellow-gold-promise-couple-rings-esdomera-2_1800x1800.png?v=1743672938",
  "https://m.media-amazon.com/images/I/61btVGnRO6L._AC_UF894,1000_QL80_.jpg",
  "https://jewelrybyjohan.com/cdn/shop/products/E3362WG10-2150BCArtCropped_1-5.jpg?v=1675110462&width=695",
  "https://img.kwcdn.com/product/open/2023-09-05/1693914328872-5ec4896063854249a6f2609cca8c9a22-goods.jpeg",
  "https://i.pinimg.com/736x/0e/21/48/0e2148ac9639fa9f608f95c7584f4f98.jpg",
  "https://www.tajjewels.com/cdn/shop/products/19_FRONT_RoseGold_1080x.jpg?v=1650544247",
  "https://img.kwcdn.com/product/fancy/d42a9fc0-5d2e-4728-a4fc-7edb6afb62b7.jpg",
  "https://i.pinimg.com/originals/91/e0/eb/91e0ebb8563c8cd36337297331ab6a94.jpg",
  "https://cdn.augrav.com/online/jewels/2023/12/13110756/113.jpg",
  "https://m.media-amazon.com/images/I/51MTmuSy5eL._AC_UY1100_.jpg",
  "https://img.joomcdn.net/ce020665a289dab3b7fa1aa8e1482ec91f953958_original.jpeg",
  "https://i.etsystatic.com/16396575/r/il/51d9af/6115811213/il_570xN.6115811213_jfpd.jpg",
  "https://rukminim2.flixcart.com/image/480/640/xif0q/ring/1/b/j/adjustable-2-mkcr112-ring-myki-original-imagr5pjxbajyewj.jpeg?q=90",
  "https://i.pinimg.com/736x/1a/f3/6c/1af36c7a1c3e754334108a43a163b0ab.jpg",
  "https://i5.walmartimages.com/asr/cecf5302-3a84-45c2-95c7-ec5f4c212f4d.b8654ded71d4429be2d4d4febef4d2d6.jpeg?q=80",
  "https://sc04.alicdn.com/kf/H287107c64b9b4182b8477fd7ba79b7d21.jpg",
  "https://esdomera.com/cdn/shop/files/4F9A3506.jpg?v=1758004629&width=900",
  "https://cpimg.tistatic.com/08073806/b/4/Diamond-Couple-Rings.jpg",
  "https://m.media-amazon.com/images/I/61Jj1R1UChL._AC_UY1000_.jpg",
  "https://i.pinimg.com/474x/fd/61/84/fd61841efb1466054aab3424f076cb98.jpg",
  "https://laraso.com/cdn/shop/files/4811BL-3946_1000x1000.jpg?v=1757118068",
  "https://www.loville.co/cdn/shop/products/CPR5013FANTASY-1_600x600.jpg?v=1586341339",
  "https://m.media-amazon.com/images/I/81QzSKSsObS._AC_UY1000_.jpg",
  "https://t3.ftcdn.net/jpg/18/72/14/94/360_F_1872149462_JAK23sHoI6L4U5RrfFm25JQNUbFFC7QB.jpg",
  "https://img.kwcdn.com/product/open/2023-09-05/1693903526024-a72036188e734902ac941154dd5c6b3e-goods.jpeg",
  "https://i5.walmartimages.com/seo/Solid-10k-Yellow-Gold-His-Hers-Round-Diamond-Square-Matching-Couple-Three-Rings-Bridal-Engagement-Ring-Wedding-Bands-Set-1-12-Ct-L-9-M-10-5_e2bd050b-f2bd-451b-94ae-512679a5a087.9f8aa8cf42a34b3f048d1ea934507652.jpeg",
  "https://rukminim2.flixcart.com/image/480/640/k5vcya80/ring/j/e/a/adjustable-swn11nos1-ring-set-silvoswan-original-imafzgn9h6hpz9f4.jpeg?q=90",
  "https://springfieldjewellers.com.au/cdn/shop/articles/0Q7A9115-Edit-ready.jpg?v=1673850669",
  "https://media.tiffany.com/is/image/tco/2025_LE_QL_ChooseWeddingBand",
  "https://images-cdn.ubuy.qa/6544da4b4b2080775f561172-two-rings-his-hers-wedding-ring-sets.jpg",
  "https://ak1.ostkcdn.com/images/products/is/images/direct/7f162be8b39f733297ef76df51ffdd2c9515664d/Womens-3.25-CT-Princess-Cut-Wedding-Band-Engagement-Ring-Set-Silver.jpg",
  "https://i.pinimg.com/736x/eb/6a/72/eb6a722528b92ffdc943edbfa51b6ae1.jpg",
  "https://www.gemsmagic.com/cdn/shop/files/moss-agate-stag-inspired-couple-ring-set-nature-inspired-elven-rings-5905061_ee4ffdfc-383d-44b3-bb99-2f336a627cb3.webp?v=1767164444&width=2000",
  "https://cpimg.tistatic.com/7551683/b/4/real-diamond-couple-ring.jpg",
  "https://cdn-media.glamira.com/media/product/newgeneration/view/1/sku/pretty-raw-pair-v/womenstone/diamond-zirconia_AAAAA/alloycolour/yellow.jpg",
  "https://images.meesho.com/images/products/646386768/75km6_512.webp?width=512",
  "https://www.thelordofgemrings.com/cdn/shop/files/ruby-sapphire-diamond-railway-couple-birthstone-band-18k-gold-334656.jpg?v=1717646221",
  "https://cpimg.tistatic.com/8354229/b/1/modern-diamond-couple-band-ring.jpg",
  "https://www.ethanlord.com/cdn/shop/articles/Untitled_design_3.png?v=1763389639",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLfrMDiRQKW3vt2DEVVwnBmu838MgF9fmDYw&s",
  "https://images-aka.zales.com/plp/20250203_visnav/1%20Engagement%20PLP/FY26_0205_Z_NOPART_EngagementBridalSets_NoPromo_PLPTriggerBank_WEB_STATIC_GM_DSK_300x300.jpg",
  "https://i.pinimg.com/474x/22/72/e8/2272e85623fa218a6a541240041a9b42.jpg",
  "https://siyari.com/cdn/shop/files/SHOPIFYRESIZE-2025-10-03T130834.930.png?v=1760421993&width=1200",
  "https://m.media-amazon.com/images/I/61hC7x0SgdL._AC_UY1100_.jpg",
  "https://i.etsystatic.com/32012347/r/il/766d1d/5100701107/il_fullxfull.5100701107_lged.jpg",
  "https://png.pngtree.com/png-clipart/20240612/original/pngtree-illustration-of-luxury-couple-rings-png-image_15310403.png",
  "https://www.candere.com/media/jewellery/images/C025805G__6.jpeg",
  "https://cdn.augrav.com/online/jewels/2023/03/21163959/2-72.jpg",
  "https://www.blackdiamondsnewyork.com/cdn/shop/files/52-hz-whale-couple-adjustable-ring-261750_41ccfc6c-c456-4319-b53f-4dd5fa3d4519.png?v=1754917060",
  "https://media2.bulgari.com/f_auto,q_auto,c_pad,h_520,w_520/production/dw73065518/images/images/1428139.png",
  "https://www.77diamonds.com/image/149231/thumb/white-gold-9k/-/toi-et-moi-emerald?v=20250724112614143?width=490/height=350",
  "https://www.jewelove.in/cdn/shop/files/jewelove-platinum-couple-rings-with-single-diamond-ring-for-men-half-eternity-ring-for-women-jl-pt-908-41525771305201_3400x.jpg?v=1726347744",
  "https://www.jewelslane.com/cdn/shop/collections/390e29522d597c608f0d91088edf2ded.jpg?v=1755361799"
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const CoupleShopView: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [allRings, setAllRings] = useState<Ring[]>([]);
  const [filteredRings, setFilteredRings] = useState<Ring[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [materials, setMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [cartCount, setCartCount] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  const [filters, setFilters] = useState<Filters>({
    material: '',
    minPrice: '',
    maxPrice: '',
    sort: 'featured'
  });

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

  // Handle notification click
  const handleNotificationClick = () => {
    alert('No new notifications');
  };

  // Load rings from API
  const loadRingsFromAPI = useCallback(async () => {
    setIsLoading(true);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (filters.material) queryParams.append('material', filters.material);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      
      const url = `${API_BASE_URL}/rings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('Fetching rings from:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const apiRings = data.data || [];
        console.log(`Received ${apiRings.length} rings from API`);
        
        // Map API rings to our format
        const mappedRings = apiRings.map((ring: any, index: number) => ({
          id: ring.id,
          ring_identifier: ring.ring_identifier || `BK-${String(index + 1).padStart(3, '0')}`,
          ring_name: ring.ring_name,
          model_id: ring.model_id,
          batch_id: ring.batch_id,
          size: ring.size || '7',
          material: ring.material || 'Unknown',
          status: ring.status || 'AVAILABLE',
          location_type: ring.location_type || 'WAREHOUSE',
          location_label: ring.location_label,
          battery_level: ring.battery_level,
          last_seen_at: ring.last_seen_at,
          last_seen_lat: ring.last_seen_lat,
          last_seen_lng: ring.last_seen_lng,
          price: parseFloat(ring.price) || 0,
          image_url: ring.image_url || RING_IMAGES[index % RING_IMAGES.length],
          created_at: ring.created_at,
          updated_at: ring.updated_at,
          
          // Computed fields
          img: ring.image_url || RING_IMAGES[index % RING_IMAGES.length],
          name: ring.ring_name,
          metal: ring.material,
          cert: ring.status || 'AVAILABLE',
          type: mapMaterialToType(ring.material),
          isNew: isNewRing(ring.created_at),
          model_name: ring.model_name || 'Signature Collection',
          collection: ring.collection_name || 'Classic',
          identifier: ring.ring_identifier
        }));

        setAllRings(mappedRings);
        
        // If we have fewer than 50 rings, generate additional ones
        if (mappedRings.length < 50) {
          const additionalNeeded = 50 - mappedRings.length;
          console.log(`Generating ${additionalNeeded} additional rings to reach 50`);
          
          const additionalRings = [];
          for (let i = 0; i < additionalNeeded; i++) {
            const newId = 1000 + i;
            const metal = ['18K Gold', 'Platinum', 'Rose Gold', 'Sterling Silver'][Math.floor(Math.random() * 4)];
            additionalRings.push({
              id: newId,
              ring_identifier: `GEN-${String(i + 1).padStart(3, '0')}`,
              ring_name: `Designer Ring ${i + 1}`,
              model_id: null,
              batch_id: null,
              size: ['5','6','7','8','9','10'][Math.floor(Math.random() * 6)],
              material: metal,
              status: 'AVAILABLE',
              location_type: 'WAREHOUSE',
              location_label: 'Virtual Inventory',
              battery_level: null,
              last_seen_at: null,
              last_seen_lat: null,
              last_seen_lng: null,
              price: Math.floor(Math.random() * 5000) + 1000,
              image_url: RING_IMAGES[(mappedRings.length + i) % RING_IMAGES.length],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              img: RING_IMAGES[(mappedRings.length + i) % RING_IMAGES.length],
              name: `Designer Ring ${i + 1}`,
              metal: metal,
              cert: 'AVAILABLE',
              type: mapMaterialToType(metal),
              isNew: Math.random() > 0.5,
              model_name: 'Designer Collection',
              collection: ['Modern', 'Classic', 'Vintage'][Math.floor(Math.random() * 3)],
              identifier: `GEN-${String(i + 1).padStart(3, '0')}`
            });
          }
          
          setAllRings(prev => [...prev, ...additionalRings]);
        }
      } else {
        console.warn('API returned error, using fallback rings');
        setAllRings(generateFallbackRings());
      }
    } catch (error) {
      console.error('Error loading rings:', error);
      setAllRings(generateFallbackRings());
    } finally {
      setIsLoading(false);
    }
  }, [filters.material, filters.minPrice, filters.maxPrice]);

  // Load filter options from API
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rings/filter-options`);
      if (!response.ok) throw new Error('Failed to load filter options');
      
      const data = await response.json();
      
      // Update materials
      if (data.data.materials && data.data.materials.length > 0) {
        setMaterials(data.data.materials);
      } else {
        setMaterials(['18K Gold', 'Platinum', 'Rose Gold', 'Sterling Silver']);
      }

      // Update price range
      if (data.data.priceRange) {
        setPriceRange({
          min: data.data.priceRange.min_price || 0,
          max: data.data.priceRange.max_price || 10000
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      setMaterials(['18K Gold', 'Platinum', 'Rose Gold', 'Sterling Silver']);
    }
  }, []);

  // Generate fallback rings if API fails
  const generateFallbackRings = (): Ring[] => {
    const rings: Ring[] = [];
    for (let i = 0; i < 50; i++) {
      const metal = ['18K Gold', 'Platinum', 'Rose Gold', 'Sterling Silver'][Math.floor(Math.random() * 4)];
      rings.push({
        id: i + 1,
        ring_identifier: `BK-${String(i + 1).padStart(3, '0')}`,
        ring_name: `Eternal Ring ${i + 1}`,
        model_id: null,
        batch_id: null,
        size: ['5','6','7','8','9','10'][Math.floor(Math.random() * 6)],
        material: metal,
        status: 'AVAILABLE',
        location_type: 'WAREHOUSE',
        location_label: 'Main Warehouse',
        battery_level: null,
        last_seen_at: null,
        last_seen_lat: null,
        last_seen_lng: null,
        price: Math.floor(Math.random() * 5000) + 1000,
        image_url: RING_IMAGES[i % RING_IMAGES.length],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        img: RING_IMAGES[i % RING_IMAGES.length],
        name: `Eternal Ring ${i + 1}`,
        metal: metal,
        cert: 'AVAILABLE',
        type: mapMaterialToType(metal),
        isNew: i % 7 === 0,
        model_name: 'Signature Collection',
        collection: 'Classic',
        identifier: `BK-${String(i + 1).padStart(3, '0')}`
      });
    }
    return rings;
  };

  // Apply sorting
  const applySort = useCallback(() => {
    let sorted = [...allRings];
    
    switch(filters.sort) {
      case 'low-high':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      default:
        sorted.sort((a, b) => a.id - b.id);
    }
    
    setFilteredRings(sorted);
    setVisibleCount(18);
  }, [allRings, filters.sort]);

  // Helper: Map material to type
  const mapMaterialToType = (material: string): string => {
    if (!material) return 'other';
    const m = material.toLowerCase();
    if (m.includes('platinum')) return 'platinum';
    if (m.includes('gold')) return 'gold';
    if (m.includes('diamond') || m.includes('white')) return 'diamond';
    if (m.includes('silver')) return 'silver';
    return 'other';
  };

  // Helper: Check if ring is new (within 30 days)
  const isNewRing = (createdAt: string): boolean => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  };

  // Handle filter changes
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, material: e.target.value }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  const handleApplyPriceFilter = () => {
    setFilters(prev => ({ ...prev }));
  };

  const handleClearFilters = () => {
    setFilters({
      material: '',
      minPrice: '',
      maxPrice: '',
      sort: 'featured'
    });
  };

  const handleDiscoverMore = () => {
    if (visibleCount < filteredRings.length) {
      setVisibleCount(prev => Math.min(prev + 6, filteredRings.length));
    }
  };

// Add to cart function with small bottom notification
const addToCart = (ring: Ring) => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existingItem = cart.find((item: any) => item.id === ring.id);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      const cartItem = {
        id: ring.id,
        ring_identifier: ring.ring_identifier,
        ring_name: ring.ring_name,
        material: ring.material,
        price: ring.price,
        size: ring.size,
        image_url: ring.image_url || ring.img,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
      cart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    
    // Show small pink notification at bottom
    showBottomNotification(`${ring.ring_name} added to cart!`);
    
    // Dispatch event for header to update
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (e) {
    // Show small pink error notification at bottom
    showBottomNotification('Error adding to cart', 'error');
  }
};

// Small bottom notification function
const showBottomNotification = (message: string, type: 'success' | 'error' = 'success') => {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-slide-up-bottom';
  
  const bgColor = type === 'success' ? 'bg-[#ff2aa2]' : 'bg-red-500';
  const icon = type === 'success' ? 'check_circle' : 'error';
  
  notification.innerHTML = `
    <div class="${bgColor} text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 min-w-[280px] max-w-md">
      <span class="material-symbols-outlined text-sm">${icon}</span>
      <p class="text-sm font-medium flex-1">${message}</p>
      <button class="hover:bg-white/20 rounded-full p-1 transition-colors" onclick="this.closest('.fixed').remove()">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
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

  // Show notification
  const showNotification = (message: string) => {
    alert(message);
  };

  // Toggle favorite
  const toggleFavorite = (ringId: number, event: React.MouseEvent) => {
    event.preventDefault();
    const isFav = localStorage.getItem(`fav-${ringId}`) === 'true';
    localStorage.setItem(`fav-${ringId}`, (!isFav).toString());
    
    // Force re-render of the favorite icon
    const target = event.currentTarget.querySelector('.material-symbols-outlined');
    if (target) {
      if (!isFav) {
        target.classList.add('text-primary');
        target.setAttribute('style', 'font-variation-settings: "FILL" 1');
      } else {
        target.classList.remove('text-primary');
        target.setAttribute('style', 'font-variation-settings: "FILL" 0');
      }
    }
  };

  // Navigate to ring detail
  const viewRingDetail = (ring: Ring) => {
    sessionStorage.setItem('currentRing', JSON.stringify(ring));
    navigate('/ring-view');
  };

  // Initial load
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadRingsFromAPI();
  }, [loadRingsFromAPI]);

  useEffect(() => {
    applySort();
  }, [allRings, filters.sort, applySort]);

  // Calculate stats
  const totalRings = allRings.length;
  const availableRings = allRings.filter(r => r.status === 'AVAILABLE').length;
  const limit = Math.min(visibleCount, filteredRings.length);
  const percent = filteredRings.length ? (limit / filteredRings.length) * 100 : 0;

  // Active filters display
  const activeFilters = [];
  if (filters.material) activeFilters.push(`Material: ${filters.material}`);
  if (filters.minPrice) activeFilters.push(`Min: $${filters.minPrice}`);
  if (filters.maxPrice) activeFilters.push(`Max: $${filters.maxPrice}`);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark love-pattern-bg">
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
              <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/shop" className="text-primary border-b border-primary/40 pb-1">Couple Shop</Link>
              <Link to="/myring" className="hover:text-primary transition-colors">My Ring</Link>
              <Link to="/profile" className="hover:text-primary transition-colors">Couple Profile</Link>
              <Link to="/relationship" className="hover:text-primary transition-colors">Relationship</Link>
            </nav>
          </div>
          {/* right icons & member */}
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
        {/* HERO + FILTERS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">
              <Link to="/">Home</Link>
              <span>/</span>
              <span className="text-primary font-bold">Shop</span>
            </nav>
            <h2 className="heading-serif text-5xl md:text-6xl font-light tracking-tight mb-4">
              The Signature <span className="font-bold text-primary">Collection</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Explore our curated selection of handcrafted rings, where timeless elegance meets modern ethical sourcing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={filters.material}
              onChange={handleMaterialChange}
              className="px-6 py-3 bg-white pink:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-primary focus:border-primary"
            >
              <option value="">All Materials</option>
              {materials.map(material => (
                <option key={material} value={material}>{material}</option>
              ))}
            </select>
            <select 
              value={filters.sort}
              onChange={handleSortChange}
              className="px-6 py-3 bg-white pink:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-primary focus:border-primary"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium">Price Range:</span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              placeholder={`Min $${priceRange.min}`} 
              className="w-24 px-3 py-2 bg-white pink:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
            <span>-</span>
            <input 
              type="number" 
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              placeholder={`Max $${priceRange.max}`} 
              className="w-24 px-3 py-2 bg-white pink:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
            <button 
              onClick={handleApplyPriceFilter}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
            <button 
              onClick={handleClearFilters}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:border-primary transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[40px]">
            {activeFilters.map(filter => (
              <span key={filter} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                {filter}
              </span>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        <div className="flex justify-between items-center mb-6 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">database</span>
            <span><span className="font-bold text-slate-900 dark:text-white">{totalRings}</span> rings in collection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">inventory</span>
            <span><span className="font-bold text-slate-900 dark:text-white">{availableRings}</span> available now</span>
          </div>
        </div>

        {/* RING GRID */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading beautiful rings from our collection...</p>
          </div>
        ) : limit === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400">No rings found matching your criteria.</p>
            <button 
              onClick={handleClearFilters}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-9 gap-y-16">
            {filteredRings.slice(0, limit).map((ring) => {
              const newBadge = ring.isNew ? (
                <div className="absolute top-4 right-16 bg-primary text-white text-[8px] font-bold px-3 py-3.5 rounded-full uppercase tracking-widest z-5">
                  New
                </div>
              ) : null;
              
              const statusColor = ring.status === 'AVAILABLE' ? 'bg-green-500' : 
                                 ring.status === 'RESERVED' ? 'bg-yellow-500' : 'bg-gray-500';

              const isFav = localStorage.getItem(`fav-${ring.id}`) === 'true';

              return (
                <div key={ring.id} className="ring-card group flex flex-col">
                  <div className="relative aspect-[4/5] bg-white dark:bg-slate-800 rounded-xl overflow-hidden mb-6 shadow-lg">
                    <img 
                      alt={ring.ring_name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      src={ring.image_url || ring.img} 
                      loading="lazy" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=800&fit=crop';
                      }} 
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="relative group">
                        <span className={`w-3 h-3 rounded-full ${statusColor} inline-block`}></span>
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {ring.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="absolute top-4 right-4">
                      <button 
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-900 hover:text-primary transition-colors favorite-btn z-10"
                        onClick={(e) => toggleFavorite(ring.id, e)}
                      >
                        <span 
                          className={`material-symbols-outlined text-xl ${isFav ? 'text-primary' : ''}`}
                          style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                    {newBadge}
                    
                    {/* Battery level (if exists) */}
                    {ring.battery_level && (
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10">
                        <span className="material-symbols-outlined text-xs align-middle">battery_full</span> {ring.battery_level}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 px-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{ring.ring_name}</h3>
                      <span className="text-xs text-slate-400">#{ring.ring_identifier}</span>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {ring.material} • Size {ring.size}
                    </p>
                    
                    <p className="text-xl font-bold text-primary mt-2">${ring.price.toLocaleString()}</p>
                    
                    {/* Location info (if exists) */}
                    {ring.location_label && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {ring.location_label}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-4">
                      <button 
                        className="flex-1 bg-primary text-white py-3 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        onClick={() => addToCart(ring)}
                      >
                        Add to Cart
                      </button>
                      <button 
                        className="flex-1 border border-primary/20 hover:border-primary py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all text-primary"
                        onClick={() => viewRingDetail(ring)}
                      >
                        See More
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOAD MORE */}
        {!isLoading && filteredRings.length > 0 && limit < filteredRings.length && (
          <div className="mt-24 flex flex-col items-center gap-6">
            <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">
              Showing {limit} of {filteredRings.length} pieces
            </p>
            <div className="w-full max-w-xs h-1 bg-slate-20 dark:bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <button 
              onClick={handleDiscoverMore}
              className="px-12 py-4 bg-white dark:bg-pink-600 border border-slate-200 dark:border-white-700 rounded-lg text-sm font-bold tracking-widest uppercase hover:border-primary transition-all flex items-center gap-3 group"
            >
              <span style={{ color: 'white' }}>Discover More</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-y-1 transition-transform color: 'white'">
                expand_more
              </span>
            </button>
          </div>
        )}

        {!isLoading && filteredRings.length > 0 && limit >= filteredRings.length && limit > 18 && (
          <div className="mt-16 text-center text-sm text-slate-400">
            You've viewed all {filteredRings.length} rings
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-background-dark border-t border-primary/10 pt-20 pb-10 mt-20">
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
              <input className="flex-1 bg-slate-50 dark:bg-slate-80 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="Email address" type="email"/>
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
    </div>
  );
};

export default CoupleShopView;