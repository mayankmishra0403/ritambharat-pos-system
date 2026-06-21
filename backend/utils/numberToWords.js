const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertBelowThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelowThousand(n % 100) : '');
};

export const numberToWords = (num) => {
    if (num === 0) return 'Zero';

    const isNegative = num < 0;
    num = Math.abs(num);

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = Math.round(num % 100);

    let result = '';
    if (crore > 0) result += convertBelowThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertBelowThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertBelowThousand(thousand) + ' Thousand ';
    if (hundred > 0) result += ones[hundred] + ' Hundred ';
    if (remainder > 0) result += convertBelowThousand(remainder);

    const paise = Math.round((num - Math.floor(num)) * 100);
    if (paise > 0) {
        result += 'and ' + convertBelowThousand(paise) + ' Paise';
    }

    result = result.trim() + ' Only';
    return (isNegative ? 'Minus ' : '') + result;
};

export default numberToWords;
