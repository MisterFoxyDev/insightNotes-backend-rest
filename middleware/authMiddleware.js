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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const appError_1 = __importDefault(require("../utils/appError"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-temporaire";
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        else if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt) {
            token = req.cookies.jwt;
        }
        if (!token) {
            return next(new appError_1.default("Veuillez vous connecter pour accéder aux notes", 401));
        }
        // 2) Vérifier la validité du token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // 3) Vérifier si l'utilisateur existe toujours
        const user = yield prisma.user.findUnique({
            where: { id: BigInt(decoded.id) },
        });
        if (!user) {
            return next(new appError_1.default("Veuillez vous connecter", 401));
        }
        // 4) Ajouter l'utilisateur à la requête
        req.user = user;
        next();
    }
    catch (error) {
        return next(appError_1.default.create("Veuillez vous connecter", 401, error));
    }
});
exports.protect = protect;
