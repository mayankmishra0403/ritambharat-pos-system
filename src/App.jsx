import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OfflineSyncProvider } from './context/OfflineSyncContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import NetworkStatus from './components/common/NetworkStatus';

// --- Professional Page Loader ---
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/30 border-t-primary shadow-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="animate-pulse text-sm font-semibold text-foreground tracking-[0.2em] uppercase">Ritam Bharat POS</p>
        <p className="text-xs text-muted-foreground/80">System Initializing...</p>
      </div>
    </div>
  </div>
);

// --- Public Pages (Lazy) ---
const Landing = lazy(() => import('./pages/Landing'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Demo = lazy(() => import('./pages/Demo'));

// --- Auth Pages (Lazy) ---
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// --- Owner Pages (Lazy) ---
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard'));
const RestaurantSettings = lazy(() => import('./pages/owner').then(m => ({ default: m.RestaurantSettings })));
const TableManagement = lazy(() => import('./pages/owner').then(m => ({ default: m.TableManagement })));
const MenuManagement = lazy(() => import('./pages/owner').then(m => ({ default: m.MenuManagement })));
const InventoryManagement = lazy(() => import('./pages/owner').then(m => ({ default: m.InventoryManagement })));
const OrderManagement = lazy(() => import('./pages/owner').then(m => ({ default: m.OrderManagement })));
const Analytics = lazy(() => import('./pages/owner').then(m => ({ default: m.Analytics })));
const Reviews = lazy(() => import('./pages/owner').then(m => ({ default: m.Reviews })));
const ServiceRequests = lazy(() => import('./pages/owner').then(m => ({ default: m.ServiceRequests })));
const Complaints = lazy(() => import('./pages/owner').then(m => ({ default: m.Complaints })));
const RestaurantOnboarding = lazy(() => import('./pages/owner').then(m => ({ default: m.RestaurantOnboarding })));
const ChefAI = lazy(() => import('./pages/owner').then(m => ({ default: m.ChefAI })));
const StaffManagement = lazy(() => import('./pages/owner').then(m => ({ default: m.StaffManagement })));
const Billing = lazy(() => import('./pages/owner/Billing'));
const QRCodeManagement = lazy(() => import('./pages/owner/QRCodeManagement'));
const POSDashboard = lazy(() => import('./pages/owner/POSDashboard'));
const GstSettings = lazy(() => import('./pages/owner/GstSettings'));
const CustomerList = lazy(() => import('./pages/owner/CustomerList'));
const TakeawayDashboard = lazy(() => import('./pages/owner/TakeawayDashboard'));
const InvoiceSettings = lazy(() => import('./pages/owner/InvoiceSettings'));

// --- Kitchen Pages (Lazy) ---
const KitchenDisplay = lazy(() => import('./pages/kitchen/KitchenDisplay'));

// --- Waiter Pages (Lazy) ---
const WaiterDashboard = lazy(() => import('./pages/waiter/WaiterDashboard'));
const OrderCreate = lazy(() => import('./pages/waiter/OrderCreate'));
const OrderDetail = lazy(() => import('./pages/waiter/OrderDetail'));
const ActiveOrders = lazy(() => import('./pages/waiter/ActiveOrders'));

// --- Customer Pages (Lazy) ---
const Menu = lazy(() => import('./pages/customer').then(m => ({ default: m.Menu })));
const Cart = lazy(() => import('./pages/customer').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/customer').then(m => ({ default: m.Checkout })));
const OrderTracking = lazy(() => import('./pages/customer').then(m => ({ default: m.OrderTracking })));
const CustomerLayout = lazy(() => import('./pages/customer').then(m => ({ default: m.CustomerLayout })));
const CustomerComplaints = lazy(() => import('./pages/customer').then(m => ({ default: m.CustomerComplaints })));
const CustomerBill = lazy(() => import('./pages/customer').then(m => ({ default: m.CustomerBill })));
const CustomerReviews = lazy(() => import('./pages/customer').then(m => ({ default: m.CustomerReviews })));
const ReviewFeedback = lazy(() => import('./pages/customer').then(m => ({ default: m.ReviewFeedback })));
const RateStaff = lazy(() => import('./pages/customer').then(m => ({ default: m.RateStaff })));
const PublicBillView = lazy(() => import('./pages/public/PublicBillView'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component for owners who haven't set up a restaurant
const OwnerGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // If owner doesn't have a restaurant, redirect to onboarding
  if (user?.role === 'OWNER' && !user?.restaurant) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// --- Redirect Handler for Legacy/Direct Review Links ---
const ReviewRedirect = () => {
  const query = new URLSearchParams(window.location.search);
  const restaurantId = query.get('restaurant');
  if (restaurantId) {
    return <Navigate to={`/menu/${restaurantId}/reviews`} replace />;
  }
  return <Navigate to="/" replace />;
};

const ComplaintRedirect = () => {
  const query = new URLSearchParams(window.location.search);
  const restaurantId = query.get('restaurant');
  if (restaurantId) {
    return <Navigate to={`/menu/${restaurantId}/complaints`} replace />;
  }
  return <Navigate to="/" replace />;
};

const FeedbackRedirect = () => {
  const query = new URLSearchParams(window.location.search);
  const restaurantId = query.get('restaurant');
  if (restaurantId) {
    return <Navigate to={`/menu/${restaurantId}/feedback`} replace />;
  }
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <OfflineSyncProvider>
            <CartProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Redirect /menu to / since we need a restaurant ID */}
                  <Route path="/menu" element={<Navigate to="/" replace />} />
                  <Route path="/reviews" element={<ReviewRedirect />} />
                  <Route path="/complaints" element={<ComplaintRedirect />} />
                  <Route path="/feedback" element={<FeedbackRedirect />} />

                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/demo" element={<Demo />} />

                  {/* Landing Page - Use path="/" exactly */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />

                  {/* Waiter App Routes - Protected for WAITER role */}
                  <Route
                    path="/waiter-app"
                    element={
                      <ProtectedRoute roles={['WAITER', 'OWNER', 'ADMIN']}>
                        <WaiterDashboard />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="order/new" element={<OrderCreate />} />
                    <Route path="order/:orderId" element={<OrderDetail />} />
                    <Route path="orders" element={<ActiveOrders />} />
                  </Route>

                  {/* Kitchen Routes - Protected for CHEF role */}
                  <Route
                    path="/kitchen"
                    element={
                      <ProtectedRoute roles={['CASHIER', 'CHEF', 'OWNER', 'ADMIN']}>
                        <KitchenDisplay />
                      </ProtectedRoute>
                    }
                  />

                  {/* Customer Routes - Public */}
                  <Route path="/menu/:restaurantId" element={<CustomerLayout />}>
                    <Route index element={<Menu />} />
                    <Route path=":tableId" element={<Menu />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="order-tracking" element={<OrderTracking />} />
                    <Route path="order-tracking/:orderId" element={<OrderTracking />} />
                    <Route path="bill" element={<CustomerBill />} />
                    <Route path="bill/:orderId" element={<CustomerBill />} />
                    <Route path="complaints" element={<CustomerComplaints />} />
                    <Route path="reviews" element={<CustomerReviews />} />
                    <Route path="feedback" element={<ReviewFeedback />} />
                    <Route path="rate-staff" element={<RateStaff />} />
                  </Route>

                  {/* Public Bill View - standalone, no layout needed */}
                  <Route path="/bill/:orderId" element={<PublicBillView />} />

                  {/* Owner Routes - Protected */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute roles={['OWNER']}>
                        <RestaurantOnboarding />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute permission="dashboard">
                        <OwnerGuard>
                          <OwnerDashboard />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute permission="settings">
                        <OwnerGuard>
                          <RestaurantSettings />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tables"
                    element={
                      <ProtectedRoute permission="tables">
                        <OwnerGuard>
                          <TableManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/menu-management"
                    element={
                      <ProtectedRoute permission="menu">
                        <OwnerGuard>
                          <MenuManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute permission="inventory">
                        <OwnerGuard>
                          <InventoryManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute roles={['CASHIER', 'OWNER', 'ADMIN']} permission="orders">
                        <OwnerGuard>
                          <OrderManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute permission="analytics">
                        <OwnerGuard>
                          <Analytics />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff-management"
                    element={
                      <ProtectedRoute permission="staff">
                        <OwnerGuard>
                          <StaffManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute permission="revenue">
                        <OwnerGuard>
                          <Billing />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/qr-codes"
                    element={
                      <ProtectedRoute permission="tables">
                        <OwnerGuard>
                          <QRCodeManagement />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reviews"
                    element={
                      <ProtectedRoute permission="reviews">
                        <OwnerGuard>
                          <Reviews />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-requests"
                    element={
                      <ProtectedRoute permission="service">
                        <OwnerGuard>
                          <ServiceRequests />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/complaints"
                    element={
                      <ProtectedRoute permission="complaints">
                        <OwnerGuard>
                          <Complaints />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/pos"
                    element={
                      <ProtectedRoute roles={['CASHIER', 'OWNER', 'ADMIN']}>
                        <OwnerGuard>
                          <POSDashboard />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gst-settings"
                    element={
                      <ProtectedRoute permission="menu">
                        <OwnerGuard>
                          <GstSettings />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/invoice-settings"
                    element={
                      <ProtectedRoute permission="settings">
                        <OwnerGuard>
                          <InvoiceSettings />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute permission="dashboard">
                        <OwnerGuard>
                          <CustomerList />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/takeaway"
                    element={
                      <ProtectedRoute permission="orders">
                        <OwnerGuard>
                          <TakeawayDashboard />
                        </OwnerGuard>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </CartProvider>
          </OfflineSyncProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
