import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes";
import noteRouter from "./routes/noteRoutes";

const app = express();

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.API_URL
      : "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/notes", noteRouter);

export { app };
