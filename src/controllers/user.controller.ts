import { Request, Response } from "express";
import User from "../models/user.model";
import { validate } from "../middlewares/validate.middleware";
import { userValidation } from "../validator/user.validators";
import { LoggerService } from "../services/logger.service";


const logger = LoggerService.getInstance();

// For Admin User Management
// Create user with validation
export const createUser = [
  validate(userValidation.createUser),
  async (req: Request, res: Response) => {
    try {
      const user = new User(req.body);
      await user.save();

      // Remove sensitive data before sending response
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetPasswordToken;
      delete userObj.resetPasswordExpiresAt;

      res.status(201).json({ success: true, data: userObj });
    } catch (error) {
      if ((error as any).code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      res
        .status(400)
        .json({ success: false, message: (error as Error)?.message });
    }
  },
];
// For Admin User Management
// Update user with validation
export const updateUser = [
  validate(userValidation.updateUser),
  async (req: Request, res: Response) => {
    try {
      const updates = Object.keys(req.body);
      const allowedUpdates = [
        "email",
        "profile",
        "addresses",
        "preferences",
        "status",
      ];
      const isValidOperation = updates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message: "Invalid updates!",
        });
      }

      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.resetPasswordToken;
      delete userObj.resetPasswordExpiresAt;

      res.status(200).json({ success: true, data: userObj });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  },
];

// For User Profile Management (not admin)
// Update profile with validation
export const updateProfile = [
  validate(userValidation.updateProfile),
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, phoneNumber, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          $set: {
            "profile.firstName": firstName,
            "profile.lastName": lastName,
            "profile.phoneNumber": phoneNumber,
            "profile.avatar": avatar,
          },
        },
        { new: true }
      );

      const userObj = user?.toObject();
      delete userObj?.password;

      res.status(200).json({ success: true, data: userObj });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  },
];

// Add address with validation
export const addAddress = [
  validate(userValidation.address),
  async (req: Request, res: Response) => {
    try {
      // Check if setting as default, unset other defaults of same type
      if (req.body.isDefault) {
        await User.updateOne(
          { _id: req.userId, "addresses.type": req.body.type },
          { $set: { "addresses.$[].isDefault": false } }
        );
      }

      const userById = await User.findOne({
        _id: req.userId,
      });

      if (userById?.addresses?.length === 4) {
        return res.status(404).json({
          success: false,
          message: "You can only have 4 addresses",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $push: { addresses: req.body } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: user?.addresses,
      });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  },
];

// Update address
export const updateAddress = [
    validate(userValidation.address),
    async (req: Request, res: Response) => {
      try {
        const { addressId } = req.params;
        
        // If setting as default, unset other defaults of same type
        if (req.body.isDefault) {
          await User.updateOne(
            { _id: req.userId, 'addresses.type': req.body.type },
            { $set: { 'addresses.$[].isDefault': false } }
          );
        }
        
        const user = await User.findOneAndUpdate(
          { _id: req.userId, 'addresses._id': addressId },
          { $set: { 'addresses.$': req.body } },
          { new: true, select: 'addresses' }
        );
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: 'Address not found' 
          });
        }
        
        res.status(200).json({ 
          success: true, 
          message: 'Address updated successfully',
          data: user.addresses
        });
      } catch (error) {
        logger.error(`Update address error: ${(error as Error).message}`);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  ]


  // Delete address
  export const deleteAddress =  async (req: Request, res: Response) => {
    try {
      const { addressId } = req.params;
      
      const user = await User.findByIdAndUpdate(
        req.userId,
        { $pull: { addresses: { _id: addressId } } },
        { new: true, select: 'addresses' }
      );
      
      res.status(200).json({ 
        success: true, 
        message: 'Address deleted successfully',
        data: user?.addresses
      });
    } catch (error) {
      logger?.error(`Delete address error: ${(error as Error).message}`);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

// Update preferences with validation
export const updatePreferences = [
  validate(userValidation.preferences),
  async (req: Request, res: Response) => {
    try {
      const { language, currency, notifications, marketing } = req.body;
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          $set: {
            "preferences.language": language,
            "preferences.currency": currency,
            "preferences.notifications": notifications,
            "preferences.marketing": marketing,
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: user?.preferences,
      });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  },
];

// Update notification preferences with validation
export const updateNotificationPrefs = [
  validate(userValidation.notificationPrefs),
  async (req: Request, res: Response) => {
    try {
      const { email, push, sms } = req.body;
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          $set: {
            "preferences.notifications.email": email,
            "preferences.notifications.push": push,
            "preferences.notifications.sms": sms,
          },
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: user?.preferences?.notifications,
      });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: (error as Error).message });
    }
  },
];
