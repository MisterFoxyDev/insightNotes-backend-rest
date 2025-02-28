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
const aiUtils_1 = require("../utils/aiUtils");
const prisma = new client_1.PrismaClient();
const noteController = {
    createNote: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { title, content } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Utilisateur non authentifié", 401));
            }
            const summary = content ? yield (0, aiUtils_1.generateSummary)(content) : null;
            const tags = content ? yield (0, aiUtils_1.generateTags)(content, title) : null;
            const newNote = yield prisma.note.create({
                data: {
                    title,
                    content,
                    user: {
                        connect: { id: userId },
                    },
                },
            });
            if (summary) {
                try {
                    yield prisma.$executeRaw `
            UPDATE notes 
            SET summary = ${client_1.Prisma.sql `${summary}`}
            WHERE id = ${newNote.id}
          `;
                }
                catch (summaryError) {
                    return next(appError_1.default.create("Erreur lors de la création de la note, merci de réessayer plus tard", 400, summaryError));
                }
            }
            if (tags) {
                try {
                    yield prisma.note.update({
                        where: { id: newNote.id },
                        data: {
                            tags: tags,
                        },
                    });
                }
                catch (tagsError) {
                    return next(appError_1.default.create("Erreur lors de l'ajout des tags, merci de réessayer plus tard", 400, tagsError));
                }
            }
            const completeNote = yield prisma.note.findUnique({
                where: { id: newNote.id },
            });
            res.status(201).json({
                status: "success",
                data: {
                    note: (0, utils_1.formatNote)(completeNote || newNote),
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la création de la note, merci de réessayer plus tard", 400, error));
        }
    })),
    getUserNotes: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter pour accéder à vos notes", 401));
            }
            const notes = yield prisma.note.findMany({
                where: {
                    userId,
                },
            });
            res.status(200).json({
                status: "success",
                data: {
                    notes: notes.map(utils_1.formatNote),
                },
            });
        }
        catch (error) {
            return next(new appError_1.default("Erreur lors de la récupération des notes, merci de réessayer plus tard", 400));
        }
    })),
    getNoteById: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const note = yield prisma.note.findUnique({
                where: { id: BigInt(id) },
            });
            if (!note) {
                return next(new appError_1.default("Note non trouvée", 404));
            }
            res.status(200).json({
                status: "success",
                data: {
                    note: (0, utils_1.formatNote)(note),
                },
            });
        }
        catch (error) {
            return next(new appError_1.default("Erreur lors de la récupération de la note, merci de réessayer plus tard", 400));
        }
    })),
    updateNote: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { id } = req.params;
            const updates = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Utilisateur non authentifié", 401));
            }
            const existingNote = yield prisma.note.findFirst({
                where: {
                    id: BigInt(id),
                    userId,
                },
            });
            if (!existingNote) {
                return next(new appError_1.default("Note non trouvée ou non autorisée", 404));
            }
            const updateFields = Object.assign({}, updates);
            delete updateFields.summary; // Le résumé est géré séparément
            const updatedNote = yield prisma.note.update({
                where: { id: BigInt(id) },
                data: updateFields,
            });
            if (updates.content && updates.content !== existingNote.content) {
                try {
                    const summary = yield (0, aiUtils_1.generateSummary)(updates.content);
                    if (summary) {
                        yield prisma.$executeRaw `
              UPDATE notes 
              SET summary = ${client_1.Prisma.sql `${summary}`}
              WHERE id = ${BigInt(id)}
            `;
                    }
                    const tags = yield (0, aiUtils_1.generateTags)(updates.content, existingNote.title);
                    if (tags) {
                        yield prisma.note.update({
                            where: { id: BigInt(id) },
                            data: {
                                tags: tags,
                            },
                        });
                    }
                }
                catch (summaryError) {
                    return next(appError_1.default.create("Erreur lors de la mise à jour du résumé ou des tags, merci de réessayer plus tard", 400, summaryError));
                }
            }
            const completeNote = yield prisma.note.findUnique({
                where: { id: BigInt(id) },
            });
            res.status(200).json({
                status: "success",
                data: { note: (0, utils_1.formatNote)(completeNote || updatedNote) },
            });
        }
        catch (error) {
            return next(appError_1.default.create(`Erreur lors de la mise à jour de la note, merci de réessayer plus tard`, 400, error));
        }
    })),
    deleteNote: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { id } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Utilisateur non authentifié", 401));
            }
            let noteId;
            try {
                noteId = BigInt(id);
            }
            catch (error) {
                return next(new appError_1.default("Format d'ID de note invalide", 400));
            }
            const existingNote = yield prisma.note.findFirst({
                where: { id: noteId, userId },
            });
            if (!existingNote) {
                return next(new appError_1.default("Note non trouvée ou non autorisée", 404));
            }
            yield prisma.note.delete({ where: { id: noteId } });
            res.status(204).send();
        }
        catch (error) {
            return next(appError_1.default.create(`Erreur lors de la suppression de la note, merci de réessayer plus tard`, 400, error));
        }
    })),
    getNotesByTag: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { tag } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter pour accéder à vos notes", 401));
            }
            const notes = yield prisma.note.findMany({
                where: {
                    userId,
                    tags: {
                        has: tag,
                    },
                },
                orderBy: {
                    created_at: "desc",
                },
            });
            res.status(200).json({
                status: "success",
                results: notes.length,
                data: {
                    notes: notes.map(utils_1.formatNote),
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create(`Erreur lors de la recherche des notes par tag, merci de réessayer plus tard`, 400, error));
        }
    })),
};
exports.default = noteController;
