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
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const utils_1 = require("../utils/utils");
const appError_1 = __importDefault(require("../utils/appError"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";
const JWT_COOKIE_EXPIRES_IN = Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7; // jours
const JWT_EXPIRES_IN = `${JWT_COOKIE_EXPIRES_IN}d`; // même durée que le cookie
const signToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId.toString() }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};
// Configuration des options du cookie
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax"),
    maxAge: JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
};
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);
    res.cookie("jwt", token, cookieOptions);
    // Ne pas inclure le mot de passe dans la réponse
    const userWithoutPassword = Object.assign({}, user);
    delete userWithoutPassword.password;
    res.status(statusCode).json({
        status: "success",
        token,
        user: (0, utils_1.formatUserResponse)(userWithoutPassword),
    });
};
const authController = {
    signup: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, name, password, confirmPassword } = req.body;
            if (!email || !password) {
                return next(new appError_1.default("L'email et le mot de passe sont requis", 400));
            }
            if (password !== confirmPassword) {
                return next(new appError_1.default("Les mots de passe ne correspondent pas", 400));
            }
            if (password.length < 6) {
                return next(new appError_1.default("Le mot de passe doit contenir au moins 6 caractères", 400));
            }
            const existingUser = yield prisma.user.findFirst({
                where: { email },
            });
            if (existingUser) {
                return next(new appError_1.default("L'utilisateur existe déjà", 400));
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            // Créer l'utilisateur
            const user = yield prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                },
            });
            createSendToken(user, 201, res);
        }
        catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            return next(appError_1.default.create("Erreur lors de la création de l'utilisateur", 400, error));
        }
    })),
    login: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(new appError_1.default("L'email et le mot de passe sont requis", 400));
            }
            const user = yield prisma.user.findFirst({
                where: { email },
                include: {
                    _count: {
                        select: { notes: true },
                    },
                },
            });
            if (!user || !user.password) {
                return next(new appError_1.default("Email ou mot de passe incorrect", 401));
            }
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return next(new appError_1.default("Email ou mot de passe incorrect", 401));
            }
            // Renouveler le cookie à chaque login pour éviter les attaques de fixation
            if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt) {
                res.clearCookie("jwt");
            }
            createSendToken(user, 200, res);
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la connexion", 400, error));
        }
    })),
    logout: ((_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Supprimer le cookie JWT
            res.cookie("jwt", "", Object.assign(Object.assign({}, cookieOptions), { maxAge: 1 }));
            res.status(200).json({
                status: "success",
                message: "Déconnexion réussie",
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la déconnexion, veuillez réessayer plus tard", 400, error));
        }
    })),
};
exports.default = authController;
