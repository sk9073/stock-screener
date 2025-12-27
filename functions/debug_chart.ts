import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const symbol = 'BSOFT.NS';
        const queryOptions = {
            period1: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), 
            period2: new Date(),
            interval: '1d' as const
        };
        console.log("Fetching chart for", symbol);
        const result = await yahooFinance.chart(symbol, queryOptions);
        const quotes = result.quotes;
        
        console.log("Data length:", quotes.length);
        if (quotes.length > 0) {
            console.log("First item:", quotes[0]);
            console.log("Last item:", quotes[quotes.length-1]);
        }

        const closes = quotes.map((d: any) => d.close);
        console.log("Last 5 closes:", closes.slice(-5));
        
        // Check for undefined
        const undefinedCloses = closes.filter(c => c === undefined);
        console.log("Undefined closes count:", undefinedCloses.length);

    } catch (e) {
        console.error(e);
    }
}

test();
