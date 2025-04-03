declare namespace Express {
    export interface Request {
      user?: {
        id: string;
        // add other user properties you need
      };
    }
  }