import TaxSlab from '../models/TaxSlab.js';

export const getTaxInfo = async (restaurantId, restaurantDoc) => {
    let slabRate = restaurantDoc?.taxRate || 0;
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let taxSlabId = null;
    let isGstEnabled = false;

    try {
        const defaultSlab = await TaxSlab.findOne({ restaurant: restaurantId, isDefault: true });
        if (defaultSlab && defaultSlab.rate > 0) {
            slabRate = defaultSlab.rate;
            cgstRate = defaultSlab.cgstRate || slabRate / 2;
            sgstRate = defaultSlab.sgstRate || slabRate / 2;
            igstRate = defaultSlab.igstRate || slabRate;
            taxSlabId = defaultSlab._id;
            isGstEnabled = true;
        }
    } catch (e) {
        // GST slab lookup failed, fall back to restaurant taxRate
    }

    return { slabRate, cgstRate, sgstRate, igstRate, taxSlabId, isGstEnabled };
};

export const calculateTax = (subtotal, slabRate) => {
    return (subtotal * slabRate) / 100;
};

export const calculateGstBreakdown = (subtotal, cgstRate, sgstRate, igstRate) => {
    return {
        cgst: (subtotal * cgstRate) / 100,
        sgst: (subtotal * sgstRate) / 100,
        igst: (subtotal * igstRate) / 100
    };
};
