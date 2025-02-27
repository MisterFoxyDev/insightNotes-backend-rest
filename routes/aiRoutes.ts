import express from "express";
import aiController from "../controllers/aiController";
import { protect } from "../middleware/authMiddleware";

const aiRouter = express.Router();

// Route pour résumer une note
aiRouter.get("/summarize/:noteId", protect, aiController.summarizeNote);

// Route pour organiser les notes
aiRouter.get("/organize", protect, aiController.organizeNotes);

export default aiRouter;
