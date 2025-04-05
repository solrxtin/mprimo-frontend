import {User} from "../types/user.type"
import {ObjectId} from "mongoose"

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId: ObjectId
    }
  }
}