import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ArrowRight, CheckCircle2, Star, KeyRound, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from '../../components/common/Logo';
import ThemeToggle from '../../components/common/ThemeToggle';
import PWAInstallPrompt from '../../components/common/PWAInstallPrompt';

const Login = () => {
    const [activeTab, setActiveTab] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, pinLogin, setUser, checkRestaurantStatus, user: authUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const userStr = params.get('user');
        const error = params.get('error');

        if (error) {
            toast.error(error);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (token && refreshToken && userStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userStr));
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(userData));
                window.history.replaceState({}, document.title, window.location.pathname);
                setUser(userData);

                if (userData.role === 'OWNER') {
                    checkRestaurantStatus().then(hasRestaurant => {
                        navigate(hasRestaurant ? '/dashboard' : '/onboarding');
                    });
                } else if (userData.role === 'CHEF' || userData.role === 'WAITER' || userData.role === 'CASHIER' || (userData.permissions && userData.permissions.length > 0)) {
                    const routeMap = {
                        'CASHIER': '/admin/pos',
                        'CHEF': '/kitchen',
                        'WAITER': '/waiter-app'
                    };
                    navigate(routeMap[userData.role] || '/orders');
                } else {
                    toast.error("Access restricted: This account does not have staff permissions.");
                }
            } catch (err) {
                console.error('Error parsing social login data:', err);
                toast.error('Failed to process login');
            }
        }
    }, [navigate, setUser, checkRestaurantStatus]);

    useEffect(() => {
        if (authUser) {
            if (authUser.role === 'OWNER') {
                navigate('/dashboard');
            } else if (authUser.role === 'CASHIER') {
                navigate('/admin/pos');
            } else if (authUser.role === 'CHEF') {
                navigate('/kitchen');
            } else if (authUser.role === 'WAITER') {
                navigate('/waiter-app');
            } else if (authUser.permissions && authUser.permissions.length > 0) {
                navigate('/orders');
            }
        }
    }, [authUser, navigate]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(email, password);

            const user = result;
            if (user.role === 'OWNER') {
                const hasRestaurant = await checkRestaurantStatus();
                navigate(hasRestaurant ? '/dashboard' : '/onboarding');
            } else if (user.role === 'CHEF') {
                navigate('/kitchen');
            } else if (user.permissions?.includes('orders')) {
                navigate('/orders');
            } else if (user.permissions && user.permissions.length > 0) {
                const firstPerm = user.permissions[0];
                const routeMap = {
                    'dashboard': '/dashboard',
                    'tables': '/tables',
                    'menu': '/menu',
                    'inventory': '/inventory',
                    'staff': '/staff',
                    'analytics': '/analytics',
                    'reviews': '/reviews',
                    'service': '/service',
                    'complaints': '/complaints',
                    'settings': '/settings'
                };
                navigate(routeMap[firstPerm] || '/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await pinLogin(pin);
            const routeMap = {
                'CASHIER': '/admin/pos',
                'WAITER': '/waiter-app',
                'CHEF': '/kitchen'
            };
            navigate(routeMap[user.role] || '/orders');
        } catch (error) {
            console.error('PIN login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
                />

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Link to="/" className="group mb-12 block">
                            <Logo className="w-auto h-12" variant="inverse" />
                        </Link>

                        <h2 className="font-display text-4xl font-bold text-background mb-6 leading-tight">
                            Manage Your Restaurant <br />
                            <span className="text-primary italic">Like a Pro</span>
                        </h2>

                        <p className="text-background/70 text-lg leading-relaxed mb-8">
                            Join 89+ restaurants using Ritam Bharat POS to <span className="text-primary font-semibold">streamline operations, improve guest experience, and simplify management</span> with effortless ordering.
                        </p>

                        <div className="bg-background/10 backdrop-blur-md rounded-2xl p-6 border border-background/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center text-background font-semibold">
                                    RK
                                </div>
                                <div>
                                    <p className="text-background font-semibold">Rajesh Kumar</p>
                                    <p className="text-background/60 text-sm">Owner, The Curry House</p>
                                </div>
                            </div>
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                ))}
                            </div>
                            <p className="text-background/80 italic">
                                "Our revenue increased by 22% in the first month. The AI-powered upselling and digital menu are game-changers for my business!"
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md">
                    <div className="flex justify-center lg:hidden mb-10">
                        <Logo className="w-auto h-12" />
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-display text-3xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-muted-foreground">Sign in to manage your restaurant.</p>
                        </div>
                        <ThemeToggle className="theme-toggle-container" />
                    </div>

                    <div className="flex border-b border-border mb-6">
                        <button
                            onClick={() => setActiveTab('email')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'email'
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Mail size={16} />
                            Admin Login
                        </button>
                        <button
                            onClick={() => setActiveTab('pin')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                                activeTab === 'pin'
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <KeyRound size={16} />
                            Staff PIN
                        </button>
                    </div>

                    {activeTab === 'email' && (
                        <>
                            <form onSubmit={handleEmailSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="name@restaurant.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                        </>
                    )}

                    {activeTab === 'pin' && (
                        <form onSubmit={handlePinSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Enter Your PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-center text-2xl font-bold tracking-[0.5em]"
                                    placeholder="••••••"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground mt-1">Enter your 4-6 digit staff PIN</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || pin.length < 4}
                                className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In with PIN
                                        <KeyRound className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <PWAInstallPrompt />
        </div>
    );
};

export default Login;
