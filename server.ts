import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { Product, Order, Customer, ActivityLog, Coupon, HeroBanner } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory DB
let products: Product[] = [];
let orders: Order[] = [];
let customers: Customer[] = [];
let activityLogs: ActivityLog[] = [];
let coupons: Coupon[] = [];
let banners: HeroBanner[] = [];
let settings = {
  deliveryTimeMin: 15,
  deliveryTimeMax: 30,
  tollFreeNumber: '1800-419-0909'
};

let trustpilotReviews: any[] = [
  { id: 'rev-1', customerName: 'Aarav Sharma', rating: 5, comment: 'Incredible speed! Received my MacBook Clone in under 3 hours in Mumbai. Highly recommended!', reply: 'Thank you Aarav! We try our best to keep deliveries blazing fast.', timestamp: '2026-07-16T12:00:00Z' },
  { id: 'rev-2', customerName: 'Ananya Iyer', rating: 4, comment: 'Great prices on the Galaxy Ultra. Customer support was helpful on the phone line.', reply: '', timestamp: '2026-07-17T15:20:00Z' },
  { id: 'rev-3', customerName: 'Vikram Singh', rating: 5, comment: 'VoltMart is my go-to electronics hub. Verified authentic products and easy checkout.', reply: 'We appreciate the trust Vikram! Enjoy your OLED TV.', timestamp: '2026-07-18T08:10:00Z' }
];

let communications: any[] = [
  { id: 'comm-1', type: 'callback', customerName: 'Rohan Patel', phone: '+91 98765 43210', status: 'pending', query: 'Need help choosing gaming mechanical keyboard', notes: '', timestamp: '2026-07-18T08:30:00Z' },
  { id: 'comm-2', type: 'sms', customerName: 'Meera Nair', phone: '+91 99887 76655', status: 'resolved', query: 'When will Epson projector restock?', notes: 'Sent restock notification. Customer confirmed.', timestamp: '2026-07-18T06:15:00Z' }
];

