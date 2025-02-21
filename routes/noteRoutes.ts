import express from "express";
import noteController from "../controllers/noteController";
import { protect } from "../middleware/authMiddleware";

const noteRouter = express.Router();

noteRouter.post("/", protect, noteController.createNote);
noteRouter.get("/", protect, noteController.getUserNotes);
noteRouter.get("/:id", protect, noteController.getNoteById);
noteRouter.patch("/:id", protect, noteController.updateNote);

export default noteRouter;
