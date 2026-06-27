import Restaurant from '../models/Restaurant.js';
import cache from '../utils/cache.js';

export const getInvoiceSettings = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).select('name invoiceSettings logo address contact tagline gstin fssai alternatePhone website');
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
        next(error);
    }
};

export const updateInvoiceSettings = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const { invoiceSettings, tagline, gstin, fssai, alternatePhone, website } = req.body;

        if (invoiceSettings) {
            const existing = restaurant.invoiceSettings?.toObject?.() || {};
            restaurant.invoiceSettings = { ...existing, ...invoiceSettings };
        }
        if (tagline !== undefined) restaurant.tagline = tagline;
        if (gstin !== undefined) restaurant.gstin = gstin;
        if (fssai !== undefined) restaurant.fssai = fssai;
        if (alternatePhone !== undefined) restaurant.alternatePhone = alternatePhone;
        if (website !== undefined) restaurant.website = website;

        await restaurant.save();
        await cache.del(cache.keys.restaurant(req.params.id));

        res.status(200).json({
            success: true,
            message: 'Invoice settings updated successfully',
            data: {
                invoiceSettings: restaurant.invoiceSettings,
                tagline: restaurant.tagline,
                gstin: restaurant.gstin,
                fssai: restaurant.fssai,
                alternatePhone: restaurant.alternatePhone,
                website: restaurant.website
            }
        });
    } catch (error) {
        next(error);
    }
};
