import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, resolveApiAssetUrl } from '../lib/api';
import { getCartRequestHeaders, getCartSessionId, setCartSessionId, setStoredCartItems } from '../lib/cartStorage';

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

      let sessionId = getCartSessionId();
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCartRequestHeaders(),
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

      if (data.sessionId) {
        sessionId = String(data.sessionId);
        setCartSessionId(sessionId);
      }

      if (Array.isArray(data.data)) {
        setStoredCartItems(data.data);
      }

      showNotification(`${ring.name} added to cart.`, 'success');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Error adding ring to cart.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase text-primary">Ring Models</p>
            <h1 className="text-3xl font-bold text-slate-950 dark:text-white md:text-4xl">
              Discover our ring collection
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-400">
              Browse designs, compare materials, and choose a ring that fits your story.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:w-72">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase text-slate-500">Models</p>
              <p className="mt-1 text-2xl font-bold">{totalRings}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase text-slate-500">Available</p>
              <p className="mt-1 text-2xl font-bold">{availableRings}</p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <form onSubmit={handleSearchSubmit} className="relative min-w-0">
              <input
                type="text"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by model, material, collection, or description"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-950"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">search</span>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => applyFilters({ ...filters, search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </form>

            <select
              value={filters.material}
              onChange={handleMaterialChange}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
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
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="featured">Featured</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Price</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                placeholder={`Min $${priceRange.min}`}
                className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                placeholder={`Max $${priceRange.max}`}
                className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <button
              onClick={handleApplyPriceFilter}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-white"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold dark:border-slate-700"
            >
              Clear
            </button>
          </div>
        </section>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {filter}
              </span>
            ))}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">{filteredRings.length}</span> ring models found
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">{availableRings}</span> available now
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <p className="text-slate-500">Loading ring models from the database...</p>
          </div>
        ) : displayedRings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">search_off</span>
            <p className="text-slate-500 mb-4">No ring models match your filters.</p>
            <button onClick={handleClearFilters} className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayedRings.map((ring) => {
              const isFav = localStorage.getItem(`fav-${ring.id}`) === 'true';
              const stockLabel = `${ring.available_units} in stock`;
              const statusLabel =
                ring.available_units <= 0 ? 'Out of stock' : ring.available_units <= 5 ? 'Low stock' : 'In stock';
              const statusTone =
                ring.available_units <= 0
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                  : ring.available_units <= 5
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300';

              return (
                <article
                  key={ring.id}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30 dark:hover:border-slate-500"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-white dark:bg-slate-950">
                    <img
                      src={ring.image_url || ring.image || PLACEHOLDER_IMAGE}
                      alt={ring.model_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />

                    <div className="absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/95 dark:text-white dark:ring-slate-500">
                      {stockLabel}
                    </div>
                    {ring.isNew && (
                      <div className="absolute left-3 top-12 rounded-lg bg-slate-950 px-2 py-1 text-[11px] font-bold uppercase text-white">
                        New
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(ring.id, e)}
                      className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg bg-white/95 text-slate-900 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-primary dark:bg-slate-950/95 dark:text-white dark:ring-slate-500"
                    >
                      <span
                        className={`material-symbols-outlined ${isFav ? 'text-primary' : ''}`}
                        style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                        {ring.model_name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {ring.material} ring, size {ring.size}
                      </p>
                    </div>

                    <p className="sr-only">
                      Status: {statusLabel} • {ring.material}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-2xl font-bold text-slate-950 dark:text-white">
                        {ring.price.toLocaleString()} {ring.currency_code}
                      </p>
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusTone}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addToCart(ring)}
                        disabled={!ring.representative_ring_id || ring.available_units <= 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-primary dark:hover:bg-primary/80 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        Add
                      </button>
                      <button
                        onClick={() => viewRingDetail(ring)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:border-primary hover:text-primary dark:border-slate-500 dark:bg-slate-950 dark:text-white dark:hover:border-primary"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Details
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && filteredRings.length > visibleCount && (
          <div className="mt-10 text-center">
            <p className="mb-4 text-sm text-slate-400">
              Showing {displayedRings.length} of {filteredRings.length}
            </p>
            <button
              onClick={handleDiscoverMore}
              className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
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

      <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">
          <p>BondKeeper · Curated ring collection for couples.</p>
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
