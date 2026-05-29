"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, createProduct, getCategories } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";
import { motion } from "framer-motion";
import {
  FaBox, FaPlus, FaTags, FaTimes, FaImage,
  FaFilter, FaSync, FaStar, FaLayerGroup,
} from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";

/* ─── helpers ──────────────────────────────────────────── */
const generateKey = (f) =>
  JSON.stringify({ categoryId: f.categoryId, isActive: f.isActive, productNumber: f.productNumber, stockStatus: f.stockStatus, sort: f.sort, page: f.page });

const getVisiblePages = (current, total) => {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
  if (current - delta > 2) range.unshift("...");
  if (current + delta < total - 1) range.push("...");
  const pages = [1, ...range];
  if (total > 1) pages.push(total);
  return pages;
};

export default function ProductsPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const { productsCache, setProductsCache } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({ categoryId: "", isActive: "", sort: "newest", productNumber: "", page: 1, stockStatus: "" });
  const [tempFilters, setTempFilters] = useState(filters);

  /* ─── form state ─── */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState([]);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [selections, setSelections] = useState([{ name: "", options: [""] }]);

  /* ─── fetch ─── */
  const fetchAll = async (isFilter = false, force = false) => {
    const key = generateKey(filters);
    if (!force && productsCache[key]) { setProducts(productsCache[key]); return; }
    try {
      if (isFilter) setFilterLoading(true);
      else if (!refreshing) setLoading(true);
      const sortMap = {
        newest:   { sortBy: "createdAt", order: "desc" },
        oldest:   { sortBy: "createdAt", order: "asc" },
        priceAsc: { sortBy: "price",     order: "asc" },
        priceDesc:{ sortBy: "price",     order: "desc" },
      };
      const sp = sortMap[filters.sort];
      const res = await getProducts({
        categoryId:   filters.categoryId   || undefined,
        isActive:     filters.isActive     || undefined,
        productNumber:filters.productNumber|| undefined,
        stockStatus:  filters.stockStatus  || undefined,
        sortBy: sp.sortBy, order: sp.order,
        page: filters.page || 1,
      });
      if (res.success) { setProducts(res.data); setProductsCache(prev => ({ ...prev, [key]: res.data })); }
    } catch { toast.error("Failed to load products"); }
    finally {
      if (isFilter) setFilterLoading(false);
      else if (!refreshing) setLoading(false);
    }
  };

  useEffect(() => { getCategories().then(r => { if (r.success) setCategories(r.data); }); }, []);
  useEffect(() => { fetchAll(false); }, []);
  useEffect(() => { fetchAll(true); }, [filters]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setProductsCache({});
    try { await fetchAll(false, true); toast.success("Products refreshed"); }
    finally { setRefreshing(false); }
  };

  /* ─── attributes ─── */
  const updateAttr  = (i, field, val) => { const c = [...attributes]; c[i][field] = val; setAttributes(c); };
  const addAttr     = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttr  = (i) => setAttributes(attributes.filter((_, idx) => idx !== i));

  /* ─── selections ─── */
  const updateSelName = (i, val) => { const c = [...selections]; c[i].name = val; setSelections(c); };
  const updateOpt     = (i, oi, val) => { const c = [...selections]; c[i].options[oi] = val; setSelections(c); };
  const addSel        = () => setSelections([...selections, { name: "", options: [""] }]);
  const removeSel     = (i) => setSelections(selections.filter((_, idx) => idx !== i));
  const addOpt        = (i) => { const c = [...selections]; c[i].options.push(""); setSelections(c); };
  const removeOpt     = (i, oi) => { const c = [...selections]; c[i].options = c[i].options.filter((_, idx) => idx !== oi); setSelections(c); };

  /* ─── images ─── */
  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const slots = 5 - images.length;
    if (slots <= 0) { toast.error("Max 5 images"); return; }
    const toAdd = files.slice(0, slots);
    if (files.length > slots) toast.error(`Only ${slots} more image(s) allowed`);
    const processed = await Promise.all(
      toAdd.map(async (f) => ({ file: (await compressImage(f)) || f, preview: URL.createObjectURL(f) }))
    );
    setImages(prev => [...prev, ...processed]);
    e.target.value = "";
  };
  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  /* ─── submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId || !images.length) return toast.error("Fill required fields");
    const fd = new FormData();
    fd.append("name", name); fd.append("description", description);
    fd.append("price", price); fd.append("comparePrice", comparePrice);
    fd.append("sku", sku); fd.append("stock", stock);
    fd.append("categoryId", categoryId); fd.append("isFeatured", isFeatured);
    fd.append("attributes", JSON.stringify(attributes.filter(a => a.key && a.value)));
    fd.append("selections", JSON.stringify(selections.filter(s => s.name && s.options.some(o => o))));
    images.forEach(img => fd.append("images", img.file));
    try {
      setSubmitting(true);
      await createProduct(fd);
      toast.success("Product created");
      setName(""); setDescription(""); setPrice(""); setComparePrice("");
      setSku(""); setStock(""); setCategoryId(""); setIsFeatured(false);
      setImages([]); setAttributes([{ key: "", value: "" }]); setSelections([{ name: "", options: [""] }]);
      setProductsCache({});
      fetchAll();
    } catch (err) { toast.error(err.message || "Create failed"); }
    finally { setSubmitting(false); }
  };

  if (loading && !refreshing) return (
    <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>
  );

  return (
    <div className="space-y-5">

      {/* ─── Add Product ─── */}
      <div className="d-card space-y-5">
        <h2 className="page-title">Add New Product</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Name *</label>
              <input className="d-input" placeholder="Product name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="section-label block mb-1.5">SKU</label>
              <input className="d-input" placeholder="SKU-001" value={sku} onChange={e => setSku(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="section-label block mb-1.5">Description</label>
            <textarea className="d-input" rows={3} placeholder="Product description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="section-label block mb-1.5">Price *</label>
              <input type="number" className="d-input" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="section-label block mb-1.5">Compare Price</label>
              <input type="number" className="d-input" placeholder="0.00" value={comparePrice} onChange={e => setComparePrice(e.target.value)} />
            </div>
            <div>
              <label className="section-label block mb-1.5">Stock</label>
              <input type="number" className="d-input" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div>
              <label className="section-label block mb-1.5">Category *</label>
              <CustomSelect
                placeholder="Select category"
                value={categoryId}
                onChange={setCategoryId}
                options={[
                  { label: "Select category", value: "" },
                  ...categories.map(c => ({ label: c.name, value: c._id })),
                ]}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <FaStar size={11} style={{ color: "#f59e0b" }} />
            <span className="text-[13px] text-slate-700">Mark as featured</span>
          </label>

          {/* Images */}
          <div>
            <label className="section-label block mb-1.5">Images * (max 5)</label>
            <button
              type="button"
              onClick={() => { if (images.length >= 5) { toast.error("Max 5 images"); return; } fileRef.current.click(); }}
              className="d-btn d-btn-outline gap-2"
            >
              <FaImage size={11} /> Upload Images
            </button>
            <input ref={fileRef} hidden type="file" accept="image/*" multiple disabled={images.length >= 5} onChange={handleImages} />
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img.preview} className="h-20 w-20 rounded-lg object-contain border" style={{ borderColor: "var(--border)", background: "#f8fafc" }} />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer border-none">
                      <FaTimes size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attributes */}
          <div>
            <p className="section-label mb-2 flex items-center gap-1.5"><FaTags size={10} /> Attributes</p>
            <div className="space-y-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex gap-2">
                  <input className="d-input" placeholder="Key (e.g. material)" value={attr.key} onChange={e => updateAttr(i, "key", e.target.value)} />
                  <input className="d-input" placeholder="Value (e.g. cotton)" value={attr.value} onChange={e => updateAttr(i, "value", e.target.value)} />
                  {attributes.length > 1 && (
                    <button type="button" onClick={() => removeAttr(i)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none bg-transparent flex-shrink-0"
                      style={{ color: "#ef4444" }}>
                      <FaTimes size={11} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addAttr} className="d-btn d-btn-outline gap-1.5 text-[12px]">
                <FaPlus size={9} /> Add attribute
              </button>
            </div>
          </div>

          {/* Selections */}
          <div>
            <p className="section-label mb-2 flex items-center gap-1.5"><FaLayerGroup size={10} /> Selections (Variants)</p>
            <div className="space-y-3">
              {selections.map((sel, i) => (
                <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
                  <div className="flex gap-2">
                    <input className="d-input" placeholder="Variant name (e.g. Color)" value={sel.name} onChange={e => updateSelName(i, e.target.value)} />
                    {selections.length > 1 && (
                      <button type="button" onClick={() => removeSel(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none bg-transparent flex-shrink-0"
                        style={{ color: "#ef4444" }}>
                        <FaTimes size={11} />
                      </button>
                    )}
                  </div>
                  {sel.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input className="d-input" placeholder="Option (e.g. Red)" value={opt} onChange={e => updateOpt(i, oi, e.target.value)} />
                      {sel.options.length > 1 && (
                        <button type="button" onClick={() => removeOpt(i, oi)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none bg-transparent flex-shrink-0"
                          style={{ color: "#ef4444" }}>
                          <FaTimes size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addOpt(i)} className="d-btn d-btn-outline text-[11px] gap-1 py-1">
                    <FaPlus size={8} /> Add option
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSel} className="d-btn d-btn-outline gap-1.5 text-[12px]">
                <FaPlus size={9} /> Add selection
              </button>
            </div>
          </div>

          <button disabled={submitting} className="d-btn d-btn-primary w-full h-10 gap-2">
            {submitting ? <><Loader size={14} color="#fff" /> Creating...</> : <><FaBox size={11} /> Create Product</>}
          </button>
        </form>
      </div>

      {/* ─── Filters ─── */}
      <div className="d-card">
        <p className="section-label mb-3">Filter Products</p>
        <div className="flex flex-wrap gap-2.5 items-end">
          <input
            placeholder="Search by product number..."
            className="d-input flex-1 min-w-[200px]"
            value={tempFilters.productNumber}
            onChange={e => setTempFilters({ ...tempFilters, productNumber: e.target.value })}
          />
          <CustomSelect
            placeholder="All categories"
            value={tempFilters.categoryId}
            onChange={v => setTempFilters({ ...tempFilters, categoryId: v })}
            options={[{ label: "All categories", value: "" }, ...categories.map(c => ({ label: c.name, value: c._id }))]}
          />
          <CustomSelect
            placeholder="Sort"
            value={tempFilters.sort}
            onChange={v => setTempFilters({ ...tempFilters, sort: v })}
            options={[
              { label: "Newest",   value: "newest" },
              { label: "Oldest",   value: "oldest" },
              { label: "Price ↑",  value: "priceAsc" },
              { label: "Price ↓",  value: "priceDesc" },
            ]}
          />
          <CustomSelect
            placeholder="Stock"
            value={tempFilters.stockStatus}
            onChange={v => setTempFilters({ ...tempFilters, stockStatus: v })}
            options={[
              { label: "All",          value: "" },
              { label: "In Stock",     value: "instock" },
              { label: "Out of Stock", value: "outstock" },
            ]}
          />
          <div className="flex gap-2">
            <button onClick={() => setFilters({ ...tempFilters, page: 1 })} className="d-btn d-btn-primary gap-1.5">
              <FaFilter size={10} /> Apply
            </button>
            <button
              onClick={() => {
                const c = { categoryId: "", isActive: "", productNumber: "", sort: "newest", page: 1, stockStatus: "" };
                setTempFilters(c); setFilters(c);
              }}
              className="d-btn d-btn-outline"
            >
              Clear
            </button>
            <button onClick={handleRefresh} disabled={refreshing} className="d-btn d-btn-outline" title="Refresh">
              <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Products Grid ─── */}
      {filterLoading ? (
        <div className="flex items-center justify-center py-20"><Loader /></div>
      ) : !products?.products?.length ? (
        <div className="d-empty">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.products.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/products/${p._id}`)}
              className="bg-white rounded-xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md"
              style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="h-36 overflow-hidden" style={{ background: "#f8fafc" }}>
                <img src={p.images?.[0]?.url} className="w-full h-full object-cover" alt={p.name} />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="font-medium text-[13px] text-slate-900 line-clamp-2 leading-snug">{p.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-subtle)" }}>{p.categoryId?.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: p.stock > 0 ? "#dcfce7" : "#fee2e2", color: p.stock > 0 ? "#15803d" : "#b91c1c" }}
                  >
                    Stock: {p.stock}
                  </span>
                  <span className="text-[13px] font-bold text-slate-900">{p.price?.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {products?.pagination?.totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-1.5">
          <button
            disabled={products.pagination.page === 1}
            onClick={() => setFilters({ ...filters, page: products.pagination.page - 1 })}
            className="d-page-btn"
          >
            Prev
          </button>
          {getVisiblePages(products.pagination.page, products.pagination.totalPages).map((p, i) =>
            p === "..." ? (
              <span key={i} className="d-page-btn border-none">…</span>
            ) : (
              <button
                key={i}
                onClick={() => setFilters({ ...filters, page: p })}
                className={`d-page-btn ${p === products.pagination.page ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}
          <button
            disabled={products.pagination.page === products.pagination.totalPages}
            onClick={() => setFilters({ ...filters, page: products.pagination.page + 1 })}
            className="d-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
