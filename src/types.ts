export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  original_price: number;
  stock: number;
  rating: number;
  review_count: number;
  is_flash_sale: boolean;
  is_trending: boolean;
  is_featured: boolean;
  imageColor: string; // Tailwind gradient classes, e.g. "from-teal-500 to-emerald-600"
  iconName: string; // Lucide icon identifier
  imageUrl: string; // Real Unsplash product image URL
  views: number;
  wishlistCount: number;
  cartCount: number;
  salesCount: number;
  revenueGenerated: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  couponUsed?: string;
  status: 'waiting' | 'packed' | 'shipped' | 'delivered';
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  totalSpent: number;
  totalOrders: number;
  joinDate: string;
}

export interface ActivityLog {
  id: string;
  type: 'view' | 'cart_add' | 'cart_remove' | 'wishlist_add' | 'wishlist_remove' | 'coupon_apply' | 'checkout_start' | 'checkout_success';
  message: string;
  timestamp: string;
  productName?: string;
  customerName: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  isActive: boolean;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  colorGradient: string;
  productId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppSettings {
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  tollFreeNumber: string;
}

export interface StoreState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  activityLogs: ActivityLog[];
  coupons: Coupon[];
  banners: HeroBanner[];
}
