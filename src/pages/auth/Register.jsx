import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ArrowRight, Store, ChefHat, Check, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from "../../components/common/Logo";
import ThemeToggle from '../../components/common/ThemeToggle';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'OWNER',
    });
    const [loading, setLoading] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        number: false,
        special: false,
        match: false
    });
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const { register, user: authUser, checkRestaurantStatus } = useAuth();
    const navigate = useNavigate();

    // Handle errors from social login redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (error) {
            toast.error(error);
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Auto-redirect if already logged in as OWNER or STAFF
    useEffect(() => {
        if (authUser) {
            console.log('[Register] User check:', authUser.role);
            if (authUser.role === 'OWNER') {
                console.log('[Register] Owner detected, redirecting to dashboard');
                navigate('/dashboard');
            } else if (authUser.role === 'CHEF' || authUser.role === 'WAITER' || (authUser.permissions && authUser.permissions.length > 0)) {
                console.log('[Register] Staff detected, redirecting to orders');
                navigate('/orders');
            } else {
                console.log('[Register] Customer or unauthorized user detected, allowing registration access');
                // Don't navigate away; allow them to see the registration page
            }
        }
    }, [authUser, navigate]);

    useEffect(() => {
        const isMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
        setPasswordCriteria({
            length: formData.password.length >= 8,
            number: /\d/.test(formData.password),
            special: /[@$!%*?&]/.test(formData.password),
            match: Boolean(isMatch)
        });
    }, [formData.password, formData.confirmPassword]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double check validation before submit
        if (!Object.values(passwordCriteria).every(Boolean)) {
            return;
        }

        setLoading(true);

        try {
            const result = await register(formData.name, formData.email, formData.password, formData.role);
            if (result.success) {
                toast.success('Registration successful! You can now login.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Registration error detail:', error);
            const message = error.response?.data?.message || error.message || 'Registration failed. Please check your connection.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex">
            {/* Left Side - Visual & Benefits */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-foreground overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />

                {/* Gradient Orbs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]"
                />

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="mb-8">
                            <Logo className="w-auto h-16" variant="inverse" />
                        </div>
                        <h2 className="font-display text-4xl font-bold text-background mb-6 leading-tight">
                            Start Your Journey with Ritam Bharat POS
                        </h2>

                        <div className="space-y-6 mt-12">
                            {[
                                { title: "Digital Menu", desc: "Create stunning QR menus in minutes" },
                                { title: "Order Management", desc: "Streamline kitchen workflows instantly" },
                                { title: "Analytics", desc: "Track sales and growth in real-time" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-background">{item.title}</h3>
                                        <p className="text-background/60">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-md">
                    {/* Logo - Centered for Mobile */}
                    <div className="flex justify-center lg:hidden mb-10">
                        <Logo className="w-auto h-12" />
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <div className="text-left">
                            <h2 className="font-display text-3xl font-bold mb-2">Create Account</h2>
                            <p className="text-muted-foreground">Join 89+ restaurants growing with Ritam Bharat POS.</p>
                        </div>
                        <ThemeToggle className="theme-toggle-container" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setFormData({ ...formData, role: 'OWNER' })}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.role === 'OWNER'
                                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                            >
                                <Store className={`w-8 h-8 mb-3 ${formData.role === 'OWNER' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <h3 className="font-semibold text-sm">Restaurant Owner</h3>
                                <p className="text-xs text-muted-foreground mt-1">I want to manage my restaurant</p>
                            </div>

                            <div
                                onClick={() => setFormData({ ...formData, role: 'CHEF' })}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.role === 'CHEF'
                                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                            >
                                <ChefHat className={`w-8 h-8 mb-3 ${formData.role === 'CHEF' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <h3 className="font-semibold text-sm">Kitchen Staff</h3>
                                <p className="text-xs text-muted-foreground mt-1">I work in the kitchen</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium">Full Name</label>
                                    {formData.name.length > 2 && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                            <Check className="w-3 h-3" /> Looks good
                                        </motion.div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Ali Khan"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="ali@royaltandoor.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${formData.password.length > 0 && !Object.values(passwordCriteria).slice(0, 3).every(Boolean)
                                            ? 'border-destructive/50 focus:border-destructive bg-destructive/5'
                                            : 'border-border bg-muted/30 focus:bg-background focus:border-primary/50'
                                            }`}
                                        placeholder="••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setShowPasswordRequirements(true)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Confirm</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${formData.confirmPassword.length > 0 && !passwordCriteria.match
                                            ? 'border-destructive/50 focus:border-destructive bg-destructive/5'
                                            : formData.confirmPassword.length > 0 && passwordCriteria.match
                                                ? 'border-green-500/50 focus:border-green-500 bg-green-500/5'
                                                : 'border-border bg-muted/30 focus:bg-background focus:border-primary/50'
                                            }`}
                                        placeholder="••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {(showPasswordRequirements || formData.password.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 overflow-hidden"
                                    >
                                        <p className="font-semibold mb-2 text-muted-foreground">Password requirements:</p>
                                        <div className="flex items-center gap-2">
                                            {passwordCriteria.length ? <Check className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground" />}
                                            <span className={passwordCriteria.length ? "text-green-600" : "text-muted-foreground"}>At least 8 characters</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordCriteria.number ? <Check className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground" />}
                                            <span className={passwordCriteria.number ? "text-green-600" : "text-muted-foreground"}>Contains a number</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {passwordCriteria.special ? <Check className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground" />}
                                            <span className={passwordCriteria.special ? "text-green-600" : "text-muted-foreground"}>Special character (@$!%*?&)</span>
                                        </div>
                                        {formData.confirmPassword.length > 0 && (
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                                                {passwordCriteria.match ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-destructive" />}
                                                <span className={passwordCriteria.match ? "text-green-600" : "text-destructive"}>Passwords match</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !Object.values(passwordCriteria).every(Boolean)}
                            className="w-full btn-primary py-3.5 text-base rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>


                    </form>

                    <p className="text-center mt-8 text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
