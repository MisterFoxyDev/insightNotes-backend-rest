import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { formatUserResponse } from "../utils/utils";
import { Response } from "express";
import AppError from "../utils/appError";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";
const JWT_COOKIE_EXPIRES_IN = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7; // jours
const JWT_EXPIRES_IN = `${JWT_COOKIE_EXPIRES_IN}d`; // même durée que le cookie

const signToken = (userId: bigint) => {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

// Configuration des options du cookie
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax") as
    | "strict"
    | "lax",
  maxAge: JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
};

const createSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user.id);

  res.cookie("jwt", token, cookieOptions);

  // Ne pas inclure le mot de passe dans la réponse
  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;

  res.status(statusCode).json({
    status: "success",
    token,
    user: formatUserResponse(userWithoutPassword),
  });
};

const authController = {
  signup: (async (req, res, next) => {
    try {
      const { email, name, password, confirmPassword } = req.body;

      if (!email || !password) {
        return next(
          new AppError("L'email et le mot de passe sont requis", 400),
        );
      }

      if (password !== confirmPassword) {
        return next(
          new AppError("Les mots de passe ne correspondent pas", 400),
        );
      }

      if (password.length < 6) {
        return next(
          new AppError(
            "Le mot de passe doit contenir au moins 6 caractères",
            400,
          ),
        );
      }

      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return next(new AppError("L'utilisateur existe déjà", 400));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      createSendToken(user, 201, res);
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      return next(
        AppError.create(
          "Erreur lors de la création de l'utilisateur",
          400,
          error,
        ),
      );
    }
  }) as RequestHandler,

  login: (async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(
          new AppError("L'email et le mot de passe sont requis", 400),
        );
      }

      const user = await prisma.user.findFirst({
        where: { email },
        include: {
          _count: {
            select: { notes: true },
          },
        },
      });

      if (!user || !user.password) {
        return next(new AppError("Email ou mot de passe incorrect", 401));
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return next(new AppError("Email ou mot de passe incorrect", 401));
      }

      // Renouveler le cookie à chaque login pour éviter les attaques de fixation
      if (req.cookies?.jwt) {
        res.clearCookie("jwt");
      }

      createSendToken(user, 200, res);
    } catch (error) {
      return next(AppError.create("Erreur lors de la connexion", 400, error));
    }
  }) as RequestHandler,

  logout: (async (_req, res, next) => {
    try {
      // Supprimer le cookie JWT
      res.cookie("jwt", "", {
        ...cookieOptions,
        maxAge: 1, // Expire immédiatement
      });

      res.status(200).json({
        status: "success",
        message: "Déconnexion réussie",
      });
    } catch (error) {
      return next(
        AppError.create(
          "Erreur lors de la déconnexion, veuillez réessayer plus tard",
          400,
          error,
        ),
      );
    }
  }) as RequestHandler,
};

export default authController;
