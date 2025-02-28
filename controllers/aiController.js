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
const utils_1 = require("../utils/utils");
const appError_1 = __importDefault(require("../utils/appError"));
const openai_1 = __importDefault(require("openai"));
const prisma = new client_1.PrismaClient();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const aiController = {
    summarizeNote: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const { noteId } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Utilisateur non authentifié", 401));
            }
            const note = yield prisma.note.findFirst({
                where: {
                    id: BigInt(noteId),
                    userId,
                },
            });
            if (!note) {
                return next(new appError_1.default("Note non trouvée ou non autorisée", 404));
            }
            const completion = yield openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: `Tu es un assistant chargé de résumer la note suivante: ${note.content}. Tu privilégies l'usage de mots-clés, plutôt que de développer les idées et utiliser des mots de liaison ou de la grammaire. Le résumé doit être le plus court possible. N'hésite pas à utiliser des émojis représentatifs.`,
                    },
                ],
                max_tokens: 150,
                temperature: 0.5,
            });
            const summary = ((_d = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) ||
                "Aucun résumé généré";
            try {
                yield prisma.$executeRaw `
          UPDATE notes 
          SET summary = ${client_1.Prisma.sql `${summary}`}
          WHERE id = ${BigInt(noteId)}
        `;
                console.log("Résumé mis à jour dans la base de données pour la note:", noteId);
            }
            catch (summaryError) {
                console.error("Erreur lors de la mise à jour du résumé:", summaryError);
            }
            const updatedNote = yield prisma.note.findUnique({
                where: { id: BigInt(noteId) },
            });
            res.status(200).json({
                status: "success",
                data: {
                    summary,
                    note: (0, utils_1.formatNote)(updatedNote || note),
                },
            });
        }
        catch (error) {
            console.error("Erreur lors de la génération du résumé:", error);
            return next(appError_1.default.create("Erreur lors de la génération du résumé", 500, error));
        }
    })),
    organizeNotes: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Utilisateur non authentifié", 401));
            }
            const notes = yield prisma.note.findMany({
                where: {
                    userId,
                },
            });
            if (notes.length === 0) {
                return res.status(200).json({
                    status: "success",
                    data: {
                        categories: [],
                        message: "Aucune note à organiser",
                    },
                });
            }
            const notesData = notes.map((note) => ({
                id: note.id.toString(),
                title: note.title,
                content: note.content || "",
            }));
            const completion = yield openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: `Organise ces notes en catégories pertinentes. Pour chaque catégorie, donne un nom et liste les IDs des notes qui appartiennent à cette catégorie. Voici les notes : ${JSON.stringify(notesData)}`,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            });
            const organizationResult = ((_d = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) ||
                "Aucune organisation générée";
            res.status(200).json({
                status: "success",
                data: {
                    organization: organizationResult,
                    notes: notes.map(utils_1.formatNote),
                },
            });
        }
        catch (error) {
            console.error("Erreur lors de l'organisation des notes:", error);
            return next(appError_1.default.create("Erreur lors de l'organisation des notes", 500, error));
        }
    })),
};
exports.default = aiController;
