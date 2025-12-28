import { GoogleGenerativeAI } from "@google/generative-ai";
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

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt
        const prompt = `
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
        1. Select the SINGLE BEST stock to trade for tomorrow.
        2. Explain WHY briefly (Technical + News sentiment).
        3. Provide a clear ACTION plan (Buy Price, Stop Loss, Target).
        4. Mention 1-2 other honorable mentions.
        
        Keep the output concise, professional, and formatted in HTML (use <h3>, <ul>, <b>). 
        Do not include standard HTML boilerplate (<html>, <body>), just the inner content.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return "<p><i>AI Analysis failed due to an error.</i></p>";
    }
}
