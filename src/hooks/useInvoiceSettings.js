import { useQuery } from '@tanstack/react-query';
import api from '../config/api';

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

const defaultRestaurant = {
    name: 'Restaurant',
    tagline: '',
    gstin: '',
    fssai: '',
    alternatePhone: '',
    website: '',
    logo: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    contact: { phone: '', email: '' }
};

export function useInvoiceSettings(restaurantId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['invoice-settings', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return null;
            const res = await api.get(`/restaurant/${restaurantId}/invoice-settings`);
            return res.data.data;
        },
        enabled: !!restaurantId,
        staleTime: 300000
    });

    const settings = data?.invoiceSettings || defaultSettings;
    const restaurant = {
        ...defaultRestaurant,
        ...data,
        invoiceSettings: settings
    };

    return { restaurant, settings, isLoading, error };
}