// Seed functions
function seedDatabase() {
  const CATEGORIES_DATA = [
    { name: 'Laptops', icon: 'Laptop', color: 'from-blue-600 to-indigo-700', brands: ['Dell', 'Apple', 'HP', 'Lenovo', 'ASUS'], items: ['UltraBook Pro', 'Creator Edition', 'SlimBook Air', 'Gamer Elite', 'Yoga Flex', 'MacBook Pro Clone', 'Inspiron Extreme', 'Pavilion Studio', 'ThinkPad Titan', 'ZenBook Dual'] },
    { name: 'Smartphones', icon: 'Smartphone', color: 'from-cyan-500 to-blue-600', brands: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Google'], items: ['Galaxy Ultra', 'iPhone Premium', 'Nordic Pro', 'Mi Note Prime', 'Pixel Clear', 'A10 Speed', 'X90 Pro', 'Fold Vision', 'Apex Zoom', 'Smart Lite'] },
    { name: 'Audio Devices', icon: 'Headphones', color: 'from-violet-500 to-purple-600', brands: ['Sony', 'Bose', 'Sennheiser', 'JBL', 'Boat'], items: ['NoiseCanceler X', 'QuietComfort Duo', 'Studio Beats', 'BassBoom Speaker', 'Buds Pro Active', 'PodStream Pro', 'CinemaSound Bar', 'Acoustic Pure', 'Stage Monitor', 'Rocker Pods'] },
    { name: 'Television & Video', icon: 'Tv', color: 'from-rose-500 to-red-600', brands: ['Samsung', 'LG', 'Sony', 'OnePlus', 'TCL'], items: ['OLED Quantum', 'Cinema 4K TV', 'Smart Home Theater', 'NanoCell Pro', 'Curved Display', 'Acoustic OLED', 'Ultra Crystal LED', 'MiniLED Max', 'Slim Horizon TV', 'AirPlay Screen'] },
    { name: 'Smart Appliances', icon: 'Flame', color: 'from-amber-500 to-orange-600', brands: ['Dyson', 'Philips', 'LG', 'Panasonic', 'Xiaomi'], items: ['AeroPurifier Max', 'Smart AirFryer', 'Robot Vacuum Lite', 'Instant Induction Cooktop', 'AirMoist Humidifier', 'SteamPress Iron', 'MicroWave Digital', 'Blender Blitz Pro', 'Smart Refrigerator', 'Dishwasher Pro'] },
    { name: 'Wearable Tech', icon: 'Watch', color: 'from-emerald-500 to-teal-600', brands: ['Apple', 'Samsung', 'Fitbit', 'Garmin', 'Noise'], items: ['Pulse Watch 5', 'Fitness Band Pro', 'Sport Run Tracker', 'Sleep Ring 2', 'Altitude Watch Max', 'Cardio Tracker', 'Active Band S', 'Rugged Watch Trail', 'Classic Dial Smart', 'Health Guard'] },
    { name: 'Gaming & Gear', icon: 'Gamepad2', color: 'from-fuchsia-600 to-pink-700', brands: ['Razer', 'Logitech', 'Corsair', 'ASUS', 'Sony'], items: ['Apex Keyboard Mechanical', 'Lightspeed Pro Mouse', 'DualShock controller', 'RGB GamePad Extra', 'Virtual VR Headset', 'RGB Desk Mat', 'Surround Headset G', 'Stream Deck Pro', 'Gamer Chair Max', 'Custom Flight Yoke'] },
    { name: 'Cameras & Optics', icon: 'Camera', color: 'from-zinc-700 to-slate-900', brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'GoPro'], items: ['Shutter Mirrorless Pro', 'Action Cam 4K Waterproof', 'Vlog Cam Starter', 'Cinema Lens Kit', 'Alpha Prime Focus', 'Telescopic Zoom Lens', 'Retro PointShoot', 'Pocket Gimbal Stabilizer', 'Drone Air Cam', 'Macro Lens HD'] },
    { name: 'Data Storage', icon: 'HardDrive', color: 'from-sky-500 to-blue-600', brands: ['Seagate', 'Western Digital', 'SanDisk', 'Samsung', 'Crucial'], items: ['Portable SSD 2TB', 'Ultra Speed USB-C 128GB', 'Desktop Expansion 8TB', 'Extreme MicroSD 256GB', 'Internal PCIe SSD 1TB', 'NAS Network Drive 4TB', 'Cloud Backup Server', 'Dual Drive OTG', 'Pro Rugged Disk', 'SATA SSD Storage'] },
    { name: 'Power & Cables', icon: 'Zap', color: 'from-lime-500 to-green-600', brands: ['Anker', 'Belkin', 'Spigen', 'Portronics', 'Mi'], prefix: 'Volt', items: ['PowerBank 20000mAh', 'Multi Charging Dock', 'Nylon Braided USB-C Cable', 'Wireless Fast Charger Pad', 'GaN Wall Charger 65W', 'Car Fast Charger', 'Power Strip Surge Protector', 'Magnetic Power Pod', 'Heavy Duty Travel Adapter', 'Solar Charger Panel'] },
    { name: 'Monitors & Displays', icon: 'Monitor', color: 'from-indigo-500 to-purple-600', brands: ['Dell', 'LG', 'BenQ', 'Samsung', 'Acer'], items: ['Horizon UltraWide 34"', 'Gaming Display 144Hz', 'Designer 4K Monitor', 'Curved Vision 27"', 'USB-C Portable Display', 'Ergonomic Desk Monitor', 'EyeCare Office LCD', 'Slim Bezel Monitor', 'Double Screen Stand', 'Professional Color Screen'] },
    { name: 'Networking & Wifi', icon: 'Wifi', color: 'from-teal-600 to-cyan-600', brands: ['TP-Link', 'Netgear', 'Asus', 'D-Link', 'Linksys'], items: ['Link WiFi 6 Router', 'Whole Home Mesh Kit', 'High Gain Range Extender', 'Gigabit Network Switch', 'Wireless USB Adapter', '4G LTE Travel Router', 'Outdoor Access Point', 'Smart Home Hub', 'PoE Injector Core', 'Fiber Moden Router'] },
    { name: 'Smart Home Security', icon: 'Shield', color: 'from-yellow-500 to-amber-600', brands: ['Ring', 'Arlo', 'Eufy', 'Mi', 'TP-Link'], items: ['Sentry Security Camera', 'Video Doorbell WiFi', 'Smart Fingerprint Doorlock', 'Window Motion Sensor', 'Floodlight Smart Camera', 'Indoor Baby Monitor', 'Smoke Detector Link', 'Siren alarm Smart', 'Smart Safe Box', 'Main Hub Controller'] },
    { name: 'PC Components', icon: 'Cpu', color: 'from-red-600 to-orange-600', brands: ['Intel', 'AMD', 'NVIDIA', 'Corsair', 'ASUS'], items: ['Core Processor 8-Core', 'Graphics Card RTX Prime', 'DDR5 RGB Desktop RAM 32GB', 'AIO Liquid Cooler 240mm', 'Titanium Modular PSU 850W', 'Gaming MidTower Case', 'Motherboard Elite Wifi', 'NVMe Heatsink Cooler', 'Case Fan RGB 3-Pack', 'GPU Vertical Mount'] },
    { name: 'Printers & Scanners', icon: 'Printer', color: 'from-stone-500 to-neutral-700', brands: ['HP', 'Canon', 'Epson', 'Brother', 'Xerox'], items: ['Jet InkTank Printer', 'Laser Scanner All-in-One', 'Wireless Photo Printer', 'Label Maker Professional', 'Flatbed Doc Scanner', 'Portable Pocket Printer', '3D Creator Printer', 'Continuous Ink Jet', 'Thermal Receipt Printer', 'Duplex Auto Scanner'] },
    { name: 'Office Electronics', icon: 'Briefcase', color: 'from-blue-400 to-teal-500', brands: ['Epson', 'BenQ', 'Casio', 'Honeywell', 'Fellowes'], items: ['Office Projector 1080p', 'Scientific Calculator Max', 'Digital Voice Dictaphone', 'Paper Shredder Silent', 'Laminating Machine Pro', 'Whiteboard Digital Pen', 'Electronic Dictionary', 'Time Attendance puncher', 'Currency Counter Prime', 'Air Scent Dispenser'] }
  ];

  const CATEGORY_IMAGES: { [key: string]: string[] } = {
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

  let idCounter = 1;

  // We want to generate exactly 320 products across 16 categories.
  CATEGORIES_DATA.forEach((cat, catIdx) => {
    const itemCount = 20;

    // Prices scale
    let basePrice = 0;
    switch (cat.name) {
      case 'Laptops': basePrice = 35000; break;
      case 'Smartphones': basePrice = 12000; break;
      case 'Audio Devices': basePrice = 1500; break;
      case 'Television & Video': basePrice = 18000; break;
      case 'Smart Appliances': basePrice = 3000; break;
      case 'Wearable Tech': basePrice = 2000; break;
      case 'Gaming & Gear': basePrice = 1000; break;
      case 'Cameras & Optics': basePrice = 15000; break;
      case 'Data Storage': basePrice = 800; break;
      case 'Power & Cables': basePrice = 499; break;
      case 'Monitors & Displays': basePrice = 7000; break;
      case 'Networking & Wifi': basePrice = 1200; break;
      case 'Smart Home Security': basePrice = 1800; break;
      case 'PC Components': basePrice = 4000; break;
      case 'Printers & Scanners': basePrice = 4500; break;
      case 'Office Electronics': basePrice = 2500; break;
      default: basePrice = 2000;
    }

    for (let i = 0; i < itemCount; i++) {
      const brand = cat.brands[i % cat.brands.length];
      const itemName = cat.items[i % cat.items.length];
      
      // Build unique names
      const specVariants = [
        '(Standard Edition)',
        'V2',
        'Max Pro',
        'Plus',
        'Slim Ultra',
        '(Value Edition)',
        'Sport',
        'Elite Series',
        'Studio Edition',
        'Carbon Black',
        'Platinum Limited',
        'Creator Pack',
        'Gen 3'
      ];
      
      const pName = `${brand} ${itemName} ${specVariants[i % specVariants.length]}`;
      const scaleMultiplier = 1 + (i * 0.12);
      const price = Math.round((basePrice * scaleMultiplier) / 10) * 10;
      const discountPercent = 10 + (idCounter % 5) * 5; // 10%, 15%, 20%, 25%, 30%
      const original_price = Math.round((price * (1 + (discountPercent / 100))) / 10) * 10;
      
      // Create interesting stock and reviews
      let stock = Math.floor(Math.random() * 45) + 5; // 5 to 50
      if (idCounter % 15 === 0) stock = 0; // some out of stock
      else if (idCounter % 9 === 0) stock = Math.floor(Math.random() * 4) + 1; // some low stock
      
      const rating = parseFloat((4.0 + (idCounter % 10) * 0.1).toFixed(1)); // 4.0 to 4.9
      const review_count = 15 + (idCounter % 15) * 65; // 15 to 1000

      const is_flash_sale = idCounter % 18 === 0;
      const is_trending = rating >= 4.5 && review_count > 500;
      const is_featured = idCounter % 12 === 0;

      // Seed views/sales metrics
      const views = review_count * 5 + Math.floor(Math.random() * 150);
      const wishlistCount = Math.floor(review_count * 0.4);
      const cartCount = Math.floor(review_count * 0.15);
      const salesCount = Math.floor(review_count * 0.8) + Math.floor(Math.random() * 20);
      const revenueGenerated = salesCount * price;

      const catImages = CATEGORY_IMAGES[cat.name] || ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'];
      const imageUrl = catImages[i % catImages.length];

      products.push({
        id: `prod-${idCounter}`,
        name: pName,
        brand,
        category: cat.name,
        price,
        original_price,
        stock,
        rating,
        review_count,
        is_flash_sale,
        is_trending,
        is_featured,
        imageColor: cat.color,
        iconName: cat.icon,
        imageUrl,
        views,
        wishlistCount,
        cartCount,
        salesCount,
        revenueGenerated
      });

      idCounter++;
    }
  });

  // Seed standard coupons
  coupons = [
    { code: 'FIRST10', type: 'percentage', value: 10, description: '10% off for first-time shoppers!', isActive: true },
    { code: 'VOLT20', type: 'percentage', value: 20, description: '20% off on premium orders above ₹5,000!', isActive: true },
    { code: 'SUPER500', type: 'fixed', value: 500, description: 'Flat ₹500 off on total checkout value!', isActive: true },
    { code: 'FLASH30', type: 'percentage', value: 30, description: 'Flash-sale special 30% discount!', isActive: true }
  ];

  // Seed standard hero banners
  banners = [
    {
      id: 'banner-1',
      title: 'Upgrade to Next-Gen Computing',
      subtitle: 'Grab top Intel/M3 laptops at up to 30% off. High performance, zero lag.',
      buttonText: 'Explore Laptops',
      colorGradient: 'from-teal-600 to-cyan-700',
      productId: 'prod-1' // first laptop
    },
    {
      id: 'banner-2',
      title: 'Monstrous Flash Sale! ⚡',
      subtitle: 'Limited stock flash-sale devices. Lowest prices guaranteed on TVs and Wearables.',
      buttonText: 'Check Deals',
      colorGradient: 'from-orange-500 to-rose-600',
      productId: 'prod-18' // some smartphone or TV
    },
    {
      id: 'banner-3',
      title: 'Immersive Soundscape Experience',
      subtitle: 'Experience noise-cancellation with Sony & Bose acoustics. Flat discounts inside.',
      buttonText: 'Shop Audio',
      colorGradient: 'from-purple-600 to-indigo-700',
      productId: 'prod-27' // an audio device
    }
  ];

  // Seed default customers
  customers = [
    { id: 'cust-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', avatarColor: 'bg-emerald-500', totalSpent: 92500, totalOrders: 3, joinDate: '2026-02-15' },
    { id: 'cust-2', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', avatarColor: 'bg-rose-500', totalSpent: 124000, totalOrders: 5, joinDate: '2026-03-01' },
    { id: 'cust-3', name: 'Rohan Patel', email: 'rohan.patel@example.com', avatarColor: 'bg-indigo-500', totalSpent: 42000, totalOrders: 2, joinDate: '2026-04-10' },
    { id: 'cust-4', name: 'Meera Deshmukh', email: 'meera.d@example.com', avatarColor: 'bg-amber-500', totalSpent: 18500, totalOrders: 1, joinDate: '2026-05-22' },
    { id: 'cust-5', name: 'Vikram Singh', email: 'vikram.s@example.com', avatarColor: 'bg-teal-500', totalSpent: 312000, totalOrders: 9, joinDate: '2026-01-10' }
  ];

  // Seed initial orders
  orders = [
    {
      id: 'ord-1001',
      customerId: 'cust-1',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.com',
      items: [
        { id: 'item-1', productId: 'prod-1', productName: 'Dell UltraBook Pro (Standard Edition)', price: 35000, quantity: 1 },
        { id: 'item-2', productId: 'prod-27', productName: 'Sony NoiseCanceler X (Standard Edition)', price: 1500, quantity: 2 }
      ],
      subtotal: 38000,
      discount: 3800,
      couponUsed: 'FIRST10',
      total: 34200,
      status: 'delivered',
      timestamp: '2026-07-15T14:22:00-07:00'
    },
    {
      id: 'ord-1002',
      customerId: 'cust-2',
      customerName: 'Ananya Iyer',
      customerEmail: 'ananya.iyer@example.com',
      items: [
        { id: 'item-3', productId: 'prod-14', productName: 'Apple Galaxy Ultra (Standard Edition)', price: 12000, quantity: 1 }
      ],
      subtotal: 12000,
      discount: 2400,
      couponUsed: 'VOLT20',
      total: 9600,
      status: 'shipped',
      timestamp: '2026-07-17T09:15:00-07:00'
    },
    {
      id: 'ord-1003',
      customerId: 'cust-5',
      customerName: 'Vikram Singh',
      customerEmail: 'vikram.s@example.com',
      items: [
        { id: 'item-4', productId: 'prod-40', productName: 'Samsung OLED Quantum (Standard Edition)', price: 18000, quantity: 2 }
      ],
      subtotal: 36000,
      discount: 500,
      couponUsed: 'SUPER500',
      total: 35500,
      status: 'packed',
      timestamp: '2026-07-18T05:30:00-07:00'
    }
  ];

  // Seed default activities
  activityLogs = [
    { id: 'act-1', type: 'view', message: 'A customer in Mumbai viewed Dell UltraBook Pro', timestamp: '2026-07-18T07:30:23-07:00', productName: 'Dell UltraBook Pro (Standard Edition)', customerName: 'Guest Shopper' },
    { id: 'act-2', type: 'cart_add', message: 'Rohan Patel added Apple iPhone Premium to their cart', timestamp: '2026-07-18T07:35:10-07:00', productName: 'Apple iPhone Premium V2', customerName: 'Rohan Patel' },
    { id: 'act-3', type: 'wishlist_add', message: 'A customer in Delhi wishlisted GoPro Action Cam 4K Waterproof', timestamp: '2026-07-18T07:42:00-07:00', productName: 'GoPro Action Cam 4K Waterproof V2', customerName: 'Guest Shopper' },
    { id: 'act-4', type: 'checkout_success', message: 'Vikram Singh successfully ordered 2x Samsung OLED Quantum (Total: ₹35,500)', timestamp: '2026-07-18T07:50:11-07:00', customerName: 'Vikram Singh' }
  ];
}

// Perform initial seed
seedDatabase();

// --- API ROUTES ---

// Products Endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const categoryProducts = products.filter(p => p.category === req.body.category);
  const fallbackImageUrl = categoryProducts.length > 0 
    ? categoryProducts[Math.floor(Math.random() * categoryProducts.length)].imageUrl
    : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';

  const newProd: Product = {
    ...req.body,
    imageUrl: req.body.imageUrl || fallbackImageUrl,
    id: `prod-${products.length + 1}`,
    views: 0,
    wishlistCount: 0,
    cartCount: 0,
    salesCount: 0,
    revenueGenerated: 0
  };
  products.push(newProd);
  
  // Log activity
  const log: ActivityLog = {
    id: `act-${Date.now()}`,
    type: 'cart_add', // general placeholder, but we log product addition
    message: `Admin added a new product: ${newProd.name} (Category: ${newProd.category})`,
    timestamp: new Date().toISOString(),
    productName: newProd.name,
    customerName: 'Admin (System)'
  };
  activityLogs.unshift(log);

  res.status(201).json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...req.body };
    res.json(products[idx]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const deleted = products.splice(idx, 1)[0];
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Orders Endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, items, total, subtotal, discount, couponUsed } = req.body;
  
  // Create or find customer
  let cust = customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
  if (!cust) {
    cust = {
      id: `cust-${customers.length + 1}`,
      name: customerName,
      email: customerEmail,
      avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'][customers.length % 5],
      totalSpent: 0,
      totalOrders: 0,
      joinDate: new Date().toISOString().split('T')[0]
    };
    customers.push(cust);
  }

  // Deduct stocks and record metrics
  items.forEach((item: any) => {
    const pIdx = products.findIndex(p => p.id === item.productId);
    if (pIdx !== -1) {
      products[pIdx].stock = Math.max(0, products[pIdx].stock - item.quantity);
      products[pIdx].salesCount += item.quantity;
      products[pIdx].revenueGenerated += item.price * item.quantity;
    }
  });

  const newOrder: Order = {
    id: `ord-${1000 + orders.length + 1}`,
    customerId: cust.id,
    customerName,
    customerEmail,
    items,
    total,
    subtotal,
    discount,
    couponUsed,
    status: 'waiting',
    timestamp: new Date().toISOString()
  };

  orders.unshift(newOrder);

  // Update customer summary
  cust.totalSpent += total;
  cust.totalOrders += 1;

  // Log activity
  const activity: ActivityLog = {
    id: `act-${Date.now()}`,
    type: 'checkout_success',
    message: `${customerName} placed order #${newOrder.id} for ${items.length} items (Total: ₹${total.toLocaleString()})`,
    timestamp: new Date().toISOString(),
    customerName
  };
  activityLogs.unshift(activity);

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const oIdx = orders.findIndex(o => o.id === id);
  if (oIdx !== -1) {
    orders[oIdx].status = status;
    
    // Log activity
    const activity: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'checkout_start', // place holder
      message: `Order #${id} status updated to ${status.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      customerName: 'Admin (System)'
    };
    activityLogs.unshift(activity);

    res.json(orders[oIdx]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Activity logs
app.get('/api/activity', (req, res) => {
  res.json(activityLogs);
});

app.post('/api/activity', (req, res) => {
  const { type, message, productName, customerName } = req.body;
  
  // Track metrics increments
  if (productName) {
    const pIdx = products.findIndex(p => p.name === productName);
    if (pIdx !== -1) {
      if (type === 'view') products[pIdx].views += 1;
      if (type === 'cart_add') products[pIdx].cartCount += 1;
      if (type === 'wishlist_add') products[pIdx].wishlistCount += 1;
    }
  }

  const newLog: ActivityLog = {
    id: `act-${Date.now()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    productName,
    customerName: customerName || 'Guest Shopper'
  };
  activityLogs.unshift(newLog);
  if (activityLogs.length > 100) activityLogs.pop(); // keep log size reasonable

  res.status(201).json(newLog);
});

