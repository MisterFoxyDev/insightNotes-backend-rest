import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "../types/express";
import AppError from "../utils/appError";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          "Vous n'êtes pas connecté. Veuillez vous connecter pour accéder aux notes",
          401,
        ),
      );
    }

    // 2) Vérifier la validité du token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 3) Vérifier si l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
    });

    if (!user) {
      return next(new AppError("Veuillez vous connecter", 401));
    }

    // 4) Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Veuillez vous connecter", 401));
  }
};
