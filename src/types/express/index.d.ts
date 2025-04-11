import {ObjectId} from "mongoose"

declare global {
  namespace Express {
    interface Request {
      user: {
        _id: ObjectId;
        email: string;
        role: string;  // Add any other user properties you need here
      };
      userId: ObjectId
    }
  }
}