import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { makeTranscriptionReq } from "./makeTranscriptionReq.js";

config();

const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({ origin: "*" }));

app.get("/", async (req, res) => {
    res.status(200).json("Welcome");
});

app.post("/audio-to-text", async (req, res) => {
    try {
        const data = req.body.data;

        const text = await makeTranscriptionReq(data);

        res.status(200).json(JSON.stringify({ text }));
    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
