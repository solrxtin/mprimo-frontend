import { Request, Response } from 'express';
import Wallet from '../models/wallet.model';


export const getWalletActivities = async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user',
      });
    }

    // Sort transactions by date descending
    const sorted = wallet.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Paginate manually since transactions are embedded
    const paginatedTransactions = sorted.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: 'Wallet activities fetched successfully',
      walletInfo: {
        balance: wallet.balance,
        pending: wallet.pending,
        currency: wallet.currency,
      },
      activities: paginatedTransactions,
      pagination: {
        total: wallet.transactions.length,
        currentPage: page,
        limit,
        pages: Math.ceil(wallet.transactions.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching wallet activities:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching wallet activities',
    });
  }
};