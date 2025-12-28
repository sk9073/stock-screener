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

    const promptText = `
        You are an expert stock trader. Analyze the following daily screening results for Indian Stocks (NSE):

        1. FALLING STOCKS (>6% Drop):
        ${JSON.stringify(falling)}

        2. RSI OPPORTUNITIES:
        ${JSON.stringify(rsi)}

        3. GOLDEN CROSS (Bullish Reversal):
        ${JSON.stringify(gc)}

        4. RELEVANT NEWS:
        ${JSON.stringify(newsMap)}

        TASK:
        1. Select the SINGLE BEST stock to trade for today.
        2. Explain WHY briefly (Technical + News sentiment).
        3. Provide a clear ACTION plan (Buy Price, Stop Loss, Target).
        4. Mention 1-2 other honorable mentions.
        
        Keep the output concise, professional, and formatted in HTML (use <h3>, <ul>, <b>). 
        Do not include standard HTML boilerplate (<html>, <body>), just the inner content.
    `;

    // Direct REST API payload
    const payload = JSON.stringify({
        contents: [{
            parts: [{ text: promptText }]
        }]
    });

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
