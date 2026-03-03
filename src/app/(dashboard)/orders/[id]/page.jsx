"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  getOrderById,
  updateOrderStatus,
  cancelOrderAdmin,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import {
  FaUser,
  FaWhatsapp,
  FaTruck,
  FaTimesCircle,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaBoxOpen,
  FaDollarSign,
  FaCopy,
  FaLink,
  FaPhone,
  FaLocationArrow,
} from "react-icons/fa";
import Link from "next/link";

/* ================= STATUS FLOW ================= */

const STATUS_FLOW = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const borderStyles = {
  pending: "border-yellow-500",
  confirmed: "border-blue-500",
  shipped: "border-purple-500",
  delivered: "border-green-500",
  cancelled: "border-red-500",
};

const iconStyles = {
  pending: <FaClock className="drop-shadow-md text-yellow-500" />,
  confirmed: <FaCheckCircle className="drop-shadow-md text-blue-500" />,
  shipped: <FaTruck className="drop-shadow-md text-purple-500" />,
  delivered: <FaBoxOpen className="drop-shadow-md text-green-500" />,
  cancelled: <FaTimesCircle className="drop-shadow-md text-red-500" />,
};

const buttonStyles = {
  pending: "from-amber-600 to-amber-300",
  confirmed: "from-blue-700 to-blue-400",
  shipped: "from-purple-700 to-purple-400",
  delivered: "from-green-700 to-green-400",
  cancelled: "from-red-700 to-red-400",
}

