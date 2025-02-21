import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { formatUserResponse } from "../utils/utils";
import { Response } from "express";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";
const JWT_COOKIE_EXPIRES_IN = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 30; // jours
const JWT_EXPIRES_IN = `${JWT_COOKIE_EXPIRES_IN}d`; // même durée que le cookie

const signToken = (userId: bigint) => {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

// Configuration des options du cookie
const cookieOptions = {
  httpOnly: true, // Empêche l'accès via JavaScript
  secure: process.env.NODE_ENV === "production", // Cookies sécurisés en production
  sameSite: "lax" as const, // Protection CSRF
  maxAge: JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // 30 jours en millisecondes
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
  signup: (async (req, res) => {
    try {
      const { email, name, password, confirmPassword } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "L'email et le mot de passe sont requis",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Les mots de passe ne correspondent pas",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: "L'utilisateur existe déjà" });
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
      res
        .status(400)
        .json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  }) as RequestHandler,

  login: (async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "L'email et le mot de passe sont requis",
        });
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
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      createSendToken(user, 200, res);
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      res.status(400).json({ message: "Erreur lors de la connexion" });
    }
  }) as RequestHandler,

  logout: (async (_req, res) => {
    // Supprimer le cookie JWT
    res.cookie("jwt", "", {
      ...cookieOptions,
      maxAge: 1, // Expire immédiatement
    });

    res.status(200).json({
      status: "success",
      message: "Déconnexion réussie",
    });
  }) as RequestHandler,
};

export default authController;
