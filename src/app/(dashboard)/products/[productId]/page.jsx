"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProductByID, getCategories, updateProductBasic, deleteProduct,
  addProductAttribute, updateProductAttribute, deleteProductAttribute,
  addProductImage, updateProductImage, deleteProductImage,
  addSelectionOption, deleteSelectionOption, deleteProductSelection,
  updateProductSelection, addProductSelection,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";
import {
  FaBox, FaTags, FaImages, FaTrash, FaPlus, FaPen,
  FaTimes, FaCheck, FaFilter, FaArrowLeft, FaStar, FaLayerGroup,
} from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params?.productId;
  const router = useRouter();

  /* ─── state ─── */
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [product,          setProduct]          = useState(null);
  const [categories,       setCategories]       = useState([]);

  /* confirm modals */
  const [deleteProductOpen,  setDeleteProductOpen]  = useState(false);
  const [deleteImageId,      setDeleteImageId]      = useState(null);
  const [deleteAttributeId,  setDeleteAttributeId]  = useState(null);
  const [deletingSelectionId,setDeletingSelectionId]= useState(null);

  /* loading flags */
  const [deletingProduct,   setDeletingProduct]   = useState(false);
  const [deletingImage,     setDeletingImage]     = useState(false);
  const [deletingAttribute, setDeletingAttribute] = useState(false);
  const [imageLoading,      setImageLoading]      = useState(false);
  const [selectionLoading,  setSelectionLoading]  = useState(false);
  const [optionLoadingId,   setOptionLoadingId]   = useState(null);
  const [selectionSavingId, setSelectionSavingId] = useState(null);
  const [addingAttribute,   setAddingAttribute]   = useState(false);

  /* basic fields */
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [comparePrice,setComparePrice]= useState("");
  const [sku,         setSku]         = useState("");
  const [stock,       setStock]       = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [isFeatured,  setIsFeatured]  = useState(false);

  /* attributes */
  const [attributes,      setAttributes]      = useState([]);
  const [showAddAttribute,setShowAddAttribute] = useState(false);
  const [newAttrKey,      setNewAttrKey]      = useState("");
  const [newAttrValue,    setNewAttrValue]    = useState("");

  /* selections */
  const [selections,      setSelections]      = useState([]);
  const [showAddSelection,setShowAddSelection] = useState(false);
  const [newSelectionName,setNewSelectionName] = useState("");
  const [newOptions,      setNewOptions]      = useState([""]);

  /* ─── fetch ─── */
  const fetchData = async () => {
    if (!productId) return;
    try {
      const [p, c] = await Promise.all([getProductByID(productId), getCategories()]);
      if (p?._id) {
        setProduct(p);
        setName(p.name || ""); setDescription(p.description || "");
        setPrice(String(p.price ?? "")); setComparePrice(String(p.comparePrice ?? ""));
        setSku(p.sku || ""); setStock(String(p.stock ?? ""));
        setCategoryId(p.categoryId?._id || ""); setIsFeatured(!!p.isFeatured);
        setAttributes(p.attributes || []);
        setSelections((p.selections || []).map(s => ({
          ...s,
          options: s.options.map(o => typeof o === "string" ? { value: o } : o),
        })));
      }
      if (c?.success) setCategories(c.data);
    } catch { toast.error("Failed to load product"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [productId]);

  /* ─── basic update ─── */
  const handleUpdateBasic = async () => {
    try {
      setSaving(true);
      await updateProductBasic(productId, {
        name, description,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        sku,
        stock: Number(stock),
        categoryId, isFeatured,
      });
      toast.success("Product updated");
      fetchData();
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  /* ─── attributes ─── */
  const handleUpdateAttribute = async (id, key, value) => {
    try { await updateProductAttribute(productId, { attributeId: id, key, value }); }
    catch { toast.error("Attribute update failed"); }
  };

  const handleSaveNewAttribute = async () => {
    if (!newAttrKey || !newAttrValue) return toast.error("Key and value required");
    try {
      setAddingAttribute(true);
      await addProductAttribute(productId, { key: newAttrKey, value: newAttrValue });
      setShowAddAttribute(false); setNewAttrKey(""); setNewAttrValue("");
      fetchData();
    } catch { toast.error("Add attribute failed"); }
    finally { setAddingAttribute(false); }
  };

  const confirmDeleteAttribute = async () => {
    try {
      setDeletingAttribute(true);
      await deleteProductAttribute(productId, deleteAttributeId);
      setDeleteAttributeId(null); fetchData();
    } catch { toast.error("Delete attribute failed"); }
    finally { setDeletingAttribute(false); }
  };

  /* ─── selections ─── */
  const handleAddSelection = async () => {
    if (!newSelectionName) return toast.error("Name required");
    try {
      setSelectionLoading(true);
      await addProductSelection(productId, { name: newSelectionName, options: newOptions.filter(o => o) });
      setNewSelectionName(""); setNewOptions([""]); setShowAddSelection(false); fetchData();
    } catch { toast.error("Add selection failed"); }
    finally { setSelectionLoading(false); }
  };

  const confirmDeleteSelection = async () => {
    try {
      setSelectionSavingId(deletingSelectionId);
      await deleteProductSelection(productId, deletingSelectionId);
      setDeletingSelectionId(null); fetchData();
    } catch { toast.error("Delete selection failed"); }
    finally { setSelectionSavingId(null); }
  };

  const handleUpdateSelection = async (sel) => {
    try {
      setSelectionSavingId(sel._id);
      await updateProductSelection(productId, { selectionId: sel._id, name: sel.name });
      toast.success("Selection updated"); fetchData();
    } catch { toast.error("Update failed"); }
    finally { setSelectionSavingId(null); }
  };

  const handleAddOption = async (selectionId, value) => {
    if (!value.trim()) return;
    try { setOptionLoadingId(selectionId); await addSelectionOption(productId, selectionId, value); fetchData(); }
    catch { toast.error("Add option failed"); }
    finally { setOptionLoadingId(null); }
  };

  const handleDeleteOption = async (selectionId, optionId) => {
    try { setOptionLoadingId(optionId); await deleteSelectionOption(productId, selectionId, optionId); fetchData(); }
    catch { toast.error("Delete option failed"); }
    finally { setOptionLoadingId(null); }
  };

  /* ─── images ─── */
  const handleAddImage = async (files) => {
    if (!files?.length) return;
    const slots = 5 - product.images.length;
    if (slots <= 0) { toast.error("Max 5 images"); return; }
    const filesArray = Array.from(files).slice(0, slots);
    try {
      setImageLoading(true);
      for (const file of filesArray) {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("image", compressed || file);
        await addProductImage(productId, fd);
      }
      toast.success("Images added"); fetchData();
    } catch { toast.error("Add image failed"); }
    finally { setImageLoading(false); }
  };

  const handleReplaceImage = async (imageId, files) => {
    if (!files?.length) return;
    try {
      setImageLoading(true);
      const compressed = await compressImage(files[0]);
      const fd = new FormData();
      fd.append("imageId", imageId);
      fd.append("image", compressed || files[0]);
      await updateProductImage(productId, fd);
      toast.success("Image replaced"); fetchData();
    } catch { toast.error("Replace failed"); }
    finally { setImageLoading(false); }
  };

  const confirmDeleteImage = async () => {
    try {
      setDeletingImage(true);
      await deleteProductImage(productId, deleteImageId);
      setDeleteImageId(null); fetchData();
    } catch { toast.error("Delete image failed"); }
    finally { setDeletingImage(false); }
  };

  /* ─── delete product ─── */
  const confirmDeleteProduct = async () => {
    try { setDeletingProduct(true); await deleteProduct(productId); router.push("/products"); }
    catch { toast.error("Delete failed"); }
    finally { setDeletingProduct(false); }
  };

  /* ─── render ─── */
  if (loading) return <div className="flex justify-center items-center py-20 w-full h-screen"><Loader /></div>;
  if (!product) return <div className="d-empty">Product not found</div>;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Back */}
      <button onClick={() => router.back()} className="d-btn d-btn-outline gap-2">
        <FaArrowLeft size={11} /> Back
      </button>

      {/* ─── Basic Info ─── */}
      <div className="d-card space-y-4">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f5f3ff" }}>
            <FaBox size={14} style={{ color: "#7c3aed" }} />
          </div>
          <h2 className="page-title">Basic Information</h2>
        </div>

        {/* IDs (read-only) */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
          <div>
            <p className="section-label">Product ID</p>
            <p className="text-[12px] text-slate-700 font-mono mt-1 break-all">{productId}</p>
          </div>
          <div>
            <p className="section-label">Product Number</p>
            <p className="text-[12px] text-slate-700 font-mono mt-1">{product.productNumber}</p>
          </div>
        </div>

        <div>
          <label className="section-label block mb-1.5">Name</label>
          <input className="d-input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="section-label block mb-1.5">Description</label>
          <textarea className="d-input" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="section-label block mb-1.5">Price</label>
            <input type="number" className="d-input" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Compare Price</label>
            <input type="number" className="d-input" value={comparePrice} onChange={e => setComparePrice(e.target.value)} />
          </div>
          <div>
            <label className="section-label block mb-1.5">SKU</label>
            <input className="d-input" value={sku} onChange={e => setSku(e.target.value)} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Stock</label>
            <input
              type="number"
              className="d-input"
              value={stock}
              onChange={e => setStock(e.target.value)}
              style={{ borderColor: Number(stock) === 0 ? "#f87171" : undefined }}
            />
          </div>
        </div>

        <div>
          <label className="section-label block mb-1.5">Category</label>
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

        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <FaStar size={11} style={{ color: "#f59e0b" }} />
          <span className="text-[13px] text-slate-700">Featured product</span>
        </label>

        <button onClick={handleUpdateBasic} disabled={saving} className="d-btn d-btn-primary gap-2">
          {saving ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaCheck size={11} /> Save Changes</>}
        </button>
      </div>

      {/* ─── Images ─── */}
      <div className="d-card space-y-4">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0f9ff" }}>
            <FaImages size={14} style={{ color: "#0284c7" }} />
          </div>
          <h2 className="page-title">Images</h2>
        </div>

        <label className={`d-btn d-btn-outline gap-2 cursor-pointer ${imageLoading ? "opacity-60 pointer-events-none" : ""}`}>
          {imageLoading ? <><Loader size={14} color="var(--accent)" /> Uploading...</> : <><FaPlus size={11} /> Add Images</>}
          <input type="file" hidden multiple accept="image/*" onChange={e => handleAddImage(e.target.files)} />
        </label>

        <div className="flex gap-3 flex-wrap">
          {product.images.map((img) => (
            <div key={img._id} className="rounded-xl overflow-hidden relative group" style={{ border: "1px solid var(--border)", background: "#f8fafc" }}>
              <img src={img.url} className="h-24 w-24 object-contain p-2" />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: "rgba(15,23,42,0.7)" }}>
                <label className="cursor-pointer text-white" title="Replace">
                  <FaPen size={11} />
                  <input type="file" hidden accept="image/*" onChange={e => handleReplaceImage(img._id, e.target.files)} />
                </label>
                <button onClick={() => setDeleteImageId(img._id)} className="text-red-400 cursor-pointer border-none bg-transparent" title="Delete">
                  <FaTrash size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Attributes ─── */}
      <div className="d-card space-y-4">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ecfeff" }}>
            <FaTags size={14} style={{ color: "#0891b2" }} />
          </div>
          <h2 className="page-title">Attributes</h2>
        </div>

        <div className="space-y-2">
          {attributes.map((attr) => (
            <div key={attr._id} className="flex gap-2">
              <input
                className="d-input"
                defaultValue={attr.key}
                onBlur={e => handleUpdateAttribute(attr._id, e.target.value, attr.value)}
              />
              <input
                className="d-input"
                defaultValue={attr.value}
                onBlur={e => handleUpdateAttribute(attr._id, attr.key, e.target.value)}
              />
              <button
                onClick={() => setDeleteAttributeId(attr._id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none flex-shrink-0"
                style={{ background: "#fee2e2", color: "#b91c1c" }}
              >
                <FaTrash size={11} />
              </button>
            </div>
          ))}
        </div>

        {showAddAttribute ? (
          <div className="flex gap-2">
            <input className="d-input" placeholder="Key" value={newAttrKey} onChange={e => setNewAttrKey(e.target.value)} />
            <input className="d-input" placeholder="Value" value={newAttrValue} onChange={e => setNewAttrValue(e.target.value)} />
            <button
              disabled={addingAttribute}
              onClick={handleSaveNewAttribute}
              className="d-btn d-btn-primary gap-1.5 flex-shrink-0"
            >
              {addingAttribute ? <Loader size={13} color="#fff" /> : <FaCheck size={11} />}
            </button>
            <button
              disabled={addingAttribute}
              onClick={() => { setShowAddAttribute(false); setNewAttrKey(""); setNewAttrValue(""); }}
              className="d-btn d-btn-outline flex-shrink-0"
            >
              <FaTimes size={11} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddAttribute(true)} className="d-btn d-btn-outline gap-1.5 text-[12px]">
            <FaPlus size={9} /> Add attribute
          </button>
        )}
      </div>

      {/* ─── Selections ─── */}
      <div className="d-card space-y-4">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fdf4ff" }}>
            <FaLayerGroup size={14} style={{ color: "#a21caf" }} />
          </div>
          <h2 className="page-title">Selections (Variants)</h2>
        </div>

        <div className="space-y-3">
          {selections.map((sel, sIndex) => (
            <div key={sel._id} className="rounded-xl p-4 space-y-3" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
              {/* Selection name */}
              <input
                className="d-input font-medium"
                value={sel.name}
                onChange={e => {
                  const copy = structuredClone(selections);
                  copy[sIndex].name = e.target.value;
                  setSelections(copy);
                }}
                placeholder="Variant name (e.g. Color)"
              />

              {/* Options */}
              <div className="space-y-1.5">
                {sel.options.map((opt) => (
                  <div key={opt._id} className="flex gap-2">
                    <input className="d-input" value={opt.value} disabled style={{ background: "#f1f5f9", color: "var(--text-muted)" }} />
                    <button
                      onClick={() => handleDeleteOption(sel._id, opt._id)}
                      disabled={optionLoadingId === opt._id}
                      className="w-8 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none flex-shrink-0"
                      style={{ background: "#fee2e2", color: "#b91c1c" }}
                    >
                      {optionLoadingId === opt._id ? <Loader size={11} color="#b91c1c" /> : <FaTrash size={10} />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new option inline */}
              <input
                disabled={optionLoadingId === sel._id}
                className="d-input text-[12px]"
                placeholder={optionLoadingId === sel._id ? "Adding..." : "Type new option and press Enter"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleAddOption(sel._id, e.target.value); e.target.value = ""; }
                }}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleUpdateSelection(sel)}
                  disabled={selectionSavingId === sel._id}
                  className="d-btn d-btn-primary text-[12px] gap-1.5"
                >
                  {selectionSavingId === sel._id ? <Loader size={12} color="#fff" /> : <FaCheck size={10} />}
                  {selectionSavingId === sel._id ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setDeletingSelectionId(sel._id)}
                  disabled={selectionSavingId === sel._id}
                  className="d-btn d-btn-danger text-[12px]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new selection */}
        {showAddSelection ? (
          <div className="rounded-xl p-4 space-y-2" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
            <input
              className="d-input"
              placeholder="Variant name (e.g. Color)"
              value={newSelectionName}
              onChange={e => setNewSelectionName(e.target.value)}
            />
            {newOptions.map((opt, i) => (
              <input
                key={i}
                className="d-input"
                placeholder="Option value (e.g. Red)"
                value={opt}
                onChange={e => { const c = [...newOptions]; c[i] = e.target.value; setNewOptions(c); }}
              />
            ))}
            <button onClick={() => setNewOptions([...newOptions, ""])} className="d-btn d-btn-outline text-[11px] gap-1">
              <FaPlus size={8} /> Add option
            </button>
            <div className="flex gap-2 pt-1">
              <button
                disabled={selectionLoading}
                onClick={handleAddSelection}
                className="d-btn d-btn-primary text-[12px] gap-1.5"
              >
                {selectionLoading ? <Loader size={13} color="#fff" /> : null} Save selection
              </button>
              <button
                onClick={() => { setShowAddSelection(false); setNewSelectionName(""); setNewOptions([""]); }}
                className="d-btn d-btn-outline text-[12px]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddSelection(true)} className="d-btn d-btn-outline gap-1.5 text-[12px]">
            <FaPlus size={9} /> Add selection
          </button>
        )}
      </div>

      {/* ─── Danger zone ─── */}
      <div className="d-card" style={{ border: "1px solid #fee2e2", background: "#fff5f5" }}>
        <p className="section-label mb-2 text-red-400">Danger Zone</p>
        <p className="text-[12px] text-slate-500 mb-3">Permanently delete this product. This action cannot be undone.</p>
        <button onClick={() => setDeleteProductOpen(true)} className="d-btn d-btn-danger gap-2">
          <FaTrash size={11} /> Delete Product
        </button>
      </div>

      {/* ─── Confirm modals ─── */}
      <ConfirmModal open={!!deleteImageId}      title="Delete Image"     message="Delete this image?"           loading={deletingImage}     onCancel={() => setDeleteImageId(null)}     onConfirm={confirmDeleteImage} />
      <ConfirmModal open={!!deleteAttributeId}  title="Delete Attribute" message="Delete this attribute?"       loading={deletingAttribute} onCancel={() => setDeleteAttributeId(null)} onConfirm={confirmDeleteAttribute} />
      <ConfirmModal open={deleteProductOpen}    title="Delete Product"   message="This action cannot be undone." loading={deletingProduct}   onCancel={() => setDeleteProductOpen(false)} onConfirm={confirmDeleteProduct} />
      <ConfirmModal open={!!deletingSelectionId} title="Delete Selection" message="Delete this selection?"       loading={!!selectionSavingId} onCancel={() => setDeletingSelectionId(null)} onConfirm={confirmDeleteSelection} />
    </div>
  );
}
