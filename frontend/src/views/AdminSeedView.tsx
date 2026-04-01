import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { api, resolveApiAssetUrl } from '../lib/api';

interface SeedResult {
  message: string;
  createdModels: number;
  createdRings: number;
  syncedInventoryItems?: number;
}

interface CatalogFormState {
  modelName: string;
  collectionName: string;
  material: string;
  description: string;
  imageUrl: string;
  basePrice: string;
  currencyCode: string;
  ringNamePrefix: string;
  ringIdentifierPrefix: string;
  stockCount: string;
  defaultSize: string;
  locationLabel: string;
}

interface InventoryPreviewItem {
  id: number;
  image: string | null;
  model: string;
  color: string | null;
  variant: string;
  sku: string;
  serial: string;
  status: string;
  stock: number;
}

interface InventoryPreviewResponse {
  items: InventoryPreviewItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const INITIAL_FORM: CatalogFormState = {
  modelName: '',
  collectionName: '',
  material: '',
  description: '',
  imageUrl: '',
  basePrice: '',
  currencyCode: 'USD',
  ringNamePrefix: '',
  ringIdentifierPrefix: '',
  stockCount: '1',
  defaultSize: '',
  locationLabel: '',
};

const inputClassName =
  'h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

const AdminSeedView: React.FC = () => {
  const [isInserting, setIsInserting] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);
  const [inventoryPreview, setInventoryPreview] = useState<InventoryPreviewItem[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(true);

  const loadInventoryPreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await api.get<InventoryPreviewResponse>('/inventory?limit=6');
      setInventoryPreview(Array.isArray(response.items) ? response.items : []);
      setPreviewTotal(Number(response.pagination?.total || 0));
    } catch {
      setInventoryPreview([]);
      setPreviewTotal(0);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    void loadInventoryPreview();
  }, []);

  const updateForm = (key: keyof CatalogFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateForm('imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const insertFromForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsInserting(true);
    setResult(null);
    setErrorMessage(null);

    const basePrice = Number(form.basePrice);
    const stockCount = Number(form.stockCount);

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
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        basePrice,
        currencyCode: form.currencyCode.trim() || 'USD',
        ringNamePrefix: form.ringNamePrefix.trim() || null,
        ringIdentifierPrefix: form.ringIdentifierPrefix.trim() || null,
        stockCount,
        defaultSize: form.defaultSize.trim() || null,
        locationLabel: form.locationLabel.trim() || null,
      });
      setResult(response);
      setForm(INITIAL_FORM);
      await loadInventoryPreview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to insert catalog data');
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <>
      <Header title="Catalog Seed" subtitle="Insert catalog data that appears in inventory and couple shop." />
      <main className="admin-seed-page flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <form
            onSubmit={insertFromForm}
            className="space-y-4 rounded-3xl border border-pink-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8"
          >
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Insert Custom Catalog Data</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Only products added here will appear in Couple Shop for customers to browse.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className={inputClassName} placeholder="Model Name" value={form.modelName} onChange={(e) => updateForm('modelName', e.target.value)} />
              <input className={inputClassName} placeholder="Material" value={form.material} onChange={(e) => updateForm('material', e.target.value)} />
              <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 shadow-sm transition focus-within:border-pink-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-300/40 dark:border-slate-700 dark:bg-slate-800">
                <input
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Paste image URL"
                  value={form.imageUrl}
                  onChange={(e) => updateForm('imageUrl', e.target.value)}
                />
                <div className="shrink-0">
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-pink-700 transition hover:border-pink-300 hover:bg-pink-50 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-950/50">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <input className={inputClassName} placeholder="Base Price (USA)" type="number" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} />
              <input className={inputClassName} placeholder="Stock Count" type="number" value={form.stockCount} onChange={(e) => updateForm('stockCount', e.target.value)} />
              <input className={inputClassName} placeholder="Default Size" value={form.defaultSize} onChange={(e) => updateForm('defaultSize', e.target.value)} />
              <input className={inputClassName} placeholder="Location Label" value={form.locationLabel} onChange={(e) => updateForm('locationLabel', e.target.value)} />
            </div>
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm font-medium placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Description"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
            />
            {form.imageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Preview</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Seed image preview</p>
                  </div>
                  <span className="rounded-full bg-pink-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                    Ready
                  </span>
                </div>
                <img
                  src={resolveApiAssetUrl(form.imageUrl)}
                  alt="Seed preview"
                  className="h-52 w-full object-cover"
                />
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isInserting}
              className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isInserting ? 'Inserting...' : 'Insert Product + Stock'}
            </button>
          </form>

          {result && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <p>{result.message}</p>
              <p className="mt-1">Created Models: {result.createdModels}</p>
              <p>Created Rings: {result.createdRings}</p>
              {typeof result.syncedInventoryItems === 'number' ? <p>Updated Inventory Items: {result.syncedInventoryItems}</p> : null}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          <section className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Product Preview</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preview how new products and stock updates will appear in the shop.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void loadInventoryPreview();
                }}
                className="h-11 px-5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {previewLoading ? 'Loading...' : 'Refresh Preview'}
              </button>
            </div>

            {previewLoading ? (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">Loading product preview...</p>
            ) : inventoryPreview.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                No product or stock entries are available yet.
              </p>
            ) : (
              <>
                <p className="mt-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Showing {inventoryPreview.length} of {previewTotal} products.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {inventoryPreview.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50"
                    >
                      {item.image ? (
                        <img src={resolveApiAssetUrl(item.image)} alt={item.model} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          No image
                        </div>
                      )}
                      <div className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.model}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.variant}</p>
                          </div>
                          <span className="rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                            {item.stock} in stock
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Serial: {item.serial}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Status: {item.status}{item.color ? ` • ${item.color}` : ''}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default AdminSeedView;
