import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function testNews() {
    try {
        const symbol = 'BSOFT.NS';
        console.log(`Fetching news for ${symbol}...`);
        
        // Method 1: Search
        const searchResult = await yahooFinance.search(symbol, { newsCount: 3 });
        console.log("Search Result News:", JSON.stringify(searchResult.news, null, 2));

        // Method 2: QuoteSummary (sometmes contains news)
        // const quoteResult = await yahooFinance.quoteSummary(symbol, { modules: ['recommendationTrend', 'earnings'] }); 
        // console.log("Quote Summary:", quoteResult);

    } catch (e) {
        console.error(e);
    }
}

testNews();
