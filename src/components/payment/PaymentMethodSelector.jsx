import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentMethodSelector = ({ currency = 'INR', onSelect, selectedMethod }) => {
    const [availableMethods, setAvailableMethods] = useState([]);

    useEffect(() => {
        setAvailableMethods([
            {
                id: 'UPI',
                name: 'UPI',
                icon: Smartphone,
                description: 'Google Pay, PhonePe, Paytm'
            },
            {
                id: 'CARD',
                name: 'Card',
                icon: CreditCard,
                description: 'Debit / Credit Card'
            },
            {
                id: 'CASH',
                name: 'Cash',
                icon: Building2,
                description: 'Cash payment'
            }
        ]);
    }, []);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;

                    return (
                        <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(method.id, 'MANUAL')}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                                    p-2 rounded-lg
                                    ${isSelected
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }
                                `}>
                                    <Icon size={20} />
                                </div>

                                <div className="flex-1 text-left">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {method.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {method.description}
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentMethodSelector;
