"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = __importDefault(require("../controllers/noteController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const noteRouter = express_1.default.Router();
// Routes sans paramètres dynamiques ou avec préfixes spécifiques d'abord
noteRouter.post("/", authMiddleware_1.protect, noteController_1.default.createNote);
noteRouter.get("/", authMiddleware_1.protect, noteController_1.default.getUserNotes);
noteRouter.get("/tags/:tag", authMiddleware_1.protect, noteController_1.default.getNotesByTag);
// Routes avec paramètres génériques ensuite
noteRouter.get("/:id", authMiddleware_1.protect, noteController_1.default.getNoteById);
noteRouter.patch("/:id", authMiddleware_1.protect, noteController_1.default.updateNote);
noteRouter.delete("/:id", authMiddleware_1.protect, noteController_1.default.deleteNote);
exports.default = noteRouter;
