import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, resolveApiAssetUrl } from '../lib/api';
import { getUserScopedLocalStorageItem, setUserScopedLocalStorageItem } from '../lib/userStorage';

interface ShopRing {
  id: number;
  model_id: number;
  model_name: string;
  ring_name: string;
  name: string;
  ring_identifier: string;
  identifier: string;
  sku: string;
  serial_number: string;
  image: string;
  image_url: string;
  img: string;
  material: string;
  metal: string;
  color: string;
  variant: string;
  size: string;
  description: string | null;
  status: string;
  stock: number;
  stockPercent: number;
  statusColor: string;
  price: number;
  base_price: number;
  currency_code: string;
  collection_name: string | null;
  collection: string;
  available_units: number;
  representative_ring_id: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  created_at: string | null;
  updated_at: string | null;
  cert: string;
  type: string;
  isNew: boolean;
  sample_size?: string;
}

interface Filters {
  material: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  search: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

const DEFAULT_MATERIALS = ['18K Gold', 'Platinum', 'Rose Gold', 'Sterling Silver'];

const DEFAULT_FILTERS: Filters = {
  material: '',
  minPrice: '',
  maxPrice: '',
  sort: 'featured',
  search: '',
};

const mapMaterialToType = (material: string): string => {
  const value = String(material || '').toLowerCase();
  if (value.includes('platinum')) return 'platinum';
  if (value.includes('gold')) return 'gold';
  if (value.includes('diamond') || value.includes('white')) return 'diamond';
  if (value.includes('silver')) return 'silver';
  return 'other';
};

const normalizeRing = (ring: any, index: number): ShopRing => {
  const id = Number(ring?.id || index + 1);
  const modelName = String(ring?.model_name || ring?.name || `Ring ${index + 1}`);
  const material = String(ring?.material || 'Unknown');
  const collectionName = ring?.collection_name ? String(ring.collection_name) : null;
  const rawImage = ring?.image_url || ring?.image || ring?.img || '';
  const image = resolveApiAssetUrl(rawImage) || PLACEHOLDER_IMAGE;
  const availableUnits = Number(ring?.available_units ?? ring?.stock ?? 0);
  const representativeRingId = ring?.representative_ring_id != null ? Number(ring.representative_ring_id) : null;
  const createdAt = ring?.created_at || ring?.createdAt || null;
  const isNew = createdAt ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30 : false;
  const size = String(ring?.size || ring?.sample_size || '20').trim() || '20';
  const serialNumber = String(ring?.serial_number || `INV-${id}-${material.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${size}`);

  return {
    id,
    model_id: Number(ring?.model_id ?? id),
    model_name: modelName,
    ring_name: modelName,
    name: modelName,
    ring_identifier: String(ring?.ring_identifier || `MODEL-${id}`),
    identifier: String(ring?.identifier || `MODEL-${id}`),
    sku: String(ring?.sku || `MODEL-${id}`),
    image,
    image_url: image,
    img: image,
    material,
    metal: material,
    color: material,
    variant: String(ring?.variant || (collectionName ? `Collection ${collectionName}` : material)),
    size,
    description: ring?.description ?? null,
    status: availableUnits > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
    stock: availableUnits,
    stockPercent: availableUnits > 0 ? Math.min(100, availableUnits * 10) : 0,
    statusColor: availableUnits <= 0 ? 'rose' : availableUnits <= 5 ? 'amber' : 'emerald',
    price: Number(ring?.price ?? ring?.base_price ?? 0),
    base_price: Number(ring?.base_price ?? ring?.price ?? 0),
    currency_code: String(ring?.currency_code || 'USD'),
    collection_name: collectionName,
    collection: collectionName || 'Signature',
    available_units: availableUnits,
    representative_ring_id: representativeRingId,
    serial_number: serialNumber,
    createdAt: createdAt,
    updatedAt: ring?.updated_at || ring?.updatedAt || null,
    created_at: createdAt,
    updated_at: ring?.updated_at || ring?.updatedAt || null,
    cert: String(ring?.cert || ring?.description || collectionName || material || 'AVAILABLE'),
    type: mapMaterialToType(material),
    isNew,
    sample_size: size,
  };
};

const sortRings = (rings: ShopRing[], sort: string): ShopRing[] => {
  const next = [...rings];

  switch (sort) {
    case 'low-high':
      next.sort((a, b) => a.price - b.price);
      break;
    case 'high-low':
      next.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      next.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
      break;
    default:
      next.sort((a, b) => a.id - b.id);
      break;
  }

  return next;
};

const CoupleShopView: React.FC = () => {
  const navigate = useNavigate();

  const [allRings, setAllRings] = useState<ShopRing[]>([]);
  const [filteredRings, setFilteredRings] = useState<ShopRing[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(18);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [materials, setMaterials] = useState<string[]>(DEFAULT_MATERIALS);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    setNotification({ message, type });
  }, []);

