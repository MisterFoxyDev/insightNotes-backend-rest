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
const appError_1 = __importDefault(require("../utils/appError"));
const utils_1 = require("../utils/utils");
const prisma = new client_1.PrismaClient();
const tagController = {
    getUserTags: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter.", 401));
            }
            const allNotes = yield prisma.note.findMany({
                where: { userId },
                select: { tags: true },
            });
            let allTags = [];
            for (const note of allNotes) {
                if (note.tags && note.tags.length > 0) {
                    allTags.push(...note.tags);
                }
            }
            const uniqueTags = [...new Set(allTags)].sort();
            const tagCounts = uniqueTags.map((tag) => {
                const count = allNotes.filter((note) => note.tags && note.tags.includes(tag)).length;
                return { tag, count };
            });
            res.status(200).json({
                status: "success",
                results: uniqueTags.length,
                data: {
                    tags: tagCounts,
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la récupération des tags", 400, error));
        }
    })),
    updateTag: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { oldTag, newTag } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter.", 401));
            }
            if (!oldTag) {
                return next(new appError_1.default("Erreur dans la récupération du tag à modifier, veuillez rééssayer", 400));
            }
            if (!newTag) {
                return next(new appError_1.default("Veuillez renseigner le nouveau nom du tag.", 400));
            }
            const allNotes = yield prisma.note.findMany({
                where: { userId },
                select: { id: true, tags: true },
            });
            // Mettre à jour les notes qui contiennent l'ancien tag
            let updatedCount = 0;
            for (const note of allNotes) {
                if (note.tags && note.tags.includes(oldTag)) {
                    const updatedTags = note.tags.map((tag) => tag === oldTag ? newTag : tag);
                    // Éviter les doublons si le nouveau tag existe déjà dans la note
                    const uniqueTags = [...new Set(updatedTags)];
                    yield prisma.note.update({
                        where: { id: note.id },
                        data: { tags: uniqueTags },
                    });
                    updatedCount++;
                }
            }
            res.status(200).json({
                status: "success",
                message: `Tag '${oldTag}' renommé en '${newTag}' dans ${updatedCount} notes.`,
                data: {
                    oldTag,
                    newTag,
                    updatedCount,
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la mise à jour du tag", 400, error));
        }
    })),
    deleteTag: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { tag } = req.params;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter.", 401));
            }
            if (!tag) {
                return next(new appError_1.default("Le nom du tag est requis.", 400));
            }
            // Récupérer toutes les notes qui contiennent ce tag
            const notesWithTag = yield prisma.note.findMany({
                where: {
                    userId,
                    tags: {
                        has: tag,
                    },
                },
                select: { id: true, tags: true },
            });
            // Supprimer le tag de chaque note
            let updatedCount = 0;
            for (const note of notesWithTag) {
                if (note.tags && note.tags.includes(tag)) {
                    const updatedTags = note.tags.filter((t) => t !== tag);
                    yield prisma.note.update({
                        where: { id: note.id },
                        data: { tags: updatedTags },
                    });
                    updatedCount++;
                }
            }
            res.status(200).json({
                status: "success",
                message: `Tag '${tag}' supprimé de ${updatedCount} notes.`,
                data: {
                    tag,
                    updatedCount,
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la suppression du tag", 400, error));
        }
    })),
    // Rechercher des notes par plusieurs tags (avec opérateur ET ou OU)
    searchByTags: ((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const { tags, operator = "OR" } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next(new appError_1.default("Veuillez vous connecter.", 401));
            }
            if (!tags || !Array.isArray(tags) || tags.length === 0) {
                return next(new appError_1.default("Au moins un tag est requis pour la recherche.", 400));
            }
            let notes;
            if (operator.toUpperCase() === "AND") {
                // Recherche avec l'opérateur ET - toutes les notes qui contiennent TOUS les tags
                notes = yield prisma.note.findMany({
                    where: {
                        userId,
                        AND: tags.map((tag) => ({
                            tags: {
                                has: tag,
                            },
                        })),
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                });
            }
            else {
                // Recherche avec l'opérateur OU (par défaut) - toutes les notes qui contiennent AU MOINS UN des tags
                notes = yield prisma.note.findMany({
                    where: {
                        userId,
                        tags: {
                            hasSome: tags,
                        },
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                });
            }
            res.status(200).json({
                status: "success",
                results: notes.length,
                data: {
                    operator: operator.toUpperCase(),
                    tags,
                    notes: notes.map(utils_1.formatNote),
                },
            });
        }
        catch (error) {
            return next(appError_1.default.create("Erreur lors de la recherche par tags", 400, error));
        }
    })),
};
exports.default = tagController;
