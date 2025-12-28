import * as https from 'https';
import { StockDropResult } from "./scanner";
import { RsiResult, GoldenCrossResult } from "./strategies";
import { StockNews } from "./news";

export async function getAiAnalysis(
    apiKey: string, 
    falling: StockDropResult[], 
    rsi: RsiResult[], 
    gc: GoldenCrossResult[],
    newsMap: Record<string, StockNews[]>
): Promise<string> {
    
    if (!apiKey) return "<p><i>AI Analysis skipped: Missing GEMINI_API_KEY.</i></p>";

    // Construct the prompt object first
    const promptData = {
        falling,
        rsi,
        gc,
        newsMap
    };

    // Serialize data safely
    const dataString = JSON.stringify(promptData, null, 2);

    // Build the prompt text safely
    // We avoid template literals for the outer JSON structure to prevent breaking the payload
    const corePrompt = 
        "You are an expert stock trader. Analyze the following daily screening results for Indian Stocks (NSE):\n\n" +
        "DATA:\n" + dataString + "\n\n" +
        "TASK:\n" +
        "1. Select the SINGLE BEST stock to trade for today.\n" +
        "2. Explain WHY briefly (Technical + News sentiment).\n" +
        "3. Provide a clear ACTION plan (Buy Price, Stop Loss, Target).\n" +
        "4. Mention 1-2 other honorable mentions.\n\n" +
        "Keep the output concise, professional, and formatted in HTML (use <h3>, <ul>, <b>). \n" +
        "Do not include standard HTML boilerplate (<html>, <body>), just the inner content.";

    // Directly construct the object to be stringified
    // This ensures JSON.stringify handles all necessary escaping for the API
    const apiBody = {
        contents: [{
            parts: [{ text: corePrompt }]
        }]
    };

    const payload = JSON.stringify(apiBody);

    return new Promise((resolve) => {
        // Use gemini-1.5-flash which is standard and stable via REST
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        console.error("AI API Error Response:", data);
                        resolve("<p><i>AI Analysis unavailable (API Error).</i></p>");
                    }
                } catch (e) {
                    console.error("AI Parse Error:", e);
                    resolve("<p><i>AI Analysis unavailable (Parse Error).</i></p>");
                }
            });
        });

        req.on('error', (e) => {
            console.error("AI Request Failed:", e);
            resolve("<p><i>AI Analysis unavailable (Network Error).</i></p>");
        });

        req.write(payload);
        req.end();
    });
}
