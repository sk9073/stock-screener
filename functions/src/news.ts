import * as https from 'https';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface StockNews {
    title: string;
    link: string;
    publisher: string;
    time: string;
    content?: string; // New field for deep analysis
}

export async function fetchStockNews(symbol: string): Promise<StockNews[]> {
    return new Promise((resolve) => {
        const cleanSymbol = symbol.replace('.NS', '');
        const query = encodeURIComponent(`${cleanSymbol} stock news India`);
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                const items: StockNews[] = [];
                const itemRegex = /<item>(.*?)<\/item>/gs;
                let match;
                
                // Get top 3 news items
                while ((match = itemRegex.exec(data)) !== null && items.length < 3) {
                    const itemContent = match[1];
                    const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
                    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
                    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
                    const sourceMatch = itemContent.match(/<source url=".*?">(.*?)<\/source>/);

                    if (titleMatch && linkMatch) {
                        const link = linkMatch[1];
                        const title = titleMatch[1].replace('<![CDATA[', '').replace(']]>', '');
                        
                        // DEEP DIVE: Fetch article content for AI
                        // Only do this for the very first (most recent) article to save time/bandwidth
                        let content = '';
                        if (items.length === 0) {
                             content = await scrapeArticleContent(link);
                        }

                        items.push({
                            title,
                            link,
                            publisher: sourceMatch ? sourceMatch[1] : 'Google News',
                            time: pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString('en-IN', { 
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' 
                            }) : '',
                            content: content || undefined
                        });
                    }
                }
                resolve(items);
            });
        }).on('error', (err) => {
            console.error(`Error fetching Google News for ${symbol}:`, err);
            resolve([]);
        });
    });
}

// Helper to scrape text from news articles
async function scrapeArticleContent(googleLink: string): Promise<string> {
    try {
        // News links are often redirects, so we follow them.
        const response = await axios.get(googleLink, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        const $ = cheerio.load(response.data);
        // Heuristic: Get paragraphs from common news layout containers
        // This is generic and might not work for 100% of sites, but works for most major publishers
        let text = '';
        $('article p, .content p, .story p, #article-body p').each((i, el) => {
            if (i < 5) text += $(el).text() + ' '; // Limit to first 5 paragraphs
        });
        
        // If no text found, specific fallbacks for MoneyControl/ET
        if (text.length < 50) {
             $('p').each((i, el) => {
                if (i < 5) text += $(el).text() + ' ';
             });
        }
        
        return text.substring(0, 1000) + '...'; // Cap at 1000 chars for AI context window
    } catch (e) {
        // console.error("Failed to deep scrape:", e);
        return ""; // Fail silently, just return empty content
    }
}
