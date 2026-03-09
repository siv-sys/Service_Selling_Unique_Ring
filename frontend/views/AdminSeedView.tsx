
import React, { useState } from "react";
import { api } from "../lib/api";

/* =========================
   TYPES
========================= */

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
  modelName: "",
  collectionName: "",
  material: "",
  description: "",
  imageUrl: "",
  basePrice: "",
  currencyCode: "",
  ringNamePrefix: "",
  ringIdentifierPrefix: "",
  stockCount: "",
  startingNumber: "",
  defaultSize: "",
  locationLabel: "",
};

/* =========================
   MAIN PAGE
========================= */

const CatalogSeedPage: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CatalogFormState>(INITIAL_FORM);
  const [isInserting, setIsInserting] = useState(false);
  const [insertSummary, setInsertSummary] = useState<string | null>(null);

  /* =========================
     API ACTIONS
  ========================= */

  const seedCatalog = async () => {
    setIsSeeding(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await api.post<SeedResult>(
        "/admin/migrations/seed-catalog",
        {}
      );
      setResult(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to seed catalog";
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
      setErrorMessage("Model name, material, and valid base price required.");
      setIsInserting(false);
      return;
    }

    if (!Number.isInteger(stockCount) || stockCount < 1) {
      setErrorMessage("Stock count must be positive.");
      setIsInserting(false);
      return;
    }

    try {
      const response = await api.post<SeedResult>(
        "/admin/migrations/seed-catalog",
        {
          modelName: form.modelName.trim(),
          collectionName: form.collectionName.trim() || null,
          material: form.material.trim(),
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          basePrice: price,
          currencyCode: form.currencyCode.trim() || "USD",
          ringNamePrefix: form.ringNamePrefix.trim(),
          ringIdentifierPrefix: form.ringIdentifierPrefix.trim(),
          stockCount,
          startingNumber,
          defaultSize: form.defaultSize.trim() || null,
          locationLabel: form.locationLabel.trim() || null,
        }
      );

      setInsertSummary(response.message);
      setResult(response);
      setForm(INITIAL_FORM);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Insert failed";
      setErrorMessage(message);
    } finally {
      setIsInserting(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="flex h-screen bg-slate-100">

      {/* ================= SIDEBAR ================= */}

      <aside className="w-64 bg-white border-r flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b">
            <h2 className="font-bold text-lg text-rose-600">RingAdmin</h2>
          </div>

          <nav className="p-4 space-y-2 text-sm">

            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100">
              Dashboard
            </button>

            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100">
              User & Pair Management
            </button>

            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100">
              Ring Inventory
            </button>

            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100">
              Security Logs
            </button>

            <button className="w-full text-left px-4 py-2 rounded-lg bg-rose-50 text-rose-600 font-semibold">
              Catalog Seed
            </button>

            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-100">
              Settings
            </button>

          </nav>
        </div>

        <div className="p-4 border-t text-sm">
          <p className="font-semibold">Alex Rivera</p>
          <p className="text-slate-400">System Admin</p>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <header className="h-16 bg-white border-b flex items-center justify-between px-6">

          <div>
            <h1 className="text-lg font-bold">Catalog Seed</h1>
            <p className="text-xs text-slate-400">
              Insert starter products into catalog
            </p>
          </div>

          <input
            className="h-10 px-4 rounded-xl border border-slate-200 text-sm"
            placeholder="Search..."
          />

        </header>

        {/* CONTENT */}

        <main className="flex-1 overflow-y-auto p-8">

          <div className="max-w-4xl mx-auto flex flex-col gap-8">

            {/* SEED BUTTON */}

            <div className="bg-white rounded-3xl border p-8">
              <h3 className="text-xl font-bold mb-4">
                Couple Shop Seed Data
              </h3>

              <button
                onClick={seedCatalog}
                disabled={isSeeding}
                className="h-12 px-8 rounded-xl bg-rose-600 text-white font-bold"
              >
                {isSeeding ? "Seeding..." : "Seed Couple Shop Data"}
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={insertFromForm}
              className="bg-white rounded-3xl border p-8 space-y-6"
            >

              <h4 className="text-lg font-bold">
                Insert Custom Catalog Data
              </h4>

              <div className="grid grid-cols-2 gap-4">

                <input
                  placeholder="Model Name"
                  value={form.modelName}
                  onChange={(e) =>
                    updateForm("modelName", e.target.value)
                  }
                  className="h-11 px-3 border rounded-lg"
                />

                <input
                  placeholder="Material"
                  value={form.material}
                  onChange={(e) =>
                    updateForm("material", e.target.value)
                  }
                  className="h-11 px-3 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Base Price"
                  value={form.basePrice}
                  onChange={(e) =>
                    updateForm("basePrice", e.target.value)
                  }
                  className="h-11 px-3 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Stock Count"
                  value={form.stockCount}
                  onChange={(e) =>
                    updateForm("stockCount", e.target.value)
                  }
                  className="h-11 px-3 border rounded-lg"
                />

              </div>

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  updateForm("description", e.target.value)
                }
                className="w-full border rounded-lg p-3"
              />

              <button
                type="submit"
                disabled={isInserting}
                className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold"
              >
                {isInserting ? "Inserting..." : "Insert Product + Stock"}
              </button>

            </form>

            {/* RESULT */}

            {result && (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700">
                <p>{result.message}</p>
                <p>Created Models: {result.createdModels}</p>
                <p>Created Rings: {result.createdRings}</p>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-600">
                {errorMessage}
              </div>
            )}

          </div>

        </main>

      </div>

    </div>
  );
};

export default CatalogSeedPage;
