import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Product, HeroBanner, Coupon, OrderItem, AppSettings } from '../types';
import ChatbotWidget from './ChatbotWidget';
import Confetti from './Confetti';
import { playClickSound, playSuccessSound, playErrorSound, toggleAmbientMusic } from '../utils/audio';

interface CustomerStorefrontProps {
  products: Product[];
  banners: HeroBanner[];
  coupons: Coupon[];
  isConfettiActive: boolean;
  settings: AppSettings;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    couponUsed?: string;
    total: number;
  }) => Promise<void>;
  onTrackActivity: (type: string, message: string, productName?: string, customerName?: string) => Promise<void>;
  onSelectProductInspector: (product: Product) => void;
}

export default function CustomerStorefront({
  products,
  banners,
  coupons,
  isConfettiActive,
  settings,
  onPlaceOrder,
  onTrackActivity,
  onSelectProductInspector
}: CustomerStorefrontProps) {
  // Storefront navigation & filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('Laptops');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interaction states
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  // Modals & views
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Payment selection state
  const [paymentGateway, setPaymentGateway] = useState<'billdesk' | 'upi'>('billdesk');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Checkout process
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<string>(''); // '', 'processing', 'success'
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Flash Message Toasts state
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Music & Trustpilot state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  
  // Phone/SMS Support Desk
  const [phoneHubOpen, setPhoneHubOpen] = useState(false);
  const [phoneName, setPhoneName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [phoneType, setPhoneType] = useState<'callback' | 'sms'>('callback');
  
  // SMS TPA OTP Gateway
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpPendingAction, setOtpPendingAction] = useState<any>(null);

  // Out Of Stock / Back in Stock notification
  const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyName, setNotifyName] = useState('');

  // Simulated Tracker Map details
  const [trackerStep, setTrackerStep] = useState(0); // 0: Packed, 1: Out for delivery, 2: Arrived!

  // Trustpilot 2-Way reviews fetcher
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Trustpilot reviews:', err);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 8000); // 2-way reviews synced live
    return () => clearInterval(interval);
  }, []);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newReviewName,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      if (res.ok) {
        playSuccessSound();
        showToast('⭐️ Thank you! Review published on Trustpilot.', 'success');
        setNewReviewName('');
        setNewReviewComment('');
        setNewReviewRating(5);
        setWriteReviewOpen(false);
        fetchReviews();
      }
    } catch (err) {
      playErrorSound();
      showToast('Error publishing review. Please try again.', 'error');
    }
  };

  const handleRequestOtp = async (phone: string, callbackAction: () => void) => {
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/communications/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        const data = await res.json();
        setExpectedOtp(String(data.otp));
        setOtpSent(true);
        // Dispatch OTP onto screen toast
        showToast(`📲 [SMS TPA Gateway] Secure passcode transmitted to ${phone}. OTP: ${data.otp}`, 'info');
        setOtpPendingAction(() => callbackAction);
        playSuccessSound();
      }
    } catch (err) {
      playErrorSound();
      showToast('TPA SMS Carrier authentication failed.', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode === expectedOtp) {
      playSuccessSound();
      showToast('📲 OTP verified successfully via SMS TPA Gateway!', 'success');
      setOtpSent(false);
      setOtpCode('');
      setExpectedOtp('');
      
      if (otpPendingAction) {
        otpPendingAction();
      }
    } else {
      playErrorSound();
      showToast('❌ Invalid security code. Try again.', 'error');
    }
  };

  const submitPhoneInquiry = async () => {
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: phoneType,
          customerName: phoneName,
          phone: phoneNum,
          query: phoneQuery
        })
      });
      if (res.ok) {
        playSuccessSound();
        showToast(
          phoneType === 'callback' 
            ? '📞 Callback requested! An agent will call you shortly.' 
            : '📲 SMS Ticket opened! Watch for incoming texts.',
          'success'
        );
        setPhoneName('');
        setPhoneNum('');
        setPhoneQuery('');
        setPhoneHubOpen(false);
      }
    } catch (err) {
      playErrorSound();
      showToast('Failed to connect to Support Hub. Try again.', 'error');
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneName || !phoneNum || !phoneQuery) return;
    handleRequestOtp(phoneNum, submitPhoneInquiry);
  };

  const submitNotifyRequest = async () => {
    if (!outOfStockProduct) return;
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          customerName: notifyName,
          phone: notifyPhone,
          query: `ALERT ME WHEN IN STOCK: ${outOfStockProduct.name}`
        })
      });
      if (res.ok) {
        playSuccessSound();
        showToast(`📲 Registered! We will SMS you as soon as ${outOfStockProduct.name} is back in stock.`, 'success');
        setNotifyName('');
        setNotifyPhone('');
        setOutOfStockProduct(null);
      }
    } catch (err) {
      playErrorSound();
      showToast('Failed to register restock alert.', 'error');
    }
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyName || !notifyPhone || !outOfStockProduct) return;
    handleRequestOtp(notifyPhone, submitNotifyRequest);
  };

  const handleBannerRedirect = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    
    playSuccessSound();
    showToast(`Redirecting you to featured deal: ${p.name}!`, 'info');
    
    setSelectedCategory(p.category);
    setSelectedBrand('All');
    setSearchQuery('');
    
    setTimeout(() => {
      const card = document.getElementById(`product-card-${p.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('ring-4', 'ring-amber-400', 'animate-pulse');
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-amber-400', 'animate-pulse');
        }, 3000);
      }
      handleProductClick(p, true);
    }, 300);
  };

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Category listing derived from loaded products
  const categories = Array.from(new Set(products.map((p) => p.category)));
  
  // Brand listing derived based on selected category
  const brandsInCategory = Array.from(
    new Set(
      products
        .filter((p) => p.category === selectedCategory)
        .map((p) => p.brand)
    )
  );

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory = p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesBrand && matchesSearch;
  });

  // Render dynamic Category Icon
  const renderCategoryIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'Laptop': return <Icons.Laptop className={className} />;
      case 'Smartphone': return <Icons.Smartphone className={className} />;
      case 'Headphones': return <Icons.Headphones className={className} />;
      case 'Tv': return <Icons.Tv className={className} />;
      case 'Flame': return <Icons.Flame className={className} />;
      case 'Watch': return <Icons.Watch className={className} />;
      case 'Gamepad2': return <Icons.Gamepad2 className={className} />;
      case 'Camera': return <Icons.Camera className={className} />;
      case 'HardDrive': return <Icons.HardDrive className={className} />;
      case 'Zap': return <Icons.Zap className={className} />;
      case 'Monitor': return <Icons.Monitor className={className} />;
      case 'Wifi': return <Icons.Wifi className={className} />;
      case 'Shield': return <Icons.Shield className={className} />;
      case 'Cpu': return <Icons.Cpu className={className} />;
      case 'Printer': return <Icons.Printer className={className} />;
      case 'Briefcase': return <Icons.Briefcase className={className} />;
      default: return <Icons.ShoppingBag className={className} />;
    }
  };

  // Recently viewed addition
  const handleProductClick = (product: Product, openModal = true) => {
    playClickSound();
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== product.id);
      return [product.id, ...filtered].slice(0, 5);
    });

    onTrackActivity('view', `A customer viewed ${product.name}`, product.name);
    
    if (openModal) {
      setQuickViewProduct(product);
    }
    
    // Also trigger admin product inspector!
    onSelectProductInspector(product);
  };

  // Wishlist handler
  const toggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyIn = wishlist.includes(product.id);
    if (isCurrentlyIn) {
      playClickSound();
      showToast(`Removed ${product.name} from your wishlist`, 'info');
      setWishlist((prev) => prev.filter((id) => id !== product.id));
      onTrackActivity('wishlist_remove', `A customer removed ${product.name} from wishlist`, product.name);
    } else {
      playSuccessSound();
      showToast(`Added ${product.name} to wishlist! 💖`, 'success');
      setWishlist((prev) => [...prev, product.id]);
      onTrackActivity('wishlist_add', `A customer added ${product.name} to wishlist`, product.name);
    }
  };

  // Cart helper functions
  const updateCartQty = (productId: string, delta: number, productName: string) => {
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        playClickSound();
        showToast(`Removed ${productName} from cart`, 'info');
        const copy = { ...prev };
        delete copy[productId];
        onTrackActivity('cart_remove', `A customer removed ${productName} from cart`, productName);
        return copy;
      }
      
      if (delta > 0) {
        playSuccessSound();
        showToast(`Added ${productName} to cart! 🛒`, 'success');
      } else {
        playClickSound();
        showToast(`Decreased ${productName} quantity`, 'info');
      }

      onTrackActivity(
        delta > 0 ? 'cart_add' : 'cart_remove',
        `A customer updated ${productName} quantity to ${newQty}`,
        productName
      );
      return { ...prev, [productId]: newQty };
    });
  };

  // Compare helper functions
  const handleToggleCompare = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    setCompareProducts((prev) => {
      const isComparing = prev.some((p) => p.id === product.id);
      if (isComparing) {
        showToast(`Removed ${product.name} from comparison sheet`, 'info');
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        playErrorSound();
        showToast("You can compare up to 3 products at a time!", 'error');
        return prev;
      }
      showToast(`Added ${product.name} to compare list`, 'success');
      return [...prev, product];
    });
  };

  // Compute Cart Summary metrics
  const getBulkDiscountRate = (qty: number) => {
    if (qty >= 20) return 0.10; // 10%
    if (qty >= 10) return 0.05; // 5%
    return 0;
  };

  const cartItemsList = Object.entries(cart).map(([productId, quantity]): { product: Product; quantity: number } => {
    const product = products.find((p) => p.id === productId)!;
    return { product, quantity: quantity as number };
  }).filter(item => item.product);

  const cartSubtotal = cartItemsList.reduce((acc, item) => {
    // Apply quantity-based volume discount inline
    const bulkDiscount = getBulkDiscountRate(item.quantity);
    const effectivePrice = item.product.price * (1 - bulkDiscount);
    return acc + effectivePrice * item.quantity;
  }, 0);

  const totalQuantity = cartItemsList.reduce((acc, item) => acc + item.quantity, 0);

  // Apply Coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponInput.toUpperCase() && c.isActive
    );

    if (!matched) {
      playErrorSound();
      setCouponError('Invalid or inactive coupon code.');
      setAppliedCoupon(null);
      return;
    }

    if (matched.code === 'VOLT20' && cartSubtotal < 5000) {
      playErrorSound();
      setCouponError('VOLT20 requires a minimum order of ₹5,000.');
      setAppliedCoupon(null);
      return;
    }

    playSuccessSound();
    setAppliedCoupon(matched);
    showToast(`Coupon ${matched.code} applied! Saved discount!`, 'success');
    onTrackActivity('coupon_apply', `Customer applied coupon ${matched.code}`);
  };

  const getCouponDiscountValue = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return cartSubtotal * (appliedCoupon.value / 100);
    } else {
      return Math.min(appliedCoupon.value, cartSubtotal);
    }
  };

  const couponDiscount = getCouponDiscountValue();
  const shippingFee = cartSubtotal >= 999 || totalQuantity === 0 ? 0 : 99;
  const cartTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  // Clear checkout flow
  const proceedWithCheckoutOrder = async () => {
    setIsCheckingOut(true);
    setCheckoutStep('processing');
    onTrackActivity('checkout_start', `${customerName} initiated checkout processing...`);

    // Simulated status updates for authentic banking flow
    const steps = paymentGateway === 'billdesk' ? [
      'Establishing connection with BillDesk encrypted server...',
      'Redirecting to BillDesk secure bank authentication page...',
      'Routing payment request safely to selected banking branch...',
      'Success! BillDesk transaction completed, order approved by VoltMart.'
    ] : [
      'Establishing secure connection with Bank...',
      'Verifying gateway and customer authentication...',
      'Confirming standard transaction ledger records...',
      'Success! Order approved by VoltMart Billing System.'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 900));
      setCheckoutStep(steps[i]);
    }

    // Call backend order placing
    const itemsPayload: OrderItem[] = cartItemsList.map((item) => ({
      id: `item-${Date.now()}-${item.product.id}`,
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    await onPlaceOrder({
      customerName,
      customerEmail,
      items: itemsPayload,
      subtotal: cartSubtotal,
      discount: couponDiscount,
      couponUsed: appliedCoupon?.code,
      total: cartTotal
    });

    setCheckoutStep('success');
    playSuccessSound();
    showToast('Congratulations! Order placed successfully.', 'success');
    
    // Reset simulated tracker steps
    setTrackerStep(0);
    
    // Advance tracking animation step-by-step
    setTimeout(() => {
      setTrackerStep(1);
      showToast('📦 Tracker: Your VoltMart order is packed and dispatched!', 'info');
      playSuccessSound();
    }, 7000);

    setTimeout(() => {
      setTrackerStep(2);
      showToast('⚡ Tracker: VoltMart drone has landed! Delivery complete.', 'success');
      playSuccessSound();
    }, 18000);

    // Clear storefront cart
    setCart({});
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !shippingAddress || !customerPhone) {
      playErrorSound();
      showToast('Please complete all delivery fields.', 'error');
      return;
    }

    // Intercept checkout to require simulated TPA SMS OTP validation!
    handleRequestOtp(customerPhone, proceedWithCheckoutOrder);
  };

  return (
    <div id="customer-storefront-panel" className="flex flex-col h-full bg-white relative">
      
      {/* Customer-scoped balloons & crackers confetti animation */}
      <Confetti active={isConfettiActive} />

      {/* Dynamic Information Banner */}
      <div className="bg-teal-950 text-teal-100 px-4 py-1.5 text-[10px] sm:text-[11px] flex justify-between items-center gap-2 font-mono font-bold z-30 border-b border-teal-900/40 select-none">
        <div className="flex items-center gap-1.5">
          <Icons.PhoneCall className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>VoltMart toll-free support: <span className="text-white underline font-extrabold">{settings.tollFreeNumber}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icons.Clock className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Committed Delivery: <span className="text-amber-300 font-extrabold">{settings.deliveryTimeMin}-{settings.deliveryTimeMax} Mins</span> ⚡</span>
        </div>
      </div>
      
      {/* Search and Header Section */}
      <header className="p-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-zinc-50/50 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/30">
            <Icons.ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">VoltMart</h1>
          </div>
        </div>

        {/* Dynamic Search & Audio Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-64">
            <Icons.Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search items or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-zinc-800 shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600">
                <Icons.X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => {
              const currentPlaying = toggleAmbientMusic();
              setMusicPlaying(currentPlaying);
              showToast(currentPlaying ? '🎵 Lofi background store music playing!' : '🔇 Ambient music paused', 'info');
            }}
            className={`p-2 rounded-xl border transition shrink-0 ${
              musicPlaying 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse' 
                : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'
            }`}
            title="Toggle store music"
          >
            {musicPlaying ? <Icons.Music className="w-4.5 h-4.5" /> : <Icons.Music4 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* Trustpilot & Support Desk Quick-Bar */}
      <div className="px-4 py-2 border-b border-zinc-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setWriteReviewOpen(true)}>
          <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black text-[9px] tracking-wider uppercase">
            ★ Trustpilot
          </span>
          <div className="flex text-emerald-500 text-[10px]">★★★★★</div>
          <span className="text-zinc-600 font-medium hover:underline">
            TrustScore <strong className="text-zinc-900">4.9</strong> • Excellent • <span className="text-teal-600 font-bold">Write a review</span>
          </span>
        </div>
        <button
          onClick={() => {
            playClickSound();
            setPhoneHubOpen(true);
          }}
          className="text-xs text-teal-600 font-bold flex items-center gap-1.5 hover:underline"
        >
          <Icons.PhoneCall className="w-3.5 h-3.5" /> Live Support & Callback Desk
        </button>
      </div>

      {/* Main Independently Scrolling Content Container */}
      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Admin Banners Carousel */}
        {banners.length > 0 && (
          <section className="p-4">
            <div className={`group relative h-44 rounded-2xl bg-gradient-to-r ${banners[activeBannerIdx]?.colorGradient || 'from-teal-600 to-cyan-700'} text-white p-6 flex flex-col justify-between overflow-hidden shadow-lg shadow-teal-700/10 hover:shadow-xl transition duration-300`}>
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <Icons.Sparkles className="w-48 h-48" />
              </div>
              
              {/* Floating linked product real photo */}
              {(() => {
                const linkedProd = products.find(p => p.id === banners[activeBannerIdx]?.productId);
                if (linkedProd && linkedProd.imageUrl) {
                  return (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 shadow-2xl border border-white/20 rotate-6 hidden sm:block group-hover:rotate-3 group-hover:scale-105 transition duration-350 cursor-pointer"
                      onClick={() => handleProductClick(linkedProd)}
                    >
                      <img src={linkedProd.imageUrl} alt={linkedProd.name} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  );
                }
                return null;
              })()}

              <div className="max-w-[65%] sm:max-w-[70%] z-10">
                <span className="bg-white/20 text-white font-medium text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                  Featured Promotion
                </span>
                <h2 className="text-lg md:text-xl font-bold mt-2 tracking-tight line-clamp-1">
                  {banners[activeBannerIdx]?.title}
                </h2>
                <p className="text-xs text-teal-50/90 mt-1 line-clamp-2">
                  {banners[activeBannerIdx]?.subtitle}
                </p>
              </div>
              <div className="flex justify-between items-center z-10">
                <button
                  onClick={() => {
                    const linkedId = banners[activeBannerIdx]?.productId;
                    if (linkedId) handleBannerRedirect(linkedId);
                  }}
                  className="bg-white text-teal-800 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-50 hover:scale-[1.02] transition shadow-md"
                >
                  {banners[activeBannerIdx]?.buttonText || 'Shop Now'}
                </button>
                <div className="flex gap-1">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`w-2 h-2 rounded-full transition ${activeBannerIdx === idx ? 'bg-white px-2' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Flash Sale Header bar */}
        <section className="px-4 py-2">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white p-1 rounded-lg animate-bounce">
                <Icons.Zap className="w-4.5 h-4.5" />
              </span>
              <div>
                <span className="font-bold text-orange-800 text-sm">Lightning Deals Live! ⚡</span>
                <p className="text-[11px] text-orange-600/90">Exclusive prices, changing hourly</p>
              </div>
            </div>
            {/* Real countdown ticker */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-zinc-500 mr-1">Ends in:</span>
              <span className="bg-zinc-900 text-white px-2 py-1 rounded font-mono font-bold">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-zinc-900 text-white px-2 py-1 rounded font-mono font-bold">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-zinc-900 text-white px-2 py-1 rounded font-mono font-bold text-orange-400">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </section>

        {/* 16 Category Rail */}
        <section className="px-4 py-2 mt-2">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Explore Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none snap-x">
            {categories.map((catName) => {
              const matchedProd = products.find((p) => p.category === catName);
              const isActive = selectedCategory === catName;
              return (
                <button
                  key={catName}
                  onClick={() => {
                    setSelectedCategory(catName);
                    setSelectedBrand('All');
                  }}
                  className={`flex-none snap-start flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition ${
                    isActive
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-zinc-50 border-zinc-100 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-200'
                  }`}
                >
                  {matchedProd && renderCategoryIcon(matchedProd.iconName, `w-4 h-4 ${isActive ? 'text-white' : 'text-teal-600'}`)}
                  <span className="text-xs font-semibold whitespace-nowrap">{catName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Brand Chip Filter Rail */}
        {brandsInCategory.length > 0 && (
          <section className="px-4 py-2 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 mt-2 pt-3">
            <span className="text-xs text-zinc-400 font-medium mr-1.5">Brands:</span>
            <button
              onClick={() => setSelectedBrand('All')}
              className={`text-[11px] font-bold px-3 py-1 rounded-full transition border ${
                selectedBrand === 'All'
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              All Brands
            </button>
            {brandsInCategory.map((br) => (
              <button
                key={br}
                onClick={() => setSelectedBrand(br)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition border ${
                  selectedBrand === br
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {br}
              </button>
            ))}
          </section>
        )}

        {/* Product Grid */}
        <section className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-400">
              <Icons.Inbox className="w-12 h-12 text-zinc-300 mb-2" />
              <p className="text-sm font-medium">No active products match your filter.</p>
              <button onClick={() => { setSelectedBrand('All'); setSearchQuery(''); }} className="text-xs text-teal-600 mt-1 hover:underline font-semibold">
                Clear Filters
              </button>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inWish = wishlist.includes(p.id);
              const isLowStock = p.stock > 0 && p.stock < 5;
              const isOutOfStock = p.stock === 0;
              const cartQty = cart[p.id] || 0;
              const discountPercent = Math.round(((p.original_price - p.price) / p.original_price) * 100);

              const isComparing = compareProducts.some((comp) => comp.id === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col group cursor-pointer relative"
                >
                  
                  {/* Badge Row */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                    {p.is_flash_sale && (
                      <span className="bg-orange-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm">
                        Flash Deal
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Wishlist Heart Toggle */}
                  <button
                    onClick={(e) => toggleWishlist(p, e)}
                    className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-full border border-zinc-100 text-zinc-400 hover:text-rose-500 hover:scale-105 transition"
                  >
                    <Icons.Heart className={`w-4 h-4 ${inWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Image Tile */}
                  <div className="h-32 bg-zinc-100 relative shadow-inner overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${p.imageColor} flex items-center justify-center`}>
                        {renderCategoryIcon(p.iconName, "w-10 h-10 text-white drop-shadow-md")}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" />
                  </div>

                  {/* Body Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">{p.brand}</span>
                        {/* Compare Toggle Box */}
                        <button
                          onClick={(e) => handleToggleCompare(p, e)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition flex items-center gap-0.5 ${
                            isComparing ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <Icons.Layers className="w-2.5 h-2.5" />
                          {isComparing ? 'Comparing' : 'Compare'}
                        </button>
                      </div>

                      <h3 className="text-xs font-bold text-zinc-800 line-clamp-2 mt-1 leading-snug">
                        {p.name}
                      </h3>

                      {/* Rating/Reviews */}
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500">
                        <Icons.Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-zinc-800">{p.rating}</span>
                        <span>({p.review_count})</span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      {/* Price labels */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-zinc-900">₹{p.price.toLocaleString()}</span>
                        {p.original_price > p.price && (
                          <span className="text-[10px] text-zinc-400 line-through">₹{p.original_price.toLocaleString()}</span>
                        )}
                      </div>

                      {/* Low/Out of Stock labels & Delivery ETA */}
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 animate-pulse">
                            Only {p.stock} Left!
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            In Stock
                          </span>
                        )}
                        <span className="text-[9px] font-medium text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 flex items-center gap-0.5">
                          <Icons.Truck className="w-2.5 h-2.5 text-zinc-400" />
                          Delivery in {p.price > 20000 ? '2' : '3'} Days
                        </span>
                      </div>

                      {/* Cart Add / Stepper */}
                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                        {cartQty > 0 ? (
                          <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-2.5 py-1">
                            <button
                              onClick={() => updateCartQty(p.id, -1, p.name)}
                              className="text-teal-700 p-1 hover:bg-teal-100/50 rounded-lg transition"
                            >
                              <Icons.Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-teal-800">{cartQty}</span>
                            <button
                              onClick={() => {
                                if (cartQty < p.stock) {
                                  updateCartQty(p.id, 1, p.name);
                                } else {
                                  alert(`Only ${p.stock} items left in stock.`);
                                }
                              }}
                              className="text-teal-700 p-1 hover:bg-teal-100/50 rounded-lg transition"
                            >
                              <Icons.Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isOutOfStock ? (
                          <button
                            onClick={() => {
                              playClickSound();
                              setOutOfStockProduct(p);
                            }}
                            className="w-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Icons.Bell className="w-3.5 h-3.5" />
                            Notify Me
                          </button>
                        ) : (
                          <button
                            onClick={() => updateCartQty(p.id, 1, p.name)}
                            className="w-full bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm group-hover:scale-[1.01]"
                          >
                            <Icons.ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Recently Viewed Strip */}
        {recentlyViewed.length > 0 && (
          <section className="px-4 py-3 border-t border-zinc-100 mt-4 bg-zinc-50/40">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Icons.Eye className="w-3.5 h-3.5" />
              Recently Viewed Products
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {recentlyViewed.map((id) => {
                const prod = products.find((p) => p.id === id);
                if (!prod) return null;
                return (
                  <div
                    key={id}
                    onClick={() => handleProductClick(prod)}
                    className="flex-none w-32 bg-white border border-zinc-100 rounded-xl p-2 cursor-pointer hover:border-teal-300 transition shadow-sm flex flex-col items-center text-center"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${prod.imageColor} flex items-center justify-center`}>
                          {renderCategoryIcon(prod.iconName, "w-4.5 h-4.5 text-white")}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-800 line-clamp-1 mt-1.5 leading-tight">{prod.name}</span>
                    <span className="text-[10px] text-teal-600 font-extrabold mt-0.5">₹{prod.price.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* Sticky View Cart Bar (At the bottom of Customer storefront) */}
      {totalQuantity > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-teal-900 text-white p-3 shadow-2xl flex items-center justify-between border-t border-teal-800 z-30 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <span className="bg-teal-800 p-2 rounded-xl flex items-center justify-center animate-pulse">
              <Icons.ShoppingCart className="w-4 h-4 text-teal-200" />
            </span>
            <div>
              <p className="text-xs font-bold">{totalQuantity} Items in Shopper Cart</p>
              <p className="text-[10px] text-teal-200">
                Total: ₹{cartSubtotal.toLocaleString()} 
                {cartSubtotal >= 999 ? ' • Free Delivery Applied!' : ` • Add ₹${(999 - cartSubtotal).toLocaleString()} more for free delivery`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md shadow-orange-600/30 active:scale-95"
          >
            Review & Checkout
            <Icons.ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floated Chatbot Widget nested inside storefront */}
      <ChatbotWidget />

      {/* Compare up to 3 floating Drawer */}
      {compareProducts.length > 0 && (
        <div className="absolute bottom-16 left-4 right-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl z-40 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-teal-600 p-1 rounded-lg">
                <Icons.Layers className="w-4 h-4 text-white" />
              </span>
              <span className="text-xs font-bold">Compare Dashboard ({compareProducts.length}/3)</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCompareOpen(!isCompareOpen)}
                className="text-[11px] font-bold bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-lg transition"
              >
                {isCompareOpen ? 'Hide Specs' : 'Show Side-by-Side'}
              </button>
              <button
                onClick={() => setCompareProducts([])}
                className="text-[11px] text-zinc-400 hover:text-white px-2 py-1"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Quick mini header */}
          <div className="grid grid-cols-3 gap-2">
            {compareProducts.map((p) => (
              <div key={p.id} className="bg-zinc-800/60 p-2 rounded-xl relative border border-zinc-700">
                <button
                  onClick={(e) => handleToggleCompare(p, e)}
                  className="absolute -top-1.5 -right-1.5 bg-zinc-700 text-zinc-300 p-0.5 rounded-full hover:bg-zinc-600"
                >
                  <Icons.X className="w-3 h-3" />
                </button>
                <p className="text-[10px] font-bold text-teal-400 truncate">{p.brand}</p>
                <p className="text-[10px] text-zinc-100 font-bold line-clamp-1 leading-snug">{p.name}</p>
                <p className="text-[10px] text-orange-400 font-extrabold mt-0.5">₹{p.price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Expanded specifications table */}
          {isCompareOpen && (
            <div className="mt-3 border-t border-zinc-800 pt-3 space-y-2 text-[11px] overflow-y-auto max-h-40">
              <div className="grid grid-cols-4 border-b border-zinc-800 pb-1 text-zinc-400 font-bold">
                <div>Spec Category</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="truncate px-1 text-teal-400 font-semibold">{p.name.substring(0, 15)}...</div>
                ))}
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-800/50 py-1">
                <div className="text-zinc-500 font-medium">Price</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="font-bold">₹{p.price.toLocaleString()}</div>
                ))}
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-800/50 py-1">
                <div className="text-zinc-500 font-medium">MRP Price</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="text-zinc-400 line-through">₹{p.original_price.toLocaleString()}</div>
                ))}
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-800/50 py-1">
                <div className="text-zinc-500 font-medium">Rating</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="text-amber-400 font-bold flex items-center gap-0.5">
                    <Icons.Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {p.rating}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 border-b border-zinc-800/50 py-1">
                <div className="text-zinc-500 font-medium">Category</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className="text-zinc-300 truncate">{p.category}</div>
                ))}
              </div>
              <div className="grid grid-cols-4 py-1">
                <div className="text-zinc-500 font-medium">Stock Status</div>
                {compareProducts.map((p) => (
                  <div key={p.id} className={p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {p.stock > 0 ? `${p.stock} left` : 'Out of Stock'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cart Review & Checkout Drawer/Modal Overlay */}
      {isCartOpen && (
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-1.5">
                <Icons.ShoppingBag className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-zinc-900">Your Shopping Cart</h3>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckingOut(false);
                  setCheckoutStep('');
                }}
                className="text-zinc-400 hover:text-zinc-600 p-1 hover:bg-zinc-100 rounded-full"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Payment Success Step */}
            {checkoutStep === 'success' ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-start overflow-y-auto text-center bg-white">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 border-4 border-emerald-50 text-emerald-600 animate-bounce">
                  <Icons.Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-zinc-900 leading-tight">Order Placed & Secured! 🎉</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Billed transaction totals have synced live with Seller Central. We sent an SMS OTP receipt confirmation to your phone.
                </p>

                {/* Interactive Live Map Tracker */}
                <div className="mt-5 p-4 border border-zinc-100 bg-zinc-50/70 rounded-xl w-full text-left space-y-3 shadow-inner">
                  <p className="font-extrabold text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Icons.Compass className="w-3.5 h-3.5 text-teal-600 animate-spin" style={{ animationDuration: '10s' }} /> Live Coordinate Tracking
                  </p>
                  
                  {/* Visual Tracker Bar */}
                  <div className="relative flex justify-between items-center px-4 pt-2 select-none">
                    {/* Background track line */}
                    <div className="absolute top-1/2 left-8 right-8 h-1 bg-zinc-200 -translate-y-1/2 z-0" />
                    <div 
                      className="absolute top-1/2 left-8 h-1 bg-teal-600 -translate-y-1/2 transition-all duration-1000 z-0" 
                      style={{ width: trackerStep === 0 ? '0%' : trackerStep === 1 ? '50%' : '100%' }}
                    />

                    {/* Step 0: Packed */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        trackerStep >= 0 ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-105' : 'bg-white border-zinc-200 text-zinc-400'
                      }`}>
                        <Icons.Package className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-1 text-zinc-800">Packed</span>
                    </div>

                    {/* Step 1: Dispatched */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        trackerStep >= 1 ? 'bg-teal-600 border-teal-600 text-white shadow-md scale-105' : 'bg-white border-zinc-200 text-zinc-400'
                      }`}>
                        <Icons.Plane className="w-4 h-4 animate-pulse" />
                      </div>
                      <span className="text-[9px] font-bold mt-1 text-zinc-800">In Transit</span>
                    </div>

                    {/* Step 2: Delivered */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        trackerStep >= 2 ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105 animate-bounce' : 'bg-white border-zinc-200 text-zinc-400'
                      }`}>
                        <Icons.MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold mt-1 text-zinc-800">Arrived!</span>
                    </div>
                  </div>

                  {/* Dynamic description of tracker */}
                  <div className="p-2.5 bg-white border border-zinc-100 rounded-lg text-[10px] text-zinc-600 flex items-start gap-1.5 leading-relaxed font-mono">
                    <Icons.Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    {trackerStep === 0 && (
                      <span>VoltMart hub crew is wrapping your high-tech payload. Dispatching automated courier drone sequence...</span>
                    )}
                    {trackerStep === 1 && (
                      <span className="text-teal-700 font-semibold animate-pulse">Carrier Drone VM-902 is flying over your locality. ETA: ~2 minutes. Please keep your landing pad clear!</span>
                    )}
                    {trackerStep === 2 && (
                      <span className="text-emerald-700 font-extrabold">Delivery verified at your coordinates! Digital receipt and warranty card generated. Enjoy! 🎉</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 border border-emerald-100 bg-emerald-50/40 rounded-xl w-full text-left space-y-1.5 text-[10.5px]">
                  <p className="font-extrabold text-emerald-800 uppercase tracking-wider text-[9px] mb-1">📋 Dispatch Invoice</p>
                  <p className="text-emerald-700 font-semibold">Recipient Name: <span className="text-zinc-700">{customerName}</span></p>
                  <p className="text-emerald-700 font-semibold">Verified SMS Mobile: <span className="text-zinc-700 font-mono">{customerPhone}</span></p>
                  <p className="text-emerald-700 font-semibold">Banking Gateway: <span className="text-zinc-700">{paymentGateway === 'billdesk' ? 'BillDesk Secure NetBanking/Cards Hub' : 'VoltMart Instant UPI API'}</span></p>
                  <p className="text-emerald-700 font-semibold">Transit Class: <span className="text-zinc-700">Express Delivery ({settings.deliveryTimeMin}-{settings.deliveryTimeMax} mins guaranteed)</span></p>
                </div>
                
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckingOut(false);
                    setCheckoutStep('');
                  }}
                  className="mt-5 bg-zinc-900 hover:bg-zinc-800 text-white w-full py-2.5 rounded-xl font-bold text-xs transition"
                >
                  Continue Browsing Store
                </button>
              </div>
            ) : checkoutStep !== '' ? (
              // Processing Payment view
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-zinc-50">
                <div className="w-16 h-16 border-4 border-t-teal-600 border-zinc-200 rounded-full animate-spin mb-4" />
                <h4 className="text-lg font-bold text-zinc-800">Processing Secured Transaction...</h4>
                <p className="text-xs text-zinc-500 mt-2 font-mono bg-white border border-zinc-200 px-3 py-1.5 rounded-lg">
                  {checkoutStep}
                </p>
              </div>
            ) : (
              // General Cart and Form View
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Free Delivery progress bar */}
                <div className="bg-teal-50 p-3 border-b border-teal-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                  <div className="flex items-center gap-1.5">
                    <Icons.Truck className="w-4 h-4 text-teal-600" />
                    {cartSubtotal >= 999 ? (
                      <span>🎉 You unlocked <strong>FREE Delivery!</strong></span>
                    ) : (
                      <span>Add <strong>₹{(999 - cartSubtotal).toLocaleString()}</strong> more for FREE shipping</span>
                    )}
                  </div>
                  <span className="text-[10px] text-teal-600">Threshold: ₹999</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5">
                  <div
                    className="bg-teal-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (cartSubtotal / 999) * 100)}%` }}
                  />
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cartItemsList.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400 text-center">
                      <Icons.ShoppingCart className="w-12 h-12 text-zinc-300 mb-2" />
                      <p className="text-sm font-medium">Your shopper cart is empty.</p>
                      <button onClick={() => setIsCartOpen(false)} className="text-xs text-teal-600 mt-1 hover:underline font-bold">
                        Add Premium Products Now
                      </button>
                    </div>
                  ) : (
                    cartItemsList.map(({ product, quantity }) => {
                      const discountPercent = Math.round(((product.original_price - product.price) / product.original_price) * 100);
                      const bulkDiscount = getBulkDiscountRate(quantity);
                      const hasBulkDiscount = bulkDiscount > 0;
                      const productPriceUnit = product.price * (1 - bulkDiscount);

                      return (
                        <div key={product.id} className="flex gap-3 bg-zinc-50 border border-zinc-100 rounded-xl p-2.5 relative">
                          <div className="w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${product.imageColor} flex items-center justify-center text-white`}>
                                {renderCategoryIcon(product.iconName, "w-6 h-6")}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold">{product.brand}</span>
                            <h4 className="text-xs font-bold text-zinc-800 truncate">{product.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-black text-zinc-900">₹{productPriceUnit.toLocaleString()}</span>
                              {hasBulkDiscount && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded">
                                  Bulk Discount Applied ({Math.round(bulkDiscount * 100)}% Off)
                                </span>
                              )}
                            </div>
                            {/* Qty controller inside Cart */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50">
                              <span className="text-[10px] text-zinc-400">Quantity</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCartQty(product.id, -1, product.name)}
                                  className="bg-white border border-zinc-200 p-0.5 rounded text-zinc-600 hover:bg-zinc-100"
                                >
                                  <Icons.Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black text-zinc-800">{quantity}</span>
                                <button
                                  onClick={() => updateCartQty(product.id, 1, product.name)}
                                  className="bg-white border border-zinc-200 p-0.5 rounded text-zinc-600 hover:bg-zinc-100"
                                >
                                  <Icons.Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Coupon Field */}
                  {cartItemsList.length > 0 && (
                    <div className="pt-2 border-t border-zinc-100">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Apply Promotion Coupon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. FIRST10"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-teal-700 transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] font-semibold text-rose-500 mt-1">{couponError}</p>}
                      {appliedCoupon && (
                        <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                          ✓ Coupon {appliedCoupon.code} Applied: {appliedCoupon.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Checkout Shipping Form */}
                  {cartItemsList.length > 0 && !isCheckingOut && (
                    <form onSubmit={handleCheckoutSubmit} className="pt-4 border-t border-zinc-100 space-y-3">
                      <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1">
                        <Icons.CreditCard className="w-4 h-4 text-teal-600" />
                        Delivery & Checkout details
                      </h4>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-1">Full Name</label>
                        <input
                          required
                          type="text"
                          placeholder="Aarav Sharma"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-1">Email Address</label>
                        <input
                          required
                          type="email"
                          placeholder="aarav@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-1">Phone Number (Required for SMS OTP Verification)</label>
                        <input
                          required
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-1">Shipping Address</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Flat 101, Prestige Tech Park, Mumbai"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 resize-none"
                        />
                      </div>

                      {/* Gateway Selection (with BillDesk Payment) */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Secure Payment Gateway</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentGateway('billdesk')}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                              paymentGateway === 'billdesk'
                                ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/10'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50/60'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-extrabold text-[11px] text-zinc-900">BillDesk Hub</span>
                              <span className="bg-teal-600 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded scale-90">Secure</span>
                            </div>
                            <span className="text-[9px] text-zinc-400 mt-1 block">NetBanking, Cards, UPI routing</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPaymentGateway('upi')}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                              paymentGateway === 'upi'
                                ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/10'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50/60'
                            }`}
                          >
                            <span className="font-extrabold text-[11px] text-zinc-900 animate-pulse">Standard UPI</span>
                            <span className="text-[9px] text-zinc-400 mt-1 block">GPay, PhonePe, Cards</span>
                          </button>
                        </div>
                      </div>

                      {/* Display bulk discount explanations */}
                      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 text-[10px] text-amber-800 space-y-0.5">
                        <p className="font-bold flex items-center gap-1">
                          <Icons.Info className="w-3.5 h-3.5 text-amber-600" />
                          Volume & Bulk Tiers
                        </p>
                        <p>• Buy 10-19 units: get <strong>5% flat</strong> off item prices</p>
                        <p>• Buy 20+ units: get <strong>10% flat</strong> off item prices</p>
                      </div>

                      {/* Checkout Button */}
                      <button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-600/20 mt-4 active:scale-95"
                      >
                        <Icons.Check className="w-4 h-4" />
                        Place Order (₹{cartTotal.toLocaleString()})
                      </button>
                    </form>
                  )}
                </div>

                {/* Footer totals */}
                {cartItemsList.length > 0 && (
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span className="font-semibold text-zinc-800">₹{cartSubtotal.toLocaleString()}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon Discount ({appliedCoupon?.code}):</span>
                        <span>-₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Standard Shipping:</span>
                      <span className="font-semibold text-zinc-800">
                        {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-zinc-900 border-t border-zinc-200/60 pt-2">
                      <span>Total Amount Billed:</span>
                      <span className="text-teal-700">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* Quick View Product Modal */}
      {quickViewProduct && (
        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90%]">
            
            {/* Header / Dismiss */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 bg-zinc-100 text-zinc-500 hover:bg-zinc-200 p-1.5 rounded-full z-10 transition"
            >
              <Icons.X className="w-4.5 h-4.5" />
            </button>

            <div className="overflow-y-auto">
              {/* Product Image Backdrop */}
              <div className="h-48 bg-zinc-100 relative shadow-inner overflow-hidden flex items-center justify-center">
                {quickViewProduct.imageUrl ? (
                  <img
                    src={quickViewProduct.imageUrl}
                    alt={quickViewProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${quickViewProduct.imageColor} flex items-center justify-center text-white`}>
                    {renderCategoryIcon(quickViewProduct.iconName, "w-14 h-14 text-white drop-shadow-md")}
                  </div>
                )}
              </div>

              {/* Product Details Body */}
              <div className="p-5">
                <span className="bg-teal-50 border border-teal-100 text-teal-700 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {quickViewProduct.brand} • {quickViewProduct.category}
                </span>

                <h3 className="text-lg font-black text-zinc-900 mt-2.5 leading-snug">
                  {quickViewProduct.name}
                </h3>

                {/* Rating line */}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                  <Icons.Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-zinc-800">{quickViewProduct.rating} Stars</span>
                  <span>({quickViewProduct.review_count} verified reviews)</span>
                </div>

                <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                  Experience standard-setting technical capabilities with the {quickViewProduct.name}. Architected with premium specifications, tailored for the highest performance and aesthetic modern design in its class. Guaranteed durability with full VoltMart warranty.
                </p>

                {/* Price and Stock info */}
                <div className="mt-5 flex items-center justify-between border-t border-b border-zinc-100 py-3.5">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">VoltMart Guaranteed Price</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-black text-zinc-900">₹{quickViewProduct.price.toLocaleString()}</span>
                      {quickViewProduct.original_price > quickViewProduct.price && (
                        <span className="text-xs text-zinc-400 line-through">₹{quickViewProduct.original_price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Available Inventory</p>
                    <p className={`text-xs font-black mt-0.5 ${quickViewProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {quickViewProduct.stock === 0 ? 'Out of Stock' : `${quickViewProduct.stock} units left`}
                    </p>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-5 flex gap-3">
                  <button
                    disabled={quickViewProduct.stock === 0}
                    onClick={() => {
                      updateCartQty(quickViewProduct.id, 1, quickViewProduct.name);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/10"
                  >
                    <Icons.ShoppingCart className="w-4 h-4" />
                    Add to Cart (₹{quickViewProduct.price.toLocaleString()})
                  </button>

                  <button
                    onClick={(e) => {
                      toggleWishlist(quickViewProduct, e);
                    }}
                    className="bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3.5 rounded-xl border border-zinc-200 transition"
                  >
                    <Icons.Heart className={`w-4 h-4 ${wishlist.includes(quickViewProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Related Products Section */}
                <div className="mt-6 border-t border-zinc-100 pt-5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Related Products in {quickViewProduct.category}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {products
                      .filter((p) => p.category === quickViewProduct.category && p.id !== quickViewProduct.id)
                      .slice(0, 2)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setQuickViewProduct(p);
                            handleProductClick(p, false);
                          }}
                          className="bg-zinc-50 border border-zinc-100 hover:border-teal-300 rounded-xl p-2 cursor-pointer transition flex items-center gap-2.5"
                        >
                          <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${p.imageColor} flex items-center justify-center text-white`}>
                                {renderCategoryIcon(p.iconName, "w-4.5 h-4.5")}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[10px] font-bold text-zinc-800 truncate leading-tight">{p.name}</h5>
                            <span className="text-[10px] text-teal-600 font-extrabold">₹{p.price.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Flash Message Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 transition-all duration-300 animate-in slide-in-from-top-4 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}
          >
            {t.type === 'success' ? (
              <Icons.CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : t.type === 'error' ? (
              <Icons.AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Icons.MessageSquare className="w-5 h-5 text-teal-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold leading-normal">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Simulated SMS TPA OTP Gateway Verification Modal */}
      {otpSent && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-zinc-100 flex flex-col text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 mx-auto text-teal-600">
              <Icons.ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            
            <h3 className="text-base font-black text-zinc-900 leading-tight">📲 Carrier Authentication Required</h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              To complete this secure operation, enter the 4-digit verification code dispatched via our SMS Third Party API Gateway.
            </p>
            
            <div className="mt-4 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-800 font-mono">
              📟 [Simulated SMS Carrier Output]: Enter <strong className="text-amber-900 text-xs font-black">{expectedOtp}</strong> to verify.
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="text"
                maxLength={4}
                placeholder="• • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-black font-mono bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-zinc-800"
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setExpectedOtp('');
                  }}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl py-2 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-xs font-black transition shadow-md"
                >
                  Confirm OTP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Callback Request Modal */}
      {phoneHubOpen && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative border border-zinc-100 flex flex-col">
            
            <button
              onClick={() => setPhoneHubOpen(false)}
              className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition"
            >
              <Icons.X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100">
                <Icons.PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 leading-none">Support Desk Hub</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Live callback & SMS inquiry request</p>
              </div>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="Enter your name"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Mobile Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. +91 99999 88888"
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Request Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPhoneType('callback')}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      phoneType === 'callback'
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Icons.Phone className="w-3.5 h-3.5" /> Call Me Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneType('sms')}
                    className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      phoneType === 'sms'
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Icons.MessageSquare className="w-3.5 h-3.5" /> SMS Inquiry
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Your Question / Inquiry</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Need help with laptop stock / discount code..."
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2 rounded-xl text-xs transition shadow-md shadow-teal-600/10 flex items-center justify-center gap-1.5 mt-2"
              >
                <Icons.Sparkles className="w-3.5 h-3.5" />
                {isVerifyingOtp ? 'Sending code...' : 'Verify Phone & Submit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Trustpilot Reviews Submission & List Overlay */}
      {writeReviewOpen && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl relative border border-zinc-100 flex flex-col max-h-[85%]">
            
            <button
              onClick={() => setWriteReviewOpen(false)}
              className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition"
            >
              <Icons.X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                ★ Trustpilot
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 leading-none">Shopper Reviews</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Authentic 2-way verified reviews</p>
              </div>
            </div>

            {/* List of current reviews (scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1 max-h-[220px]">
              {reviews.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">No shopper reviews yet. Be the first to share your experience!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-zinc-800">{rev.customerName}</span>
                      <span className="text-zinc-400">{new Date(rev.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1 rounded">Verified</span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-snug">{rev.comment}</p>
                    
                    {/* Admin/Seller Reply inline */}
                    {rev.sellerReply ? (
                      <div className="mt-2 p-2 bg-teal-50/70 border border-teal-100 rounded-lg text-[10px] space-y-0.5">
                        <p className="font-bold text-teal-800 flex items-center gap-1">
                          <Icons.Shield className="w-3 h-3 text-teal-600" /> VoltMart Admin Response:
                        </p>
                        <p className="text-zinc-600 italic leading-snug">"{rev.sellerReply}"</p>
                      </div>
                    ) : (
                      <span className="text-[9px] text-zinc-400 italic block">Pending Admin verification review</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Submit Review form */}
            <form onSubmit={handleAddReview} className="border-t border-zinc-100 pt-3 mt-2 space-y-2">
              <h4 className="text-xs font-bold text-zinc-700">Write an Excellent Review:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Your Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Suhail Khan"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Rating Rating</label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Your Experience Comment</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Unbelievably fast checkout, highly recommend the prompt delivery!"
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 rounded-xl text-xs transition shadow-md"
              >
                Publish Verified Review ★
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Back in stock Notification registration overlay */}
      {outOfStockProduct && (
        <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative border border-zinc-100 flex flex-col">
            
            <button
              onClick={() => setOutOfStockProduct(null)}
              className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 hover:bg-zinc-200 p-1.5 rounded-full transition"
            >
              <Icons.X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <Icons.BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 leading-none">Restock Portal Alert</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Get notified via SMS immediately!</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl mb-3 flex items-center gap-2.5">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {outOfStockProduct.imageUrl ? (
                  <img src={outOfStockProduct.imageUrl} alt={outOfStockProduct.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${outOfStockProduct.imageColor}`} />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-800 truncate leading-tight">{outOfStockProduct.name}</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Restocking expected in 3 days</p>
              </div>
            </div>

            <form onSubmit={handleNotifySubmit} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="Enter your name"
                  value={notifyName}
                  onChange={(e) => setNotifyName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">SMS Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="+91 99999 77777"
                  value={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-800 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2 rounded-xl text-xs transition shadow-md"
              >
                Submit Restock Alert Request
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
