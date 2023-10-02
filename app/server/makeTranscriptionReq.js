import axios from "axios";
import fs from "fs/promises";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const saveAudio = async (data64) => {
    const filePath = join(__dirname, "./audio.mp3");

    const buffer = Buffer.from(data64, "base64");

    await fs.writeFile(filePath, buffer);

    return filePath;
};

export const makeTranscriptionReq = async (data64) => {
    try {
        const filePath = await saveAudio(data64);

        const baseUrl = "https://api.assemblyai.com/v2";
        const headers = {
            authorization: process.env.ASSEMBLY_AI_KEY,
        };

        const audioData = await fs.readFile(filePath);
        const uploadResponse = await axios.post(`${baseUrl}/upload`, audioData, {
            headers,
        });
        const uploadUrl = uploadResponse.data.upload_url;
        const data = {
            audio_url: uploadUrl,
        };
        const url = `${baseUrl}/transcript`;
        const response = await axios.post(url, data, { headers });

        const transcriptId = response.data.id;
        const pollingEndpoint = `${baseUrl}/transcript/${transcriptId}`;

        let text = "";

        while (true) {
            const pollingResponse = await axios.get(pollingEndpoint, {
                headers,
            });
            const transcriptionResult = pollingResponse.data;

            if (transcriptionResult.status === "completed") {
                text = transcriptionResult.text;
                break;
            } else if (transcriptionResult.status === "error") {
                throw new Error(`Transcription failed: ${transcriptionResult.error}`);
            } else {
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        return text;
    } catch (error) {
        console.log(error);
    }
};
