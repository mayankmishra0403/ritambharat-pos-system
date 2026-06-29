import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Restaurant from '../models/Restaurant.js';
import WhatsAppCredit from '../models/WhatsAppCredit.js';
import CreditTransaction from '../models/CreditTransaction.js';

const seedWhatsAppCredits = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const restaurants = await Restaurant.find({ isDeleted: { $ne: true } });
        console.log(`Found ${restaurants.length} active restaurants`);

        let created = 0;
        let skipped = 0;

        for (const r of restaurants) {
            const existing = await WhatsAppCredit.findOne({ restaurant: r._id });
            if (existing) {
                skipped++;
                continue;
            }

            await WhatsAppCredit.create({
                restaurant: r._id,
                balance: 10,
                totalCredited: 10
            });

            await CreditTransaction.create({
                restaurant: r._id,
                type: 'credit',
                amount: 10,
                balanceBefore: 0,
                balanceAfter: 10,
                messageType: 'initial_credit',
                description: 'Initial free credits (seed)'
            });

            console.log(`  Created ₹10 credit for ${r.name} (${r.code})`);
            created++;
        }

        console.log(`\nDone: ${created} created, ${skipped} skipped`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedWhatsAppCredits();