// Customers list
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

// Coupons
app.get('/api/coupons', (req, res) => {
  res.json(coupons);
});

app.post('/api/coupons', (req, res) => {
  const { code, type, value, description } = req.body;
  const newCoupon: Coupon = {
    code: code.toUpperCase(),
    type,
    value,
    description,
    isActive: true
  };
  coupons.push(newCoupon);
  res.status(201).json(newCoupon);
});

app.put('/api/coupons/:code', (req, res) => {
  const { code } = req.params;
  const { isActive } = req.body;
  const idx = coupons.findIndex(c => c.code === code.toUpperCase());
  if (idx !== -1) {
    coupons[idx].isActive = isActive;
    res.json(coupons[idx]);
  } else {
    res.status(404).json({ error: 'Coupon not found' });
  }
});

// Banners
app.get('/api/banners', (req, res) => {
  res.json(banners);
});

app.post('/api/banners', (req, res) => {
  const newBanner: HeroBanner = {
    id: `banner-${banners.length + 1}`,
    ...req.body
  };
  banners.push(newBanner);
  res.status(201).json(newBanner);
});

app.delete('/api/banners/:id', (req, res) => {
  const { id } = req.params;
  const idx = banners.findIndex(b => b.id === id);
  if (idx !== -1) {
    const deleted = banners.splice(idx, 1)[0];
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Banner not found' });
  }
});

