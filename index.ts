import { config } from "dotenv";
import express from "express";
import { FileRouter } from "./routes/file.route";
config();

const app = express();
const port = process.env.PORT || 8080;

app.get("/v1/health-check", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/v1/files", FileRouter);

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`);
});
