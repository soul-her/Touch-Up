// src/components/dashboards/ManagerProducts.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Search, Pencil, Trash2, Save, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image?: string;
  productType?: "item" | "service";
  createdAt?: any;
}

const ManagerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snap) =>
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)))
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      `${p.name} ${p.description}`.toLowerCase().includes(q)
    );
  }, [products, search]);

  const save = async () => {
    if (!selected) return;
    await updateDoc(doc(db, "products", selected.id), {
      name: form.name,
      price: form.price,
      stock: form.stock,
      description: form.description,
      image: form.image,
      productType: form.productType,
    });
    setSelected(null);
  };

  const remove = async (id: string) => {
    if (confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const inputBase =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT LIST */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Products
            </h2>
            <p className="text-sm text-white/60">Search and manage inventory</p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
            {filtered.length} shown
          </span>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
          <input
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputBase} pl-10`}
          />
        </div>

        <ul className="divide-y divide-white/10">
          {filtered.map((p) => (
            <li key={p.id} className="py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{p.name}</p>
                <p className="text-sm text-white/60">
                  ₱{p.price} • Stock: {p.stock}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelected(p);
                    setForm(p);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-semibold transition"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  onClick={() => remove(p.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT EDIT */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/60">Select a product to edit</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-4">
              Editing: {selected.name}
            </h2>

            <div className="space-y-3">
              <input
                className={inputBase}
                placeholder="Name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  className={inputBase}
                  placeholder="Price"
                  value={form.price ?? 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />

                <input
                  type="number"
                  className={inputBase}
                  placeholder="Stock"
                  value={form.stock ?? 0}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>

              <textarea
                className={`${inputBase} min-h-[110px]`}
                placeholder="Description"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <input
                className={inputBase}
                placeholder="Image URL"
                value={form.image || ""}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-500/80 hover:bg-green-500 px-4 py-2 font-semibold text-white transition"
                >
                  <Save size={18} />
                  Save
                </button>

                <button
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 font-semibold text-white transition border border-white/10"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerProducts;
