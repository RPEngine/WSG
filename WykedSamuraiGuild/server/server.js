import express from "express";
import cors from "cors";
import apiRoutes from "./routes/apiRoutes.js";
import { PORT } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.send("WSG backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
