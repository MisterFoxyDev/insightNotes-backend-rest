import express, { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes";
import noteRouter from "./routes/noteRoutes";
import aiRouter from "./routes/aiRoutes";
import AppError from "./utils/appError";

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

export { app };
