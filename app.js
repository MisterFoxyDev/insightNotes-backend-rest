"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const tagRoutes_1 = __importDefault(require("./routes/tagRoutes"));
const appError_1 = __importDefault(require("./utils/appError"));
const emailService_1 = require("./utils/emailService");
const app = (0, express_1.default)();
exports.app = app;
// Configuration CORS adaptative selon l'environnement
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
            ? [process.env.FRONTEND_URL]
            : undefined
        : true,
    credentials: true,
};
console.log("🔒 Configuration CORS:", {
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
            ? [process.env.FRONTEND_URL]
            : undefined
        : true,
    credentials: true,
});
app.use((0, cors_1.default)(corsOptions));
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
// Middleware de journalisation des requêtes pour toutes les méthodes
app.use((req, res, next) => {
    console.log(`📝 Requête reçue: ${req.method} ${req.url}`);
    next();
});
app.use(express_1.default.json({ limit: "100kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "100kb" }));
app.use((0, cookie_parser_1.default)());
// ROUTES
app.use("/api/v1/users", userRoutes_1.default);
app.use("/api/v1/notes", noteRoutes_1.default);
app.use("/api/v1/ai", aiRoutes_1.default);
app.use("/api/v1/tags", tagRoutes_1.default);
// Gestion des routes non trouvées
app.all("*", (req, res, next) => {
    next(new appError_1.default(`Route ${req.originalUrl} non trouvée sur ce serveur`, 404));
});
// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    const isDevelopment = process.env.NODE_ENV === "development";
    console.error("Erreur :", err);
    res.status(err.statusCode).json(Object.assign({ status: err.status, message: err.message }, (isDevelopment && {
        stack: err.stack,
        error: err,
    })));
});
// Gestion des erreurs non rattrapées pour éviter les crashs
process.on("uncaughtException", (error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("❌ Erreur non rattrapée critique:", error);
    console.error("Une erreur non rattrapée s'est produite");
    // Envoi d'un email de notification pour les erreurs
    if (process.env.SMTP_USER && process.env.EMAIL_FROM) {
        try {
            const { subject, text, html } = (0, emailService_1.formatErrorForEmail)(error);
            yield (0, emailService_1.sendErrorEmail)(subject, text, html);
        }
        catch (emailError) {
            console.error("❌ Erreur lors de l'envoi de l'email de notification:", emailError);
        }
    }
    if (process.env.NODE_ENV === "production") {
        console.error("🔥 L'application est dans un état instable - Arrêt dans 3 secondes");
        setTimeout(() => {
            process.exit(1);
        }, 3000);
    }
    else {
        console.warn("⚠️ Mode développement: le serveur continue malgré l'erreur critique");
        console.warn("Cette erreur devrait être corrigée pour éviter des comportements imprévisibles");
    }
}));
process.on("unhandledRejection", (reason, promise) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("❌ Promesse rejetée non gérée:", promise);
    console.error("Raison:", reason);
    // Envoi d'un email de notification pour les erreurs
    if (process.env.SMTP_USER && process.env.EMAIL_FROM) {
        try {
            // Convertir la raison en objet Error si ce n'est pas déjà le cas
            const error = reason instanceof Error ? reason : new Error(String(reason));
            const { subject, text, html } = (0, emailService_1.formatErrorForEmail)(error);
            yield (0, emailService_1.sendErrorEmail)(subject, text, html);
        }
        catch (emailError) {
            console.error("❌ Erreur lors de l'envoi de l'email de notification:", emailError);
        }
    }
    if (process.env.NODE_ENV === "production") {
        console.error("🔥 Promesse non gérée - Arrêt du serveur dans 3 secondes");
        setTimeout(() => {
            process.exit(1);
        }, 3000);
    }
    else {
        console.warn("⚠️ Mode développement: le serveur continue malgré l'erreur");
        console.warn("Cette erreur devrait être corrigée pour assurer la stabilité de l'application");
    }
}));
