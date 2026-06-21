import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Plus,
    Minus,
    ShoppingBag,
    Bell,
    MessageCircle,
    Star,
    X,
    CreditCard,
    Banknote,
    Send,
    ChevronRight,
    ChevronLeft,
    Check,
    Clock,
    Utensils,
    Package
} from "lucide-react";
import { AnimatedSection } from "../ui/animated-section";

const demoScreens = [
    {
        id: "menu",
        title: "Browse Menu",
        description: "Customers can browse your menu by category with beautiful food imagery"
    },
    {
        id: "cart",
        title: "Quick Checkout",
        description: "Add items to cart and send orders directly to your kitchen"
    },
    {
        id: "tracking",
        title: "Live Order Tracking",
        description: "Real-time order status updates keep customers informed"
    },
    {
        id: "payment",
        title: "Flexible Payment",
        description: "Multiple payment options for easy bill settlement"
    }
];

const menuCategories = [
    { id: "starters", name: "Starters & Snacks" },
    { id: "mains", name: "Classic Curries" },
    { id: "desserts", name: "Indian Sweets" },
    { id: "drinks", name: "Lassis & Chai" },
];

const menuItems = [
    {
        id: 1,
        category: "starters",
        name: "Paneer Tikka",
        description: "Marinated cottage cheese cubes grilled in tandoor",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop",
        rating: 4.8,
        popular: true,
    },
    {
        id: 2,
        category: "starters",
        name: "Vegetable Samosas",
        description: "Crispy pastry filled with spiced potatoes and peas (2 pcs)",
        price: 6.50,
        image: "https://images.unsplash.com/photo-1601050690597-df056fb04791?w=500&auto=format&fit=crop",
        rating: 4.9,
        popular: true,
    },
    {
        id: 3,
        category: "mains",
        name: "Chicken Biryani",
        description: "Fragrant basmati rice cooked with succulent chicken and spices",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=500&auto=format&fit=crop",
        rating: 4.9,
        popular: true,
    },
    {
        id: 4,
        category: "mains",
        name: "Butter Chicken",
        description: "Tender chicken in a rich, creamy tomato gravy",
        price: 16.50,
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop",
        rating: 4.7,
        popular: true,
    },
    {
        id: 5,
        category: "mains",
        name: "Mutton Nihari",
        description: "Slow-cooked mutton stew with aromatic spices",
        price: 21.99,
        image: "https://images.unsplash.com/photo-1545231027-63b6f2a3c59c?w=500&auto=format&fit=crop",
        rating: 5.0,
        popular: true,
    },
];

