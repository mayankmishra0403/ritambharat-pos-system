import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bell, Receipt, X, Send, Bot, User, ChefHat, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartWaiter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState(null); // 'chat' or null
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hi! I\'m your AI Waiter. Ask me anything about the menu!' }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleCallWaiter = () => {
        toast.success("Waiter has been notified! They'll be with you shortly.", {
            icon: '🔔',
            style: {
                background: '#333',
                color: '#fff',
            }
        });
        setIsOpen(false);
    };

    const handleRequestBill = () => {
        toast.success("Bill requested! A waiter will bring it to your table.", {
            icon: '🧾',
            style: {
                background: '#333',
                color: '#fff',
            }
        });
        setIsOpen(false);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const newMessages = [...messages, { type: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "The Spicy Pasta is a customer favorite! It has a real kick.",
                "Yes, we have gluten-free options. Check the 'Healthy' section.",
                "Our Chef recommends the Grilled Salmon for dinner.",
                "I can help you customize your burger. Just let me know!",
                "Would you like to see the dessert menu?"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setMessages(prev => [...prev, { type: 'bot', text: randomResponse }]);
        }, 1000);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col-reverse items-end gap-4">
            {/* Main Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className={`relative w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-colors z-50 ${isOpen ? 'bg-black text-white' : 'bg-primary text-black'}`}
            >
                {isOpen ? <X size={24} /> : <Bot size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
            </motion.button>

            {/* Expanded Actions */}
            <AnimatePresence>
                {isOpen && !mode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="flex flex-col gap-3 items-end"
                    >
                        <button
                            onClick={() => setMode('chat')}
                            className="bg-white text-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            Ask AI Chef <Sparkles size={16} className="text-purple-600" />
                        </button>
                        <button
                            onClick={handleCallWaiter}
                            className="bg-white text-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            Call Waiter <Bell size={16} className="text-orange-500" />
                        </button>
                        <button
                            onClick={handleRequestBill}
                            className="bg-white text-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors font-medium text-sm whitespace-nowrap"
                        >
                            Request Bill <Receipt size={16} className="text-green-600" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && mode === 'chat' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-[350px] h-[450px] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Bot size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Ritam Bharat POS AI</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setMode(null)} className="text-white/50 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                        ? 'bg-primary text-black rounded-tr-sm'
                                        : 'bg-white/10 text-white rounded-tl-sm border border-white/5'}`
                                    }>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-black/50">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about ingredients..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default SmartWaiter;
