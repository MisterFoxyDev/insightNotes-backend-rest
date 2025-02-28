import express from "express";
import noteController from "../controllers/noteController";
import { protect } from "../middleware/authMiddleware";

const noteRouter = express.Router();

// Routes sans paramètres dynamiques ou avec préfixes spécifiques d'abord
noteRouter.post("/", protect, noteController.createNote);
noteRouter.get("/", protect, noteController.getUserNotes);
noteRouter.get("/tags/:tag", protect, noteController.getNotesByTag);

// Routes avec paramètres génériques ensuite
noteRouter.get("/:id", protect, noteController.getNoteById);
noteRouter.patch("/:id", protect, noteController.updateNote);
noteRouter.delete("/:id", protect, noteController.deleteNote);

export default noteRouter;
