import React, { useState } from 'react';
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
  currencyCode: '',
  ringNamePrefix: '',
  ringIdentifierPrefix: '',
  stockCount: '',
  startingNumber: '',
  defaultSize: '',
  locationLabel: '',
};

const AdminSeedView: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);
  const [isInserting, setIsInserting] = useState(false);
  const [insertSummary, setInsertSummary] = useState<string | null>(null);

  const seedCatalog = async () => {
    setIsSeeding(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await api.post<SeedResult>('/admin/migrations/seed-catalog', {});
      setResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to seed catalog';
      setErrorMessage(message);
    } finally {
      setIsSeeding(false);
    }
  };

  const updateForm = (key: keyof CatalogFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const insertFromForm = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsInserting(true);
    setInsertSummary(null);
    setErrorMessage(null);

    const price = Number(form.basePrice);
    const stockCount = Number(form.stockCount);
    const startingNumber = Number(form.startingNumber);

    if (!form.modelName || !form.material || !Number.isFinite(price)) {
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
        basePrice: price,
        currencyCode: form.currencyCode.trim() || 'USD',
        ringNamePrefix: form.ringNamePrefix.trim(),
        ringIdentifierPrefix: form.ringIdentifierPrefix.trim(),
        stockCount,
        startingNumber,
        defaultSize: form.defaultSize.trim() || null,
        locationLabel: form.locationLabel.trim() || null,
      });
      setInsertSummary(response.message);
      setResult(response);
      setForm(INITIAL_FORM);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to insert catalog data';
      setErrorMessage(message);
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-50 dark:border-slate-800 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="size-12 rounded-2xl bg-rose-50 text-primary-red dark:bg-slate-800 flex items-center justify-center">
            <span className="material-symbols-outlined">database_upload</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Couple Shop Seed Data</h3>
            <p className="text-sm text-slate-400">Insert starter products and stock into `ring_models` and `rings`.</p>
          </div>
        </div>

        <div className="space-y-4">
          <ul className="text-sm text-slate-500 list-disc pl-5 space-y-1">
            <li>Creates missing ring models for Couple Shop.</li>
            <li>Inserts available stock rings using safe re-run migration behavior.</li>
            <li>Admin-only action, protected by auth role.</li>
          </ul>

          <button
            onClick={seedCatalog}
            disabled={isSeeding}
            className="h-12 px-8 rounded-2xl bg-primary-red hover:bg-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-500/25 disabled:opacity-50"
          >
            {isSeeding ? 'Seeding Catalog...' : 'Seed Couple Shop Data'}
          </button>
        </div>
      </div>

      <form onSubmit={insertFromForm} className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-50 dark:border-slate-800 shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-red">edit_note</span>
          <h4 className="text-lg font-bold">Insert Custom Catalog Data</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Model Name" value={form.modelName} onChange={(e) => updateForm('modelName', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Collection Name" value={form.collectionName} onChange={(e) => updateForm('collectionName', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Material" value={form.material} onChange={(e) => updateForm('material', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Image URL" value={form.imageUrl} onChange={(e) => updateForm('imageUrl', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Base Price" type="number" step="0.01" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Currency (USD)" value={form.currencyCode} onChange={(e) => updateForm('currencyCode', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Ring Name Prefix" value={form.ringNamePrefix} onChange={(e) => updateForm('ringNamePrefix', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Identifier Prefix (SHOP-XXX)" value={form.ringIdentifierPrefix} onChange={(e) => updateForm('ringIdentifierPrefix', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Stock Count" type="number" min="1" value={form.stockCount} onChange={(e) => updateForm('stockCount', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Starting Number" type="number" min="1" value={form.startingNumber} onChange={(e) => updateForm('startingNumber', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Default Size" value={form.defaultSize} onChange={(e) => updateForm('defaultSize', e.target.value)} />
          <input className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Location Label" value={form.locationLabel} onChange={(e) => updateForm('locationLabel', e.target.value)} />
        </div>

        <textarea className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" placeholder="Description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />

        <button
          type="submit"
          disabled={isInserting}
          className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm disabled:opacity-50"
        >
          {isInserting ? 'Inserting...' : 'Insert Product + Stock'}
        </button>
      </form>

      {result && (
        <div className="px-4 py-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
          <p>{result.message}</p>
          <p className="mt-1">Created Models: {result.createdModels}</p>
          <p>Created Rings: {result.createdRings}</p>
        </div>
      )}

      {insertSummary && (
        <div className="px-4 py-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
          {insertSummary}
        </div>
      )}

      {errorMessage && (
        <div className="px-4 py-4 rounded-xl bg-rose-50 text-primary-red text-sm font-semibold border border-rose-100">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default AdminSeedView;
