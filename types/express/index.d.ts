import { User as PrismaUser, Note as PrismaNote } from "@prisma/client";

declare global {
  namespace Express {
    export interface Request {
      user?: PrismaUser;
      note?: PrismaNote;
      notes?: PrismaNote[];
    }

    export interface Response {
      json: (body: {
        status: string;
        message?: string;
        data?: {
          note?: PrismaNote;
          notes?: PrismaNote[];
        };
      }) => this;
    }
  }
}

export interface JwtPayload {
  id: string;
}
