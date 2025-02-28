import express from "express";
import tagController from "../controllers/tagController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.use(protect);
router.get("/", tagController.getUserTags);
router.post("/search", tagController.searchByTags);
router.patch("/", tagController.updateTag);
router.delete("/:tag", tagController.deleteTag);

export default router;
