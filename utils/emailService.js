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
exports.formatErrorForEmail = exports.sendErrorEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configuration du transporteur d'emails avec les variables existantes
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASSWORD || "",
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
    },
});
// Afficher la configuration de sécurité au démarrage
console.log(`📧 Configuration email: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
console.log(`🔒 Vérification SSL: ${process.env.NODE_ENV === "production"
    ? "activée (sécurisé)"
    : "désactivée (développement)"}`);
/**
 * Envoie un email de notification pour les erreurs
 * @param subject Sujet de l'email
 * @param text Contenu textuel de l'email
 * @param html Contenu HTML de l'email (optionnel)
 */
const sendErrorEmail = (subject, text, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!process.env.SMTP_USER || !process.env.EMAIL_FROM) {
            console.warn("⚠️ Configuration email incomplète. Email non envoyé.");
            return false;
        }
        const mailOptions = {
            from: `"InsightNotes Error" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_FROM,
            subject,
            text,
            html: html || text,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log(`📧 Email d'erreur envoyé: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email:", error);
        return false;
    }
});
exports.sendErrorEmail = sendErrorEmail;
/**
 * Formate une erreur pour l'envoi par email
 * @param error L'erreur à formater
 * @returns Un objet contenant le sujet et le contenu de l'email
 */
const formatErrorForEmail = (error) => {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || "development";
    const appName = "InsightNotes API";
    const subject = `[${environment.toUpperCase()}] ${appName} - Erreur: ${error.name}`;
    const text = `
    Erreur détectée sur ${appName} (${environment})
    --------------------------------------------
    Timestamp: ${timestamp}
    Type d'erreur: ${error.name}
    Message: ${error.message}
    Stack: ${error.stack || "Non disponible"}
  `;
    const html = `
    <h2>Erreur détectée sur ${appName} (${environment})</h2>
    <p><strong>Timestamp:</strong> ${timestamp}</p>
    <p><strong>Type d'erreur:</strong> ${error.name}</p>
    <p><strong>Message:</strong> ${error.message}</p>
    <h3>Stack Trace:</h3>
    <pre>${error.stack || "Non disponible"}</pre>
  `;
    return { subject, text, html };
};
exports.formatErrorForEmail = formatErrorForEmail;
