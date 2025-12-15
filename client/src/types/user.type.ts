

export interface User {
    _id: string;
    email: string;
    password?: string;
    businessName?: string;
    country: string;
    profile: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        avatar?: string;
        sex?: string;
    };
    addresses?: Array<{
        _id?: string;
        type: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        isDefault: boolean;
    }>;
    socialLogins?: Array<{
        provider: string;
        providerId: string;
    }>;
    role: 'user' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    canMakeSales: boolean;
    preferences: {
        language?: string;
        currency?: string;
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        },
        marketing?: boolean;
    };
    activity: {
        lastLogin?: Date;
        lastPurchase?: Date;
        totalOrders?: number;
        totalSpent?: number;
    };
    cart?: Array<{
        product: string;
        quantity: number;
        price: number;
        selectedVariant: string;
        addedAt: Date;
    }>; 
    wishlist?: Array<string>;
    createdAt?: Date;
    updatedAt?: Date;
    resetPasswordToken?: string;
    resetPasswordExpiresAt?: Date;
    verificationToken: string;
    verificationTokenExpiresAt: Date;
    isEmailVerified: boolean;
    twoFactorAuth: {
        enabled: boolean;
        secret?: string;
        tempSecret?: string;
        backupCodes?: string[];
    };
    vendorInfo: string;
}