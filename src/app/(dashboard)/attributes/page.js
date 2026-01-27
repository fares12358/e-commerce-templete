"use client";

import { useEffect, useState } from "react";
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  AttributeStauts,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "react-toastify";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [type, setType] = useState("text");
  const [editingId, setEditingId] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusLoadingId, setStatusLoadingId] = useState(null);

  /* ================= FETCH ================= */
    
  const fetchAttributes = async () => {
    try {
      const res = await getAttributes();
      if (res.success) setAttributes(res.data);
    } catch {
      toast.error("Failed to load attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  /* ================= CREATE / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Attribute name is required");
    if (!keyValue.trim()) return toast.error("Attribute key is required");
    if (!type) return toast.error("Attribute type is required");

    const payload = {
      name,
      key: keyValue,
      type,
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await updateAttribute(editingId, payload);
        toast.success("Attribute updated");
      } else {
        await createAttribute(payload);
        toast.success("Attribute created");
      }

      resetForm();
      fetchAttributes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setKeyValue("");
    setType("text");
    setEditingId(null);
  };

  /* ================= EDIT ================= */

  const handleEdit = (attr) => {
    setEditingId(attr._id);
    setName(attr.name);
    setKeyValue(attr.key);
    setType(attr.type);
  };

  /* ================= DELETE ================= */

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteAttribute(deleteId);
      toast.success("Attribute deleted");
      fetchAttributes();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  /* ================= STATUS ================= */

  const handleToggleStatus = async (attr) => {
    try {
      setStatusLoadingId(attr._id);

      await AttributeStauts(attr._id);

      toast.success("Status updated");
      fetchAttributes();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-8">
      {/* ================= FORM ================= */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h2 className="mb-4 font-medium">
          {editingId ? "Edit Attribute" : "Add Attribute"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Name"
            className="border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Key (e.g. color, size)"
            className="border px-3 py-2"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
          />

          <select
            className="border px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>

          <div className="md:col-span-3">
            <button
              disabled={submitting}
              className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 flex items-center gap-2 rounded-md disabled:opacity-60 hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
              {submitting ? (
                <>
                  <Loader size={18} color="#fff" />
                  Processing
                </>
              ) : (
                editingId ? "Update" : "Create"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ================= LIST ================= */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="border-b px-4 py-3 font-medium">Attributes</div>

        {attributes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attributes found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr._id} className="border-t">
                  <td className="px-4 py-2">{attr.name}</td>
                  <td className="px-4 py-2">{attr.key}</td>
                  <td className="px-4 py-2 capitalize">{attr.type}</td>

                  <td className="px-4 py-2 text-center">
                    <StatusSwitch
                      checked={attr.isActive}
                      loading={statusLoadingId === attr._id}
                      onChange={() => handleToggleStatus(attr)}
                    />
                  </td>

                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(attr)}
                      className="bg-gradient-to-br from-blue-500 to-blue-300 text-white py-1 px-3 rounded-md hover:-translate-y-1 transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(attr._id)}
                      className="bg-gradient-to-br from-red-500 to-red-300 text-white py-1 px-3 rounded-md hover:-translate-y-1 transition-all duration-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete attribute"
        message="Are you sure you want to delete this attribute?"
        loading={deleteLoading}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ================= SWITCH ================= */

const StatusSwitch = ({ checked, loading, onChange }) => {
  return (
    <button
      disabled={loading}
      onClick={onChange}
      className={`w-10 h-5 flex items-center rounded-full p-1 relative transition ${
        checked ? "bg-black" : "bg-gray-300"
      }`}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader size={12} />
        </span>
      ) : (
        <span
          className={`bg-white w-3 h-3 rounded-full transition transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
};
