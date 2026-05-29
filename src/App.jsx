// ============================================================
// DUNE.EG — Premium Egyptian Streetwear Landing Page
// UPGRADED: Cart Persistence, Size Selection, Quick View Modal,
//           Toast Notifications
// Tech: React (Hooks) + Tailwind CSS + Lucide React
// ============================================================
//
// NEW FEATURES SUMMARY:
// 1. cartItems state initialises from localStorage and syncs
//    back on every change via useEffect.
// 2. Cart tracks items by a composite key "id-size" so Size M
//    and Size L of the same product are stored separately.
// 3. Clicking a ProductCard opens a Quick View Modal with full
//    image, info, and size selection.
// 4. Adding to cart (from card OR modal) fires a temporary
//    Toast that auto-dismisses after 3 seconds.

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  User,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  Check,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

// ============================================================
// MOCK DATA
// ============================================================
const mockProducts = [
  {
    id: 1,
    name: "Desert Phantom Tee",
    price: "650 EGP",
    priceNum: 650,
    category: "Oversized Tees",
    tag: "NEW",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80",
  },
  {
    id: 2,
    name: "Cairo Cargo Pant",
    price: "1,200 EGP",
    priceNum: 1200,
    category: "Cargo Pants",
    tag: "BESTSELLER",
    img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
  },
  {
    id: 3,
    name: "Nile Wash Hoodie",
    price: "950 EGP",
    priceNum: 950,
    category: "Hoodies",
    tag: null,
    img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80",
  },
  {
    id: 4,
    name: "Khamsin Oversized Shirt",
    price: "780 EGP",
    priceNum: 780,
    category: "Oversized Tees",
    tag: "LIMITED",
    img: "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
  },
  {
    id: 5,
    name: "Sphinx Cargo Short",
    price: "680 EGP",
    priceNum: 680,
    category: "Cargo Pants",
    tag: "NEW",
    img: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80",
  },
  {
    id: 6,
    name: "Sahara Drop-Shoulder",
    price: "720 EGP",
    priceNum: 720,
    category: "Oversized Tees",
    tag: null,
    img: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
  },
  {
    id: 7,
    name: "Oasis Quarter-Zip",
    price: "1,050 EGP",
    priceNum: 1050,
    category: "Hoodies",
    tag: "BESTSELLER",
    img: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4?w=600&q=80",
  },
  {
    id: 8,
    name: "Mirage Utility Vest",
    price: "890 EGP",
    priceNum: 890,
    category: "Cargo Pants",
    tag: "LIMITED",
    img: "https://images.unsplash.com/photo-1609873814058-a8928924184a?w=600&q=80",
    hoverImg: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80",
  },
];

const instagramPosts = [
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80",
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&q=80",
  "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=400&q=80",
  "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400&q=80",
  "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&q=80",
];

const SIZES = ["S", "M", "L", "XL"];

