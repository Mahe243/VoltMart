import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Product, Order, Customer, ActivityLog, Coupon, HeroBanner, AppSettings } from '../types';

interface SellerCentralProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  activityLogs: ActivityLog[];
  coupons: Coupon[];
  banners: HeroBanner[];
  inspectedProduct: Product | null;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  onAddProduct: (productData: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: string) => Promise<void>;
  onAddCoupon: (couponData: any) => Promise<void>;
  onToggleCoupon: (code: string, isActive: boolean) => Promise<void>;
  onAddBanner: (bannerData: any) => Promise<void>;
  onDeleteBanner: (id: string) => Promise<void>;
}

export default function SellerCentral({
  products,
  orders,
  customers,
  activityLogs,
  coupons,
  banners,
  inspectedProduct,
  settings,
  onUpdateSettings,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAddCoupon,
  onToggleCoupon,
  onAddBanner,
  onDeleteBanner
}: SellerCentralProps) {
  // Tabs: 'dashboard', 'inventory', 'orders', 'coupons', 'crm'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'coupons' | 'crm'>('dashboard');

  // Inventory search & filter
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'healthy' | 'low' | 'critical'>('all');

  // New product form
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Laptops');
  const [newProdPrice, setNewProdPrice] = useState(15000);
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState(19999);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdImageUrl, setNewProdImageUrl] = useState('');

  const CATEGORY_PRESET_IMAGES: { [key: string]: string[] } = {
    'Laptops': [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=600&q=80'
    ],
    'Smartphones': [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?auto=format&fit=crop&w=600&q=80'
    ],
    'Audio Devices': [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80'
    ],
    'Television & Video': [
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80'
    ],
    'Smart Appliances': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80'
    ],
    'Wearable Tech': [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551816230-ef5deaed4a28?auto=format&fit=crop&w=600&q=80'
    ],
    'Gaming & Gear': [
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80'
    ],
    'Cameras & Optics': [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1471897488648-5eae4ac6686b?auto=format&fit=crop&w=600&q=80'
    ],
    'Data Storage': [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80'
    ],
    'Power & Cables': [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1548092372-0d1bd40894a3?auto=format&fit=crop&w=600&q=80'
    ],
    'Monitors & Displays': [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=600&q=80'
    ],
    'Networking & Wifi': [
      'https://images.unsplash.com/photo-1631553127988-7578bbf1808b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80'
    ],
    'Smart Home Security': [
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80'
    ],
    'PC Components': [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80'
    ],
    'Printers & Scanners': [
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1563161402-8b110218dd7f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80'
    ],
    'Office Electronics': [
      'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600132806608-231446b2e7af?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80'
    ]
  };

  // New coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // New banner form
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [newBannerBtn, setNewBannerBtn] = useState('Explore Deals');
  const [newBannerGradient, setNewBannerGradient] = useState('from-teal-600 to-cyan-700');
  const [newBannerProdId, setNewBannerProdId] = useState('');

  // Inline edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<number>(0);
  const [inlineStock, setInlineStock] = useState<number>(0);

  // Price Elasticity State
  const [elasticProduct, setElasticProduct] = useState<Product | null>(null);
  const [elasticPriceInput, setElasticPriceInput] = useState<number>(0);

  // Dynamic Direct Controls State
  const [controlPrice, setControlPrice] = useState<number>(0);
  const [controlOriginalPrice, setControlOriginalPrice] = useState<number>(0);
  const [controlStock, setControlStock] = useState<number>(0);

  // Store Commitments States
  const [delTimeMin, setDelTimeMin] = useState(15);
  const [delTimeMax, setDelTimeMax] = useState(30);
  const [tfNumber, setTfNumber] = useState('1800-419-0909');

  // Customer CRM Filters State
  const [crmSearch, setCrmSearch] = useState('');
  const [spentFilter, setSpentFilter] = useState('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState('all');

  // Sync elastic simulator with inspections
  useEffect(() => {
    if (inspectedProduct) {
      setElasticProduct(inspectedProduct);
      setElasticPriceInput(inspectedProduct.price);
      setControlPrice(inspectedProduct.price);
      setControlOriginalPrice(inspectedProduct.original_price);
      setControlStock(inspectedProduct.stock);
    } else if (products.length > 0 && !elasticProduct) {
      setElasticProduct(products[0]);
      setElasticPriceInput(products[0].price);
      setControlPrice(products[0].price);
      setControlOriginalPrice(products[0].original_price);
      setControlStock(products[0].stock);
    }
  }, [inspectedProduct, products]);

  // Sync store commitments from global settings
  useEffect(() => {
    if (settings) {
      setDelTimeMin(settings.deliveryTimeMin);
      setDelTimeMax(settings.deliveryTimeMax);
      setTfNumber(settings.tollFreeNumber);
    }
  }, [settings]);

  // --- ADMIN LIVE MODERATION STATES ---
  const [reviews, setReviews] = useState<any[]>([]);
  const [comms, setComms] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<{ [reviewId: string]: string }>({});

  const fetchAdminData = async () => {
    try {
      const revRes = await fetch('/api/reviews');
      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data);
      }
      const commRes = await fetch('/api/communications');
      if (commRes.ok) {
        const data = await commRes.json();
        setComms(data);
      }
    } catch (err) {
      console.warn('Failed to fetch admin moderation logs:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminReplySubmit = async (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: text })
      });
      if (res.ok) {
        setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComm = async (commId: string) => {
    try {
      const res = await fetch(`/api/communications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commId, status: 'resolved' })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- KPI CALCULATIONS ---
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrderCount = orders.length;
  const averageOrderValue = totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount) : 0;
  
  // Simulated Conversion rate based on views in products catalog
  const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalOrderCount / totalViews) * 100).toFixed(2) : '3.12';

  // --- INVENTORY HEALTH BREAKDOWN ---
  const criticalStockItems = products.filter((p) => p.stock === 0);
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock < 5);
  const healthyStockItems = products.filter((p) => p.stock >= 5);

  // Inventory filter
  const filteredInventory = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase());
    
    if (stockFilter === 'healthy') return matchesSearch && p.stock >= 5;
    if (stockFilter === 'low') return matchesSearch && p.stock > 0 && p.stock < 5;
    if (stockFilter === 'critical') return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

  // --- PRICE ELASTICITY HEURISTIC CALCULATIONS ---
  const getElasticityHeuristic = () => {
    if (!elasticProduct) return null;
    const basePrice = elasticProduct.price;
    const baseSales = Math.max(1, elasticProduct.salesCount);
    const newPrice = elasticPriceInput;
    
    // Heuristic Elasticity Coefficient
    const elasticity = 1.6; 
    const priceChangeFraction = (newPrice - basePrice) / basePrice;
    const qtyChangeFraction = -priceChangeFraction * elasticity;
    
    const projectedSales = Math.max(0, Math.round(baseSales * (1 + qtyChangeFraction)));
    
    // Estimated profit margin (Cost price assumed flat 65% of base seeded price)
    const costPrice = basePrice * 0.65;
    const currentProfit = (basePrice - costPrice) * baseSales;
    const projectedProfit = (newPrice - costPrice) * projectedSales;

    const currentRevenue = basePrice * baseSales;
    const projectedRevenue = newPrice * projectedSales;

    return {
      currentRevenue,
      projectedRevenue,
      revenueChange: projectedRevenue - currentRevenue,
      currentProfit,
      projectedProfit,
      profitChange: projectedProfit - currentProfit,
      projectedSales,
      salesChange: projectedSales - baseSales
    };
  };

  const elasticityReport = getElasticityHeuristic();

  // Filtered customer count logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(crmSearch.toLowerCase());

    let matchesSpent = true;
    if (spentFilter === 'high') matchesSpent = c.totalSpent >= 50000;
    else if (spentFilter === 'medium') matchesSpent = c.totalSpent >= 10000 && c.totalSpent < 50000;
    else if (spentFilter === 'low') matchesSpent = c.totalSpent < 10000;

    let matchesLoyalty = true;
    if (loyaltyFilter === 'frequent') matchesLoyalty = c.totalOrders >= 3;
    else if (loyaltyFilter === 'occasional') matchesLoyalty = c.totalOrders >= 1 && c.totalOrders <= 2;
    else if (loyaltyFilter === 'none') matchesLoyalty = c.totalOrders === 0;

    return matchesSearch && matchesSpent && matchesLoyalty;
  });

  // --- SUBMISSIONS ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdBrand) return;

    // Pick random category icon color
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
      'from-rose-500 to-red-600',
      'from-emerald-500 to-teal-600'
    ];
    const categoryIcons: { [key: string]: string } = {
      'Laptops': 'Laptop',
      'Smartphones': 'Smartphone',
      'Audio Devices': 'Headphones',
      'Television & Video': 'Tv',
      'Smart Appliances': 'Flame',
      'Wearable Tech': 'Watch',
      'Gaming & Gear': 'Gamepad2',
      'Cameras & Optics': 'Camera',
      'Data Storage': 'HardDrive',
      'Power & Cables': 'Zap',
      'Monitors & Displays': 'Monitor',
      'Networking & Wifi': 'Wifi',
      'Smart Home Security': 'Shield',
      'PC Components': 'Cpu',
      'Printers & Scanners': 'Printer',
      'Office Electronics': 'Briefcase'
    };

    await onAddProduct({
      name: newProdName,
      brand: newProdBrand,
      category: newProdCategory,
      price: Number(newProdPrice),
      original_price: Number(newProdOriginalPrice),
      stock: Number(newProdStock),
      rating: 4.5,
      review_count: 1,
      is_flash_sale: false,
      is_trending: false,
      is_featured: false,
      imageColor: gradients[products.length % gradients.length],
      iconName: categoryIcons[newProdCategory] || 'ShoppingBag',
      imageUrl: newProdImageUrl || undefined
    });

    setNewProdName('');
    setNewProdBrand('');
    setNewProdPrice(15000);
    setNewProdOriginalPrice(19999);
    setNewProdStock(15);
    setNewProdImageUrl('');
    setIsAddProductOpen(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    await onAddCoupon({
      code: newCouponCode.toUpperCase(),
      type: newCouponType,
      value: Number(newCouponValue),
      description: newCouponDesc || `Flat ${newCouponValue} discount promotion`
    });
    setNewCouponCode('');
    setNewCouponValue(10);
    setNewCouponDesc('');
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle) return;
    await onAddBanner({
      title: newBannerTitle,
      subtitle: newBannerSub,
      buttonText: newBannerBtn,
      colorGradient: newBannerGradient,
      productId: newBannerProdId || undefined
    });
    setNewBannerTitle('');
    setNewBannerSub('');
    setNewBannerBtn('Explore Deals');
    setNewBannerProdId('');
  };

  const startInlineEdit = (p: Product) => {
    setEditingProductId(p.id);
    setInlinePrice(p.price);
    setInlineStock(p.stock);
  };

  const saveInlineEdit = async (productId: string) => {
    await onUpdateProduct(productId, {
      price: Number(inlinePrice),
      stock: Number(inlineStock)
    });
    setEditingProductId(null);
  };

  return (
    <div id="seller-central-panel" className="flex flex-col h-full bg-zinc-50 border-l border-zinc-200">
      
      {/* Admin Panel Header */}
      <header className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
            <Icons.Settings className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">VoltMart Seller Central</h1>
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">Admin Dashboard</p>
          </div>
        </div>

        {/* Action controls */}
        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          Live Synchronized
        </span>
      </header>

      {/* Tabs navigation */}
      <nav className="flex border-b border-zinc-200 bg-white">
        {(['dashboard', 'inventory', 'orders', 'coupons', 'crm'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold capitalize transition border-b-2 text-center ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700 bg-teal-50/20'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
              }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Dashboard main panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Metrics Cards with mock Sparklines */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Revenue */}
              <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gross Revenue</span>
                  <p className="text-lg font-black text-zinc-950 mt-1">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                    <Icons.ArrowUpRight className="w-3.5 h-3.5" />
                    +12.4%
                  </span>
                  {/* Miniature SVG Sparkline */}
                  <svg className="w-12 h-5 text-emerald-500" viewBox="0 0 50 20">
                    <path d="M0,15 Q10,5 20,12 T40,2 T50,8" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Orders</span>
                  <p className="text-lg font-black text-zinc-950 mt-1">{totalOrderCount}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                    <Icons.ArrowUpRight className="w-3.5 h-3.5" />
                    +8.5%
                  </span>
                  <svg className="w-12 h-5 text-teal-500" viewBox="0 0 50 20">
                    <path d="M0,18 L10,12 L20,15 L30,5 L40,8 L50,1" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Avg Order Value</span>
                  <p className="text-lg font-black text-zinc-950 mt-1">₹{averageOrderValue.toLocaleString()}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-orange-600 font-bold flex items-center">
                    <Icons.ArrowDownRight className="w-3.5 h-3.5" />
                    -1.2%
                  </span>
                  <svg className="w-12 h-5 text-orange-400" viewBox="0 0 50 20">
                    <path d="M0,5 Q15,18 25,12 T50,15" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Shopper Conversion */}
              <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Conversion Rate</span>
                  <p className="text-lg font-black text-zinc-950 mt-1">{conversionRate}%</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                    <Icons.ArrowUpRight className="w-3.5 h-3.5" />
                    +0.4%
                  </span>
                  <svg className="w-12 h-5 text-emerald-500" viewBox="0 0 50 20">
                    <path d="M0,15 L15,12 L30,14 L50,2" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Product Inspector - Clicking product on storefront triggers view */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 bg-teal-500 text-white font-extrabold text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-inner">
                Storefront Click Target
              </div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Icons.Sliders className="w-4.5 h-4.5 text-teal-600" />
                Live Product Inspector
              </h3>
              
              {elasticProduct ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400">
                      {elasticProduct.imageUrl ? (
                        <img src={elasticProduct.imageUrl} alt={elasticProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${elasticProduct.imageColor} flex items-center justify-center text-white`}>
                          <Icons.Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold">{elasticProduct.brand} • {elasticProduct.category}</span>
                      <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">{elasticProduct.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">SKU ID: <span className="font-mono text-zinc-600">{elasticProduct.id}</span></p>
                    </div>
                  </div>

                  {/* Operational Metrics list */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-b border-zinc-100 py-3 text-center">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Direct Views</span>
                      <span className="text-xs font-black text-zinc-800">{elasticProduct.views || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Wishlists</span>
                      <span className="text-xs font-black text-zinc-800">{elasticProduct.wishlistCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Cart Adds</span>
                      <span className="text-xs font-black text-zinc-800">{elasticProduct.cartCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Total Sales</span>
                      <span className="text-xs font-black text-emerald-600">{elasticProduct.salesCount || 0} units</span>
                    </div>
                  </div>

                  {/* Margin & Financial Summary */}
                  <div className="bg-zinc-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Estimated Unit Cost (65%)</p>
                      <p className="font-bold text-zinc-800">₹{Math.round(elasticProduct.price * 0.65).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Estimated Profit Margin</p>
                      <p className="font-bold text-emerald-600">35.0%</p>
                    </div>
                  </div>

                  {/* DYNAMIC PRICE, STOCK, AND DISCOUNT LIVE CONTROLS */}
                  <div className="p-3.5 border border-zinc-200 bg-zinc-50 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1">
                      <Icons.Sliders className="w-4 h-4 text-teal-600 animate-pulse" />
                      Dynamic Product Live Overrides
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] text-zinc-400 font-extrabold uppercase block mb-1">Selling Price</label>
                        <input
                          type="number"
                          value={controlPrice}
                          onChange={(e) => setControlPrice(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] text-zinc-400 font-extrabold uppercase block mb-1">MRP Price</label>
                        <input
                          type="number"
                          value={controlOriginalPrice}
                          onChange={(e) => setControlOriginalPrice(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] text-zinc-400 font-extrabold uppercase block mb-1">Stock Level</label>
                        <input
                          type="number"
                          value={controlStock}
                          onChange={(e) => setControlStock(Number(e.target.value))}
                          className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-zinc-200/50 pt-2 bg-white/40 p-2 rounded-lg">
                      <div>
                        <span className="text-[8px] text-zinc-400 font-bold uppercase block">Computed Discount</span>
                        <span className="font-extrabold text-teal-700 text-xs">
                          {controlOriginalPrice > controlPrice 
                            ? `${Math.round(((controlOriginalPrice - controlPrice) / controlOriginalPrice) * 100)}% Off`
                            : 'No Discount'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateProduct(elasticProduct.id, {
                            price: controlPrice,
                            original_price: controlOriginalPrice,
                            stock: controlStock
                          });
                          // Synchronize what-if simulation inputs
                          setElasticPriceInput(controlPrice);
                        }}
                        className="bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg transition"
                      >
                        Push Live Overrides
                      </button>
                    </div>
                  </div>

                  {/* PRICE ELASTICITY WHAT-IF SIMULATOR */}
                  <div className="p-3 border border-zinc-200 bg-teal-50/30 rounded-xl">
                    <h4 className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Icons.TrendingUp className="w-4 h-4 text-teal-600 animate-pulse" />
                      Price-Elasticity "What-If" Simulator
                    </h4>
                    <p className="text-[10px] text-teal-700/80 mb-3">
                      Simulate sales impact of changing price. (Heuristic: elasticity coefficient of 1.6x)
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1">
                          <span>Adjust Simulation Price</span>
                          <span className="text-teal-700">₹{elasticPriceInput.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(elasticProduct.price * 0.5)}
                          max={Math.round(elasticProduct.price * 1.5)}
                          step="10"
                          value={elasticPriceInput}
                          onChange={(e) => setElasticPriceInput(Number(e.target.value))}
                          className="w-full accent-teal-600"
                        />
                      </div>

                      {/* Simulator outcomes */}
                      {elasticityReport && (
                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-200/50">
                          <div className="bg-white border border-zinc-100 rounded-lg p-1.5">
                            <span className="text-[8px] text-zinc-400 font-bold uppercase block">Projected Sales</span>
                            <span className="text-xs font-black text-zinc-800">{elasticityReport.projectedSales} units</span>
                            <span className={`text-[8px] font-bold block ${elasticityReport.salesChange >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {elasticityReport.salesChange >= 0 ? '+' : ''}{elasticityReport.salesChange} units
                            </span>
                          </div>

                          <div className="bg-white border border-zinc-100 rounded-lg p-1.5">
                            <span className="text-[8px] text-zinc-400 font-bold uppercase block">Projected Rev</span>
                            <span className="text-xs font-black text-zinc-800">₹{elasticityReport.projectedRevenue.toLocaleString()}</span>
                            <span className={`text-[8px] font-bold block ${elasticityReport.revenueChange >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {elasticityReport.revenueChange >= 0 ? '+' : ''}₹{Math.round(elasticityReport.revenueChange).toLocaleString()}
                            </span>
                          </div>

                          <div className="bg-white border border-zinc-100 rounded-lg p-1.5">
                            <span className="text-[8px] text-zinc-400 font-bold uppercase block">Projected Profit</span>
                            <span className="text-xs font-black text-zinc-800">₹{Math.round(elasticityReport.projectedProfit).toLocaleString()}</span>
                            <span className={`text-[8px] font-bold block ${elasticityReport.profitChange >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {elasticityReport.profitChange >= 0 ? '+' : ''}₹{Math.round(elasticityReport.profitChange).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setElasticPriceInput(elasticProduct.price)}
                          className="text-[9px] font-bold text-zinc-400 hover:text-zinc-600"
                        >
                          Reset Price
                        </button>
                        <button
                          onClick={() => {
                            onUpdateProduct(elasticProduct.id, { price: elasticPriceInput });
                            alert(`Catalog price for ${elasticProduct.name} updated to ₹${elasticPriceInput.toLocaleString()}`);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-lg transition"
                        >
                          Apply Real Price
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                <p className="text-xs text-zinc-400 py-3 text-center">No product catalog loaded yet.</p>
              )}
            </div>

            {/* Inventory Stock Health Indicators */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Icons.Package className="w-4.5 h-4.5 text-zinc-800" />
                Inventory Health Status
              </h3>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <button
                  onClick={() => { setActiveTab('inventory'); setStockFilter('critical'); }}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl p-3 transition"
                >
                  <span className="text-[9px] text-rose-500 font-bold uppercase block">Critical Out</span>
                  <span className="text-lg font-black text-rose-700 block">{criticalStockItems.length}</span>
                  <span className="text-[9px] text-rose-500/80 block mt-0.5 font-bold">Refill Needed</span>
                </button>

                <button
                  onClick={() => { setActiveTab('inventory'); setStockFilter('low'); }}
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl p-3 transition"
                >
                  <span className="text-[9px] text-orange-500 font-bold uppercase block">Low Stock</span>
                  <span className="text-lg font-black text-orange-700 block">{lowStockItems.length}</span>
                  <span className="text-[9px] text-orange-500/80 block mt-0.5 font-bold">Watchlist</span>
                </button>

                <button
                  onClick={() => { setActiveTab('inventory'); setStockFilter('healthy'); }}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl p-3 transition"
                >
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block">Healthy Stock</span>
                  <span className="text-lg font-black text-emerald-700 block">{healthyStockItems.length}</span>
                  <span className="text-[9px] text-emerald-500/80 block mt-0.5 font-bold">Sufficient</span>
                </button>
              </div>
            </div>

            {/* Live Shopper Activity Feed */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Icons.RefreshCw className="w-4 h-4 text-teal-600 animate-spin" style={{ animationDuration: '6s' }} />
                Real-Time Shopper Activity Feed
              </h3>
              <p className="text-[10px] text-zinc-400 mb-3">Live customer interaction trail streamed instantly</p>
              
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {activityLogs.map((log) => {
                  let badgeColor = 'bg-zinc-100 text-zinc-700';
                  if (log.type === 'checkout_success') badgeColor = 'bg-emerald-100 text-emerald-800';
                  if (log.type === 'cart_add') badgeColor = 'bg-teal-100 text-teal-800';
                  if (log.type === 'wishlist_add') badgeColor = 'bg-rose-100 text-rose-800';
                  if (log.type === 'coupon_apply') badgeColor = 'bg-purple-100 text-purple-800';

                  return (
                    <div key={log.id} className="flex gap-2.5 items-start text-[11px] border-b border-zinc-100 pb-2.5 last:border-0 last:pb-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase whitespace-nowrap mt-0.5 ${badgeColor}`}>
                        {log.type.replace('_', ' ')}
                      </span>
                      <div className="flex-1">
                        <p className="text-zinc-700 leading-normal">{log.message}</p>
                        <span className="text-[9px] text-zinc-400 block mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {activityLogs.length === 0 && (
                  <p className="text-xs text-zinc-400 py-3 text-center">No customer activity recorded yet.</p>
                )}
              </div>
            </div>

            {/* STORE COMMITMENTS CONFIGURATION PANEL */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Sliders className="w-4.5 h-4.5 text-teal-600 animate-spin" style={{ animationDuration: '10s' }} />
                Store Commitments & Helpline Settings
              </h3>
              <p className="text-[10px] text-zinc-400">Configure global shopper delivery SLA and toll-free contact numbers dynamically</p>
              
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold block mb-1">Min SLA (Mins)</label>
                  <input
                    type="number"
                    value={delTimeMin}
                    onChange={(e) => setDelTimeMin(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 font-bold text-zinc-800"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] text-zinc-500 font-bold block mb-1">Max SLA (Mins)</label>
                  <input
                    type="number"
                    value={delTimeMax}
                    onChange={(e) => setDelTimeMax(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 font-bold text-zinc-800"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 font-bold block mb-1">Toll-Free Helpline</label>
                  <input
                    type="text"
                    value={tfNumber}
                    onChange={(e) => setTfNumber(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 font-bold text-zinc-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({
                      deliveryTimeMin: delTimeMin,
                      deliveryTimeMax: delTimeMax,
                      tollFreeNumber: tfNumber
                    });
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-teal-600/10"
                >
                  Save Store Commitments
                </button>
              </div>
            </div>
          </>
        )}

        {/* Inventory tab */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center gap-3">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Package className="w-4.5 h-4.5 text-teal-600" />
                Product Catalog Management
              </h3>
              
              <button
                onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Icons.Plus className="w-4 h-4" />
                Add SKU
              </button>
            </div>

            {/* Inventory filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search catalog products..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800"
              />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-xs text-zinc-800 font-semibold"
              >
                <option value="all">All Stocks</option>
                <option value="healthy">Healthy stock (5+)</option>
                <option value="low">Low stock (1-4)</option>
                <option value="critical">Out of stock (0)</option>
              </select>
            </div>

            {/* Add product form */}
            {isAddProductOpen && (
              <form onSubmit={handleCreateProduct} className="bg-zinc-50 p-3.5 border border-zinc-200 rounded-xl space-y-3 text-xs animate-in slide-in-from-top duration-200">
                <h4 className="font-bold text-zinc-800">Add New Product Specification</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Product Name</label>
                    <input required type="text" placeholder="MacBook Pro Clone" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Brand Name</label>
                    <input required type="text" placeholder="Apple" value={newProdBrand} onChange={(e) => setNewProdBrand(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Category</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => {
                        setNewProdCategory(e.target.value);
                        const presets = CATEGORY_PRESET_IMAGES[e.target.value] || [];
                        if (presets.length > 0) setNewProdImageUrl(presets[0]);
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-semibold"
                    >
                      <option value="Laptops">Laptops</option>
                      <option value="Smartphones">Smartphones</option>
                      <option value="Audio Devices">Audio Devices</option>
                      <option value="Television & Video">Television & Video</option>
                      <option value="Smart Appliances">Smart Appliances</option>
                      <option value="Wearable Tech">Wearable Tech</option>
                      <option value="Gaming & Gear">Gaming & Gear</option>
                      <option value="Cameras & Optics">Cameras & Optics</option>
                      <option value="Data Storage">Data Storage</option>
                      <option value="Power & Cables">Power & Cables</option>
                      <option value="Monitors & Displays">Monitors & Displays</option>
                      <option value="Networking & Wifi">Networking & Wifi</option>
                      <option value="Smart Home Security">Smart Home Security</option>
                      <option value="PC Components">PC Components</option>
                      <option value="Printers & Scanners">Printers & Scanners</option>
                      <option value="Office Electronics">Office Electronics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Price (₹)</label>
                    <input
                      required
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => {
                        setNewProdPrice(Number(e.target.value));
                        setNewProdOriginalPrice(Math.round(Number(e.target.value) * 1.25));
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Stock Level</label>
                    <input required type="number" value={newProdStock} onChange={(e) => setNewProdStock(Number(e.target.value))} className="w-full bg-white border border-zinc-200 rounded-lg p-2" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Product Photo URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or choose a preset below"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs"
                  />
                  
                  {CATEGORY_PRESET_IMAGES[newProdCategory] && (
                    <div className="mt-2">
                      <p className="text-[9px] text-zinc-400 mb-1 font-semibold">Instant Preset Photos (Click to choose):</p>
                      <div className="flex gap-2">
                        {CATEGORY_PRESET_IMAGES[newProdCategory].map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewProdImageUrl(url)}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition ${
                              newProdImageUrl === url ? 'border-teal-500 scale-105 shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt="Preset" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg hover:bg-teal-700">
                  Save Product to Catalog
                </button>
              </form>
            )}

            {/* Catalog Table */}
            <div className="overflow-x-auto border border-zinc-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="p-2.5">Product Details</th>
                    <th className="p-2.5 text-center">Real Price</th>
                    <th className="p-2.5 text-center">Stock</th>
                    <th className="p-2.5 text-center">Toggles</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredInventory.slice(0, 40).map((p) => {
                    const isEditing = editingProductId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="p-2.5 min-w-[150px] flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-zinc-400 border border-zinc-200/60">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${p.imageColor} flex items-center justify-center text-white text-[10px]`}>
                                <Icons.Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-800 line-clamp-1 leading-snug">{p.name}</p>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block mt-0.5">{p.brand} • {p.category}</span>
                          </div>
                        </td>
                        
                        {/* Inline price edit */}
                        <td className="p-2.5 text-center font-bold">
                          {isEditing ? (
                            <input
                              type="number"
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(Number(e.target.value))}
                              className="w-16 border rounded p-1 text-center font-bold"
                            />
                          ) : (
                            <span>₹{p.price.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Inline stock edit */}
                        <td className="p-2.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={inlineStock}
                              onChange={(e) => setInlineStock(Number(e.target.value))}
                              className="w-12 border rounded p-1 text-center font-bold"
                            />
                          ) : (
                            <span className={p.stock === 0 ? 'text-rose-600 font-black' : p.stock < 5 ? 'text-orange-500 font-black' : 'text-zinc-600'}>
                              {p.stock} units
                            </span>
                          )}
                        </td>

                        {/* Flash-sale and Trending Toggles */}
                        <td className="p-2.5 text-center space-y-1">
                          <button
                            onClick={() => onUpdateProduct(p.id, { is_flash_sale: !p.is_flash_sale })}
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded border block w-full text-center ${
                              p.is_flash_sale ? 'bg-orange-100 border-orange-200 text-orange-800' : 'bg-white border-zinc-200 text-zinc-400'
                            }`}
                          >
                            Flash Sale {p.is_flash_sale ? 'ON' : 'OFF'}
                          </button>
                          <button
                            onClick={() => onUpdateProduct(p.id, { is_trending: !p.is_trending })}
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded border block w-full text-center ${
                              p.is_trending ? 'bg-teal-100 border-teal-200 text-teal-800' : 'bg-white border-zinc-200 text-zinc-400'
                            }`}
                          >
                            Trending {p.is_trending ? 'ON' : 'OFF'}
                          </button>
                        </td>

                        {/* Inline save/delete */}
                        <td className="p-2.5 text-center space-x-1.5">
                          {isEditing ? (
                            <button
                              onClick={() => saveInlineEdit(p.id)}
                              className="text-emerald-600 hover:text-emerald-800 p-1"
                            >
                              <Icons.Check className="w-4 h-4 inline" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startInlineEdit(p)}
                              className="text-zinc-400 hover:text-zinc-600 p-1"
                            >
                              <Icons.Edit2 className="w-4 h-4 inline" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="text-rose-400 hover:text-rose-600 p-1"
                          >
                            <Icons.Trash className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredInventory.length > 40 && (
              <p className="text-[10px] text-zinc-400 text-center">Showing first 40 of {filteredInventory.length} products. Use search to filter.</p>
            )}

          </div>
        )}

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Truck className="w-4.5 h-4.5 text-teal-600" />
              Delivery & Fulfillment Operations
            </h3>

            <div className="space-y-3">
              {orders.map((o) => {
                let badgeColor = 'bg-zinc-100 text-zinc-600';
                if (o.status === 'delivered') badgeColor = 'bg-emerald-100 text-emerald-800';
                if (o.status === 'shipped') badgeColor = 'bg-blue-100 text-blue-800';
                if (o.status === 'packed') badgeColor = 'bg-amber-100 text-amber-800';

                return (
                  <div key={o.id} className="border border-zinc-100 bg-zinc-50/40 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-zinc-800">Order ID: #{o.id}</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(o.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${badgeColor}`}>
                        {o.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-600 space-y-1">
                      <p><span className="font-semibold">Customer:</span> {o.customerName} ({o.customerEmail})</p>
                      <p><span className="font-semibold">Items:</span> {o.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}</p>
                      <p><span className="font-semibold">Total Invoice:</span> ₹{o.total.toLocaleString()}</p>
                    </div>

                    {/* Cycle order status */}
                    <div className="pt-2 border-t border-zinc-200/50 flex justify-end gap-1.5">
                      <button
                        disabled={o.status === 'delivered'}
                        onClick={() => {
                          const statusFlow = ['waiting', 'packed', 'shipped', 'delivered'];
                          const nextIdx = statusFlow.indexOf(o.status) + 1;
                          if (nextIdx < statusFlow.length) {
                            onUpdateOrderStatus(o.id, statusFlow[nextIdx]);
                          }
                        }}
                        className="bg-zinc-900 text-white disabled:bg-zinc-100 disabled:text-zinc-400 font-extrabold text-[9px] uppercase px-3 py-1 rounded-lg transition"
                      >
                        Advance Status ➜
                      </button>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <p className="text-xs text-zinc-400 py-3 text-center">No orders created yet in this session.</p>
              )}
            </div>
          </div>
        )}

        {/* Coupons & Promo banners tab */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Coupon Admin */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Tag className="w-4.5 h-4.5 text-teal-600" />
                Coupon Promotions
              </h3>

              <form onSubmit={handleCreateCoupon} className="bg-zinc-50 p-3 border border-zinc-200 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-zinc-700">Add New Coupon code</p>
                <div className="grid grid-cols-2 gap-2">
                  <input required type="text" placeholder="CODE e.g. FIRST10" value={newCouponCode} onChange={(e) => setNewCouponCode(e.target.value)} className="bg-white border rounded p-1.5" />
                  <input required type="number" placeholder="Discount Value" value={newCouponValue} onChange={(e) => setNewCouponValue(Number(e.target.value))} className="bg-white border rounded p-1.5" />
                </div>
                <input type="text" placeholder="Description e.g. Get 10% off checkout" value={newCouponDesc} onChange={(e) => setNewCouponDesc(e.target.value)} className="w-full bg-white border rounded p-1.5" />
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-1.5 rounded-lg hover:bg-teal-700">
                  Save Coupon Promotion
                </button>
              </form>

              <div className="space-y-2">
                {coupons.map((c) => (
                  <div key={c.code} className="border border-zinc-100 bg-zinc-50/40 p-2.5 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-black text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-mono">{c.code}</span>
                      <p className="text-[10px] text-zinc-500 mt-1">{c.description}</p>
                    </div>
                    <button
                      onClick={() => onToggleCoupon(c.code, !c.isActive)}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition ${
                        c.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Banners Admin */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Sliders className="w-4.5 h-4.5 text-teal-600" />
                Hero Banner Carousel
              </h3>

              <form onSubmit={handleCreateBanner} className="bg-zinc-50 p-3 border border-zinc-200 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-zinc-700">Configure Promotion Carousel</p>
                <input required type="text" placeholder="Banner Title" value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)} className="w-full bg-white border rounded p-1.5" />
                <input required type="text" placeholder="Banner Subtitle / Description" value={newBannerSub} onChange={(e) => setNewBannerSub(e.target.value)} className="w-full bg-white border rounded p-1.5" />
                
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Button Label" value={newBannerBtn} onChange={(e) => setNewBannerBtn(e.target.value)} className="bg-white border rounded p-1.5" />
                  <select value={newBannerGradient} onChange={(e) => setNewBannerGradient(e.target.value)} className="bg-white border rounded p-1.5 font-semibold">
                    <option value="from-teal-600 to-cyan-700">Teal-Cyan Gradient</option>
                    <option value="from-orange-500 to-rose-600">Orange-Rose Gradient</option>
                    <option value="from-purple-600 to-indigo-700">Purple-Indigo Gradient</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-teal-600 text-white font-bold py-1.5 rounded-lg hover:bg-teal-700">
                  Inject Banner promotion
                </button>
              </form>

              <div className="space-y-2">
                {banners.map((b) => (
                  <div key={b.id} className="border border-zinc-100 bg-zinc-50/40 p-2.5 rounded-xl text-xs flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-zinc-800 truncate">{b.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{b.subtitle}</p>
                    </div>
                    <button
                      onClick={() => onDeleteBanner(b.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* CRM view */}
        {activeTab === 'crm' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Users className="w-4.5 h-4.5 text-teal-600" />
              Simple Client CRM View
            </h3>

            {/* CRM Filters Toolbar */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col md:flex-row gap-2.5 text-xs">
              <div className="flex-1">
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Search Customer Profile</label>
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="w-full md:w-44">
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Total Spent Tier</label>
                <select
                  value={spentFilter}
                  onChange={(e) => setSpentFilter(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-semibold text-xs focus:outline-none"
                >
                  <option value="all">All Spends</option>
                  <option value="high">High Spenders (₹50k+)</option>
                  <option value="medium">Medium Spenders (₹10k-₹50k)</option>
                  <option value="low">Starter Spenders (&lt; ₹10k)</option>
                </select>
              </div>
              <div className="w-full md:w-36">
                <label className="text-[10px] text-zinc-400 font-bold block mb-1">Order Loyalty</label>
                <select
                  value={loyaltyFilter}
                  onChange={(e) => setLoyaltyFilter(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2 font-semibold text-xs focus:outline-none"
                >
                  <option value="all">All Orders</option>
                  <option value="frequent">Frequent (3+ Orders)</option>
                  <option value="occasional">Occasional (1-2 Orders)</option>
                  <option value="none">No Orders yet</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="p-2.5">Customer Profile</th>
                    <th className="p-2.5 text-center">Orders</th>
                    <th className="p-2.5 text-center">Total Spent</th>
                    <th className="p-2.5 text-center">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50">
                      <td className="p-2.5 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${c.avatarColor}`}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800">{c.name}</p>
                          <span className="text-[9px] text-zinc-400 font-semibold block">{c.email}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-zinc-900">{c.totalOrders}</td>
                      <td className="p-2.5 text-center font-extrabold text-teal-700">₹{c.totalSpent.toLocaleString()}</td>
                      <td className="p-2.5 text-center text-zinc-400">{c.joinDate}</td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-400 font-medium">
                        No customers matched selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Moderation & Communications feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              
              {/* Trustpilot Feed */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded tracking-normal">★ Trustpilot</span>
                    2-Way Review Moderation
                  </h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                    {reviews.length} total
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-6 text-center bg-white border rounded-xl">No Trustpilot review feedback found.</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="bg-white border border-zinc-100 p-3 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-zinc-800">{rev.customerName}</p>
                            <div className="flex text-amber-400 text-xs mt-0.5">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <span key={i}>★</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{new Date(rev.timestamp).toLocaleTimeString()}</span>
                        </div>
                        
                        <p className="text-zinc-600 bg-zinc-50/50 p-2 border border-zinc-50 rounded-lg text-xs leading-relaxed italic">
                          "{rev.comment}"
                        </p>

                        {rev.sellerReply ? (
                          <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-lg space-y-1">
                            <p className="font-bold text-teal-800 flex items-center gap-1 text-[10px]">
                              <Icons.ShieldAlert className="w-3.5 h-3.5" /> Registered Admin Reply:
                            </p>
                            <p className="text-zinc-700 text-xs italic leading-relaxed">"{rev.sellerReply}"</p>
                          </div>
                        ) : (
                          <div className="pt-1.5 flex gap-1.5 items-center">
                            <input
                              type="text"
                              placeholder="Write helpful response to this shopper..."
                              value={replyTexts[rev.id] || ''}
                              onChange={(e) => setReplyTexts(prev => ({ ...prev, [rev.id]: e.target.value }))}
                              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                            />
                            <button
                              onClick={() => handleAdminReplySubmit(rev.id)}
                              className="bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition shrink-0"
                            >
                              Post Reply
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SMS & Support Desk Logs */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.MessageSquareCode className="w-4.5 h-4.5 text-teal-600" />
                    Live Callback & SMS Gateway Logs
                  </h4>
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-100">
                    {comms.length} items
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {comms.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-6 text-center bg-white border rounded-xl">No active SMS dispatches or callback entries.</p>
                  ) : (
                    comms.map((comm) => (
                      <div key={comm.id} className="bg-white border border-zinc-100 p-3 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            comm.type === 'otp'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : comm.type === 'restock'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}>
                            {comm.type === 'otp' ? '🔐 SMS OTP' : comm.type === 'restock' ? '📦 restock alert' : '📞 support call'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">{new Date(comm.timestamp).toLocaleTimeString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 font-mono">
                          <p>Sender: <strong className="text-zinc-800">{comm.customerName || 'Guest Shopper'}</strong></p>
                          <p>Mobile: <strong className="text-zinc-800">{comm.customerPhone}</strong></p>
                        </div>

                        <p className="text-zinc-600 font-mono text-[11px] bg-zinc-50 p-2 rounded border border-zinc-100 leading-snug">
                          {comm.message}
                        </p>

                        <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
                          <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            comm.status === 'resolved' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'
                          }`}>
                            {comm.status === 'resolved' ? (
                              <>● Verified/Resolved</>
                            ) : (
                              <>● Active Request</>
                            )}
                          </span>
                          
                          {comm.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolveComm(comm.id)}
                              className="text-[10px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                            >
                              Mark Completed ✓
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
