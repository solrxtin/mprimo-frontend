
import { Request, Response } from 'express';
import paystack from 'paystack-node';
import Vendor from '../models/vendor.model';

const paystackApi = new paystack(process.env.PAYSTACK_SECRET_KEY!);

export const getSupportedCountries = async (req: Request, res: Response) => {
    try {
        const response = await paystackApi.misc.list_countries();
        res.json({ success: true, countries: response.data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBankList = async (req: Request, res: Response) => {
    try {
        const { country } = req.query;
        const response = await paystackApi.misc.list_banks({ country });
        res.json({ success: true, banks: response.data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const resolveAccount = async (req: Request, res: Response) => {
    try {
        const { accountNumber, bankCode } = req.body;
        const response = await paystackApi.verification.resolveAccount({
            account_number: accountNumber,
            bank_code: bankCode,
        });

        res.json({ success: true, data: response.data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const resolveBvn = async (req: Request, res: Response) => {
    try {
        const { bvn } = req.body;
        const response = await paystackApi.verification.resolveBvn({ bvn });

        res.json({ success: true, data: response.data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const createSubaccount = async (req: Request, res: Response) => {
    try {
        const { businessName, settlementBank, accountNumber, percentageCharge } = req.body;
        const response = await paystackApi.subaccount.create({
            business_name: businessName,
            settlement_bank: settlementBank,
            account_number: accountNumber,
            percentage_charge: percentageCharge,
        });

        // Store the subaccount_code in your vendor model
        const vendor = await Vendor.findOneAndUpdate(
            { userId: req.userId },
            { paystackSubaccountCode: response.data.subaccount_code },
            { new: true }
        );

        res.json({ success: true, data: response.data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
