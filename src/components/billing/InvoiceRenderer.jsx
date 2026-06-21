import HotelClassic from './templates/HotelClassic';
import PremiumRestaurant from './templates/PremiumRestaurant';
import ModernPOS from './templates/ModernPOS';
import MinimalReceipt from './templates/MinimalReceipt';

const templates = {
    'hotel-classic': HotelClassic,
    'premium-restaurant': PremiumRestaurant,
    'modern-pos': ModernPOS,
    'minimal-receipt': MinimalReceipt
};

const InvoiceRenderer = ({ order, restaurant, settings, type = 'display' }) => {
    const templateName = settings?.template || 'hotel-classic';
    const Template = templates[templateName] || HotelClassic;

    return (
        <Template
            order={order}
            restaurant={restaurant}
            settings={settings}
            type={type}
        />
    );
};

export default InvoiceRenderer;