// App settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { deliveryTimeMin, deliveryTimeMax, tollFreeNumber } = req.body;
  if (typeof deliveryTimeMin === 'number') settings.deliveryTimeMin = deliveryTimeMin;
  if (typeof deliveryTimeMax === 'number') settings.deliveryTimeMax = deliveryTimeMax;
  if (tollFreeNumber !== undefined) settings.tollFreeNumber = tollFreeNumber;

  // Log activity
  const log: ActivityLog = {
    id: `act-${Date.now()}`,
    type: 'checkout_start',
    message: `Admin updated store commitments: Delivery ${settings.deliveryTimeMin}-${settings.deliveryTimeMax} mins | Support Helpline: ${settings.tollFreeNumber}`,
    timestamp: new Date().toISOString(),
    customerName: 'Admin (System)'
  };
  activityLogs.unshift(log);

  res.json(settings);
});

// --- TRUSTPILOT REVIEWS (2-WAY) ENDPOINTS ---

app.get('/api/reviews', (req, res) => {
  res.json(trustpilotReviews);
});

app.post('/api/reviews', (req, res) => {
  const { customerName, rating, comment } = req.body;
  const newReview = {
    id: `rev-${Date.now()}`,
    customerName: customerName || 'Anonymous Reviewer',
    rating: Number(rating) || 5,
    comment: comment || '',
    reply: '',
    timestamp: new Date().toISOString()
  };
  trustpilotReviews.unshift(newReview);

  // Log to activities
  const log: ActivityLog = {
    id: `act-${Date.now()}`,
    type: 'wishlist_add',
    message: `⭐️ [Trustpilot] ${newReview.customerName} left a ${newReview.rating}-star review: "${newReview.comment.substring(0, 40)}${newReview.comment.length > 40 ? '...' : ''}"`,
    timestamp: new Date().toISOString(),
    customerName: newReview.customerName
  };
  activityLogs.unshift(log);

  res.status(201).json(newReview);
});

