import * as https from 'https';

export interface StockNews {
    title: string;
    link: string;
    publisher: string;
    time: string;
}

export async function fetchStockNews(symbol: string): Promise<StockNews[]> {
    return new Promise((resolve) => {
        // Remove .NS suffix for cleaner search
        const cleanSymbol = symbol.replace('.NS', '');
        // Search query: "Symbol NSE India" to get specific stock news
        const query = encodeURIComponent(`${cleanSymbol} stock news India`);
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const items: StockNews[] = [];
                // Simple regex parsing to avoid heavy xml libraries
                // Match <item> tags
                const itemRegex = /<item>(.*?)<\/item>/gs;
                let match;
                
                while ((match = itemRegex.exec(data)) !== null && items.length < 3) {
                    const itemContent = match[1];
                    const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
                    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
                    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
                    const sourceMatch = itemContent.match(/<source url=".*?">(.*?)<\/source>/);

                    if (titleMatch && linkMatch) {
                        items.push({
                            title: titleMatch[1].replace('<![CDATA[', '').replace(']]>', ''),
                            link: linkMatch[1],
                            publisher: sourceMatch ? sourceMatch[1] : 'Google News',
                            time: pubDateMatch ? new Date(pubDateMatch[1]).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''
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
