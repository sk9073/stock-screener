import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface StockNews {
    title: string;
    link: string;
    publisher: string;
    time: string;
}

export async function fetchStockNews(symbol: string): Promise<StockNews[]> {
    try {
        // Search usually returns relevant news for the symbol
        const result = await yahooFinance.search(symbol, { newsCount: 3 });
        
        if (!result.news || result.news.length === 0) {
            return [];
        }

        return result.news.map((item: any) => ({
            title: item.title,
            link: item.link,
            publisher: item.publisher,
            time: new Date(item.providerPublishTime * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        }));
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return [];
    }
}
