import { Request, Response, NextFunction } from 'express';
import VendorVerification from '../models/vendor-verification.model';
import { ComplianceService } from '../services/compliance.service';
import { DecisionEngineService } from '../services/decision-engine.service';

export class AdminVerificationController {
  // Get all pending verifications
  static async getPendingVerifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      
      const filter: any = {};
      if (status) filter.overallStatus = status;

      const verifications = await VendorVerification.find(filter)
        .populate('userId', 'profile.firstName profile.lastName email')
        .sort({ submittedAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await VendorVerification.countDocuments(filter);

      res.json({
        success: true,
        verifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get detailed verification info
  static async getVerificationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationId } = req.params;
      
      const verification = await VendorVerification.findById(verificationId)
        .populate('userId', 'profile email')
        .populate('reviewedBy', 'profile.firstName profile.lastName');

      if (!verification) {
        return res.status(404).json({ success: false, message: 'Verification not found' });
      }

      // Calculate risk score
      const riskScore = DecisionEngineService.calculateRiskScore(verification);

      res.json({
        success: true,
        verification,
        riskScore
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate compliance report
  static async generateComplianceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await ComplianceService.generateComplianceReport(start, end);

      res.json({
        success: true,
        report
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk approve/reject verifications
  static async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationIds, action, notes } = req.body;
      const reviewerId = req.userId;

      const results = await Promise.allSettled(
        verificationIds.map(async (id: string) => {
          await VendorVerification.findByIdAndUpdate(id, {
            overallStatus: action,
            reviewNotes: notes,
            reviewedAt: new Date(),
            reviewedBy: reviewerId
          });

          // Execute decision
          const verification = await VendorVerification.findById(id);
          if (verification) {
            await DecisionEngineService.evaluateApplication(id);
          }

          return id;
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.json({
        success: true,
        message: `Bulk action completed: ${successful} successful, ${failed} failed`,
        results: { successful, failed }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get verification statistics
  static async getVerificationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await VendorVerification.aggregate([
        {
          $group: {
            _id: '$overallStatus',
            count: { $sum: 1 },
            avgProcessingTime: {
              $avg: {
                $subtract: ['$reviewedAt', '$submittedAt']
              }
            }
          }
        }
      ]);

      const totalApplications = await VendorVerification.countDocuments();
      const recentApplications = await VendorVerification.countDocuments({
        submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      res.json({
        success: true,
        stats: {
          total: totalApplications,
          recent: recentApplications,
          byStatus: stats,
          avgProcessingTime: stats.reduce((sum, s) => sum + (s.avgProcessingTime || 0), 0) / stats.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}