  const loadRingsFromAPI = useCallback(
    async (overrideFilters?: Filters) => {
      setIsLoading(true);

      const activeFilters = overrideFilters || filters;

      try {
        const queryParams = new URLSearchParams();
        if (activeFilters.material) queryParams.append('material', activeFilters.material);
        if (activeFilters.minPrice) queryParams.append('minPrice', activeFilters.minPrice);
        if (activeFilters.maxPrice) queryParams.append('maxPrice', activeFilters.maxPrice);
        if (activeFilters.search) queryParams.append('search', activeFilters.search);

        const query = queryParams.toString();
        const response = await fetch(`${API_BASE_URL}/couple-shop${query ? `?${query}` : ''}`);

        if (!response.ok) {
          throw new Error(`Failed to load ring models (${response.status})`);
        }

        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload)
              ? payload
              : [];

        const normalized = rows.map((ring: any, index: number) => normalizeRing(ring, index));
        const nextMaterials = Array.from(
          new Set(
            normalized
              .map((ring) => ring.material)
              .filter(Boolean)
          )
        );
        const prices = normalized.map((ring) => ring.price).filter((price) => Number.isFinite(price));

        setAllRings(normalized);
        setFilteredRings(sortRings(normalized, activeFilters.sort));
        setVisibleCount(18);
        setMaterials(nextMaterials.length > 0 ? nextMaterials : DEFAULT_MATERIALS);
        setPriceRange(
          prices.length > 0
            ? {
                min: Math.min(...prices),
                max: Math.max(...prices),
              }
            : { min: 0, max: 10000 }
        );
      } catch (error) {
        console.error('Error loading shop rings:', error);
        setAllRings([]);
        setFilteredRings([]);
        setMaterials(DEFAULT_MATERIALS);
        showNotification('Unable to load ring models from the database.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, showNotification]
  );

  const activeFilters = useMemo(() => {
    const next: string[] = [];
    if (filters.search.trim()) next.push(`Search: ${filters.search.trim()}`);
    if (filters.material) next.push(`Material: ${filters.material}`);
    if (filters.minPrice) next.push(`Min: ${filters.minPrice}`);
    if (filters.maxPrice) next.push(`Max: ${filters.maxPrice}`);
    return next;
  }, [filters]);

  const displayedRings = useMemo(() => filteredRings.slice(0, visibleCount), [filteredRings, visibleCount]);
  const totalRings = allRings.length;
  const availableRings = allRings.filter((ring) => ring.status === 'AVAILABLE').length;

  useEffect(() => {
    void loadRingsFromAPI(DEFAULT_FILTERS);
  }, [loadRingsFromAPI]);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [notification]);

  const applyFilters = (nextFilters: Filters) => {
    setFilters(nextFilters);
    void loadRingsFromAPI(nextFilters);
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({ ...filters, material: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({ ...filters, sort: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadRingsFromAPI(filters);
  };

  const handleApplyPriceFilter = () => {
    void loadRingsFromAPI(filters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    void loadRingsFromAPI(DEFAULT_FILTERS);
  };

  const handleDiscoverMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, filteredRings.length));
  };

  const toggleFavorite = (ringId: number, event: React.MouseEvent) => {
    event.preventDefault();
    const key = `fav-${ringId}`;
    localStorage.setItem(key, String(localStorage.getItem(key) !== 'true'));
    showNotification(localStorage.getItem(key) === 'true' ? 'Saved to favorites.' : 'Removed from favorites.', 'info');
  };

  const viewRingDetail = (ring: ShopRing) => {
    const slimRing = {
      id: ring.id,
      name: ring.name,
      model_name: ring.model_name,
      ring_name: ring.ring_name,
      price: ring.price,
      material: ring.material,
      metal: ring.metal,
      color: ring.color,
      img: ring.img,
      image_url: ring.image_url,
      image: ring.image,
      ring_identifier: ring.ring_identifier,
      identifier: ring.identifier,
      sku: ring.sku,
      collection_name: ring.collection_name,
      collection: ring.collection,
      description: ring.description,
      created_at: ring.created_at,
      updated_at: ring.updated_at,
      isNew: ring.isNew,
      size: ring.size,
      cert: ring.cert,
      ringId: ring.representative_ring_id,
    };

    sessionStorage.setItem('currentRing', JSON.stringify(slimRing));
    sessionStorage.setItem('purchaseRing', JSON.stringify(slimRing));
    navigate('/ring-view');
  };

  const addToCart = async (ring: ShopRing) => {
    try {
      if (!ring.representative_ring_id || ring.available_units <= 0) {
        showNotification('This ring model has no available inventory item yet.', 'error');
        return;
      }

      let sessionId = getUserScopedLocalStorageItem('sessionId');
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId ? { 'x-session-id': sessionId } : {}),
        },
        body: JSON.stringify({
          ringId: ring.representative_ring_id,
          quantity: 1,
          size: ring.size || '7',
          material: ring.material,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add ring to cart');
      }

      if (data.sessionId && !sessionId) {
        sessionId = data.sessionId;
        setUserScopedLocalStorageItem('sessionId', data.sessionId);
      } else if (data.sessionId && sessionId) {
        setUserScopedLocalStorageItem('sessionId', sessionId);
      }

      showNotification(`${ring.name} added to cart.`, 'success');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Error adding ring to cart.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-bold mb-3">Ring Models</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Shop directly from the `ring_models` table.
            </h1>
            <p className="max-w-2xl text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
              This catalog now shows only model-level data from the database, and each card keeps a slim session payload for detail pages.
            </p>
          </div>
          <div className="rounded-3xl border border-pink-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-xl shadow-pink-100/30">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500 uppercase tracking-[0.25em] text-[11px] mb-1">Models</div>
                <div className="text-3xl font-black">{totalRings}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase tracking-[0.25em] text-[11px] mb-1">Available</div>
                <div className="text-3xl font-black">{availableRings}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-pink-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by model, material, collection, or description"
                className="w-full pl-12 pr-12 py-3 rounded-full border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => applyFilters({ ...filters, search: '' })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </form>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.material}
                onChange={handleMaterialChange}
                className="px-4 py-3 rounded-xl border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              >
                <option value="">All Materials</option>
                {materials.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>

              <select
                value={filters.sort}
                onChange={handleSortChange}
                className="px-4 py-3 rounded-xl border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              >
                <option value="featured">Sort: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Price Range</span>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                placeholder={`Min $${priceRange.min}`}
                className="w-28 px-3 py-2 rounded-lg border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                placeholder={`Max $${priceRange.max}`}
                className="w-28 px-3 py-2 rounded-lg border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <button
              onClick={handleApplyPriceFilter}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg border border-pink-100 dark:border-slate-700 text-sm font-bold"
            >
              Clear
            </button>
          </div>
        </section>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {filter}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">{filteredRings.length}</span> ring models found
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">{availableRings}</span> available now
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-pink-100 border-t-primary animate-spin" />
            <p className="text-slate-500">Loading ring models from the database...</p>
          </div>
        ) : displayedRings.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-pink-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40">
            <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">search_off</span>
            <p className="text-slate-500 mb-4">No ring models match your filters.</p>
            <button onClick={handleClearFilters} className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {displayedRings.map((ring) => {
              const isFav = localStorage.getItem(`fav-${ring.id}`) === 'true';
              const stockLabel = `${ring.available_units} in stock`;
              const statusLabel =
                ring.available_units <= 0 ? 'Out of stock' : ring.available_units <= 5 ? 'Low stock' : 'In stock';
              const serialText = ring.serial_number || `INV-${ring.id}-${ring.material.toUpperCase()}-${ring.size}`;

              return (
                <article
                  key={ring.id}
                  className="group overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:shadow-pink-100/20 transition-all duration-300"
                >
                  <div className="relative aspect-[1.35/1] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={ring.image_url || ring.image || PLACEHOLDER_IMAGE}
                      alt={ring.model_name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />

                    <div className="absolute left-4 top-4 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-pink-600 shadow-lg backdrop-blur">
                      {stockLabel}
                    </div>
                    {ring.isNew && (
                      <div className="absolute left-4 top-16 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-lg">
                        New
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(ring.id, e)}
                      className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur hover:text-primary"
                    >
                      <span
                        className={`material-symbols-outlined ${isFav ? 'text-primary' : ''}`}
                        style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-2xl font-black tracking-tight truncate">{ring.model_name}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Size {ring.size} - {ring.material}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full bg-pink-50 px-4 py-2 text-sm font-bold text-pink-600">
                        {stockLabel}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      SKU: {ring.sku}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Serial: {serialText}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                      Status: {statusLabel} • {ring.material}
                    </p>
                    <p className="mt-3 text-xl font-black text-primary">
                      ${ring.price.toLocaleString()}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {ring.currency_code}
                      </span>
                      {ring.isNew && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          Fresh
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => addToCart(ring)}
                        disabled={!ring.representative_ring_id || ring.available_units <= 0}
                        className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => viewRingDetail(ring)}
                        className="rounded-2xl border border-pink-100 dark:border-slate-700 px-4 py-3 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
                      >
                        See More
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && filteredRings.length > visibleCount && (
          <div className="mt-12 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-4">
              Showing {displayedRings.length} of {filteredRings.length}
            </p>
            <button
              onClick={handleDiscoverMore}
              className="px-8 py-3 rounded-full border border-pink-100 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase tracking-[0.2em]"
            >
              Discover More
            </button>
          </div>
        )}
      </main>

      {notification && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 flex min-w-[280px] -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 text-white shadow-2xl ${
            notification.type === 'success'
              ? 'bg-emerald-500'
              : notification.type === 'error'
                ? 'bg-rose-500'
                : 'bg-primary'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <footer className="mt-20 border-t border-pink-100 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>BondKeeper · Ring model catalog backed by `ring_models`.</p>
          <div className="flex gap-5">
            <Link to="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link to="/myring" className="hover:text-primary">
              My Ring
            </Link>
            <Link to="/ring-view" className="hover:text-primary">
              Ring View
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CoupleShopView;
