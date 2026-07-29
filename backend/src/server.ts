import express from "express";
import type { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hello Mohit",
  });
});

const PORT = 7000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});