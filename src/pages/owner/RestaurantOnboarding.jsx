import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ArrowRight, Loader, Sparkles, CheckCircle2, ChevronLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RestaurantOnboarding = () => {
    const navigate = useNavigate();
    const { fetchMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
        },
        contact: {
            phone: '',
            email: '',
            whatsappNumber: ''
        },
        cuisine: '',
        logo: ''
    });

    const handleChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/restaurant', formData);
            if (res.data.success) {
                const restaurantId = res.data.data._id;

                // Update user in localStorage with restaurant reference
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, restaurant: restaurantId };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Refresh user in context
                await fetchMe();

                toast.success('Welcome to Ritam Bharat POS! Your restaurant is ready.');
                // Navigate to dashboard after a brief delay
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error(error.response?.data?.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                // Basics: name and description required
                if (!formData.name || !formData.description) {
                    toast.error('Please fill in restaurant name and description');
                    return false;
                }
                return true;
            case 2:
                // Cuisine: must select a cuisine
                if (!formData.cuisine) {
                    toast.error('Please select your restaurant cuisine');
                    return false;
                }
                return true;
            case 3:
                // Location: at least city and country required
                if (!formData.address.city || !formData.address.country) {
                    toast.error('Please provide at least city and country');
                    return false;
                }
                return true;
            case 4:
                // Contact: phone and email required
                if (!formData.contact.phone || !formData.contact.email) {
                    toast.error('Please provide business phone and email');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setUploadingLogo(true);
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        try {
            const res = await api.post('/upload/image', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setFormData(prev => ({ ...prev, logo: res.data.data.url }));
                toast.success('Logo uploaded successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const CUISINES = [
        { label: 'Italian', icon: '🍝' },
        { label: 'Japanese', icon: '🍣' },
        { label: 'American', icon: '🍔' },
        { label: 'Indian', icon: '🍛' },
        { label: 'Mexican', icon: '🌮' },
        { label: 'Chinese', icon: '🥡' },
        { label: 'French', icon: '🥐' },
        { label: 'Modern/Fusion', icon: '✨' },
        { label: 'Other', icon: '🍽️' }
    ];

    const steps = [
        { num: 1, title: 'Basics', icon: Store },
        { num: 2, title: 'Cuisine', icon: Sparkles },
        { num: 3, title: 'Location', icon: MapPin },
        { num: 4, title: 'Contact', icon: Phone }
    ];

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 bg-black overflow-hidden font-sans">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,0,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(50,200,255,0.05),transparent_40%)]" />

            {/* Animated Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    blob: "10px"
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    scale: [1.1, 0.9, 1.1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"
            />

            <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row gap-8 items-stretch h-auto min-h-[600px]">

                {/* Left Side - Welcome & Progress */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full md:w-1/3 flex flex-col justify-between py-8 text-white"
                >
                    <div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-primary mb-6 shadow-lg shadow-primary/20"
                        >
                            <Sparkles size={24} />
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
                            Setup Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-purple-400">
                                Digital Restaurant
                            </span>
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed max-w-xs">
                            Let's configure your restaurant profile to start accepting orders instantly.
                        </p>
                    </div>

                    {/* Progress Stepper */}
                    <div className="mt-12 space-y-8 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[19px] top-2 bottom-10 w-[2px] bg-white/10 z-0" />

                        {steps.map((s, idx) => {
                            const isActive = step === s.num;
                            const isCompleted = step > s.num;
                            const Icon = s.icon;

                            return (
                                <div key={s.num} className="relative z-10 flex items-center gap-4 group">
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.1 : 1
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted || isActive ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}
                                    >
                                        {isCompleted ? <CheckCircle2 size={18} className="text-white" /> : <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>{s.num}</span>}
                                    </motion.div>
                                    <div>
                                        <h3 className={`font-semibold text-lg transition-colors ${isActive || isCompleted ? 'text-white' : 'text-white/40'}`}>
                                            {s.title}
                                        </h3>
                                        {isActive && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="text-white/50 text-xs mt-0.5"
                                            >
                                                In Progress...
                                            </motion.p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Right Side - Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full md:w-2/3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Glass Shine Effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit} className="relative z-10 h-full flex flex-col">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            Basic Information
                                            <div className="h-px flex-1 bg-white/10 ml-4" />
                                        </h2>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Restaurant Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="e.g. The Grand Bistro"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Description</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10 min-h-[120px] resize-none"
                                                    placeholder="Tell customers about your unique dining experience..."
                                                    required
                                                />
                                            </div>

                                            {/* Media Upload Area */}
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-2">Restaurant Logo</label>
                                                <div
                                                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${formData.logo ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                        disabled={uploadingLogo}
                                                    />

                                                    <div className="flex items-center gap-4 relative z-10">
                                                        {formData.logo ? (
                                                            <div className="w-16 h-16 rounded-lg bg-white/10 p-1">
                                                                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain rounded-md" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                                                                <Upload className="text-white/40" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1">
                                                            {uploadingLogo ? (
                                                                <div className="flex items-center gap-2 text-primary">
                                                                    <Loader className="animate-spin w-4 h-4" />
                                                                    <span className="text-sm font-medium">Uploading...</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <h4 className="text-white font-medium text-sm">
                                                                        {formData.logo ? 'Change Logo' : 'Upload Logo'}
                                                                    </h4>
                                                                    <p className="text-white/40 text-xs mt-1">
                                                                        PNG, JPG up to 5MB
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                            Select Your Specialty
                                            <div className="h-px flex-1 bg-white/10 ml-4" />
                                        </h2>
                                        <p className="text-white/40 text-sm mb-8">This helps us tailor your AI kitchen recommendations.</p>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {CUISINES.map((cuisine) => (
                                                <button
                                                    key={cuisine.label}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, cuisine: cuisine.label }))}
                                                    className={`p-6 rounded-2xl border-2 transition-all group relative overflow-hidden flex flex-col items-center gap-3 ${formData.cuisine === cuisine.label
                                                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className="text-3xl group-hover:scale-110 transition-transform">{cuisine.icon}</span>
                                                    <span className="font-bold text-sm tracking-tight">{cuisine.label}</span>
                                                    {formData.cuisine === cuisine.label && (
                                                        <motion.div
                                                            layoutId="active-cuisine"
                                                            className="absolute top-2 right-2"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            Location Details
                                            <div className="h-px flex-1 bg-white/10 ml-4" />
                                        </h2>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2 group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Street Address</label>
                                                <input
                                                    type="text"
                                                    name="street"
                                                    value={formData.address.street}
                                                    onChange={(e) => handleChange(e, 'address')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="123 Culinary Ave"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">City</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.address.city}
                                                    onChange={(e) => handleChange(e, 'address')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="New York"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Zip Code</label>
                                                <input
                                                    type="text"
                                                    name="zipCode"
                                                    value={formData.address.zipCode}
                                                    onChange={(e) => handleChange(e, 'address')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="10001"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">State</label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.address.state}
                                                    onChange={(e) => handleChange(e, 'address')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="NY"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Country</label>
                                                <input
                                                    type="text"
                                                    name="country"
                                                    value={formData.address.country}
                                                    onChange={(e) => handleChange(e, 'address')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="USA"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 space-y-8"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            Contact Channels
                                            <div className="h-px flex-1 bg-white/10 ml-4" />
                                        </h2>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Business Phone</label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.contact.phone}
                                                    onChange={(e) => handleChange(e, 'contact')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-primary transition-colors">Business Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.contact.email}
                                                    onChange={(e) => handleChange(e, 'contact')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hover:bg-white/10"
                                                    placeholder="contact@restaurant.com"
                                                />
                                            </div>
                                            <div className="group">
                                                <label className="block text-sm font-medium text-white/70 mb-2 group-focus-within:text-whatsapp transition-colors">WhatsApp Number (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="whatsappNumber"
                                                    value={formData.contact.whatsappNumber}
                                                    onChange={(e) => handleChange(e, 'contact')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all hover:bg-white/10"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="pt-8 mt-auto flex items-center justify-between border-t border-white/10">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
                                >
                                    <ChevronLeft size={18} />
                                    Back
                                </button>
                            ) : (
                                <div /> /* Spacer */
                            )}

                            <button
                                type={step === 4 ? 'submit' : 'button'}
                                onClick={step === 4 ? undefined : nextStep}
                                disabled={loading}
                                className="bg-primary hover:bg-primary-dark text-black font-semibold rounded-xl px-8 py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
                            >
                                {loading ? (
                                    <Loader className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        {step === 4 ? 'Launch Restaurant' : 'Continue'}
                                        {step !== 4 && <ArrowRight size={18} />}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default RestaurantOnboarding;
