import express from "express";
import authController from "../controllers/authController";

const userRouter = express.Router();

userRouter.post("/signup", authController.signup);
userRouter.post("/login", authController.login);
userRouter.get("/logout", authController.logout);

export default userRouter;
