import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { NotificationProvider } from "@/context/NotificationContext";
import CustomNotification from "@/components/ui/CustomNotification";

export const metadata = {
  title: "Admin Dashboard",
  description: "E-Commerce Admin Panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <CustomNotification />
          </NotificationProvider>
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>

      </body>
    </html>
  );
}