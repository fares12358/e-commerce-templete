import api from "./axios";

/* ================= AUTH ================= */

export const getAdminMe = async () => {
    return api.get("/admin/me");
};

export const loginAdmin = async (payload) => {
    return api.post("/admin/login", payload);
};

export const logoutAdmin = async () => {
    return api.post("/admin/logout");
};

export const forgotPassword = async (payload) => {
    return api.post("/admin/forgot-password", payload);
};

export const resetPassword = async (token, payload) => {
    return api.put(`/admin/reset-password/${token}`, payload);
};

export const getAdminProfile = () => api.get("/admin/me");

export const updateAdminProfile = (payload) =>
    api.put("/admin/profile", payload);

export const changeAdminPassword = (payload) =>
    api.put("/admin/change-password", payload);

export const getConfig = async () =>
    api.get("/admin/config");


export const updateConfig = async (payload) =>
    api.put("/admin/config", payload);


export const deleteUserAccount = async (id) => 
    api.delete(`/users/${id}`)
/* ================= DASHBOARD ================= */

export const getDashboardStats = (range = "week") => {
    return api.get(`/admin/dashboard/stats?range=${range}`);
};

/* ================= CATEGORIES ================= */

export const getCategories = async () => {
    return api.get("/admin/categories");
};

export const createCategory = async (payload) => {
    return api.post("/admin/categories", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateCategory = async (id, payload) => {
    return api.put(`/admin/categories/${id}`, payload);
};

export const CategoryStatus = async (id) => {
    return api.patch(`/admin/categories/${id}`);
};
export const deleteCategory = async (id) => {
    return api.delete(`/admin/categories/${id}`);
};

/* ================= ATTRIBUTES ================= */

export const getAttributes = async () => {
    return api.get("/admin/attributes");
};

export const createAttribute = async (payload) => {
    return api.post("/admin/attributes", payload);
};

export const updateAttribute = async (id, payload) => {
    return api.put(`/admin/attributes/${id}`, payload);
};

export const AttributeStauts = async (id) => {
    return api.patch(`/admin/attributes/${id}`);
};

export const deleteAttribute = async (id) => {
    return api.delete(`/admin/attributes/${id}`);
};

// ===== SELECTIONS =====

export const addProductSelection = (id, data) =>
    api.post(`/admin/products/selections/${id}`, data);

export const updateProductSelection = (id, data) =>
    api.put(`/admin/products/selections/${id}`, data);

export const deleteProductSelection = (id, selectionId) =>
    api.delete(`/admin/products/selections/${id}/${selectionId}`);

// options
export const addSelectionOption = (id, selectionId, value) =>
    api.post(`/admin/products/selections/${id}/${selectionId}/options`, { value });

export const deleteSelectionOption = (id, selectionId, optionId) =>
    api.delete(`/admin/products/selections/${id}/${selectionId}/options/${optionId}`);

/* ================= PRODUCTS ================= */

export const getProducts = async (params = {}) => {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
            ([_, value]) => value !== undefined && value !== ""
        )
    );

    const query = new URLSearchParams(cleanParams).toString();

    return api.get(`/admin/products?${query}`);
};


export const createProduct = async (payload) => {
    return api.post("/admin/products", payload);
};

export const updateProduct = async (id, payload) => {
    return api.put(`/admin/products/${id}`, payload);
};

export const ProductStatus = async (id) => {
    return api.patch(`/admin/products/${id}`);
};

export const deleteProduct = async (id) => {
    return api.delete(`/admin/products/${id}`);
};

export const toggleProductStatus = async (id) => {
    const res = await api.patch(`/admin/products/${id}`);
    return res.data;
};

export const getProductByID = async (id) => {
    const res = await api.get(`/admin/products/${id}`);
    return res.data;
};

export const updateProductBasic = async (id, payload) => {
    const res = await api.put(`/admin/products/${id}`, payload);
    return res.data;
};


// ATTRIBUTES
export const addProductAttribute = async (productId, payload) => {
    const res = await api.post(`/admin/products/attributes/${productId}`, payload);
    return res.data;
};

export const updateProductAttribute = async (productId, payload) => {
    const res = await api.put(`/admin/products/attributes/${productId}`, payload);
    return res.data;
};

export const deleteProductAttribute = async (productId, attributeId) => {
    const res = await api.delete(`/admin/products/attributes/${productId}/${attributeId}`);
    return res.data;
};

// IMAGES
export const addProductImage = async (productId, payload) => {
    const res = await api.post(`/admin/products/images/${productId}`, payload);
    return res.data;
};

export const updateProductImage = async (productId, payload) => {
    const res = await api.put(`/admin/products/images/${productId}`, payload);
    return res.data;
};

export const deleteProductImage = async (productId, imageId) => {
    const res = await api.delete(`/admin/products/images/${productId}/${imageId}`);
    return res.data;
};

/* ================= ORDERS ================= */

export const getOrders = (params = {}) =>
    api.get(`/orders?${new URLSearchParams(params)}`);

export const getOrderById = async (id) => {
    return api.get(`/orders/id/${id}`);
};

export const getOrderStats = async () => {
    return api.get("/orders/stats");
};

export const updateOrderStatus = async (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
};
export const cancelOrderAdmin = async (id, payload) => {
    return api.patch(`/orders/${id}/cancel`, payload);
};

/* ================= USERS ================= */

export const getUsers = async (params = {}) => {
    const clean = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== "" && v !== undefined)
    );
    const query = new URLSearchParams(clean).toString();
    return api.get(`/users?${query}`);
};

export const toggleUserStatus = async (id) => {
    return api.patch(`/users/${id}/toggle-status`);
};

export const getUserDetails = async (id, page = 1) => {
    return api.get(`/users/${id}?page=${page}`);
};

/* ================= ADS ================= */
export const getAds = async () =>
    api.get("/admin/ads");

export const getAdById = async (id) =>
    api.get(`/admin/ads/${id}`);

export const createAd = async (formData) =>
    api.post("/admin/ads", formData);

export const updateAd = async (id, formData) =>
    api.put(`/admin/ads/${id}`, formData);

export const deleteAd = async (id) =>
    api.delete(`/admin/ads/${id}`);


/* ================= CONTENT ================= */


// Get Content (Public - for website)
export const getContent = async () => api.get('/admin/content');

// Update Main Content (Admin - About, Vision, Mission)
export const updateMainContent = async (data) => api.put('/admin/content/main', data);

// Add Section (Admin - Terms/Privacy)
export const addContentSection = async (data) => api.post('/admin/content/section', data);

// Update Section (Admin - Terms/Privacy)
export const updateContentSection = async (data) => api.put('/admin/content/section', data);

// Delete Section (Admin - Terms/Privacy)
export const deleteContentSection = async (data) => api.delete('/admin/content/section', { data });

/* ================= notification ================= */

export const getNotification = async () => api.get('/admin/notification');
export const updateNotification = async (data) => api.put('/admin/notification', data);