export const DemoMenuSection = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState("starters");
    const [cart, setCart] = useState([
        { id: 1, name: "Paneer Tikka", price: 12.99, quantity: 2 },
        { id: 3, name: "Chicken Biryani", price: 18.99, quantity: 1 }
    ]);
    const [orderStatus, setOrderStatus] = useState("browsing");
    const [paymentMethod, setPaymentMethod] = useState(null);

    const handleAddToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const handleRemoveFromCart = (id) => {
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (item && item.quantity > 1) {
                return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
            }
            return prev.filter(i => i.id !== id);
        });
    };

    const handleSendOrder = () => setOrderStatus("sent");

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const filteredItems = menuItems.filter((item) => item.category === activeCategory);
    const activeScreen = demoScreens[activeIndex];

    const nextScreen = () => setActiveIndex((prev) => (prev + 1) % demoScreens.length);
    const prevScreen = () => setActiveIndex((prev) => (prev - 1 + demoScreens.length) % demoScreens.length);

    return (
        <section className="section-padding bg-muted/20 relative overflow-hidden">
            <div className="relative z-10 max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <AnimatedSection className="text-center mb-12 sm:mb-20">
                    <span className="inline-block text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        Guest-Facing Interface
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
                        Superior <span className="text-gradient italic">Guest Experience</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic font-medium">
                        Ritam Bharat POS isn't just a backend tool. It's an elegant extension of your brand that
                        removes ordering friction and maximizes table turnover while delighting your guests.
                    </p>
                </AnimatedSection>

                {/* Desktop View (LG+) */}
                <div className="hidden lg:grid grid-cols-12 gap-12 items-center">
                    {/* Left: Sidebar Navigation */}
                    <div className="col-span-5 space-y-4">
                        {demoScreens.map((screen, index) => (
                            <motion.button
                                key={screen.id}
                                onClick={() => setActiveIndex(index)}
                                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${activeIndex === index
                                    ? "bg-background border-primary shadow-xl"
                                    : "bg-transparent border-border/50 hover:border-primary/30"
                                    }`}
                                whileHover={{ x: 10 }}
                            >
                                {activeIndex === index && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"
                                    />
                                )}
                                <h3 className={`font-display text-xl font-bold mb-2 transition-colors ${activeIndex === index ? "text-primary" : "text-foreground"
                                    }`}>
                                    {screen.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {screen.description}
                                </p>
                            </motion.button>
                        ))}

                        {/* Controls */}
                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={prevScreen}
                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-background hover:border-primary hover:text-primary transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextScreen}
                                className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-background hover:border-primary hover:text-primary transition-all shadow-sm"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Phone Mockup */}
                    <div className="col-span-7 flex justify-center">
                        <div className="relative group">
                            {/* Decorative Elements */}
                            <div className="absolute -inset-10 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-500" />

                            {/* Professional Phone Frame */}
                            <div className="relative bg-[#0F172A] rounded-[3.5rem] p-3.5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-[#1E293B] w-[340px]">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1E293B] rounded-b-3xl z-20 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#0F172A]" />
                                    <div className="w-8 h-1 rounded-full bg-[#0F172A]" />
                                </div>

                                {/* Speaker/Sensors hidden in notch area... */}

                                <div className="bg-background rounded-[2.8rem] overflow-hidden relative">
                                    <div className="h-[600px] relative overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeScreen.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="h-full"
                                            >
                                                {activeScreen.id === "menu" && (
                                                    <MenuBrowseScreen
                                                        activeCategory={activeCategory}
                                                        setActiveCategory={setActiveCategory}
                                                        filteredItems={filteredItems}
                                                        menuCategories={menuCategories}
                                                        onAdd={handleAddToCart}
                                                    />
                                                )}
                                                {activeScreen.id === "cart" && (
                                                    <CartScreen
                                                        cart={cart}
                                                        totalPrice={totalPrice}
                                                        onRemove={handleRemoveFromCart}
                                                        onAdd={handleAddToCart}
                                                        onSend={handleSendOrder}
                                                    />
                                                )}
                                                {activeScreen.id === "tracking" && (
                                                    <OrderTrackingScreen status={orderStatus} />
                                                )}
                                                {activeScreen.id === "payment" && (
                                                    <PaymentScreen
                                                        totalPrice={totalPrice}
                                                        paymentMethod={paymentMethod}
                                                        setPaymentMethod={setPaymentMethod}
                                                    />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet View (Below LG) */}
                <div className="lg:hidden relative -mx-4">
                    <div className="overflow-x-auto carousel-scrollbar snap-x snap-mandatory flex gap-6 px-4 pb-8 touch-pan-x">
                        {demoScreens.map((screen) => (
                            <div
                                key={screen.id}
                                className="snap-center snap-always flex-none w-[280px] sm:w-[320px]"
                            >
                                <div className="bg-[#0F172A] rounded-[2.5rem] p-2.5 shadow-2xl border-4 border-[#1E293B]">
                                    <div className="bg-background rounded-[2rem] overflow-hidden relative h-[450px] sm:h-[500px]">
                                        {screen.id === "menu" && (
                                            <MenuBrowseScreen
                                                activeCategory={activeCategory}
                                                setActiveCategory={setActiveCategory}
                                                filteredItems={filteredItems}
                                                menuCategories={menuCategories}
                                                onAdd={handleAddToCart}
                                            />
                                        )}
                                        {screen.id === "cart" && (
                                            <CartScreen
                                                cart={cart}
                                                totalPrice={totalPrice}
                                                onRemove={handleRemoveFromCart}
                                                onAdd={handleAddToCart}
                                                onSend={handleSendOrder}
                                            />
                                        )}
                                        {screen.id === "tracking" && (
                                            <OrderTrackingScreen status={orderStatus} />
                                        )}
                                        {screen.id === "payment" && (
                                            <PaymentScreen
                                                totalPrice={totalPrice}
                                                paymentMethod={paymentMethod}
                                                setPaymentMethod={setPaymentMethod}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="text-center mt-6">
                                    <h3 className="font-semibold text-primary mb-1">{screen.title}</h3>
                                    <p className="text-xs text-muted-foreground">{screen.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// ... Subcomponents remain same ...
const MenuBrowseScreen = ({ activeCategory, setActiveCategory, filteredItems, menuCategories, onAdd }) => (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-background/95 backdrop-blur-lg border-b border-border p-3.5">
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-display font-bold italic text-foreground text-sm leading-none">Table 12</h3>
                        <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">The Royal Tandoor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors cursor-pointer">
                        <Bell className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                        <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {menuCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 scrollbar-hide">
            {filteredItems.map((item) => (
                <div
                    key={item.id}
                    className="bg-card rounded-xl p-2.5 border border-border/50 shadow-sm"
                >
                    <div className="flex gap-2.5">
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '🍛';
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-xs">{item.name}</h4>
                                        {item.popular && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-medium">
                                                Popular
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">£{item.price}</span>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                                        {item.rating}
                                    </div>
                                </div>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onAdd(item)}
                                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="w-3 h-3 text-primary-foreground" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CartScreen = ({ cart, totalPrice, onRemove, onAdd, onSend }) => (
    <div className="h-full flex flex-col p-3.5">
        <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold">Your Order</h3>
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center cursor-pointer">
                <X className="w-3.5 h-3.5" />
            </div>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto scrollbar-hide">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <ShoppingBag className="w-12 h-12 mb-4" />
                    <p className="text-sm">Your cart is empty</p>
                </div>
            ) : (
                cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-border/50">
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                                £{item.price} × {item.quantity}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1">
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => onRemove(item.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Minus className="w-3 h-3" />
                                </motion.button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => onAdd(item)}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                </motion.button>
                            </div>
                            <span className="font-bold text-sm min-w-[50px] text-right">
                                £{(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="bg-muted/50 rounded-xl p-3.5 mb-5 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>£{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>£{totalPrice.toFixed(2)}</span>
            </div>
        </div>

        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSend}
            disabled={cart.length === 0}
            className="w-full bg-primary text-primary-foreground rounded-xl p-3.5 flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Send className="w-4 h-4" />
            Send Order to Kitchen
        </motion.button>
    </div>
);

const OrderTrackingScreen = ({ status }) => {
    const orderSteps = [
        { icon: Check, label: "Order Received", status: status === "browsing" ? "pending" : "completed", time: status === "browsing" ? "" : "Just now" },
        { icon: Utensils, label: "Preparing", status: status === "sent" ? "active" : status === "browsing" ? "pending" : "completed", time: status === "sent" ? "Est. 15 min" : status === "browsing" ? "" : "Done" },
        { icon: Package, label: "Ready to Serve", status: "pending", time: "" },
    ];

    return (
        <div className="h-full flex flex-col p-3.5">
            <div className="text-center mb-6">
                <h3 className="font-display text-lg font-semibold mb-1.5">Order Status</h3>
                <p className="text-xs text-muted-foreground text-center">Table 12 • Order #1234</p>
            </div>

            <div className="flex-1 space-y-5">
                {orderSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <div key={index} className="flex gap-3.5">
                            <div className="relative">
                                <motion.div
                                    animate={step.status === "active" ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center ${step.status === "completed"
                                        ? "bg-emerald-500 text-white"
                                        : step.status === "active"
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                {index < orderSteps.length - 1 && (
                                    <div
                                        className={`absolute left-1/2 top-11 w-0.5 h-7 -translate-x-1/2 ${step.status === "completed"
                                            ? "bg-emerald-500"
                                            : "bg-muted"
                                            }`}
                                    />
                                )}
                            </div>
                            <div className="flex-1 pt-1.5">
                                <p className={`font-semibold text-sm ${step.status === "active" ? "text-primary" : ""}`}>{step.label}</p>
                                <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 text-center mt-4">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs font-medium text-primary">
                    {status === "browsing" ? "Place an order to see updates" : "Your order will be ready soon!"}
                </p>
            </div>
        </div>
    );
};

const PaymentScreen = ({ totalPrice, paymentMethod, setPaymentMethod }) => (
    <div className="h-full flex flex-col p-3.5">
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
        <h3 className="font-display text-lg font-semibold text-center mb-3">
            Request Bill
        </h3>
        <p className="text-muted-foreground text-center text-xs mb-5">
            Your server will be notified immediately
        </p>

        <div className="bg-muted/50 rounded-xl p-3.5 mb-5">
            <div className="flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span className="text-primary">£{(totalPrice * 1.1).toFixed(2)}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-4">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPaymentMethod("cash")}
                className={`rounded-xl p-5 flex flex-col items-center gap-2.5 transition-all outline-none ${paymentMethod === "cash"
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                    }`}
            >
                <Banknote className={`w-7 h-7 ${paymentMethod === "cash" ? "text-primary" : "text-emerald-500"}`} />
                <span className={`text-xs font-medium ${paymentMethod === "cash" ? "text-primary" : ""}`}>Pay Cash</span>
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPaymentMethod("online")}
                className={`rounded-xl p-5 flex flex-col items-center gap-2.5 transition-all outline-none ${paymentMethod === "online"
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-primary text-primary-foreground hover:opacity-90 border-2 border-transparent"
                    }`}
            >
                <CreditCard className="w-7 h-7" />
                <span className="text-xs font-medium">Pay Online</span>
            </motion.button>
        </div>

        <div className="flex-1" />

        <button className="w-full text-muted-foreground text-xs py-2 hover:text-foreground transition-colors">
            Cancel
        </button>
    </div>
);
