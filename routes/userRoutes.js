"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../controllers/authController"));
const userRouter = express_1.default.Router();
userRouter.post("/signup", authController_1.default.signup);
userRouter.post("/login", authController_1.default.login);
userRouter.get("/logout", authController_1.default.logout);
exports.default = userRouter;
