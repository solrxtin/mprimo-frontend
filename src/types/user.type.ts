
export interface User {
    email: string;
    password: string;
    profile: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        avatar: string;
    };
    addresses: [{
        type: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        isDefault: boolean;
    }];
    socialLogins: [{
        provider: string;
        providerId: string;
    }];
    role: 'customer' | 'vendor' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    preferences: {
        language: string;
        currency: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        },
        marketing: boolean;
    },
    activity: {
        lastLogin: Date;
        lastPurchase: Date;
        totalOrders: number;
        totalSpent: number;
    };
    createdAt: Date;
    updatedAt: Date;
}