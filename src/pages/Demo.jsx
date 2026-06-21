import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Play, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import toast from 'react-hot-toast';

const Demo = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            toast.success('Demo link sent to your email!');
        }, 1500);
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full text-center space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[2.5rem]"
                    >
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-3xl font-black">Check Your Inbox!</h1>
                        <p className="text-white/60 font-medium">
                            We've sent the exclusive demo video and platform walkthrough link to <span className="text-primary">{email}</span>.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-primary font-black uppercase tracking-widest text-xs hover:underline pt-4"
                        >
                            Back to website
                        </button>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow relative overflow-hidden flex items-center pt-32 pb-20 px-6">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,0,255,0.1),transparent_50%)]" />
                <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

                <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    {/* Left Side: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest">Instant Access</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                            Experience <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">Total Control</span>
                        </h1>

                        <p className="text-xl text-white/60 font-medium leading-relaxed max-w-xl italic">
                            Join hundreds of restaurants using Ritam Bharat POS. Get an exclusive deep-dive into the
                            ecosystem: From smart menus to real-time order management.
                        </p>

                        <div className="space-y-4 pt-4">
                            {[
                                'AI-Powered Revenue Optimization',
                                'Invisible Kitchen Orchestration (KDS)',
                                'C-Suite Analytics & Profit Dashboards',
                                'Dynamic Floor Plan Management'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-white/80 font-bold italic">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(120,0,255,1)]" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Side: Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl"
                    >
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-black mb-2">Get Your Demo Link</h2>
                            <p className="text-white/40 font-medium">Enter your professional email to receive the video.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-white/40 ml-2">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="owner@yourrestaurant.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 focus:bg-white/10 focus:border-primary/50 transition-all outline-none font-bold placeholder:text-white/20"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full btn-primary py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 group disabled:opacity-50"
                            >
                                {status === 'loading' ? (
                                    <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Send Me the Demo
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-[10px] text-white/20 uppercase font-black tracking-widest">
                            No Credit Card Required • Instant Delivery • 24/7 Access
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Demo;