app.post('/api/reviews/:id/reply', (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  const idx = trustpilotReviews.findIndex(r => r.id === id);
  if (idx !== -1) {
    trustpilotReviews[idx].reply = reply || '';
    
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'checkout_start',
      message: `✍️ Admin replied to Trustpilot review by ${trustpilotReviews[idx].customerName}: "${reply}"`,
      timestamp: new Date().toISOString(),
      customerName: 'Admin (System)'
    };
    activityLogs.unshift(log);

    res.json(trustpilotReviews[idx]);
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

// --- PHONE & SMS COMMUNICATIONS (2-WAY & SMS TPA) ENDPOINTS ---

app.get('/api/communications', (req, res) => {
  res.json(communications);
});

app.post('/api/communications', (req, res) => {
  const { type, customerName, phone, query } = req.body;
  const newComm = {
    id: `comm-${Date.now()}`,
    type: type || 'callback',
    customerName: customerName || 'Valued Shopper',
    phone: phone || '',
    status: 'pending',
    query: query || '',
    notes: '',
    timestamp: new Date().toISOString()
  };
  communications.unshift(newComm);

  // Log callback / SMS inquiry to system
  const actionLabel = type === 'callback' ? 'Requested Callback' : 'Sent SMS Inquiry';
  const log: ActivityLog = {
    id: `act-${Date.now()}`,
    type: type === 'callback' ? 'view' : 'cart_add',
    message: `📞 [Support Hub] ${newComm.customerName} (${newComm.phone}) ${actionLabel}: "${newComm.query.substring(0, 40)}"`,
    timestamp: new Date().toISOString(),
    customerName: newComm.customerName
  };
  activityLogs.unshift(log);

  res.status(201).json(newComm);
});

app.put('/api/communications/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const idx = communications.findIndex(c => c.id === id);
  if (idx !== -1) {
    if (status) communications[idx].status = status;
    if (notes !== undefined) communications[idx].notes = notes;

    // Log update
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      type: 'checkout_start',
      message: `🔧 Support Hub: Ticket ${id} updated to status [${communications[idx].status}] with notes: "${notes || 'No notes'}"`,
      timestamp: new Date().toISOString(),
      customerName: 'Admin (System)'
    };
    activityLogs.unshift(log);

    res.json(communications[idx]);
  } else {
    res.status(404).json({ error: 'Ticket not found' });
  }
});

