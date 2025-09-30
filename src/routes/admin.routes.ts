import { Router, Request, Response, NextFunction } from "express";
import { verifyToken } from "../middlewares/verify-token.middleware";
import { requirePermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";
import { CountryController, SubscriptionPlanController, VenodrManagenentController } from "../controllers/admin.controller";
import * as countryController from "../controllers/country.controller";
import * as paymentOptionsController from "../controllers/payment-options.controller";
import { CategoryController } from "../controllers/category.controller";
import * as refundController from "../controllers/refund.controller";
import * as vendorPayoutController from "../controllers/vendor-payout.controller";

const router = Router();

// Country Management Routes
router.get("/countries", verifyToken, countryController.getAllCountries);
router.get("/countries/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), countryController.getCountryStats);
router.get("/countries/:id", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), countryController.getCountryById);
router.post("/countries", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), countryController.createCountry);
router.put("/countries/:id", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), countryController.updateCountry);
router.patch("/countries/:id/delist", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), countryController.delistCountry);
router.patch("/countries/:id/payment-options", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), countryController.updatePaymentOptions);
router.delete("/countries/:id", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), countryController.deleteCountry);

// Payment Options Management Routes
router.get("/payment-options", verifyToken, paymentOptionsController.getPaymentOptions);
router.post("/payment-options", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), paymentOptionsController.createPaymentOption);
router.put("/payment-options/:id", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), paymentOptionsController.updatePaymentOption);
router.delete("/payment-options/:id", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), paymentOptionsController.deletePaymentOption);

// Category Management Routes
router.get("/categories", verifyToken, requirePermission([PERMISSIONS.CREATE_CATEGORIES]), CategoryController.getAllCategories);
router.get("/categories/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getCategoriesStats);
router.get("/categories/:id", verifyToken, requirePermission([PERMISSIONS.CREATE_CATEGORIES]), CategoryController.getCategory);
router.post("/categories", verifyToken, requirePermission([PERMISSIONS.CREATE_CATEGORIES]), CategoryController.createCategory);
router.put("/categories/:id", verifyToken, requirePermission([PERMISSIONS.EDIT_CATEGORIES]), CategoryController.updateCategory);
router.patch("/categories/:categoryId/status", verifyToken, requirePermission([PERMISSIONS.EDIT_CATEGORIES]), VenodrManagenentController.disableCategory);
router.delete("/categories/:id", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), CategoryController.deleteCategory);

// Subscription Plan Management Routes
router.get("/plans", verifyToken, SubscriptionPlanController.getPlans);
router.get("/plans/vendors/:vendorId", verifyToken, SubscriptionPlanController.getPlans);
router.get("/plans/:planId", verifyToken, SubscriptionPlanController.getPlanById);
router.post("/plans", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), SubscriptionPlanController.createPlan);
router.put("/plans/:planId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), SubscriptionPlanController.updatePlan);
router.delete("/plans/:planId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), SubscriptionPlanController.deletePlan);

// Vendor Management Routes
router.get("/vendors", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getAllVendors);
router.get("/vendors/stats", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getVendorsStats);
router.get("/vendors/suspended", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getSuspendedVendors);
router.get("/vendors/:vendorId", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getVendor);
router.get("/vendors/:vendorId/products", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getVendorProducts);
router.get("/vendors/:vendorId/orders", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getVendorOrders);
router.get("/vendors/:vendorId/top-products", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getTopSellingProducts);
router.post("/vendors/:vendorId/warning", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.sendWarning);
router.patch("/vendors/:vendorId/suspend", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.suspendVendor);
router.patch("/vendors/:vendorId/unsuspend", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.unsuspendVendor);

// Order Management Routes
router.get("/orders", verifyToken, requirePermission([PERMISSIONS.VIEW_TRANSACTIONS]), VenodrManagenentController.getAllOrders);
router.get("/orders/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getOrderStats);
router.patch("/orders/:orderId/receive", verifyToken, requirePermission([PERMISSIONS.VET_PRODUCTS]), VenodrManagenentController.markItemInOrderAsReceived);
router.patch("/orders/vendors/:vendorId/reject", verifyToken, requirePermission([PERMISSIONS.VET_PRODUCTS]), VenodrManagenentController.rejectItemInOrderForVendor);

// Admin Management Routes
router.post("/admins", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.createAdminController);
router.get("/admins", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.getAllAdmins);
router.patch("/admins/:adminId/suspend", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.suspendAdmin);
router.patch("/admins/:adminId/unsuspend", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.unsuspendAdmin);
router.put("/admins/:adminId/role", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.changeAdminRole);
router.get("/admins/:adminId/logs", verifyToken, requirePermission([PERMISSIONS.AUDIT_LOGS]), VenodrManagenentController.getAdminLogs);

// User Management Routes
router.get("/users", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.getAllUsers);
router.get("/users/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getUserStats);
router.get("/users/:userId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.getUserById);
router.put("/users/:userId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.updateUser);
router.delete("/users/:userId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.deleteUser);

// Logistics Management Routes
router.get("/logistics", verifyToken, requirePermission([PERMISSIONS.TRACK_SHIPMENTS]), VenodrManagenentController.getLogistics);
router.get("/logistics/shipping-stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getShippingStats);
router.patch("/logistics/orders/:orderId/shipping", verifyToken, requirePermission([PERMISSIONS.MANAGE_DISPATCH]), VenodrManagenentController.updateShippingStatus);

// Listings Management Routes
router.get("/listings", verifyToken, requirePermission([PERMISSIONS.APPROVE_PRODUCTS]), VenodrManagenentController.getListingStats);


// Vendor Verification Routes
router.get("/vendors/:vendorId/documents", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getVendorVerificationDocuments);
router.patch("/vendors/:vendorId/accept", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.acceptVendorApplication);
router.patch("/vendors/:vendorId/reject", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.rejectVendorApplication);


// Issue Management Routes
router.get("/issues", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES]), VenodrManagenentController.getAllIssues);
router.get("/issues/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS, PERMISSIONS.RESOLVE_DISPUTES]), VenodrManagenentController.getIssueStats);
router.patch("/issues/:issueId/status", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES, PERMISSIONS.RESPOND_TICKETS, PERMISSIONS.ESCALATE_ISSUES]), VenodrManagenentController.updateIssueStatus);


// Refund Management Routes
router.post("/refunds/:issueId/process", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES]), refundController.processRefund);
router.get("/refunds/:issueId/eligibility", verifyToken, requirePermission([PERMISSIONS.RESOLVE_DISPUTES]), refundController.getRefundEligibility);

// Payout Management Routes (Admin view/approval)
router.get("/:vendorId/payouts", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), vendorPayoutController.getAllPayouts);
router.patch("/:vendorId/payouts/:payoutId/approve", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), vendorPayoutController.approvePayout);
router.patch("/:vendorId/payouts/:payoutId/reject", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), vendorPayoutController.rejectPayout);

