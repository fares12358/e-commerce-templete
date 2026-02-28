import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
});

// response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const res = error?.response?.data;

    return Promise.reject({
      success: false,
      message: res?.message || "Something went wrong",
      data: null,
      status: error?.response?.status,
    });
  }
);

export default api;
