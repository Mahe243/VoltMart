import { useState, useEffect } from 'react';
import { Product, Order, Customer, ActivityLog, Coupon, HeroBanner } from './types';
import CustomerStorefront from './components/CustomerStorefront';
import SellerCentral from './components/SellerCentral';
import Confetti from './components/Confetti';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);

  // Selected product from storefront for administrative details
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);

  // Confetti triggering on successful payment completion
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  // App dynamic delivery and toll-free settings state
  const [settings, setSettings] = useState({ deliveryTimeMin: 15, deliveryTimeMax: 30, tollFreeNumber: '1800-419-0909' });

  // Loading/Refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState('');

  // Robust fetch with retry helper
  const fetchWithRetry = async (url: string, retries = 4, delay = 1500): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Fetch all state from fullstack database
  const fetchAllStates = async (showShimmer = false) => {
    if (showShimmer && products.length === 0) setIsLoading(true);
    try {
      const [pData, oData, cData, aData, coData, bData, sData] = await Promise.all([
        fetchWithRetry('/api/products').catch((err) => {
          console.warn('Failed to fetch products:', err);
          return null;
        }),
        fetchWithRetry('/api/orders').catch((err) => {
          console.warn('Failed to fetch orders:', err);
          return null;
        }),
        fetchWithRetry('/api/customers').catch((err) => {
          console.warn('Failed to fetch customers:', err);
          return null;
        }),
        fetchWithRetry('/api/activity').catch((err) => {
          console.warn('Failed to fetch activity logs (possibly blocked by an ad-blocker):', err);
          return [];
        }),
        fetchWithRetry('/api/coupons').catch((err) => {
          console.warn('Failed to fetch coupons (possibly blocked by an ad-blocker):', err);
          return [];
        }),
        fetchWithRetry('/api/banners').catch((err) => {
          console.warn('Failed to fetch banners (possibly blocked by an ad-blocker):', err);
          return [];
        }),
        fetchWithRetry('/api/settings').catch((err) => {
          console.warn('Failed to fetch settings:', err);
          return { deliveryTimeMin: 15, deliveryTimeMax: 30, tollFreeNumber: '1800-419-0909' };
        })
      ]);

      if (pData !== null) setProducts(pData);
      if (oData !== null) setOrders(oData);
      if (cData !== null) setCustomers(cData);
      if (aData !== null) setActivityLogs(aData);
      if (coData !== null) setCoupons(coData);
      if (bData !== null) setBanners(bData);
      if (sData) setSettings(sData);
      
      if (pData === null && products.length === 0) {
        throw new Error('Failed to fetch critical application data. Retrying...');
      }
      
      setErrorState('');
    } catch (err) {
      console.error('Failed to sync VoltMart state:', err);
      setErrorState('Server synchronization error. Retrying connection...');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for background customer actions or admin updates (every 7 seconds)
  useEffect(() => {
    fetchAllStates(true);
    const interval = setInterval(() => {
      fetchAllStates(false);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS INTERFACE ---

  // Track user actions (views, additions, wishlist)
  const trackActivity = async (type: string, message: string, productName?: string, customerName?: string) => {
    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, productName, customerName })
      });
      // Silent state refetch
      fetchAllStates(false);
    } catch (err) {
      console.error('Activity logging failed:', err);
    }
  };

  // Order Placement
  const placeOrder = async (orderData: any) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setIsConfettiActive(true);
        setTimeout(() => setIsConfettiActive(false), 5500);
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Order placement failed:', err);
    }
  };

  // Product Updates (Price, Stock, Toggles)
  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        fetchAllStates(false);
        // Sync inspected state too
        if (inspectedProduct && inspectedProduct.id === id) {
          setInspectedProduct((prev) => prev ? { ...prev, ...updatedData } : null);
        }
      }
    } catch (err) {
      console.error('Product update failed:', err);
    }
  };

  // Add new Product to Catalog
  const addProduct = async (productData: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Add product failed:', err);
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllStates(false);
        if (inspectedProduct?.id === id) {
          setInspectedProduct(null);
        }
      }
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  // Update Order Status
  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Order update failed:', err);
    }
  };

  // Add Coupon
  const addCoupon = async (couponData: any) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Add coupon failed:', err);
    }
  };

  // Toggle Coupon Active/Inactive
  const toggleCoupon = async (code: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Toggle coupon failed:', err);
    }
  };

  // Add Promotional Hero Banner
  const addBanner = async (bannerData: any) => {
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData)
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Add banner failed:', err);
    }
  };

  // Delete Banner
  const deleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Delete banner failed:', err);
    }
  };

  // Update App Settings
  const updateSettings = async (updatedSettings: Partial<typeof settings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        fetchAllStates(false);
      }
    } catch (err) {
      console.error('Settings update failed:', err);
    }
  };

  // Selection Callback for Storefront click target
  const handleSelectProductInspector = (product: Product) => {
    setInspectedProduct(product);
  };

  // Loading shimmers representation
  if (isLoading && products.length === 0) {
    return (
      <div className="h-screen w-full bg-zinc-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <ShieldCheck className="w-6 h-6 text-teal-600 absolute animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-black text-zinc-800 uppercase tracking-widest">VoltMart Ledger</h2>
          <p className="text-xs text-zinc-400">Loading catalog database & synchronizing panels...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-zinc-100 font-sans">
      
      {/* Global Sync Error Warning banner */}
      {errorState && (
        <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-center py-1.5 text-xs font-semibold z-50 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {errorState}
        </div>
      )}

      {/* LEFT PANEL: Customer Storefront (~62% width) */}
      <section className="w-full md:w-[62%] h-full flex flex-col overflow-hidden bg-white border-r border-zinc-200">
        <CustomerStorefront
          products={products}
          banners={banners}
          coupons={coupons}
          isConfettiActive={isConfettiActive}
          settings={settings}
          onPlaceOrder={placeOrder}
          onTrackActivity={trackActivity}
          onSelectProductInspector={handleSelectProductInspector}
        />
      </section>

      {/* RIGHT PANEL: Seller Central (~38% width) */}
      <section className="w-full md:w-[38%] h-full flex flex-col overflow-hidden bg-zinc-50">
        <SellerCentral
          products={products}
          orders={orders}
          customers={customers}
          activityLogs={activityLogs}
          coupons={coupons}
          banners={banners}
          inspectedProduct={inspectedProduct}
          settings={settings}
          onUpdateSettings={updateSettings}
          onUpdateProduct={updateProduct}
          onAddProduct={addProduct}
          onDeleteProduct={deleteProduct}
          onUpdateOrderStatus={updateOrderStatus}
          onAddCoupon={addCoupon}
          onToggleCoupon={toggleCoupon}
          onAddBanner={addBanner}
          onDeleteBanner={deleteBanner}
        />
      </section>

    </main>
  );
}
