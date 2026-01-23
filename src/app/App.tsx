import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
// Public Pages
const HomePage = lazy(() => import('@/app/pages/Home'));
const CatalogPage = lazy(() => import('@/app/pages/Catalog'));
const ProductPage = lazy(() => import('@/app/pages/Product'));
const CheckoutPage = lazy(() => import('@/app/pages/Checkout'));
const PaymentProcessingPage = lazy(() => import('@/app/pages/PaymentProcessing'));
const OrderStatusPage = lazy(() => import('@/app/pages/OrderStatus'));
const FAQPage = lazy(() => import('@/app/pages/FAQ'));
const LegalPage = lazy(() => import('@/app/pages/Legal'));
const AuthPage = lazy(() => import('@/app/pages/Auth'));
const AccountPage = lazy(() => import('@/app/pages/Account'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/app/pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('@/app/pages/admin/Orders'));
const AdminOrderDetail = lazy(() => import('@/app/pages/admin/OrderDetail'));
const AdminProducts = lazy(() => import('@/app/pages/admin/Products'));
const AdminPricing = lazy(() => import('@/app/pages/admin/Pricing'));
const AdminSupport = lazy(() => import('@/app/pages/admin/Support'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:category" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-processing" element={<PaymentProcessingPage />} />
          <Route path="/order/:orderId" element={<OrderStatusPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/legal/:page" element={<LegalPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:orderId"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute requireAdmin>
                <AdminSupport />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </div>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
