export default interface Vendor {
    _id?: string;
    userId: string;
    accountType: 'personal' | 'business';
    kycStatus: 'pending' | 'verified' | 'rejected';
    businessInfo?: {
        name: string;
        registrationnumber: string;
        taxId: string;
        address: {
            street: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
        };
    };
    bankDetails?: {
        accountHolder: string;
        accountnumber: string;
        bankName: string;
        swiftCode: string;
    };
    sellingLimits?: {
        maxProducts: number | null;
    }
    ratings?: {
        average: number;
        count: number;
    };
    analytics: {
        totalSales: number,
        totalRevenue: number,
        averageRating: number,
        productCount: number
    };
    settings: {
        autoAcceptOrders: boolean;
        minOrderAmount: number;
        shippingMethods: [{
            name: string;
            price: number;
            estimatedDays: number;
        }]
    };
    status: 'pending' | 'active' | 'suspended';
    createdAt?: Date;
    updatedAt?: Date;
}