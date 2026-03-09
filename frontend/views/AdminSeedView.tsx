
import React, { useState } from 'react';
import { api } from '../lib/api';
import { AppView, Role, ThemeType } from '../types';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';


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
  const [currentView, setCurrentView] = useState<AppView>(AppView.ADMIN_SEED);
  const [theme, setTheme] = useState<ThemeType>(ThemeType.LIGHT);

  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);
  const [isInserting, setIsInserting] = useState(false);

  const setView = (view: AppView) => {
    setCurrentView(view);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === ThemeType.LIGHT ? ThemeType.DARK : ThemeType.LIGHT));
  };

  const onSignOut = () => {
    sessionStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_user_id');
  };

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

      setResult(response);
      setForm(INITIAL_FORM);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to insert catalog data';
      setErrorMessage(message);
    } finally {
      setIsInserting(false);
    }
  };

  const inputClassName =
    'h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all';

  return (
    <div className="flex h-screen bg-[#f3f4f6]">

      {/* Sidebar */}
      <Sidebar currentView={currentView} setView={setView} role={Role.ADMIN} onSignOut={onSignOut} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          view={currentView}
          theme={theme}
          toggleTheme={toggleTheme}
          role={Role.ADMIN}
          setView={setView}
        />

        <main className="flex-1 overflow-y-auto bg-[#f3f4f6] p-6 md:p-8">

          <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">

            <div className="rounded-3xl border border-pink-200 bg-white shadow-sm px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Admin Tools</p>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-1">Catalog Seed Console</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-pink-50 text-pink-600 px-3 py-2 border border-pink-200">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Admin Only</span>
                </div>
              </div>
            </div>

            {/* Seed Section */}
            <div className="bg-white rounded-3xl border border-pink-200 shadow-sm p-6 md:p-8">

              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">database_upload</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold">Couple Shop Seed Data</h3>
                  <p className="text-sm text-slate-500">
                    Insert starter products and stock into `ring_models` and `rings`.
                  </p>
                </div>
              </div>

              <ul className="text-sm text-slate-500 list-disc pl-5 space-y-1 mb-5">
                <li>Creates missing ring models for Couple Shop.</li>
                <li>Inserts available stock rings using safe re-run migration behavior.</li>
                <li>Admin-only action, protected by auth role.</li>
              </ul>

              <button
                onClick={seedCatalog}
                disabled={isSeeding}
                className="h-12 px-8 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all"
              >
                {isSeeding ? 'Seeding Catalog...' : 'Seed Couple Shop Data'}
              </button>

            </div>

            {/* Insert Form */}
            <form
              onSubmit={insertFromForm}
              className="bg-white rounded-3xl border border-pink-200 shadow-sm p-6 md:p-8 space-y-6"
            >

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-pink-600">edit_note</span>
                <h4 className="text-lg font-bold">Insert Custom Catalog Data</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <input className={inputClassName}
                  placeholder="Model Name"
                  value={form.modelName}
                  onChange={(e) => updateForm('modelName', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Collection Name"
                  value={form.collectionName}
                  onChange={(e) => updateForm('collectionName', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Material"
                  value={form.material}
                  onChange={(e) => updateForm('material', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Image URL"
                  value={form.imageUrl}
                  onChange={(e) => updateForm('imageUrl', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Base Price"
                  type="number"
                  value={form.basePrice}
                  onChange={(e) => updateForm('basePrice', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Currency (USD)"
                  value={form.currencyCode}
                  onChange={(e) => updateForm('currencyCode', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Stock Count"
                  type="number"
                  value={form.stockCount}
                  onChange={(e) => updateForm('stockCount', e.target.value)}
                />

                <input className={inputClassName}
                  placeholder="Starting Number"
                  type="number"
                  value={form.startingNumber}
                  onChange={(e) => updateForm('startingNumber', e.target.value)}
                />

              </div>

              <textarea
                className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50/90 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300/80 focus:border-transparent transition-all"
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
              <div className="px-4 py-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
                <p>{result.message}</p>
                <p className="mt-1">Created Models: {result.createdModels}</p>
                <p>Created Rings: {result.createdRings}</p>
              </div>
            )}

            {errorMessage && (
              <div className="px-4 py-4 rounded-xl bg-rose-50 text-primary-red text-sm font-semibold border border-rose-100">
                {errorMessage}
              </div>
            )}

          </div>

        </main>

      </div>

    </div>
  );
};

export default AdminSeedView;
