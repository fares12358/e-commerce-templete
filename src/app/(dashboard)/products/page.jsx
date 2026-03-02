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
  FaSyncAlt,
} from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";

const generateKey = (filters) => {
  return JSON.stringify({
    categoryId: filters.categoryId,
    isActive: filters.isActive,
    productNumber: filters.productNumber,
    stockStatus: filters.stockStatus,
    sort: filters.sort,
    page: filters.page,
  });
};

const getVisiblePages = (current, total) => {
  const delta = 1; // how many pages around current
  const pages = [];

  const range = [];
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  if (current - delta > 2) {
    range.unshift("...");
  }

  if (current + delta < total - 1) {
    range.push("...");
  }

  pages.push(1);
  pages.push(...range);
  if (total > 1) pages.push(total);

  return pages;
};

/* ================= PAGE ================= */
export default function ProductsPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const { productsCache, setProductsCache } = useAuth()
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    categoryId: "",
    isActive: "",
    sort: "newest",
    productNumber: "",
    page: 1,
    stockStatus: "",
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
  const fetchAll = async (isFilter = false, force = false) => {
    const key = generateKey(filters);

    // ✅ If cached → use it
    if (!force && productsCache[key]) {
      setProducts(productsCache[key]);
      return;
    }

    try {
      if (isFilter) {
        setFilterLoading(true);
      } else if (!refreshing) {
        setLoading(true);
      }

      const sortMap = {
        newest: { sortBy: "createdAt", order: "desc" },
        oldest: { sortBy: "createdAt", order: "asc" },
        priceAsc: { sortBy: "price", order: "asc" },
        priceDesc: { sortBy: "price", order: "desc" },
      };

      const sortParams = sortMap[filters.sort];

      const response = await getProducts({
        categoryId: filters.categoryId || undefined,
        isActive: filters.isActive || undefined,
        productNumber: filters.productNumber || undefined,
        stockStatus: filters.stockStatus || undefined,
        sortBy: sortParams.sortBy,
        order: sortParams.order,
        page: filters.page || 1,
      });

      if (response.success) {
        setProducts(response.data);
        // 🔥 Save in cache
        setProductsCache((prev) => ({
          ...prev,
          [key]: response.data,
        }));
      }

    } catch {
      toast.error("Failed to load products");
    } finally {
      if (isFilter) {
        setFilterLoading(false);
      } else if (!refreshing) {
        setLoading(false);
      }
    }
  };

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

  const handleMultipleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remainingSlots = 5 - images.length;

    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more image(s)`);
    }

    const processedImages = await Promise.all(
      filesToAdd.map(async (file) => {
        const compressed = await compressImage(file);
        return {
          file: compressed || file,
          preview: URL.createObjectURL(file),
        };
      })
    );

    setImages((prev) => [...prev, ...processedImages]);

    e.target.value = "";
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
      setProductsCache({});
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

  useEffect(() => {
    const fetchCategoriesData = async () => {
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    };

    fetchCategoriesData();
  }, []);

  useEffect(() => {
    fetchAll(false);
  }, []);


  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setProductsCache({});
    try {
      await fetchAll(false, true);
      toast.success("Products refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll(true);
  }, [filters]);

  if (loading && !refreshing) {
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
            onClick={() => {
              if (images.length >= 5) {
                toast.error("Maximum 5 images allowed");
                return;
              }
              fileRef.current.click();
            }}
            className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50 w-fit"
          >
            <FaImage /> Upload images
          </div>
          <input ref={fileRef} hidden type="file" accept="image/*" multiple disabled={images.length >= 5} onChange={handleMultipleImages} />

          {/* Previews */}
          <div className="flex gap-3 flex-wrap md:col-span-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.preview} className="h-20 w-20 rounded object-contain object-center border border-gray-200 shadow-sm" />
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
                      className="text-red-600 hover:rotate-180 transition-all duration-300 ease-in-out"
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
                        className="text-red-600 hover:rotate-180 transition-all duration-300 ease-in-out"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(i)}
                  className="text-sm text-black flex items-center gap-1 py-3 px-4 shadow-sm rounded-md bg-gradient-to-br from-gray-200 to-gray-50 hover:-translate-y-1 transition ease-in-out duration-300"
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
          placeholder="Search by product number"
          className="border px-3 py-2 rounded-md w-full"
          value={tempFilters.productNumber}
          onChange={(e) =>
            setTempFilters({ ...tempFilters, productNumber: e.target.value })
          }
        />

        <CustomSelect
          placeholder="All categories"
          value={tempFilters.categoryId}
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
          value={tempFilters.sort}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, sort: val })
          }

          options={[
            { label: "Newest", value: "newest" },
            { label: "Oldest", value: "oldest" },
            { label: "Price low → high", value: "priceAsc" },
            { label: "Price high → low", value: "priceDesc" },
          ]}
        />

        <CustomSelect
          placeholder="Stock"
          value={tempFilters.stockStatus}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, stockStatus: val })
          }
          options={[
            { label: "All", value: "" },
            { label: "In Stock", value: "instock" },
            { label: "Out of Stock", value: "outstock" },
          ]}
        />

        <div className="w-fit flex items-center gap-4">

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
                productNumber: "",
                sort: "newest",
                page: 1,
                stockStatus: "",
              };
              setTempFilters(clean);
              setFilters(clean);
            }}
            className="border px-4 py-2 rounded-md hover:bg-gray-50 hover:-translate-y-1 transition duration-300 ease-in-out"
          >
            Clear
          </button>
        </div>


      </div>
      <div className="flex w-full justify-end items-center">
        <button onClick={handleRefresh} disabled={refreshing} className="bg-gradient-to-br from-cyan-600 to-cyan-300 p-3 w-fit rounded-md text-white cursor-pointer group">
          <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''} group-hover:rotate-180 duration-300 ease-in-out`} />
        </button>
      </div>
      {/* ================= PRODUCTS GRID ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {
          filterLoading ? <div className="w-full min-h-[25vh] col-span-4 flex items-center justify-center"><Loader size={30} /> </div>
            :
            products?.products?.length == 0 ?
              <div className="w-full h-fit py-5 flex items-center justify-center text-gray-500 font-semibold col-span-4 min-h-[25vh] bg-white rounded-md border">
                No Products Found
              </div>
              :
              products?.products?.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/products/${p._id}`)}
                  className="cursor-pointer border rounded-md overflow-hidden shadow-sm hover:shadow-md transition duration-300 ease-in-out bg-white" dir="rtl"
                >
                  <div className="h-40 bg-gray-100">
                    <img src={p.images?.[0]?.url} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-3 space-y-1 flex flex-col gap-2">
                    <div className="font-medium truncate line-clamp-2">{p.name}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{p.categoryId.name}</div>
                    <div className={`text-sm ${p.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}  font-bold w-fit rounded py-1 px-2`}>stock {p.stock}</div>
                    <div className="font-semibold">{p.price.toLocaleString()}</div>
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

          {getVisiblePages(
            products.pagination.page,
            products.pagination.totalPages
          ).map((page, index) => (
            page === "..." ? (
              <span key={index} className="px-3 py-1">
                ...
              </span>
            ) : (
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
            )
          ))}

          <button
            disabled={
              products.pagination.page === products.pagination.totalPages
            }
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