/* ================= PAGE ================= */

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [message, setMessage] = useState('')
  const [resetStock, setResetStock] = useState(true);

  /* ================= FETCH ================= */

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(id);
      if (res.success) setOrder(res.data);
      console.log(res.data);
      console.log(res.data);

    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  /* ================= ACTIONS ================= */

  const nextStatus = STATUS_FLOW[order?.status];

  const confirmUpdateStatus = () => {
    setConfirmAction({
      type: "status",
      title: "Update Order Status",
      message: `Change status from "${order.status}" to "${nextStatus}"?`,
    });
  };


  const confirmCancelOrder = () => {
    setResetStock(true);
    setConfirmAction({
      type: "cancel",
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
    });
  };

  const handleConfirmAction = async () => {
    try {
      setActionLoading(true);

      if (confirmAction.type === "status") {
        await updateOrderStatus(order._id, nextStatus);
        toast.success("Order updated");
      }

      if (confirmAction.type === "cancel") {
        await cancelOrderAdmin(order._id, { reset: resetStock });
        toast.success("Order cancelled");
      }

      fetchOrder();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Order Number Copied!");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  /* ================= WHATSAPP MSG ================= */
  useEffect(() => {
    if (!order?.location?.phone) return;

    const itemsText = order?.items
      ?.map((item) => {
        const itemTotal = item.price * item.quantity;
        return `• ${item.name}\n  الكمية: ${item.quantity}\n  السعر: ${item.price.toLocaleString()} EGP\n  الإجمالي: ${itemTotal.toLocaleString()} EGP`;
      })
      .join("\n\n");

    setMessage(`
  مرحباً 👋
  
  بنأكد مع حضرتك بيانات الطلب رقم:
  #${order.orderNumber}
  
  ━━━━━━━━━━━━━━━━━━
  🛒 تفاصيل الطلب:
  ━━━━━━━━━━━━━━━━━━
  
  ${itemsText}
  
  ━━━━━━━━━━━━━━━━━━
  💰 إجمالي الطلب:
  ${order.totalPrice.toLocaleString()} EGP
  
  💳 طريقة الدفع:
  ${order.paymentMethod}
  
  ━━━━━━━━━━━━━━━━━━
  📍 عنوان التوصيل:
  ━━━━━━━━━━━━━━━━━━
  المحافظة: ${order?.location?.government}
  المدينة: ${order?.location?.city}
  شارع: ${order?.location?.strName}
  تفاصيل إضافية: ${order?.location.locationDescription}
  
  📞 رقم التواصل:
  ${order.location.phone}
  
  ━━━━━━━━━━━━━━━━━━
  
  في حالة صحة البيانات برجاء تأكيد الطلب للبدء في التجهيز 🚚✨
  `);
  }, [order]);

  const sendOrderMessage = (phone, msg) => {
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-8">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center shadow-sm gap-2 text-sm bg-gradient-to-br from-zinc-600 to-zinc-400 text-white font-semibold py-3 px-5 rounded-md hover:-translate-y-1 duration-300 transition-all"
      >
        <FaArrowLeft /> Back
      </button>

      {/* ================= USER ================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm rounded-md p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-800 to-blue-400 shadow-md text-white rotate-12 md:w-20 w-16 h-16 md:h-20 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5">
            <span className="-rotate-12 text-2xl">
              <FaUser className="drop-shadow-md" size={30} />
            </span>
          </div>

          <div className="flex flex-col">
            {order?.userId ? (
              <>
                <Link
                  href={`/users/${order.userId._id}`}
                  className="text-blue-400 cursor-pointer backdrop-blur-sm bg-blue-50 p-2 w-fit rounded-md mb-px drop-shadow-sm"
                >
                  <FaLink />
                </Link>

                <div className="font-medium">{order.userId.name}</div>
                <div className="text-sm text-gray-600">
                  {order.userId.email}
                </div>
              </>
            ) : (
              <>
                <div className="text-red-500 font-medium">
                  مستخدم محذوف
                </div>
                <div className="text-sm text-gray-400">
                  لا يمكن عرض بيانات الحساب
                </div>
              </>
            )}

            <div className="text-sm text-gray-600">
              {order?.location?.phone}
            </div>
          </div>
        </div>

        {order?.location?.phone && (
          <div className=" flex items-center justify-center gap-2">
            <button
              onClick={() => { sendOrderMessage(order.location?.phone, message) }}
              target="_blank"
              className="bg-gradient-to-br from-green-800 to-green-400 text-white shadow-sm font-semibold px-5 py-3 rounded-md flex items-center gap-2 hover:-translate-y-1 duration-300 transition-all"
            >
              <FaWhatsapp size={20} /> WhatsApp
            </button>
            <button
              onClick={() => { window.open(`tel:${order.location?.phone}`) }}
              target="_blank"
              className="bg-gradient-to-br from-blue-800 to-blue-400 text-white shadow-sm font-semibold px-5 py-3 rounded-md flex items-center gap-2 hover:-translate-y-1 duration-300 transition-all"
            >
              <FaPhone size={20} /> Phone
            </button>
          </div>
        )}
      </motion.div>

      {/* ================= SHIPPING LOCATION ================= */}

      {order?.location && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm rounded-md p-5 space-y-2"
        >
          <div className="bg-gradient-to-br from-purple-800 to-purple-400 shadow-md text-white rotate-12 md:w-20 w-16 h-16 md:h-20 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5">
            <span className="-rotate-12 text-2xl">
              <FaMapMarkerAlt className="drop-shadow-md" size={30} />
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            Shipping Address
          </div>
          {order.location.locationDescription && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800 mr-2">
                Location Descreption:
              </span>
              {order.location.locationDescription}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800 mr-2">
              Location
            </span>
            {order.location.country},{" "}
            {order.location.city},{" "} {order.location.government},
          </div>

          {order.location.floorNumber && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800 mr-2">
                Floor:
              </span>
              {order.location.floorNumber}
            </div>
          )}
          {order.location.locationLink && (
            <div className="text-sm text-gray-600 flex items-center justify-start gap-2">
              <span className="font-semibold text-gray-800 mr-2 ">
                Location Link:
              </span>
              <div onClick={() => order.location?.locationLink &&
                window.open(order.location.locationLink, "_blank")
              }
                className="text-blue-400 cursor-pointer backdrop-blur-sm bg-blue-50 rounded-md p-2">
                <FaLocationArrow className="text-xl drop-shadow-sm hover:rotate-[360deg] transition-all duration-300 ease-in-out" />
                {/* {order.location.  locationLink} */}
              </div>
            </div>
          )}
          {order.location.phone && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800 mr-2">
                Phone:
              </span>
              {order.location.phone}
            </div>
          )}
        </motion.div>
      )}

      {/* ================= ORDER INFO ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-sm rounded-md p-4">
          <div className="text-sm text-gray-500">Order Number</div>
          <div className="flex items-center justify-start gap-2 mt-2 cursor-pointer" onClick={() => { copyText(order.orderNumber) }}>
            <FaCopy className="text-blue-400 drop-shadow-md" />
            <div className="font-medium capitalize">{order?.orderNumber}</div>
          </div>
        </div>
        <div className={`bg-white shadow-sm rounded-md p-4 border-t-2 ${borderStyles[order?.status]}`}>
          <div className="text-sm text-gray-500">Status</div>
          <div className="flex items-center justify-start gap-2 mt-2">
            {iconStyles[order?.status]}
            <div className="font-medium capitalize">{order?.status}</div>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-md p-4">
          <div className="text-sm text-gray-500">Payment</div>
          <div className="flex items-center justify-start gap-2 mt-2">
            <FaDollarSign className="drop-shadow-md text-green-600" />
            <div className="font-medium capitalize">{order.paymentMethod}</div>
          </div>
        </div>
      </div>

      {/* ================= PRODUCTS ================= */}
      <h3 className="text-gray-800 font-bold flex items-center justify-start gap-2 text-2xl capitalize">
        <div className="bg-gradient-to-br from-blue-800 to-blue-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl">
          <span className="-rotate-12 text-2xl">
            <FaBoxOpen className="drop-shadow-md" />
          </span>
        </div>
        items
      </h3>
      <div className="grid lg:grid-cols-3 grid-cols-1 gap-3 items-start justify-center">

        {order?.items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white shadow-sm rounded-md p-4 flex gap-4 items-start relative ${!item.productId?._id ? 'border border-red-400' : ''}`}
          >
            {/* Link to product */}
            {
              item.productId?._id &&
              <div
                className="absolute top-0 right-0 p-2 cursor-pointer text-blue-500 rounded-bl-md shadow-md bg-white"
                onClick={() =>

                  router.push(`/products/${item.productId._id}`)
                }
              >
                <FaLink />
              </div>
            }

            {/* Image only from product */}
            <img
              src={item.productId?.images?.[0]?.url || "/placeholder.png"}
              className="w-20 h-20 rounded object-cover"
            />

            {/* Snapshot data */}
            <div className="flex-1 space-y-1">
              {
                !item.productId?._id &&
                <div className="font-medium text-red-500">منتج محذوف</div>
              }
              <div className="font-medium">{item.name}</div>

              <div className="text-sm text-gray-600">
                <span className="text-gray-800 mr-1">
                  Price:
                </span>
                {item.price.toLocaleString()}
              </div>

              <div className="text-sm text-gray-600">
                <span className="text-gray-800 mr-1">
                  Qty:
                </span>
                {item.quantity}
              </div>

              {/* Attributes */}
              {item.attributes?.length > 0 && (
                <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                  {item.attributes.map((attr, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 px-2 py-1 rounded"
                    >
                      <span className="text-gray-800 ml-2">
                        {attr.key}:
                      </span>
                      {attr.value}
                    </span>
                  ))}
                </div>
              )}
              {item.selections.length > 0 && (
                <>
                  <div className="text-gray-600 font-bold my-4">selection</div>
                  {
                    item.selections.map((select, index) => (
                      <div key={index} className="text-sm w-fit text-gray-500 flex flex-wrap gap-2 bg-gray-100 px-2 py-1 rounded">
                        {select.value}
                        <span className="text-gray-800 mr-1">
                          :{select.name}
                        </span>
                      </div>
                    ))
                  }
                </>
              )}
            </div>
          </motion.div>
        ))}

      </div>

      {/* ================= TOTAL ================= */}

      <div className="bg-white shadow-sm rounded-md p-5 space-y-2">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{order.totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{order.shippingFee}</span>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}

      {
        order.status !== "delivered" && order.status !== "cancelled" && order?.userId &&  (
          <div className="flex flex-wrap gap-3">
            {nextStatus && (
              <button
                disabled={actionLoading}
                onClick={confirmUpdateStatus}
                className={`bg-gradient-to-br ${buttonStyles[nextStatus]} shadow-sm  text-white px-5 py-3 rounded-md flex items-center gap-2 hover:-translate-y-1 transition duration-300 ease-in-out`}
              >
                <FaTruck className="drop-shadow-md" /> Mark as {nextStatus}
              </button>

            )}
            <button
              disabled={actionLoading}
              onClick={confirmCancelOrder}
              className="bg-gradient-to-br from-red-800 to-red-400 shadow-sm  text-white px-5 py-3 rounded-md flex items-center gap-2 hover:-translate-y-1 transition duration-300 ease-in-out"
            >
              <FaTimesCircle className="drop-shadow-md" /> Cancel Order
            </button>
          </div>
        )
      }
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        showResetOption={confirmAction?.type === "cancel"}
        resetValue={resetStock}
        setResetValue={setResetStock}
      />
    </div >
  );
}


