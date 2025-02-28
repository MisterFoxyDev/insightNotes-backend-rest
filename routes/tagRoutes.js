"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tagController_1 = __importDefault(require("../controllers/tagController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get("/", tagController_1.default.getUserTags);
router.post("/search", tagController_1.default.searchByTags);
router.patch("/", tagController_1.default.updateTag);
router.delete("/:tag", tagController_1.default.deleteTag);
exports.default = router;
