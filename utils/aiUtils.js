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
exports.generateSummary = exports.generateTags = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateTags = (content, title) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const completion = yield openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `Tu es un assistant chargé d'analyser le titre (${title}) et le contenu (${content}) et de générer des tags pour ce contenu. Retourne uniquement les tags, séparés par des virgules, sans texte explicatif.`,
                },
            ],
            max_tokens: 100,
            temperature: 0.5,
        });
        const tagText = ((_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || "";
        return tagText
            ? tagText
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : null;
    }
    catch (error) {
        console.error("Erreur lors de la génération des tags:", error);
        return null;
    }
});
exports.generateTags = generateTags;
const generateSummary = (content) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const completion = yield openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `Tu es un assistant chargé de résumer la note suivante: ${content}. Tu privilégies l'usage de mots-clés, plutôt que de développer les idées et utiliser des mots de liaison ou de la grammaire. Le résumé doit être le plus court possible. N'hésite pas à utiliser des émojis représentatifs.`,
                },
            ],
            max_tokens: 100,
            temperature: 0.5,
        });
        return ((_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || null;
    }
    catch (error) {
        console.error("Erreur lors de la génération du résumé:", error);
        return null;
    }
});
exports.generateSummary = generateSummary;
