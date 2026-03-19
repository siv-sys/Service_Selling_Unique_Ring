import React, { useState } from 'react';
import Header from '../components/Header';
import { api } from '../lib/api';

interface SeedResult {
  message: string;
  createdModels: number;
  createdRings: number;
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
  startingNumber: string;
  defaultSize: string;
  locationLabel: string;
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
  stockCount: '',
  startingNumber: '1',
  defaultSize: '',
  locationLabel: '',
};

const inputClassName =
  'h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

const AdminSeedView: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);

  const seedCatalog = async () => {
    setIsSeeding(true);
    setResult(null);
    setErrorMessage(null);
    try {
      const response = await api.post<SeedResult>('/admin/migrations/seed-catalog', {});
      setResult(response);
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
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        basePrice,
        currencyCode: form.currencyCode.trim() || 'USD',
        ringNamePrefix: form.ringNamePrefix.trim() || null,
        ringIdentifierPrefix: form.ringIdentifierPrefix.trim() || null,
        stockCount,
        startingNumber: Number.isFinite(startingNumber) ? startingNumber : 1,
        defaultSize: form.defaultSize.trim() || null,
        locationLabel: form.locationLabel.trim() || null,
      });
      setResult(response);
      setForm(INITIAL_FORM);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to insert catalog data');
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <>
      <Header title="Catalog Seed" subtitle="Seed and insert catalog data for inventory." />
      <main className="admin-seed-page flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Seed Default Catalog Data</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Inserts starter products and stock into `ring_models` and `rings`.
            </p>
            <button
              type="button"
              onClick={seedCatalog}
              disabled={isSeeding}
              className="mt-5 h-12 px-8 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all"
            >
              {isSeeding ? 'Seeding Catalog...' : 'Seed Couple Shop Data'}
            </button>
          </section>

          <form
            onSubmit={insertFromForm}
            className="space-y-4 rounded-3xl border border-pink-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8"
          >
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Insert Custom Catalog Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className={inputClassName} placeholder="Model Name" value={form.modelName} onChange={(e) => updateForm('modelName', e.target.value)} />
              <input className={inputClassName} placeholder="Collection Name" value={form.collectionName} onChange={(e) => updateForm('collectionName', e.target.value)} />
              <input className={inputClassName} placeholder="Material" value={form.material} onChange={(e) => updateForm('material', e.target.value)} />
              <input className={inputClassName} placeholder="Image URL" value={form.imageUrl} onChange={(e) => updateForm('imageUrl', e.target.value)} />
              <input className={inputClassName} placeholder="Base Price" type="number" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} />
              <input className={inputClassName} placeholder="Currency (USD)" value={form.currencyCode} onChange={(e) => updateForm('currencyCode', e.target.value)} />
              <input className={inputClassName} placeholder="Ring Name Prefix" value={form.ringNamePrefix} onChange={(e) => updateForm('ringNamePrefix', e.target.value)} />
              <input className={inputClassName} placeholder="Ring Identifier Prefix" value={form.ringIdentifierPrefix} onChange={(e) => updateForm('ringIdentifierPrefix', e.target.value)} />
              <input className={inputClassName} placeholder="Stock Count" type="number" value={form.stockCount} onChange={(e) => updateForm('stockCount', e.target.value)} />
              <input className={inputClassName} placeholder="Starting Number" type="number" value={form.startingNumber} onChange={(e) => updateForm('startingNumber', e.target.value)} />
              <input className={inputClassName} placeholder="Default Size" value={form.defaultSize} onChange={(e) => updateForm('defaultSize', e.target.value)} />
              <input className={inputClassName} placeholder="Location Label" value={form.locationLabel} onChange={(e) => updateForm('locationLabel', e.target.value)} />
            </div>
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm font-medium placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Description"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
            />
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
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminSeedView;