// Finance Management Routes
router.get("/finance/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getFinanceStats);
router.get("/finance/analytics", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getRevenueAnalytics);
router.get("/finance/transactions", verifyToken, requirePermission([PERMISSIONS.VIEW_TRANSACTIONS]), VenodrManagenentController.getAllTransactions);
router.get("/finance/withdrawals", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getWithdrawals);
router.patch("/finance/withdrawals/:withdrawalId/approve", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.approveWithdrawal);
router.patch("/finance/withdrawals/:withdrawalId/reject", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.rejectWithdrawal);

// Banner Management
router.post("/banners", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.createBanner);
router.get("/banners", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.getBanners);
router.get("/banners/analytics", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getBannerAnalytics);
router.put("/banners/:bannerId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.updateBanner);
router.delete("/banners/:bannerId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.deleteBanner);

// Policy Management
router.post("/policies", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.createPolicy);
router.get("/policies", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.getPolicies);
router.put("/policies/:policyId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.updatePolicy);
router.delete("/policies/:policyId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.deletePolicy);
router.patch("/policies/:policyId/publish", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.publishPolicy);

// FAQ Management
router.post("/faqs", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.createFAQ);
router.get("/faqs", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.getFAQs);
router.put("/faqs/:faqId", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.editFAQ);
router.delete("/faqs/:faqId", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.deleteFAQ);
router.get("/faqs/stats", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.getFAQStats);

// Notification Management
router.post("/notifications", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.createNotification);
router.patch("/notifications/:notificationId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.updateNotification);
router.delete("/notifications/:notificationId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.deleteNotification);

// Advertisement Management
router.get("/advertisements", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.getAdvertisements);
router.patch("/advertisements/:adId/approve", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.approveAdvertisement);
router.patch("/advertisements/:adId/reject", verifyToken, requirePermission([PERMISSIONS.MANAGE_VENDORS]), VenodrManagenentController.rejectAdvertisement);

// Promotion Management
router.post("/promotions", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.createPromotion);
router.get("/promotions", verifyToken, requirePermission([PERMISSIONS.MANAGE_SETTINGS]), VenodrManagenentController.getPromotions);
router.put("/promotions/:promotionId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.updatePromotion);
router.delete("/promotions/:promotionId", verifyToken, requirePermission([PERMISSIONS.FULL_ACCESS]), VenodrManagenentController.deletePromotion);

// Reports Routes
router.get("/reports/orders", verifyToken, requirePermission([PERMISSIONS.VIEW_REPORTS]), VenodrManagenentController.generateOrderReport);

export default router;