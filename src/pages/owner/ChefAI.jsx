import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, ChefHat, Sparkles, Wand2 } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';

const ChefAIPage = () => {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const chatEndRef = useRef(null);

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = { role: 'user', content: message };
        setHistory(prev => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', {
                message,
                history: history.slice(-10),
                restaurantId,
                isOwnerMode: true
            });

            if (res.data.success) {
                setHistory(prev => [...prev, { role: 'chef', content: res.data.data }]);
            }
        } catch (error) {
            console.error('Chef AI Error:', error);
            setHistory(prev => [...prev, {
                role: 'chef',
                content: "I'm having trouble thinking right now. Please check your connection or try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedKitchenTasks = [
        "How can I reduce food waste this week?",
        "Suggest 3 high-profit specials using chicken",
        "Write a description for a new BBQ Burger",
        "Give me tips to improve table turnover during lunch"
    ];

    return (
        <div className="flex bg-background min-h-screen text-foreground transition-colors duration-300">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-left">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-hidden p-4 lg:p-12">
                    <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] flex flex-col">
                            <div className="flex-1 bg-card border-4 border-border rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="p-8 border-b-4 border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                            <ChefHat size={32} />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black tracking-tighter">Chef AI Assistant</h1>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Advanced Kitchen Brain Active</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="px-5 py-2.5 bg-background border-2 border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Gemini Pro 1.5
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {history.length === 0 && (
                                        <div className="text-center py-20 px-8">
                                            <motion.div
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 4 }}
                                                className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto text-primary mb-8"
                                            >
                                                <Wand2 size={48} />
                                            </motion.div>
                                            <h2 className="text-3xl font-black mb-4 tracking-tighter text-center">Collaborate with your AI Chef</h2>
                                            <p className="text-muted-foreground text-lg mb-12 max-w-lg mx-auto text-center font-bold">
                                                Ask for recipe optimizations, marketing copy for your menu, or business advice to scale your restaurant.
                                            </p>
                                            <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
                                                {suggestedKitchenTasks.map((task, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setMessage(task)}
                                                        className="px-6 py-4 bg-muted/30 hover:bg-muted/50 border-2 border-border/50 rounded-2xl text-sm font-bold transition-all text-left max-w-[300px]"
                                                    >
                                                        {task}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {history.map((msg, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] rounded-3xl p-6 text-base font-medium shadow-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground border-4 border-primary/20 shadow-lg shadow-primary/10'
                                                    : 'bg-muted/30 border-4 border-border'
                                                }`}>
                                                {msg.content.split('\n').map((line, j) => (
                                                    <p key={j} className={j > 0 ? "mt-3" : ""}>{line}</p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted/30 p-6 rounded-3xl border-4 border-border">
                                                <div className="flex gap-2">
                                                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-primary"></motion.div>
                                                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary"></motion.div>
                                                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary"></motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-8 bg-background border-t-4 border-border">
                                    <form onSubmit={handleSend} className="relative group">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                            placeholder="Type a mission for the Chef AI..."
                                            className="w-full bg-muted/20 border-4 border-border rounded-[2rem] py-5 px-8 pr-20 text-lg focus:outline-none focus:border-primary/50 transition-all min-h-[80px] max-h-[150px] resize-none overflow-hidden font-bold"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!message.trim() || isLoading}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-primary/30"
                                        >
                                            <Send size={24} />
                                        </button>
                                    </form>
                                    <div className="mt-4 flex justify-between items-center px-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Sparkles size={12} className="text-primary" />
                                            Professional Kitchen Intelligence Engine
                                        </p>
                                    </div>
                                </div>
                            </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChefAIPage;
