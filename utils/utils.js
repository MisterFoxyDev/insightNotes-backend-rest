"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUserResponse = exports.formatNote = void 0;
// Fonction utilitaire pour convertir les BigInt en string
const formatNote = (note) => (Object.assign(Object.assign({}, note), { id: note.id.toString(), userId: note.userId.toString(), summary: note.summary || null, tags: note.tags || [] }));
exports.formatNote = formatNote;
// Fonction utilitaire pour formater la réponse utilisateur
const formatUserResponse = (user) => {
    var _a;
    return ({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        notesCount: ((_a = user._count) === null || _a === void 0 ? void 0 : _a.notes) || 0,
    });
};
exports.formatUserResponse = formatUserResponse;
