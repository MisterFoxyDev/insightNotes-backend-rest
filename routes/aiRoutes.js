"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = __importDefault(require("../controllers/aiController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const aiRouter = express_1.default.Router();
// Route pour résumer une note
aiRouter.get("/summarize/:noteId", authMiddleware_1.protect, aiController_1.default.summarizeNote);
// Route pour organiser les notes
aiRouter.get("/organize", authMiddleware_1.protect, aiController_1.default.organizeNotes);
exports.default = aiRouter;
