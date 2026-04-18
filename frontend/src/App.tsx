import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifyOtp } from "./pages/VerifyOtp";
import { ResetPassword } from "./pages/ResetPassword";
import { Search } from "./pages/Search";
import { TurfDetail } from "./pages/TurfDetail";
import { Payment } from "./pages/Payment";
import { BookingConfirmation } from "./pages/BookingConfirmation";
import { Dashboard } from "./pages/admin/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<Search />} />
          <Route path="/turf/:turfId" element={<TurfDetail />} />
          <Route
            path="/payment/:turfId/:slotId"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