// ============================================================
// HELPER — safe localStorage read
// ============================================================
// BEGINNER NOTE — localStorage crash guard:
// localStorage.getItem() returns null if the key doesn't exist
// yet (first visit), and JSON.parse(null) returns null which is
// fine. But if the stored string is somehow corrupted, JSON.parse
// throws an error. Wrapping in try/catch means a bad value just
// resets to an empty array instead of crashing the whole app.
function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem("duneeg_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================================
// FEATURE 4 — TOAST NOTIFICATION COMPONENT
// ============================================================
// The Toast is a small pill that appears at the bottom-center
// of the viewport. It receives a `message` string and a
// `visible` boolean from the parent. CSS transitions handle
// the slide-up/fade-in animation.
//
// BEGINNER NOTE — why we animate with opacity + translateY:
// Toggling `display:none` cannot be animated because the
// browser removes the element from the DOM immediately.
// Instead we keep it rendered but change opacity and position,
// which the browser CAN interpolate smoothly.
function Toast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-[#1C1C1C] text-white px-6 py-3 shadow-2xl">
        {/* Green check icon */}
        <span className="w-5 h-5 rounded-full bg-[#555E4E] flex items-center justify-center flex-shrink-0">
          <Check size={11} strokeWidth={3} />
        </span>
        <span className="text-[12px] tracking-[0.15em] uppercase font-medium whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE 3 — QUICK VIEW MODAL
// ============================================================
// The Modal renders on top of everything. It receives:
//   product   — the item being previewed (or null = closed)
//   onClose   — function to clear the product (close the modal)
//   onAddToCart — function from App to add to cart + fire toast
//
// BEGINNER NOTE — Modal overlay pattern:
// We use TWO nested divs:
//   1. The BACKDROP — `fixed inset-0` covers the entire screen.
//      Clicking it closes the modal (onClose). The dark
//      semi-transparent background is achieved with
//      `bg-black/60 backdrop-blur-sm`.
//   2. The PANEL — `relative z-10` sits inside the backdrop
//      and holds the actual content. `e.stopPropagation()` on
//      the panel prevents a click inside it from bubbling up
//      to the backdrop and accidentally closing the modal.
//
// BEGINNER NOTE — `useEffect` for the ESC key:
// We add a keyboard listener when the modal opens (product ≠ null)
// and clean it up when the modal closes or the component unmounts.
// The dependency array [product, onClose] means the effect
// re-runs (and re-registers the listener) only when those values
// change — not on every render.
function QuickViewModal({ product, onClose, onAddToCart }) {
  // Track the user's size selection INSIDE this modal
  const [selectedSize, setSelectedSize] = useState("M");

  // Reset size selection each time a new product opens
  useEffect(() => {
    if (product) setSelectedSize("M");
  }, [product]);

  // Close on ESC key press
  useEffect(() => {
    if (!product) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Cleanup: remove the listener so it doesn't stack up
    return () => window.removeEventListener("keydown", handleKey);
  }, [product, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  // If no product is selected the modal is logically "closed"
  // — we still render the wrapper div so the CSS exit animation
  // plays, but we return null when there's truly nothing to show.
  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, selectedSize);
    onClose();
  };

  return (
    // 1. BACKDROP — covers the whole screen, click to close
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 2. PANEL — actual modal card */}
      <div
        className="relative bg-[#F9F9F6] w-full max-w-3xl lg:max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
        // stopPropagation stops a click here from reaching the
        // backdrop and triggering onClose
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-colors"
        >
          <X size={20} />
        </button>

        {/* LEFT — large product image, square crop */}
        <div className="w-full md:w-1/2 aspect-square bg-[#EDEDE8] flex-shrink-0">
          <img
            src={product.img}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* RIGHT — product details */}
        <div className="flex flex-col justify-center p-8 lg:p-10 gap-6 w-full">
          {/* Tag */}
          {product.tag && (
            <span className="w-fit bg-[#555E4E] text-white text-[9px] tracking-[0.2em] uppercase px-2 py-1 font-bold">
              {product.tag}
            </span>
          )}

          {/* Name + price */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#1C1C1C]/40 mb-1">
              {product.category}
            </p>
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-[#1C1C1C]">
              {product.name}
            </h2>
            <p className="text-xl font-semibold text-[#1C1C1C] mt-2">
              {product.price}
            </p>
          </div>

          {/* Size selector */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#1C1C1C]/50 mb-3">
              Select Size
            </p>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 text-[12px] tracking-[0.1em] uppercase font-bold border transition-all duration-150 ${
                    selectedSize === size
                      // Active size: dark fill
                      ? "bg-[#1C1C1C] text-[#F9F9F6] border-[#1C1C1C]"
                      // Inactive size: outline
                      : "bg-transparent text-[#1C1C1C] border-[#1C1C1C]/30 hover:border-[#1C1C1C]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to cart CTA */}
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-3 bg-[#1C1C1C] text-[#F9F9F6] py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-[#555E4E] transition-colors duration-300 mt-2"
          >
            Add to Cart — Size {selectedSize}
            <ArrowRight size={14} />
          </button>

          <p className="text-[11px] text-[#1C1C1C]/30 tracking-wide">
            Free shipping on orders over 1500 EGP
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE 2 — CART DRAWER
// ============================================================
// A slide-in panel from the right showing cart contents.
// Each item is identified by `id + "-" + size` (see addToCart).
function CartDrawer({ cartItems, onClose, onRemove, onUpdateQty, isOpen }) {
  // Total price calculation — strip non-numeric chars from price string
  const total = cartItems.reduce(
    (sum, item) => sum + item.priceNum * item.qty,
    0
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[85] bg-[#F9F9F6] shadow-2xl flex flex-col transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1C1C]/10">
          <div>
            <h2 className="text-[13px] tracking-[0.3em] uppercase font-black text-[#1C1C1C]">
              Your Cart
            </h2>
            <p className="text-[11px] text-[#1C1C1C]/40 tracking-wide mt-0.5">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center pb-20">
              <ShoppingBag size={40} strokeWidth={1} className="text-[#1C1C1C]/20" />
              <p className="text-[12px] tracking-[0.2em] uppercase text-[#1C1C1C]/30">
                Your cart is empty
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartKey} className="flex gap-4">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-20 h-24 object-cover bg-[#EDEDE8] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#1C1C1C] leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#1C1C1C]/40 mt-0.5 tracking-wide">
                    Size: {item.size}
                  </p>
                  <p className="text-[13px] font-bold text-[#1C1C1C] mt-1">
                    {item.price}
                  </p>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => onUpdateQty(item.cartKey, -1)}
                      className="w-6 h-6 border border-[#1C1C1C]/20 flex items-center justify-center hover:border-[#1C1C1C] transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[13px] font-semibold w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.cartKey, 1)}
                      className="w-6 h-6 border border-[#1C1C1C]/20 flex items-center justify-center hover:border-[#1C1C1C] transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                    <button
                      onClick={() => onRemove(item.cartKey)}
                      className="ml-auto text-[#1C1C1C]/30 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with total + checkout */}
        {cartItems.length > 0 && (
          <div className="border-t border-[#1C1C1C]/10 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C]/50">
                Subtotal
              </span>
              <span className="text-[15px] font-black text-[#1C1C1C]">
                {total.toLocaleString()} EGP
              </span>
            </div>
            <button className="w-full bg-[#1C1C1C] text-[#F9F9F6] py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-[#555E4E] transition-colors duration-300">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// 1. TOP ANNOUNCEMENT BAR
// ============================================================
function TopAnnouncementBar() {
  return (
    <div className="bg-[#1C1C1C] text-[#D4C4A8] text-[11px] tracking-[0.2em] uppercase overflow-hidden py-2">
      <div className="whitespace-nowrap inline-block animate-marquee">
        {Array(6)
          .fill("Free Shipping to Cairo & Alex on orders over 1500 EGP  ·  ")
          .join("")}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 28s linear infinite; }
      `}</style>
    </div>
  );
}

// ============================================================
// 2. DESKTOP HEADER
// ============================================================
// Now receives cartCount + onCartOpen as props so the header
// bag icon can open the drawer and show the live item count.
function DesktopHeader({ cartCount, onCartOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = ["Shop", "Collections", "Lookbook", "About"];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-[#F9F9F6]/95 backdrop-blur-md shadow-sm" : "bg-[#F9F9F6]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">

          <a href="#" className="flex-shrink-0">
            <span className="text-2xl lg:text-3xl font-black tracking-[0.25em] text-[#1C1C1C] uppercase">
              DUNE<span className="text-[#D4C4A8]">.</span>EG
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12">
            {navLinks.map((link) => (
              <a key={link} href="#"
                className="text-[11px] tracking-[0.2em] uppercase text-[#1C1C1C] hover:text-[#555E4E] transition-colors duration-200 font-medium"
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="hidden md:block text-[#1C1C1C] hover:text-[#555E4E] transition-colors">
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button className="hidden md:block text-[#1C1C1C] hover:text-[#555E4E] transition-colors">
              <User size={18} strokeWidth={1.5} />
            </button>
            {/* Cart bag icon — shows live item count */}
            <button
              onClick={onCartOpen}
              className="relative text-[#1C1C1C] hover:text-[#555E4E] transition-colors"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {/* Notification badge — only visible when cart has items */}
              {cartCount > 0 ? (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#555E4E] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#555E4E] rounded-full" />
              )}
            </button>
            <button
              className="md:hidden text-[#1C1C1C]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#F9F9F6] border-t border-[#1C1C1C]/10 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a key={link} href="#"
              className="text-[12px] tracking-[0.2em] uppercase text-[#1C1C1C] font-medium"
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

// ============================================================
// 3. WIDESCREEN HERO
// ============================================================
function WidescreenHero() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] bg-[#1C1C1C] overflow-hidden flex items-center">
      <img
        src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&q=90"
        alt="Summer 26 collection"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1C] via-[#1C1C1C]/60 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="text-[#D4C4A8] text-[11px] tracking-[0.35em] uppercase mb-6 font-medium">
            Summer '26 Collection
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black uppercase leading-none tracking-tight text-white mb-6">
            THE<br />SUMMER<br /><span className="text-[#D4C4A8]">'26 DROP</span>
          </h1>
          <p className="text-white/60 text-sm lg:text-base leading-relaxed mb-10 max-w-sm tracking-wide">
            Rooted in the streets of Cairo. Built for the heat of every season.
            New cuts, new silhouettes — available now.
          </p>
          <button className="flex items-center gap-4 bg-[#D4C4A8] text-[#1C1C1C] px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-white transition-colors duration-300 group">
            Shop The Collection
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-white text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-white animate-pulse" />
      </div>
    </section>
  );
}

// ============================================================
// 4. CATEGORY NAV
// ============================================================
function CategoryNav({ activeCategory, setActiveCategory }) {
  const categories = ["All", "Oversized Tees", "Cargo Pants", "Hoodies"];
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="flex items-center justify-center gap-6 lg:gap-10 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[11px] tracking-[0.25em] uppercase font-medium pb-1 transition-all duration-200 ${
              activeCategory === cat
                ? "text-[#1C1C1C] border-b-2 border-[#1C1C1C]"
                : "text-[#1C1C1C]/40 hover:text-[#1C1C1C] border-b-2 border-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 5. PRODUCT CARD
// ============================================================
// Now receives onQuickAdd (quick-add from the hover overlay,
// bypasses modal) and onOpenModal (click card body to open modal).
//
// BEGINNER NOTE — stopping event propagation on the Quick Add btn:
// The card's entire <div> has an onClick that opens the modal.
// The "Quick Add" button is INSIDE that div. Without
// e.stopPropagation(), clicking "Quick Add" would fire BOTH
// the button's handler AND the card's modal-opening handler.
// e.stopPropagation() tells the browser "stop this click event
// from travelling up the DOM tree" so only the button fires.
function ProductCard({ product, onOpenModal, onQuickAdd }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenModal(product)}
    >
      <div className="relative overflow-hidden bg-[#EDEDE8] aspect-[3/4]">
        <img
          src={product.img}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isHovered ? "scale-105 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <img
          src={product.hoverImg}
          alt={`${product.name} alternate view`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        />

        {/* Hover overlay with Quick Add button */}
        {isHovered && (
          <div className="absolute inset-0 bg-[#1C1C1C]/50 flex items-end justify-center pb-6">
            <button
              // stopPropagation so this click doesn't bubble to the
              // card's onClick (which would open the Quick View modal)
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(product, "M");
              }}
              className="bg-[#F9F9F6] text-[#1C1C1C] text-[10px] tracking-[0.25em] uppercase font-bold px-6 py-3 hover:bg-[#D4C4A8] transition-colors duration-200"
            >
              Quick Add — Size M
            </button>
          </div>
        )}

        {product.tag && (
          <span className="absolute top-3 left-3 bg-[#555E4E] text-white text-[9px] tracking-[0.2em] uppercase px-2 py-1 font-bold">
            {product.tag}
          </span>
        )}
      </div>

      <div className="pt-4 pb-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#1C1C1C]/40 mb-1">
          {product.category}
        </p>
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#1C1C1C] tracking-wide">
            {product.name}
          </h3>
          <span className="text-[13px] font-medium text-[#1C1C1C]">
            {product.price}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 5b. PRODUCT GRID
// ============================================================
function ProductGrid({ activeCategory, onOpenModal, onQuickAdd }) {
  const filtered =
    activeCategory === "All"
      ? mockProducts
      : mockProducts.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpenModal={onOpenModal}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
      <div className="flex justify-center mt-14">
        <button className="flex items-center gap-3 border border-[#1C1C1C] text-[#1C1C1C] px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-[#1C1C1C] hover:text-[#F9F9F6] transition-all duration-300">
          Load More
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Combined Shop Section
// ============================================================
function ShopSection({ onOpenModal, onQuickAdd }) {
  const [activeCategory, setActiveCategory] = useState("All");
  return (
    <section id="shop" className="bg-[#F9F9F6]">
      <CategoryNav activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <ProductGrid activeCategory={activeCategory} onOpenModal={onOpenModal} onQuickAdd={onQuickAdd} />
    </section>
  );
}

// ============================================================
// 6. SOCIAL PROOF
// ============================================================
function SocialProof() {
  return (
    <section className="bg-[#1C1C1C] py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[#D4C4A8] text-[10px] tracking-[0.3em] uppercase mb-2">Community</p>
            <h2 className="text-white text-2xl lg:text-3xl font-black uppercase tracking-tight">Wear DUNE.EG</h2>
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-[#D4C4A8] text-[11px] tracking-[0.2em] uppercase hover:text-white transition-colors">
            @dune.eg
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
          {instagramPosts.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden group cursor-pointer">
              <img
                src={src}
                alt={`Community post ${i + 1}`}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 7. WIDE FOOTER
// ============================================================
function WideFooter() {
  const [email, setEmail] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) { alert(`Subscribed: ${email}`); setEmail(""); }
  };

  return (
    <footer className="bg-[#F9F9F6] border-t border-[#1C1C1C]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          <div className="lg:col-span-1">
            <span className="text-2xl font-black tracking-[0.25em] text-[#1C1C1C] uppercase">
              DUNE<span className="text-[#D4C4A8]">.</span>EG
            </span>
            <p className="mt-4 text-[#1C1C1C]/50 text-[13px] leading-relaxed">
              Streetwear born in Cairo. Designed for the heat. Worn everywhere.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#1C1C1C] mb-5">Shop</h4>
            <ul className="space-y-3">
              {["New Arrivals", "Oversized Tees", "Cargo Pants", "Hoodies", "Accessories"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#1C1C1C] mb-5">Info</h4>
            <ul className="space-y-3">
              {["About Us", "Lookbook", "Sizing Guide", "Shipping & Returns", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-[#1C1C1C]/50 hover:text-[#1C1C1C] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#1C1C1C] mb-5">Stay Updated</h4>
            <p className="text-[13px] text-[#1C1C1C]/50 mb-5 leading-relaxed">
              Drop alerts, exclusive offers, and Cairo pop-up events — straight to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border border-[#1C1C1C]/20 px-4 py-3 text-[13px] text-[#1C1C1C] placeholder-[#1C1C1C]/30 focus:outline-none focus:border-[#1C1C1C] transition-colors"
              />
              <button type="submit" className="w-full bg-[#1C1C1C] text-[#F9F9F6] py-3 text-[11px] tracking-[0.25em] uppercase font-bold hover:bg-[#555E4E] transition-colors duration-300">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-[#1C1C1C]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#1C1C1C]/30 tracking-wide">
            © 2026 DUNE.EG. All rights reserved. Cairo, Egypt.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((item) => (
              <a key={item} href="#" className="text-[11px] text-[#1C1C1C]/30 hover:text-[#1C1C1C] transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// ROOT APP COMPONENT
// ============================================================
// All shared state lives here and is passed down as props.
// This is the "single source of truth" pattern.
//
// STATE OWNED BY APP:
//   cartItems      — the cart array, persisted to localStorage
//   cartOpen       — is the drawer visible?
//   modalProduct   — which product is open in Quick View (null = closed)
//   toast          — { message, visible } for the notification bar

export default function App() {
  // ── FEATURE 1: localStorage-persisted cart ──────────────────
  //
  // BEGINNER NOTE — lazy initialiser:
  // useState(() => loadCartFromStorage()) uses a *function* as
  // the initial value instead of a plain value. React calls this
  // function ONCE on the very first render. This is called "lazy
  // initialisation" and is the correct pattern for expensive
  // setup work (like reading localStorage) because it only runs
  // once, not on every re-render.
  const [cartItems, setCartItems] = useState(() => loadCartFromStorage());

  // ── FEATURE 1: sync cartItems → localStorage on every change ─
  //
  // BEGINNER NOTE — the dependency array [cartItems] means this
  // effect fires once after the initial render AND again every
  // time cartItems changes. JSON.stringify converts the JS array
  // into a string because localStorage can only store strings.
  useEffect(() => {
    localStorage.setItem("duneeg_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);

  // Toast state: message string + whether it's currently visible
  const [toast, setToast] = useState({ message: "", visible: false });
  // We store the auto-dismiss timer ID so we can cancel it if
  // another item is added before the 3 seconds are up.
  const toastTimer = useRef(null);

  // ── FEATURE 4: show toast helper ────────────────────────────
  const showToast = useCallback((message) => {
    // Cancel any existing timer so the 3s always resets from now
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // ── FEATURE 2: addToCart tracks by id + size ────────────────
  //
  // BEGINNER NOTE — composite key:
  // A plain id wouldn't distinguish "Size M" from "Size L".
  // We create a `cartKey` string like "3-L" that is unique per
  // product+size combination. When the user adds an item, we:
  //   a) Check if a matching cartKey already exists in the array
  //   b) If yes → increment that item's qty
  //   c) If no  → add a brand new entry to the array
  const addToCart = useCallback((product, size) => {
    const cartKey = `${product.id}-${size}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        // Already in cart — just bump the quantity
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // New entry
      return [
        ...prev,
        {
          cartKey,
          id: product.id,
          size,
          name: product.name,
          price: product.price,
          priceNum: product.priceNum,
          img: product.img,
          qty: 1,
        },
      ];
    });
    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const removeFromCart = useCallback((cartKey) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }, []);

  const updateQty = useCallback((cartKey, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0) // remove if qty reaches 0
    );
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="bg-[#F9F9F6] text-[#1C1C1C] min-h-screen font-sans">
      <TopAnnouncementBar />

      <DesktopHeader
        cartCount={totalCartCount}
        onCartOpen={() => setCartOpen(true)}
      />

      <main>
        <WidescreenHero />
        <ShopSection
          onOpenModal={(product) => setModalProduct(product)}
          onQuickAdd={addToCart}
        />
        <SocialProof />
      </main>

      <WideFooter />

      {/* Cart Drawer — always rendered, slides in/out via CSS */}
      <CartDrawer
        cartItems={cartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemove={removeFromCart}
        onUpdateQty={updateQty}
      />

      {/* Quick View Modal — only rendered when modalProduct is set */}
      <QuickViewModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Toast notification */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
