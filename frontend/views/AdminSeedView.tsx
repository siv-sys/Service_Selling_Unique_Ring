import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { api } from '../lib/api';
import { Package, Plus, RefreshCw, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface SeedResult {
  message: string;
  createdModels: number;
  createdRings: number;
  inventoryAdded?: boolean;
}

interface InventoryItem {
  id: number;
  model: string;
  color: string;
  variant: string;
  sku: string;
  stock: number;
  status: string;
  statusColor: string;
}

interface CatalogFormState {
  modelName: string;
  collectionName: string;
  material: string;
  color: string;
  description: string;
  imageUrl: string;
  basePrice: string;
  currencyCode: string;
  ringNamePrefix: string;
  ringIdentifierPrefix: string;
  stockCount: string;
  startingNumber: string;
  defaultSize: string;
  locationLabel: string;
  supplier: string;
}

const INITIAL_FORM: CatalogFormState = {
  modelName: '',
  collectionName: '',
  material: '',
  color: '',
  description: '',
  imageUrl: '',
  basePrice: '',
  currencyCode: 'USD',
  ringNamePrefix: '',
  ringIdentifierPrefix: '',
  stockCount: '',
  startingNumber: '1',
  defaultSize: '',
  locationLabel: '',
  supplier: '',
};

const inputClassName =
  'h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all';

const AdminSeedView: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Fetch current inventory items
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setInventoryItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setInventoryItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const seedCatalog = async () => {
    setIsSeeding(true);
    setResult(null);
    setErrorMessage(null);
    try {
      const response = await api.post<SeedResult>('/admin/migrations/seed-catalog', {});
      setResult(response);
      fetchInventory(); // Refresh inventory list
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to seed catalog');
    } finally {
      setIsSeeding(false);
    }
  };

  const updateForm = (key: keyof CatalogFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const insertFromForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsInserting(true);
    setResult(null);
    setErrorMessage(null);

    const basePrice = Number(form.basePrice);
    const stockCount = Number(form.stockCount);
    const startingNumber = Number(form.startingNumber);

    if (!form.modelName.trim() || !form.material.trim() || !Number.isFinite(basePrice)) {
      setIsInserting(false);
      setErrorMessage('Model name, material, and valid base price are required.');
      return;
    }

    if (!Number.isInteger(stockCount) || stockCount < 1) {
      setIsInserting(false);
      setErrorMessage('Stock count must be a positive integer.');
      return;
    }

    try {
      const response = await api.post<SeedResult>('/admin/migrations/seed-catalog', {
        modelName: form.modelName.trim(),
        collectionName: form.collectionName.trim() || null,
        material: form.material.trim(),
        color: form.color.trim() || form.material.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        basePrice,
        currencyCode: form.currencyCode.trim() || 'USD',
        ringNamePrefix: form.ringNamePrefix.trim() || null,
        ringIdentifierPrefix: form.ringIdentifierPrefix.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
        stockCount,
        startingNumber: Number.isFinite(startingNumber) ? startingNumber : 1,
        defaultSize: form.defaultSize.trim() || null,
        locationLabel: form.locationLabel.trim() || null,
        supplier: form.supplier.trim() || null,
      });
      setResult(response);
      setForm(INITIAL_FORM);
      fetchInventory(); // Refresh inventory list
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to insert catalog data');
    } finally {
      setIsInserting(false);
    }
  };

  const statusClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return (
    <>
      <Header title="Catalog Seed" subtitle="Seed and insert catalog data for inventory." />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Quick Seed Section */}
          <section className="bg-white rounded-3xl border border-pink-200 shadow-sm p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Quick Seed Default Data</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Inserts starter products into ring_models, rings, and inventory_items tables.
                </p>
              </div>
              <button
                type="button"
                onClick={seedCatalog}
                disabled={isSeeding}
                className="h-12 px-8 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {isSeeding ? 'Seeding...' : 'Seed Default Data'}
              </button>
            </div>
          </section>

          {/* Custom Insert Form */}
          <form
            onSubmit={insertFromForm}
            className="bg-white rounded-3xl border border-pink-200 shadow-sm p-6 md:p-8 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Add New Product to Inventory</h4>
                <p className="text-sm text-slate-500">Fill in the details to add a new product. It will appear in Ring Inventory.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-pink-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Model Name *</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., Eternal Bond Gold" value={form.modelName} onChange={(e) => updateForm('modelName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Collection Name</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., Classic Series" value={form.collectionName} onChange={(e) => updateForm('collectionName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Material *</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., 18K Gold" value={form.material} onChange={(e) => updateForm('material', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Color</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., Gold (defaults to material)" value={form.color} onChange={(e) => updateForm('color', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Default Size</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., Size 7" value={form.defaultSize} onChange={(e) => updateForm('defaultSize', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Image URL</label>
                <input className={inputClassName + ' w-full'} placeholder="https://..." value={form.imageUrl} onChange={(e) => updateForm('imageUrl', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <textarea
                className="w-full min-h-[80px] p-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all"
                placeholder="Product description..."
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Base Price *</label>
                <input className={inputClassName + ' w-full'} placeholder="1200.00" type="number" step="0.01" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Currency</label>
                <input className={inputClassName + ' w-full'} placeholder="USD" value={form.currencyCode} onChange={(e) => updateForm('currencyCode', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Stock Count *</label>
                <input className={inputClassName + ' w-full'} placeholder="10" type="number" min="1" value={form.stockCount} onChange={(e) => updateForm('stockCount', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Location Label</label>
                <input className={inputClassName + ' w-full'} placeholder="Main Warehouse" value={form.locationLabel} onChange={(e) => updateForm('locationLabel', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier</label>
                <input className={inputClassName + ' w-full'} placeholder="e.g., GoldCraft Inc." value={form.supplier} onChange={(e) => updateForm('supplier', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={isInserting}
                className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isInserting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isInserting ? 'Adding...' : 'Add to Inventory'}
              </button>
              <button
                type="button"
                onClick={fetchInventory}
                className="h-12 px-6 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </form>

          {/* Result Messages */}
          {result && (
            <div className="px-4 py-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">{result.message}</p>
                <p className="mt-1 text-emerald-600">
                  Models: {result.createdModels} | Rings: {result.createdRings}
                  {result.inventoryAdded && ' | Added to Inventory ✓'}
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="px-4 py-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold border border-rose-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Current Inventory Preview */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900">Current Inventory Preview</h4>
              <a href="/inventory" className="text-sm text-pink-600 hover:text-pink-700 font-semibold">
                View Full Inventory →
              </a>
            </div>

            {loadingInventory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                <span className="ml-2 text-slate-500">Loading inventory...</span>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No inventory items yet. Add products above to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Model</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Color</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                      <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryItems.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 text-sm font-medium text-slate-900">{item.model}</td>
                        <td className="py-3 text-sm text-slate-600">{item.color}</td>
                        <td className="py-3 text-sm font-mono text-slate-600">{item.sku}</td>
                        <td className="py-3 text-sm font-bold text-slate-900">{item.stock}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusClasses[item.statusColor] || 'bg-slate-100 text-slate-700'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inventoryItems.length > 5 && (
                  <p className="mt-4 text-sm text-slate-500 text-center">
                    Showing 5 of {inventoryItems.length} items.{' '}
                    <a href="/inventory" className="text-pink-600 hover:underline">View all →</a>
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminSeedView;
