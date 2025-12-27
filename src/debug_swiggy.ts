import YahooFinance from 'yahoo-finance2';

(async () => {
    const yahooFinance = new YahooFinance();
    const symbol = 'SWIGGY.NS';
    const queryOptions = {
        period1: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Last 15 days
        period2: new Date(), // Today
        interval: '1d' as const,
    };

    try {
        const result = await yahooFinance.historical(symbol, queryOptions) as any[];
        console.log(`Data for ${symbol}:`);
        console.table(result);
        
        // Simulate the logic
        const DAYS_LOOKBACK = 6;
        const today = new Date();
        const targetDate = new Date(today.getTime() - DAYS_LOOKBACK * 24 * 60 * 60 * 1000);
        targetDate.setHours(0, 0, 0, 0); 
        console.log("Target Date (6 days ago):", targetDate.toISOString());

        const sortedData = result.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let referenceEntry = null;
        for (let j = sortedData.length - 1; j >= 0; j--) {
            const entryDate = new Date(sortedData[j].date);
            // Debug log
            console.log(`Checking date: ${entryDate.toISOString()} <= ${targetDate.toISOString()}? ${entryDate <= targetDate}`);
            
            if (entryDate <= targetDate) {
                referenceEntry = sortedData[j];
                break;
            }
        }
        
        if (referenceEntry) {
            console.log("Found reference entry:", referenceEntry);
            const latest = sortedData[sortedData.length - 1];
            console.log("Latest entry:", latest);
            
            const change = (latest.close - referenceEntry.close) / referenceEntry.close;
            console.log(`Change: ${(change * 100).toFixed(2)}%`);
        } else {
            console.log("No reference entry found.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
})();
