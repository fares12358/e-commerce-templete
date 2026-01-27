"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProductByID,
  getCategories,
  updateProductBasic,
  deleteProduct,
  addProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  addSelectionOption,
  deleteSelectionOption,
  deleteProductSelection,
  updateProductSelection,
  addProductSelection,
} from "@/lib/api";

import Loader from "@/components/ui/Loader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";

import { FaBox, FaTags, FaImages, FaTrash, FaPlus, FaEdit, FaRegEdit, FaPen, FaTimes, FaCheck, FaFilter } from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params?.productId;
  const router = useRouter();

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState(null);
  const [deleteAttributeId, setDeleteAttributeId] = useState(null);


  // loading flags
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [deletingAttribute, setDeletingAttribute] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [selectionLoading, setSelectionLoading] = useState(false);
  const [optionLoadingId, setOptionLoadingId] = useState(null);
  const [selectionSavingId, setSelectionSavingId] = useState(null);


  // basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // attributes
  const [attributes, setAttributes] = useState([]);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");
  const [addingAttribute, setAddingAttribute] = useState(false);
  // selections
  const [selections, setSelections] = useState([]);
  const [showAddSelection, setShowAddSelection] = useState(false);
  const [newSelectionName, setNewSelectionName] = useState("");
  const [newOptions, setNewOptions] = useState([""]);

  const [deletingSelectionId, setDeletingSelectionId] = useState(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    if (!productId) return;
    try {
      const [p, c] = await Promise.all([
        getProductByID(productId),
        getCategories(),
      ]);
      console.log(p.selections);

      if (p?._id) {
        setProduct(p);
        setName(p.name || "");
        setDescription(p.description || "");
        setPrice(String(p.price ?? ""));
        setComparePrice(String(p.comparePrice ?? ""));
        setSku(p.sku || "");
        setStock(String(p.stock ?? ""));
        setCategoryId(p.categoryId?._id || "");
        setIsFeatured(!!p.isFeatured);
        setAttributes(p.attributes || []);
        setSelections(
          (p.selections || []).map(s => ({
            ...s,
            options: s.options.map(o =>
              typeof o === "string" ? { value: o } : o
            )
          }))
        );

      }

      if (c?.success) setCategories(c.data);
    } catch {
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  /* ================= BASIC UPDATE ================= */
  const handleUpdateBasic = async () => {
    try {
      setSaving(true);
      await updateProductBasic(productId, {
        name,
        description,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : undefined,
        sku,
        stock: Number(stock),
        categoryId,
        isFeatured,
      });
      toast.success("Product updated");
      fetchData();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= ATTRIBUTES ================= */
  const handleUpdateAttribute = async (id, key, value) => {
    try {
      await updateProductAttribute(productId, { attributeId: id, key, value });
    } catch {
      toast.error("Update attribute failed");
    }
  };

  const handleSaveNewAttribute = async () => {
    if (!newAttrKey || !newAttrValue) {
      toast.error("Key and value required");
      return;
    }
    try {
      setAddingAttribute(true);
      await addProductAttribute(productId, {
        key: newAttrKey,
        value: newAttrValue,
      });
      setShowAddAttribute(false);
      setNewAttrKey("");
      setNewAttrValue("");
      fetchData();
    } catch {
      toast.error("Add attribute failed");
    } finally {
      setAddingAttribute(false);
    }
  };

  const confirmDeleteAttribute = async () => {
    try {
      setDeletingAttribute(true);
      await deleteProductAttribute(productId, deleteAttributeId);
      setDeleteAttributeId(null);
      fetchData();
    } catch {
      toast.error("Delete attribute failed");
    } finally {
      setDeletingAttribute(false);
    }
  };

  /* ================= SELECTIONS ================= */

  const handleAddSelection = async () => {
    if (!newSelectionName) return toast.error("Name required");

    try {
      setSelectionLoading(true);
      await addProductSelection(productId, {
        name: newSelectionName,
        options: newOptions.filter(o => o)
      });
      setNewSelectionName("");
      setNewOptions([""]);
      setShowAddSelection(false);
      fetchData();
    } catch {
      toast.error("Add selection failed");
    } finally {
      setSelectionLoading(false);
    }
  };


  const confirmDeleteSelection = async () => {
    try {
      setSelectionSavingId(deletingSelectionId);
      await deleteProductSelection(productId, deletingSelectionId);
      setDeletingSelectionId(null);
      fetchData();
    } catch {
      toast.error("Delete selection failed");
    } finally {
      setSelectionSavingId(null);
    }
  };


  const handleUpdateSelection = async (sel) => {
    try {
      setSelectionSavingId(sel._id);
      await updateProductSelection(productId, {
        selectionId: sel._id,
        name: sel.name
      });
      toast.success("Updated");
      fetchData();
    } catch {
      toast.error("Failed");
    } finally {
      setSelectionSavingId(null);
    }
  };

  const handleAddOption = async (selectionId, value) => {
    if (!value.trim()) return;

    try {
      setOptionLoadingId(selectionId);
      await addSelectionOption(productId, selectionId, value);
      fetchData();
    } catch {
      toast.error("Add option failed");
    } finally {
      setOptionLoadingId(null);
    }
  };


  const handleDeleteOption = async (selectionId, optionId) => {
    try {
      setOptionLoadingId(optionId);
      await deleteSelectionOption(productId, selectionId, optionId);
      fetchData();
    } catch {
      toast.error("Delete option failed");
    } finally {
      setOptionLoadingId(null);
    }
  };



  /* ================= IMAGES ================= */
  const handleAddImage = async (file) => {
    if (!file) return;
    try {
      setImageLoading(true);
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("image", compressed || file);
      await addProductImage(productId, fd);
      fetchData();
    } catch {
      toast.error("Add image failed");
    } finally {
      setImageLoading(false);
    }
  };

  const handleReplaceImage = async (imageId, file) => {
    if (!file) return;
    try {
      setImageLoading(true);
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("imageId", imageId);
      fd.append("image", compressed || file);
      await updateProductImage(productId, fd);
      fetchData();
    } catch {
      toast.error("Replace image failed");
    } finally {
      setImageLoading(false);
    }
  };

  const confirmDeleteImage = async () => {
    try {
      setDeletingImage(true);
      await deleteProductImage(productId, deleteImageId);
      setDeleteImageId(null);
      fetchData();
    } catch {
      toast.error("Delete image failed");
    } finally {
      setDeletingImage(false);
    }
  };

  /* ================= DELETE PRODUCT ================= */
  const confirmDeleteProduct = async () => {
    try {
      setDeletingProduct(true);
      await deleteProduct(productId);
      router.push("/products");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingProduct(false);
    }
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="space-y-10">
      {/* BASIC INFO */}
      <div className="bg-white border rounded-md p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <div
            className='bg-gradient-to-br from-purple-800 to-purple-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
          >
            <span className="-rotate-12">
              <FaBox size={25} className="drop-shadow-md" />
            </span>
          </div>
          Basic Information
        </h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-md font-semibold">name</label>
          <input className="border px-3 py-2 w-full rounded-md" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-md font-semibold">description</label>
          <textarea className="border px-3 py-2 w-full rounded-md" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="text-md font-semibold">price</label>
            <input type="number" className="border px-3 py-2 rounded-md" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="comparePrice" className="text-md font-semibold">comparePrice</label>
            <input type="number" className="border px-3 py-2 rounded-md" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="sku" className="text-md font-semibold">sku</label>
            <input className="border px-3 py-2 rounded-md" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="stock" className="text-md font-semibold">stock</label>
            <input type="number" className="border px-3 py-2 rounded-md" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-semibold">Category</label>

          <CustomSelect
            placeholder="Select category"
            value={categoryId}
            onChange={(val) => setCategoryId(val)}
            options={[
              { label: "Select category", value: "" },
              ...categories.map((c) => ({
                label: c.name,
                value: c._id,
              })),
            ]}
          />
        </div>


        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>

        <button onClick={handleUpdateBasic} disabled={saving} className=" rounded-md bg-gradient-to-br from-black to-black/70 text-white hover:-translate-y-1 transition-all duration-300 ease-in-out px-4 py-2">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ATTRIBUTES */}
      <div className="bg-white border rounded-md p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <div
            className='bg-gradient-to-br from-cyan-800 to-cyan-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
          >
            <span className="-rotate-12">
              <FaTags size={25} className="drop-shadow-md" />
            </span>
          </div>
          Attributes
        </h2>

        {attributes.map((attr) => (
          <div key={attr._id} className="flex gap-2">
            <input className="border px-3 py-2 w-1/2 rounded-md" defaultValue={attr.key} onBlur={(e) => handleUpdateAttribute(attr._id, e.target.value, attr.value)} />
            <input className="border px-3 py-2 w-1/2 rounded-md" defaultValue={attr.value} onBlur={(e) => handleUpdateAttribute(attr._id, attr.key, e.target.value)} />
            <button onClick={() => setDeleteAttributeId(attr._id)} className="text-red-600 hover:rotate-12 transition-all duration-300 ease-in-out"><FaTrash /></button>
          </div>
        ))}

        {showAddAttribute ? (
          <div className="flex gap-2">
            <input className="border px-3 py-2 w-1/2" value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} />
            <input className="border px-3 py-2 w-1/2" value={newAttrValue} onChange={(e) => setNewAttrValue(e.target.value)} />
            <button disabled={addingAttribute} onClick={handleSaveNewAttribute} className="flex items-center justify-center gap-2 py-2 px-2 rounded-md bg-gradient-to-br from-blue-500 to-blue-400 text-white hover:-translate-y-1 transition-all duration-300 ease-in-out">{addingAttribute ? <> <Loader size={10} color="#fff" /> Saving...</> : <><FaCheck />Save</>}</button>
            <button disabled={addingAttribute} onClick={() => { setShowAddAttribute(false); setNewAttrValue(''); setNewAttrKey('') }} className="flex items-center justify-center gap-2 py-2 px-2 rounded-md bg-gradient-to-br from-red-600 to-red-400 text-white hover:-translate-y-1 transition-all duration-300 ease-in-out"><FaTimes />Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowAddAttribute(true)}
            className="text-md flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-gradient-to-br from-blue-800 to-blue-400 text-white hover:-translate-y-1 transition-all duration-300 ease-in-out"
          > <FaPlus size={15} /> Add attribute</button>
        )}
      </div>

      {/* ================= SELECTIONS ================= */}
      <div className="bg-white border rounded-md p-5 space-y-4">

        <h2 className="font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-800 to-purple-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5">
            <span className="-rotate-12">
              <FaFilter size={25} />
            </span>
          </div>
          Selections
        </h2>

        {selections.map((sel, sIndex) => (
          <div key={sel._id} className="border rounded-md p-4 space-y-3">

            {/* Selection name */}
            <input
              className="border px-3 py-2 rounded-md w-full font-medium"
              value={sel.name}
              onChange={(e) => {
                const copy = structuredClone(selections);

                copy[sIndex].name = e.target.value;
                setSelections(copy);
              }}
            />

            {/* OPTIONS */}
            {sel.options.map((opt) => (
              <div key={opt._id} className="flex gap-2">

                <input
                  className="border px-3 py-2 rounded-md flex-1 bg-gray-100"
                  value={opt.value}
                  disabled
                />

                <button
                  onClick={() => handleDeleteOption(sel._id, opt._id)}
                  disabled={optionLoadingId === opt._id}
                  className="text-red-600"
                >
                  {optionLoadingId === opt._id ? "..." : <FaTrash />}
                </button>

              </div>
            ))}

            <input
              disabled={optionLoadingId === sel._id}
              className="border px-3 py-2 rounded-md w-full"
              placeholder={
                optionLoadingId === sel._id ? "Adding..." : "Add new option and press Enter"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddOption(sel._id, e.target.value);
                  e.target.value = "";
                }
              }}
            />

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">

              <button
                onClick={() => handleUpdateSelection(sel)}
                disabled={selectionSavingId === sel._id}
                className="bg-black text-white px-4 py-2 rounded-md text-sm disabled:opacity-60"
              >
                {selectionSavingId === sel._id ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setDeletingSelectionId(sel._id)}
                disabled={selectionSavingId === sel._id}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-60"
              >
                Delete
              </button>

            </div>
          </div>
        ))}

        {showAddSelection && (
          <div className="border rounded-md p-4 space-y-2">

            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Selection name (ex: Color)"
              value={newSelectionName}
              onChange={(e) => setNewSelectionName(e.target.value)}
            />

            {newOptions.map((opt, i) => (
              <input
                key={i}
                className="border px-3 py-2 rounded w-full"
                placeholder="Option value"
                value={opt}
                onChange={(e) => {
                  const copy = [...newOptions];
                  copy[i] = e.target.value;
                  setNewOptions(copy);
                }}
              />
            ))}

            <button
              onClick={() => setNewOptions([...newOptions, ""])}
              className="text-blue-600 text-sm"
            >
              + Add option
            </button>

            <div className="flex gap-2 pt-2">
              <button
                disabled={selectionLoading}
                onClick={handleAddSelection}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {selectionLoading ? "Saving..." : "Save selection"}
              </button>

              <button
                onClick={() => {
                  setShowAddSelection(false);
                  setNewSelectionName("");
                  setNewOptions([""]);
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAddSelection(true)}
          className="bg-gradient-to-br from-purple-800 to-purple-400 text-white px-5 py-3 rounded-md flex items-center gap-2"
        >
          <FaPlus /> Add selection
        </button>


      </div>


      {/* IMAGES */}
      <div className="bg-white border rounded-md p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <div
            className='bg-gradient-to-br from-neutral-800 to-neutral-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
          >
            <span className="-rotate-12">
              <FaImages size={25} className="drop-shadow-md" />
            </span>
          </div>
          Images
        </h2>

        <label className={`cursor-pointer flex items-center justify-center gap-2 py-3 px-5 w-fit rounded-md bg-gradient-to-br from-blue-800 to-blue-400 text-white hover:-translate-y-1 transition-all duration-300 ease-in-out  ${imageLoading ? 'opacity-80' : ''} `}>
          {imageLoading ? <> <Loader size={20} color={'#fff'} /> Uploading...</> : <> <FaPlus size={15} />  Add image </>}
          <input type="file" hidden accept="image/*" onChange={(e) => handleAddImage(e.target.files[0])} />
        </label>

        <div className="flex gap-4 flex-wrap">
          {product.images.map((img) => (
            <div key={img._id} className="border p-2 w-32 rounded flex items-center flex-col gap-3">
              <img src={img.url} className="h-24 w-full object-cover rounded" />
              <div className="flex items-baseline justify-evenly w-full">
                <label className="block text-xs cursor-pointer text-blue-500 hover:scale-110 transition-all duration-300 ease-in-out">
                  <FaPen size={15} />
                  <input type="file" hidden accept="image/*" onChange={(e) => handleReplaceImage(img._id, e.target.files[0])} />
                </label>
                <button onClick={() => setDeleteImageId(img._id)} className="text-xs text-red-600 cursor-pointer hover:scale-110 transition-all duration-300 ease-in-out"><FaTrash size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELETE PRODUCT */}
      <button onClick={() => setDeleteProductOpen(true)} className="bg-gradient-to-br from-red-800 to-red-400 text-white py-3 px-5 rounded-md flex items-center justify-center gap-2 hover:-translate-y-1 transition-all ease-in-out duration-300">
        <FaTrash size={15} />
        Delete Product
      </button>

      {/* MODALS */}
      <ConfirmModal open={!!deleteImageId} title="Delete image" message="Are you sure?" onCancel={() => setDeleteImageId(null)} onConfirm={confirmDeleteImage} loading={deletingImage} />
      <ConfirmModal open={!!deleteAttributeId} title="Delete attribute" message="Are you sure?" onCancel={() => setDeleteAttributeId(null)} onConfirm={confirmDeleteAttribute} loading={deletingAttribute} />
      <ConfirmModal open={deleteProductOpen} title="Delete product" message="This action cannot be undone" onCancel={() => setDeleteProductOpen(false)} onConfirm={confirmDeleteProduct} loading={deletingProduct} />
      <ConfirmModal
        open={!!deletingSelectionId}
        title="Delete selection"
        message="Are you sure?"
        onCancel={() => setDeletingSelectionId(null)}
        onConfirm={confirmDeleteSelection}
      />

    </div>
  );
}
