import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JwtPayload } from "../types/express";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1) Vérifier si le token existe
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
      res.status(401).json({
        status: "error",
        message:
          "Vous n'êtes pas connecté. Veuillez vous connecter pour accéder aux notes",
      });
      return;
    }

    // 2) Vérifier la validité du token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 3) Vérifier si l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) }, // Conversion en BigInt
    });

    if (!user) {
      res.status(401).json({
        status: "error",
        message:
          "L'utilisateur associé à ce token n'existe plus, veuillez vous reconnecter",
      });
      return;
    }

    // 4) Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Token invalide ou expiré",
    });
  }
};
