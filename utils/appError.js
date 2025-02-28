"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(message, statusCode, details) {
        // En production, on ne veut pas exposer les détails dans le message
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        // Stockage des détails pour logs et environnement de développement
        if (details) {
            this.details = details;
        }
        Error.captureStackTrace(this, this.constructor);
    }
    // Méthode statique pour créer une erreur avec le bon message selon l'environnement
    static create(baseMessage, statusCode, details) {
        const isDevelopment = process.env.NODE_ENV === "development";
        // En développement, on peut inclure les détails dans le message
        const message = isDevelopment && details ? `${baseMessage} (${details})` : baseMessage;
        return new AppError(message, statusCode, details);
    }
}
exports.default = AppError;
