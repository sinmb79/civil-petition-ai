declare global {
  namespace Express {
    interface Request {
      request_id?: string;
    }
  }
}

export {};
