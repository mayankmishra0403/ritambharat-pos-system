import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { Save, Loader, Building2, Palette, QrCode, FileText, Image } from 'lucide-react';
import HotelClassic from '../../components/billing/templates/HotelClassic';
import PremiumRestaurant from '../../components/billing/templates/PremiumRestaurant';
import ModernPOS from '../../components/billing/templates/ModernPOS';
import MinimalReceipt from '../../components/billing/templates/MinimalReceipt';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';

const TABS = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'options', label: 'Invoice Options', icon: Palette },
    { id: 'qr', label: 'QR Settings', icon: QrCode },
    { id: 'footer', label: 'Footer', icon: FileText }
];

const TEMPLATES = [
    { id: 'hotel-classic', label: 'Hotel Classic' },
    { id: 'premium-restaurant', label: 'Premium Restaurant' },
    { id: 'modern-pos', label: 'Modern POS' },
    { id: 'minimal-receipt', label: 'Minimal Receipt' }
];

const QR_TYPES = [
    { id: 'google-review', label: 'Google Review' },
    { id: 'website', label: 'Website' },
    { id: 'menu', label: 'Menu' },
    { id: 'upi', label: 'UPI Payment' }
];

const defaultSettings = {
    template: 'hotel-classic',
    invoiceTitle: 'TAX INVOICE',
    showLogo: true,
    showGstin: true,
    showFssai: true,
    showCustomerDetails: true,
    showWaiterName: false,
    showCashierName: false,
    showAmountInWords: true,
    showGstBreakdown: true,
    showServiceCharge: false,
    showQRCode: false,
    showFooter: true,
    showPax: false,
    qrType: 'website',
    qrPosition: 'footer-center',
    qrSize: 'small',
    qrUrl: '',
    thankYouMessage: 'Thank You For Visiting',
    visitAgainMessage: 'Please Visit Again',
    customerCareNumber: '',
    footerEmail: '',
    footerWebsite: '',
    customFooterNote: '',
    showPoweredBy: true
};

const InvoiceSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('business');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        tagline: '',
        gstin: '',
        fssai: '',
        alternatePhone: '',
        website: '',
        logo: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        contact: { phone: '', email: '' },
        invoiceSettings: { ...defaultSettings }
    });
    const queryClient = useQueryClient();

    const restaurantId = user?.restaurant?._id || user?.restaurant;

    const { data, isLoading } = useQuery({
        queryKey: ['invoice-settings', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/restaurant/${restaurantId}/invoice-settings`);
            return res.data.data;
        },
        enabled: !!restaurantId
    });

    useEffect(() => {
        if (data) {
            setForm({
                name: data.name || '',
                tagline: data.tagline || '',
                gstin: data.gstin || '',
                fssai: data.fssai || '',
                alternatePhone: data.alternatePhone || '',
                website: data.website || '',
                logo: data.logo || '',
                address: {
                    street: data.address?.street || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    zipCode: data.address?.zipCode || ''
                },
                contact: {
                    phone: data.contact?.phone || '',
                    email: data.contact?.email || ''
                },
                invoiceSettings: {
                    ...defaultSettings,
                    ...(data.invoiceSettings || {})
                }
            });
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: (payload) => api.patch(`/restaurant/${restaurantId}/invoice-settings`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['invoice-settings', restaurantId]);
            toast.success('Invoice settings saved');
        },
        onError: () => toast.error('Failed to save settings')
    });

    const handleField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingsField = (field, value) => {
        setForm(prev => ({
            ...prev,
            invoiceSettings: { ...prev.invoiceSettings, [field]: value }
        }));
    };

    const handleSave = () => {
        const payload = {
            tagline: form.tagline,
            gstin: form.gstin,
            fssai: form.fssai,
            alternatePhone: form.alternatePhone,
            website: form.website,
            invoiceSettings: form.invoiceSettings
        };
        saveMutation.mutate(payload);
    };

    if (isLoading) return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
        </div>
    );

    const inputClass = "w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all";
    const labelClass = "block text-sm font-medium text-gray-400 mb-1";
    const toggleClass = (on) => `relative w-10 h-5 rounded-full cursor-pointer transition-colors ${on ? 'bg-primary' : 'bg-gray-700'}`;

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <FileText className="text-primary" />
                                Invoice Settings
                            </h1>
                            <button onClick={handleSave} disabled={saveMutation.isPending}
                                className="bg-primary text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 text-sm">
                                {saveMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                Save Settings
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-900/50 p-1 rounded-xl overflow-x-auto">
                            {TABS.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* ─── BUSINESS INFO ─── */}
                            {activeTab === 'business' && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Restaurant Name</label>
                                            <input name="name" value={form.name} onChange={e => handleField('name', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Tagline</label>
                                            <input value={form.tagline} onChange={e => handleField('tagline', e.target.value)} placeholder="Fine Dining Restaurant" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Logo URL</label>
                                            <input value={form.logo} onChange={e => handleField('logo', e.target.value)} placeholder="https://..." className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Website</label>
                                            <input value={form.website} onChange={e => handleField('website', e.target.value)} placeholder="https://example.com" className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <h3 className="text-sm font-bold mb-3 text-gray-300">Address</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Street</label>
                                                <input value={form.address.street} onChange={e => handleField('address', { ...form.address, street: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>City</label>
                                                <input value={form.address.city} onChange={e => handleField('address', { ...form.address, city: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>State</label>
                                                <input value={form.address.state} onChange={e => handleField('address', { ...form.address, state: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>PIN Code</label>
                                                <input value={form.address.zipCode} onChange={e => handleField('address', { ...form.address, zipCode: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <h3 className="text-sm font-bold mb-3 text-gray-300">Contact</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Mobile Number</label>
                                                <input value={form.contact.phone} onChange={e => handleField('contact', { ...form.contact, phone: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Alternate Mobile</label>
                                                <input value={form.alternatePhone} onChange={e => handleField('alternatePhone', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input value={form.contact.email} onChange={e => handleField('contact', { ...form.contact, email: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-800 pt-4">
                                        <h3 className="text-sm font-bold mb-3 text-gray-300">Tax & License</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>GSTIN</label>
                                                <input value={form.gstin} onChange={e => handleField('gstin', e.target.value)} placeholder="07AABCU9603R1Z7" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>FSSAI Number</label>
                                                <input value={form.fssai} onChange={e => handleField('fssai', e.target.value)} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── INVOICE OPTIONS ─── */}
                            {activeTab === 'options' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-300">Template & Title</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Invoice Template</label>
                                                <select value={form.invoiceSettings.template} onChange={e => handleSettingsField('template', e.target.value)} className={inputClass}>
                                                    {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Invoice Title</label>
                                                <input value={form.invoiceSettings.invoiceTitle} onChange={e => handleSettingsField('invoiceTitle', e.target.value)} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-gray-300 mb-4">Display Options</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                ['showLogo', 'Show Logo'],
                                                ['showGstin', 'Show GSTIN'],
                                                ['showFssai', 'Show FSSAI'],
                                                ['showCustomerDetails', 'Show Customer Details'],
                                                ['showWaiterName', 'Show Waiter Name'],
                                                ['showCashierName', 'Show Cashier Name'],
                                                ['showAmountInWords', 'Show Amount in Words'],
                                                ['showGstBreakdown', 'Show GST Breakdown'],
                                                ['showServiceCharge', 'Show Service Charge'],
                                                ['showPax', 'Show PAX'],
                                                ['showQRCode', 'Show QR Code'],
                                                ['showFooter', 'Show Footer']
                                            ].map(([key, label]) => (
                                                <label key={key} className="flex items-center gap-3 cursor-pointer">
                                                    <div className={toggleClass(form.invoiceSettings[key])} onClick={() => handleSettingsField(key, !form.invoiceSettings[key])}>
                                                        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${form.invoiceSettings[key] ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                                    </div>
                                                    <span className="text-sm text-gray-300">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── QR SETTINGS ─── */}
                            {activeTab === 'qr' && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={toggleClass(form.invoiceSettings.showQRCode)} onClick={() => handleSettingsField('showQRCode', !form.invoiceSettings.showQRCode)}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${form.invoiceSettings.showQRCode ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                        </div>
                                        <span className="text-sm font-medium">Enable QR Code on Invoice</span>
                                    </label>

                                    {form.invoiceSettings.showQRCode && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>QR Type</label>
                                                    <select value={form.invoiceSettings.qrType} onChange={e => handleSettingsField('qrType', e.target.value)} className={inputClass}>
                                                        {QR_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>QR Position</label>
                                                    <select value={form.invoiceSettings.qrPosition} onChange={e => handleSettingsField('qrPosition', e.target.value)} className={inputClass}>
                                                        <option value="footer-center">Footer Center</option>
                                                        <option value="footer-right">Footer Right</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>QR Size</label>
                                                    <select value={form.invoiceSettings.qrSize} onChange={e => handleSettingsField('qrSize', e.target.value)} className={inputClass}>
                                                        <option value="small">Small (120px)</option>
                                                        <option value="medium">Medium (160px)</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className={labelClass}>QR URL</label>
                                                    <input value={form.invoiceSettings.qrUrl} onChange={e => handleSettingsField('qrUrl', e.target.value)} placeholder="https://example.com/review" className={inputClass} />
                                                </div>
                                            </div>

                                            {form.invoiceSettings.qrUrl && (
                                                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                                                    <p className="text-xs text-gray-400 mb-2">Preview</p>
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(form.invoiceSettings.qrUrl)}`}
                                                        alt="QR Preview" className="inline-block w-[120px] h-[120px]" crossOrigin="anonymous" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ─── FOOTER ─── */}
                            {activeTab === 'footer' && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={toggleClass(form.invoiceSettings.showFooter)} onClick={() => handleSettingsField('showFooter', !form.invoiceSettings.showFooter)}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${form.invoiceSettings.showFooter ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                        </div>
                                        <span className="text-sm font-medium">Show Footer on Invoice</span>
                                    </label>

                                    {form.invoiceSettings.showFooter && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Thank You Message</label>
                                                <input value={form.invoiceSettings.thankYouMessage} onChange={e => handleSettingsField('thankYouMessage', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Visit Again Message</label>
                                                <input value={form.invoiceSettings.visitAgainMessage} onChange={e => handleSettingsField('visitAgainMessage', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Customer Care Number</label>
                                                <input value={form.invoiceSettings.customerCareNumber} onChange={e => handleSettingsField('customerCareNumber', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Footer Email</label>
                                                <input value={form.invoiceSettings.footerEmail} onChange={e => handleSettingsField('footerEmail', e.target.value)} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Footer Website</label>
                                                <input value={form.invoiceSettings.footerWebsite} onChange={e => handleSettingsField('footerWebsite', e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Custom Footer Note</label>
                                                <textarea value={form.invoiceSettings.customFooterNote} onChange={e => handleSettingsField('customFooterNote', e.target.value)} rows={2} className={inputClass} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <div className={toggleClass(form.invoiceSettings.showPoweredBy)} onClick={() => handleSettingsField('showPoweredBy', !form.invoiceSettings.showPoweredBy)}>
                                                        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${form.invoiceSettings.showPoweredBy ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                                    </div>
                                                    <span className="text-sm text-gray-300">Show "Powered by Ritam Bharat POS"</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Preview Card */}
                        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-300">Preview</h3>
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                    {TEMPLATES.find(t => t.id === form.invoiceSettings.template)?.label || 'Hotel Classic'}
                                </span>
                            </div>
                            <div className="bg-white rounded-xl max-w-[320px] mx-auto shadow-lg overflow-hidden max-h-[600px] overflow-y-auto">
                                <PreviewRenderer form={form} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const templates = {
    'hotel-classic': HotelClassic,
    'premium-restaurant': PremiumRestaurant,
    'modern-pos': ModernPOS,
    'minimal-receipt': MinimalReceipt
};

const PreviewRenderer = ({ form }) => {
    const s = form.invoiceSettings;
    const order = {
        orderNumber: 'INV-0001',
        _id: 'abc123',
        createdAt: new Date().toISOString(),
        items: [
            { name: 'Paneer Butter Masala', quantity: 2, price: 249, specialInstructions: 'Extra Cheese' },
            { name: 'Butter Naan', quantity: 5, price: 45 },
            { name: 'Dal Makhani', quantity: 1, price: 195 }
        ],
        subtotal: 1008,
        tax: 50.4,
        total: 1058.4,
        gstBreakdown: { cgst: 25.2, sgst: 25.2, igst: 0 },
        discountAmount: 0,
        serviceChargeAmount: 0,
        tipAmount: 0,
        table: { name: 'T1' },
        orderType: 'DINE IN',
        pax: 4,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        customerName: 'Guest',
        waiterName: 'Rajesh'
    };

    const restaurant = {
        name: form.name || 'Rang Mahal',
        tagline: form.tagline || 'Fine Dining',
        gstin: form.gstin || '07AABCU9603R1Z7',
        fssai: form.fssai || '12345678901234',
        alternatePhone: form.alternatePhone,
        website: form.website,
        logo: form.logo || '',
        address: {
            street: form.address.street || '123 Main Street',
            city: form.address.city || 'City',
            state: form.address.state || 'State',
            zipCode: form.address.zipCode || '123456'
        },
        contact: {
            phone: form.contact.phone || '+91-9876543210',
            email: form.contact.email || 'info@restaurant.com'
        },
        invoiceSettings: s
    };

    const Template = templates[s.template] || HotelClassic;
    return <Template order={order} restaurant={restaurant} settings={s} type="display" />;
};

export default InvoiceSettings;
