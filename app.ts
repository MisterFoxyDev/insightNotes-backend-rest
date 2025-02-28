import express, { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes";
import noteRouter from "./routes/noteRoutes";
import aiRouter from "./routes/aiRoutes";
import tagRouter from "./routes/tagRoutes";
import AppError from "./utils/appError";
import { sendErrorEmail, formatErrorForEmail } from "./utils/emailService";

const app = express();

// Configuration CORS adaptative selon l'environnement
const corsOptions: CorsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : undefined
      : true,
  credentials: true,
};

console.log("🔒 Configuration CORS:", {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : undefined
      : true,
  credentials: true,
});

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware de journalisation des requêtes pour toutes les méthodes
app.use((req, res, next) => {
  console.log(`📝 Requête reçue: ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/tags", tagRouter);

// Gestion des routes non trouvées
app.all("*", (req, res, next) => {
  next(
    new AppError(`Route ${req.originalUrl} non trouvée sur ce serveur`, 404),
  );
});

// Middleware de gestion d'erreurs global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const isDevelopment = process.env.NODE_ENV === "development";

  console.error("Erreur :", err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(isDevelopment && {
      stack: err.stack,
      error: err,
    }),
  });
});

// Gestion des erreurs non rattrapées pour éviter les crashs
process.on("uncaughtException", async (error) => {
  console.error("❌ Erreur non rattrapée critique:", error);
  console.error("Une erreur non rattrapée s'est produite");

  // Envoi d'un email de notification pour les erreurs
  if (process.env.SMTP_USER && process.env.EMAIL_FROM) {
    try {
      const { subject, text, html } = formatErrorForEmail(error);
      await sendErrorEmail(subject, text, html);
    } catch (emailError) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de notification:",
        emailError,
      );
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "🔥 L'application est dans un état instable - Arrêt dans 3 secondes",
    );
    setTimeout(() => {
      process.exit(1);
    }, 3000);
  } else {
    console.warn(
      "⚠️ Mode développement: le serveur continue malgré l'erreur critique",
    );
    console.warn(
      "Cette erreur devrait être corrigée pour éviter des comportements imprévisibles",
    );
  }
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("❌ Promesse rejetée non gérée:", promise);
  console.error("Raison:", reason);

  // Envoi d'un email de notification pour les erreurs
  if (process.env.SMTP_USER && process.env.EMAIL_FROM) {
    try {
      // Convertir la raison en objet Error si ce n'est pas déjà le cas
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      const { subject, text, html } = formatErrorForEmail(error);
      await sendErrorEmail(subject, text, html);
    } catch (emailError) {
      console.error(
        "❌ Erreur lors de l'envoi de l'email de notification:",
        emailError,
      );
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error("🔥 Promesse non gérée - Arrêt du serveur dans 3 secondes");
    setTimeout(() => {
      process.exit(1);
    }, 3000);
  } else {
    console.warn("⚠️ Mode développement: le serveur continue malgré l'erreur");
    console.warn(
      "Cette erreur devrait être corrigée pour assurer la stabilité de l'application",
    );
  }
});

export { app };