// Simulated SMS Third Party API Gateway (TPA) Dispatch
app.post('/api/communications/send-otp', (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000); // 4 digit OTP
  const trackingId = `tpa-sms-${Date.now().toString().slice(-6)}`;
  
  // Real-time dispatch payload logged to terminal activity
  const log: ActivityLog = {
    id: `act-${Date.now()}`,
    type: 'cart_add',
    message: `📲 [SMS TPA Gateway] Outbound SMS dispatched to ${phone} (Payload: OTP is ${otp}, Gateway Ref: ${trackingId})`,
    timestamp: new Date().toISOString(),
    customerName: 'TPA Gateway (SMS)'
  };
  activityLogs.unshift(log);

  res.json({
    success: true,
    trackingId,
    otp,
    message: 'SMS OTP successfully broadcasted via TPA SMS Carrier.'
  });
});

// --- CHATBOT WITH GEMINI API (GROUNDED IN LIVE STATE) ---

app.post('/api/chatbot', async (req, res) => {
  const { message, chatHistory } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ response: "Hello! I'm VoltBot. Note: The Gemini API Key is not configured in the secrets yet. Please configure GEMINI_API_KEY to enable full natural language responses!" });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Generate compact product catalog for grounding
    const compactCatalog = products.map(p => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: `₹${p.price}`,
      original: `₹${p.original_price}`,
      stock: p.stock,
      flashSale: p.is_flash_sale ? 'Yes' : 'No',
      rating: p.rating
    }));

    // Generate active orders context
    const recentOrders = orders.slice(0, 5).map(o => ({
      id: o.id,
      customer: o.customerName,
      items: o.items.map(it => `${it.quantity}x ${it.productName}`).join(', '),
      total: `₹${o.total}`,
      status: o.status,
      date: o.timestamp
    }));

    // Active Coupons
    const activeCoupons = coupons.filter(c => c.isActive).map(c => `${c.code}: ${c.description}`);

    const systemInstruction = `
You are VoltBot, the intelligent and helpful AI shopping assistant for "VoltMart" - an electronics e-commerce store.
Your goal is to guide shoppers, answer product questions, check live stock/prices, review delivery and returns policy, and lookup mock order details.

VoltMart Core Information & Rules:
1. DELIVERY POLICY:
   - Free shipping on orders over ₹999.
   - For orders below ₹999, a flat shipping fee of ₹99 is applied.
   - Delivery standard is 2-4 business days. Express delivery is available for ₹149.
2. RETURN & REFUND POLICY:
   - Free returns or replacements within 14 days of delivery.
   - Items must be in original packaging and in working condition.
3. COUPON CODES (Share these with customers if they ask for deals!):
   ${activeCoupons.join('\n   ')}
4. BULK DISCOUNTS:
   - Buy 10-19 units of any product to receive an automatic 5% volume discount.
   - Buy 20+ units of any product to receive an automatic 10% volume discount.

LIVE CATALOG GROUNDING:
Here is the complete current list of products in the store with prices, brands, and real-time stock levels. If a customer asks about a product, you MUST check this list first. If stock is 0, explicitly warn them that it is currently out of stock.
${JSON.stringify(compactCatalog.slice(0, 80))}  // Provide a compact subset of products if too large, but 80 cover the key popular ones. Let's send up to 100 products for complete grounding.
${JSON.stringify(compactCatalog.slice(80, 150))}

LIVE RECENT ORDERS GROUNDING:
Here are the recent orders in the system. If a customer asks about order tracking (e.g. "Where is order #1001?"), read this list:
${JSON.stringify(recentOrders)}

Guidelines:
- Be warm, helpful, and concise. E-commerce bots should not write long essays.
- Address prices and stocks strictly based on the real-time catalog above.
- Never make up products, prices, or orders that are not listed here.
- If asked about a product not in the catalog, politely say we don't carry that exact SKU but offer to recommend an alternative from our existing categories.
`;

    // Map React-style chat messages to Gemini's expected Content format
    // Each history item is: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const contents: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add the final user query
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ response: response.text || "I'm sorry, I couldn't formulate a response right now." });
  } catch (error: any) {
    console.error('Gemini Chatbot Error:', error);
    res.json({ response: `VoltBot Service is currently undergoing quick maintenance. (Details: ${error.message || 'System busy'}). How else can I help you?` });
  }
});

// Server configuration with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
