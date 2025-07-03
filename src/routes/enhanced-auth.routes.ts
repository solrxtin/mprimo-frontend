// Example: Enhanced auth routes (add to your existing auth routes)
import { Router } from 'express';
import { auditAuth, auditSensitive } from '../middlewares/audit-logger.middleware';
import { strictRateLimit, moderateRateLimit } from '../middlewares/enhanced-rate-limit.middleware';

// Add these middlewares to your existing auth routes:

// For login route - add audit logging
// router.post('/login', auditAuth, yourExistingLoginHandler);

// For password change - add both rate limiting and audit logging
// router.post('/change-password', strictRateLimit, auditSensitive, yourExistingPasswordChangeHandler);

// For registration - add audit logging
// router.post('/register', auditAuth, yourExistingRegisterHandler);

// Example of how to enhance your existing route:
/*
// BEFORE:
router.post('/login', async (req, res) => {
  // your existing login logic
});

// AFTER (just add the middleware):
router.post('/login', auditAuth, async (req, res) => {
  // your existing login logic - no changes needed
});
*/