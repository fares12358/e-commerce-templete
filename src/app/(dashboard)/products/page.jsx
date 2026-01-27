"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProducts,
  createProduct,
  getCategories,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";
import { motion } from "framer-motion";
import {
  FaBox,
  FaPlus,
  FaTags,
  FaTimes,
  FaImage,
  FaFilter,
} from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";

/* ================= PAGE ================= */

export default function ProductsPage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false)

  const [filters, setFilters] = useState({
    categoryId: "",
    isActive: "",
    sort: "newest",
    name: "",
    page: 1,
  });


  const [tempFilters, setTempFilters] = useState(filters);

  /* ================= FORM STATE ================= */
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
  const [selections, setSelections] = useState([
    { name: "", options: [""] }
  ]);

  /* ================= FETCH ================= */

  const fetchAll = async (isFilter = false) => {
    try {
      if (isFilter) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      const sortMap = {
        newest: { sortBy: "createdAt", order: "desc" },
        priceAsc: { sortBy: "price", order: "asc" },
        priceDesc: { sortBy: "price", order: "desc" },
      };

      const sortParams = sortMap[filters.sort];

      const [p, c] = await Promise.all([
        getProducts({
          categoryId: filters.categoryId || undefined,
          isActive: filters.isActive || undefined,
          name: filters.name || undefined,
          sortBy: sortParams.sortBy,
          order: sortParams.order,
          page: filters.page || 1,
        }),
        getCategories(),
      ]);

      if (p.success) setProducts(p.data);
      if (c.success) setCategories(c.data);

    } catch {
      toast.error("Failed to load products");
    } finally {
      if (isFilter) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAll(false);   // full page loader
  }, []);

  useEffect(() => {
    fetchAll(true);   // grid loader only
  }, [filters]);


  /* ================= ATTRIBUTES ================= */

  const updateAttribute = (i, field, val) => {
    const copy = [...attributes];
    copy[i][field] = val;
    setAttributes(copy);
  };

  const addAttribute = () =>
    setAttributes([...attributes, { key: "", value: "" }]);

  const removeAttribute = (i) =>
    setAttributes(attributes.filter((_, index) => index !== i));

  /* ================= SELECTIONS ================= */

  const updateSelectionName = (i, val) => {
    const copy = [...selections];
    copy[i].name = val;
    setSelections(copy);
  };

  const updateOption = (i, oi, val) => {
    const copy = [...selections];
    copy[i].options[oi] = val;
    setSelections(copy);
  };

  const addSelection = () => {
    setSelections([...selections, { name: "", options: [""] }]);
  };

  const removeSelection = (i) => {
    setSelections(selections.filter((_, idx) => idx !== i));
  };

  const addOption = (i) => {
    const copy = [...selections];
    copy[i].options.push("");
    setSelections(copy);
  };

  const removeOption = (i, oi) => {
    const copy = [...selections];
    copy[i].options = copy[i].options.filter((_, idx) => idx !== oi);
    setSelections(copy);
  };


  /* ================= IMAGES ================= */

  const addImage = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file);

    setImages((prev) => [
      ...prev,
      {
        file: compressed || file,
        preview: URL.createObjectURL(file),
      },
    ]);
  };

  const removeImage = (i) =>
    setImages((prev) => prev.filter((_, index) => index !== i));

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !categoryId || images.length === 0)
      return toast.error("Fill required fields");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("comparePrice", comparePrice);
    formData.append("sku", sku);
    formData.append("stock", stock);
    formData.append("categoryId", categoryId);
    formData.append("isFeatured", isFeatured);
    formData.append(
      "attributes",
      JSON.stringify(attributes.filter(a => a.key && a.value))
    );
    formData.append(
      "selections",
      JSON.stringify(
        selections.filter(
          s => s.name && s.options.some(o => o)
        )
      )
    );


    images.forEach((img) => formData.append("images", img.file));

    try {
      setSubmitting(true);
      await createProduct(formData);
      toast.success("Product created");
      resetForm();
      fetchAll();
    } catch {
      toast.error("Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setComparePrice("");
    setSku("");
    setStock("");
    setCategoryId("");
    setIsFeatured(false);
    setImages([]);
    setAttributes([{ key: "", value: "" }]);
    setSelections([
      { name: "", options: [""] }
    ]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ================= ADD PRODUCT ================= */}

      <div className="bg-white shadow-sm rounded-md p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <div
            className='bg-gradient-to-br from-purple-800 to-purple-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
          >
            <span className="-rotate-12">
              <FaBox size={25} className="drop-shadow-md" />
            </span>
          </div>
          Add Product
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input className="border px-3 py-2 rounded-md" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border px-3 py-2 rounded-md" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />

          <textarea className="border px-3 py-2 rounded-md md:col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <input type="number" className="border px-3 py-2 rounded-md" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input type="number" className="border px-3 py-2 rounded-md" placeholder="Compare price" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />

          <input type="number" className="border px-3 py-2 rounded-md" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />

          <CustomSelect
            placeholder="Select category"
            value={categoryId}
            onChange={(val) => setCategoryId(val)}
            options={[
              { label: "Select category", value: "" },
              ...categories.map(c => ({
                label: c.name,
                value: c._id
              }))
            ]}
          />

          {/* Upload */}
          <div
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50 w-fit"
          >
            <FaImage /> Upload images
          </div>
          <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => { addImage(e.target.files[0]); e.target.value = ""; }} />

          {/* Previews */}
          <div className="flex gap-3 flex-wrap md:col-span-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.preview} className="h-20 w-20 rounded object-cover" />
                <button onClick={() => removeImage(i)} type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>

          {/* ATTRIBUTES */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <FaTags /> Attributes
            </h3>

            {attributes.map((attr, i) => (
              <div key={i} className="flex gap-2">
                <input className="border px-3 py-2 w-1/2 rounded-md" placeholder="Key" value={attr.key} onChange={(e) => updateAttribute(i, "key", e.target.value)} />
                <input className="border px-3 py-2 w-1/2 rounded-md" placeholder="Value" value={attr.value} onChange={(e) => updateAttribute(i, "value", e.target.value)} />
                {attributes.length > 1 && (
                  <button onClick={() => removeAttribute(i)} type="button" className="text-red-600 hover:rotate-180 transition-all duration-300 ease-in-out">
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={addAttribute} className="bg-gradient-to-br from-blue-700 to-blue-400 text-white px-5 py-3 rounded-md hover:-translate-y-1 transition duration-300  flex items-center gap-2 w-fit">
              <FaPlus size={15} /> Add attribute
            </button>
          </div>

          {/* ================= SELECTIONS ================= */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <FaFilter /> Selections (Variants)
            </h3>

            {selections.map((sel, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2">

                <div className="flex gap-2">
                  <input
                    placeholder="Selection name (ex: Color)"
                    className="border px-3 py-2 rounded-md flex-1"
                    value={sel.name}
                    onChange={(e) =>
                      updateSelectionName(i, e.target.value)
                    }
                  />

                  {selections.length > 1 && (
                    <button
                      onClick={() => removeSelection(i)}
                      className="text-red-600"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {/* OPTIONS */}
                {sel.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-2">
                    <input
                      placeholder="Option (ex: Red)"
                      className="border px-3 py-2 rounded-md flex-1"
                      value={opt}
                      onChange={(e) =>
                        updateOption(i, oi, e.target.value)
                      }
                    />

                    {sel.options.length > 1 && (
                      <button
                        onClick={() => removeOption(i, oi)}
                        className="text-red-600"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(i)}
                  className="text-sm text-blue-600 flex items-center gap-1"
                >
                  <FaPlus /> Add option
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addSelection}
              className="bg-gradient-to-br from-purple-700 to-purple-400 text-white px-5 py-3 rounded-md hover:-translate-y-1 transition flex items-center gap-2 w-fit"
            >
              <FaPlus size={15} /> Add selection
            </button>
          </div>



          <button disabled={submitting} className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-3 rounded-md hover:-translate-y-1 transition duration-300 md:col-span-2">
            {submitting ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>


      {/* ================= FILTERS ================= */}

      <div className="flex flex-wrap gap-4 items-center bg-white shadow-sm rounded-md p-4">

        <input
          placeholder="Search by product name"
          className="border px-3 py-2 rounded-md"
          value={tempFilters.name}
          onChange={(e) =>
            setTempFilters({ ...tempFilters, name: e.target.value })
          }
        />

        <CustomSelect
          placeholder="All categories"
          value={filters.categoryId}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, categoryId: val })
          }

          options={[
            { label: "All categories", value: "" },
            ...categories.map(c => ({
              label: c.name,
              value: c._id
            }))
          ]}
        />

        {/* <CustomSelect
          placeholder="Status"
          value={filters.isActive}
          onChange={(val) =>
            setFilters({ ...filters, isActive: val, page: 1 })
          }
          options={[
            { label: "All status", value: "" },
            { label: "Active", value: "true" },
            { label: "Disabled", value: "false" },
          ]}
        /> */}

        <CustomSelect
          placeholder="Sort"
          value={filters.sort}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, categoryId: val })
          }

          options={[
            { label: "Newest", value: "newest" },
            { label: "Price low → high", value: "priceAsc" },
            { label: "Price high → low", value: "priceDesc" },
          ]}
        />

        <button
          onClick={() => setFilters({ ...tempFilters, page: 1 })}
          className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md hover:-translate-y-1 transition duration-300 ease-in-out flex items-center justify-center gap-2"
        >
          <FaFilter />
          Apply
        </button>

        <button
          onClick={() => {
            const clean = {
              categoryId: "",
              isActive: "",
              name: "",
              sort: "newest",
              page: 1,
            };
            setTempFilters(clean);
            setFilters(clean);
          }}
          className="border px-4 py-2 rounded-md hover:bg-gray-50 hover:-translate-y-1 transition duration-300 ease-in-out"
        >
          Clear
        </button>


      </div>


      {/* ================= PRODUCTS GRID ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {
          filterLoading ? <div className="w-full min-h-[25vh] col-span-4 flex items-center justify-center"><Loader size={30} /> </div>
            :
            products?.products?.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/products/${p._id}`)}
                className="cursor-pointer border rounded-md overflow-hidden shadow-sm hover:shadow-md transition duration-300 ease-in-out bg-white"
              >
                <div className="h-40 bg-gray-100">
                  <img src={p.images?.[0]?.url} className="w-full h-full object-cover" />
                </div>

                <div className="p-3 space-y-1">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{p.categoryId.name}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{p.description}</div>
                  <div className="font-semibold">${p.price}</div>
                </div>
              </motion.div>
            ))}
      </div>

      {/* ================= PAGINATION ================= */}

      {products?.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">

          <button
            disabled={products.pagination.page === 1}
            onClick={() =>
              setFilters({ ...filters, page: products.pagination.page - 1 })
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: products.pagination.totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 border rounded ${page === products.pagination.page
                  ? "bg-black text-white"
                  : ""
                  }`}
              >
                {page}
              </button>
            );
          })}

          <button
            disabled={products.pagination.page === products.pagination.totalPages}
            onClick={() =>
              setFilters({ ...filters, page: products.pagination.page + 1 })
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>
      )}


    </div>
  );
}
