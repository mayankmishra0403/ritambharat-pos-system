import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'owner@foodcourt.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Test@123!';
        const adminName = process.env.ADMIN_NAME || 'Restaurant Owner';
        const restaurantName = process.env.RESTAURANT_NAME || 'Food Court';

        // Check if admin already exists
        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log(`Admin already exists: ${admin.email}`);
        } else {
            admin = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: 'OWNER',
                emailVerified: true
            });
            console.log(`Admin created: ${admin.email} / ${adminPassword}`);
        }

        // Check if restaurant exists
        let restaurant = await Restaurant.findOne({ owner: admin._id });
        if (restaurant) {
            console.log(`Restaurant already exists: ${restaurant.name}`);
        } else {
            restaurant = await Restaurant.create({
                name: restaurantName,
                owner: admin._id,
                taxRate: 0,
                currency: 'INR',
                timezone: 'Asia/Kolkata',
                paymentGateway: 'CASH',
                address: 'Your Restaurant Address',
                phone: '+91-9876543210'
            });
            admin.restaurant = restaurant._id;
            await admin.save();
            console.log(`Restaurant created: ${restaurant.name}`);
        }

        // Create staff users
        const staffConfig = [
            { name: process.env.STAFF_CASHIER_NAME || 'Cashier One', pin: process.env.STAFF_CASHIER_PIN || '1234', role: 'CASHIER' },
            { name: process.env.STAFF_WAITER_NAME || 'Waiter One', pin: process.env.STAFF_WAITER_PIN || '5678', role: 'WAITER' },
            { name: process.env.STAFF_CHEF_NAME || 'Chef One', pin: process.env.STAFF_CHEF_PIN || '0000', role: 'CHEF' },
        ];

        for (const staff of staffConfig) {
            const existing = await User.findOne({ pin: staff.pin, restaurant: restaurant._id });
            if (existing) {
                console.log(`${staff.role} already exists: PIN ${staff.pin}`);
            } else {
                await User.create({
                    name: staff.name,
                    email: `${staff.role.toLowerCase()}@${restaurantName.toLowerCase().replace(/\s+/g, '')}.com`,
                    password: 'staff@123',
                    role: staff.role,
                    pin: staff.pin,
                    restaurant: restaurant._id,
                    emailVerified: true
                });
                console.log(`${staff.role} created: ${staff.name} (PIN: ${staff.pin})`);
            }
        }

        console.log('\n✓ Seed complete!');
        console.log('\n── Login Credentials ──');
        console.log(`Admin:     ${adminEmail} / ${adminPassword}`);
        console.log(`Cashier:   PIN ${process.env.STAFF_CASHIER_PIN || '1234'}`);
        console.log(`Waiter:    PIN ${process.env.STAFF_WAITER_PIN || '5678'}`);
        console.log(`Chef:      PIN ${process.env.STAFF_CHEF_PIN || '0000'}`);
        console.log(`Restaurant: ${restaurantName}`);
        console.log('────────────────────────\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
