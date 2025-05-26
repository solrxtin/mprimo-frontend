import { Request, Response } from "express";
import User from "../models/user.model";
import { LoggerService } from "../services/logger.service";

const logger = LoggerService.getInstance();

/// Helper function to handle validation errors
function handleValidationError(error: any, res: Response) {
  if ((error as Error).name === 'ValidationError') {
    const validationError = error as { errors: Record<string, { path: string; message: string }> };
    const errors = Object.values(validationError.errors).map((err) => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  if ('code' in error && (error as { code: number }).code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Email already exists"
    });
  }

  logger.error(`Server error: ${(error as Error).message}`);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
}
// Get user profile (Authenticated)


// Admin-only endpoints
export const adminController = {
  getProfile : async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.userId)
        .select('-password -resetPasswordToken -resetPasswordExpiresAt -twoFactorAuth.secret -role');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
  
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      handleValidationError(error, res);
    }
  },
  // List all users (Admin)
  listUsers: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, role, status } = req.query;
      const query: any = {};
      
      if (role) query.role = role;
      if (status) query.status = status;

      const users = await User.find(query)
        .select('-password -resetPasswordToken -twoFactorAuth')
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  },

  // Get user by ID (Admin)
  getUser: async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password -resetPasswordToken -twoFactorAuth.secret');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      handleValidationError(error, res);
    }
  },

  // Update user status (Admin)
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: user,
        message: "User status updated"
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  },


// Update user (Admin)
 updateUser : async (req: Request, res: Response) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["email", "profile", "addresses", "preferences", "status"];
    
    if (!updates.every(update => allowedUpdates.includes(update))) {
      return res.status(400).json({
        success: false,
        message: "Invalid updates!"
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpiresAt;

    res.status(200).json({ success: true, data: userObj });
  } catch (error) {
    handleValidationError(error, res);
  }
},

// Update profile
updateProfile : async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phoneNumber, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          "profile.firstName": firstName,
          "profile.lastName": lastName,
          "profile.phoneNumber": phoneNumber,
          "profile.avatar": avatar
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.twoFactorAuth?.secret;
    delete userObj.socialLogins;
    delete (userObj as { role?: string }).role;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpiresAt;

    res.status(200).json({ success: true, data: userObj });
  } catch (error) {
    handleValidationError(error, res);
  }
},

// Add address
addAddress : async (req: Request, res: Response) => {
  try {
    // Check address limit
    const user = await User.findById(req.userId);
    if ((user?.addresses ?? []).length >= 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum of 4 addresses allowed"
      });
    }

    // Handle default address
    if (req.body.isDefault) {
      await User.updateOne(
        { _id: req.userId, "addresses.type": req.body.type },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $push: { addresses: req.body } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser?.addresses
    });
  } catch (error) {
    handleValidationError(error, res);
  }
},
// Get addresses
getAddresses : async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId)
      .select("addresses")
      .populate("addresses.type", "name");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: user.addresses 
    });
  } catch (error) {
    handleValidationError(error, res);
  }
},

// Update address
updateAddress : async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;
    
    if (req.body.isDefault) {
      await User.updateOne(
        { _id: req.userId, "addresses.type": req.body.type },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }
    
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "addresses._id": addressId },
      { $set: { "addresses.$": req.body } },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: user.addresses
    });
  } catch (error) {
    handleValidationError(error, res);
  }
},

// Delete address
deleteAddress : async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );
    
    res.status(200).json({ 
      success: true, 
      data: user?.addresses
    });
  } catch (error) {
    logger.error(`Delete address error: ${(error as Error).message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
},

// Update preferences
updatePreferences : async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { preferences: req.body } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    handleValidationError(error, res);
  }
}
}
