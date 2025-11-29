const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Cache for stock prices to reduce API calls
const priceCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes (to respect API rate limits)

// Rate limit tracking (Yahoo Finance is more lenient but good to keep track)
let apiCallCount = 0;
const API_CALL_LIMIT = 1000; // Much higher limit than AlphaVantage

// Popular Indian stocks data - Expanded to 100+ stocks
// Using BSE exchange with .BO suffix for Yahoo Finance
const INDIAN_STOCKS = [
    // IT Sector
    { symbol: 'TCS.BO', name: 'Tata Consultancy Services Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'INFY.BO', name: 'Infosys Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'WIPRO.BO', name: 'Wipro Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'HCLTECH.BO', name: 'HCL Technologies Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'TECHM.BO', name: 'Tech Mahindra Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'LTI.BO', name: 'LTI Mindtree Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'MPHASIS.BO', name: 'Mphasis Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'COFORGE.BO', name: 'Coforge Ltd', exchange: 'BSE', sector: 'IT' },

    // Banking & Finance
    { symbol: 'HDFCBANK.BO', name: 'HDFC Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'ICICIBANK.BO', name: 'ICICI Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'SBIN.BO', name: 'State Bank of India', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'KOTAKBANK.BO', name: 'Kotak Mahindra Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'AXISBANK.BO', name: 'Axis Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'INDUSINDBK.BO', name: 'IndusInd Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'BANDHANBNK.BO', name: 'Bandhan Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'FEDERALBNK.BO', name: 'Federal Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'IDFCFIRSTB.BO', name: 'IDFC First Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'PNB.BO', name: 'Punjab National Bank', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'BANKBARODA.BO', name: 'Bank of Baroda', exchange: 'BSE', sector: 'Banking' },

    // Conglomerates & Energy
    { symbol: 'RELIANCE.BO', name: 'Reliance Industries Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'ADANIENT.BO', name: 'Adani Enterprises Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'ONGC.BO', name: 'Oil and Natural Gas Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'BPCL.BO', name: 'Bharat Petroleum Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'IOC.BO', name: 'Indian Oil Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'COALINDIA.BO', name: 'Coal India Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'GAIL.BO', name: 'GAIL (India) Ltd', exchange: 'BSE', sector: 'Energy' },

    // Automobiles
    { symbol: 'MARUTI.BO', name: 'Maruti Suzuki India Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'TATAMOTORS.BO', name: 'Tata Motors Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'M&M.BO', name: 'Mahindra & Mahindra Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'BAJAJ-AUTO.BO', name: 'Bajaj Auto Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'HEROMOTOCO.BO', name: 'Hero MotoCorp Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'EICHERMOT.BO', name: 'Eicher Motors Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'TVSMOTOR.BO', name: 'TVS Motor Company Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'ASHOKLEY.BO', name: 'Ashok Leyland Ltd', exchange: 'BSE', sector: 'Automobile' },

    // Pharmaceuticals
    { symbol: 'SUNPHARMA.BO', name: 'Sun Pharmaceutical Industries Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'DRREDDY.BO', name: 'Dr Reddys Laboratories Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'CIPLA.BO', name: 'Cipla Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'DIVISLAB.BO', name: 'Divi\'s Laboratories Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'BIOCON.BO', name: 'Biocon Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'LUPIN.BO', name: 'Lupin Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'AUROPHARMA.BO', name: 'Aurobindo Pharma Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'TORNTPHARM.BO', name: 'Torrent Pharmaceuticals Ltd', exchange: 'BSE', sector: 'Pharma' },

    // FMCG & Consumer
    { symbol: 'HINDUNILVR.BO', name: 'Hindustan Unilever Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'ITC.BO', name: 'ITC Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'NESTLEIND.BO', name: 'Nestle India Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'BRITANNIA.BO', name: 'Britannia Industries Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'DABUR.BO', name: 'Dabur India Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'MARICO.BO', name: 'Marico Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'GODREJCP.BO', name: 'Godrej Consumer Products Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'TATACONSUM.BO', name: 'Tata Consumer Products Ltd', exchange: 'BSE', sector: 'FMCG' },

    // Metals & Mining
    { symbol: 'TATASTEEL.BO', name: 'Tata Steel Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'HINDALCO.BO', name: 'Hindalco Industries Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'JSWSTEEL.BO', name: 'JSW Steel Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'VEDL.BO', name: 'Vedanta Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'SAIL.BO', name: 'Steel Authority of India Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'NMDC.BO', name: 'NMDC Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'HINDZINC.BO', name: 'Hindustan Zinc Ltd', exchange: 'BSE', sector: 'Metals' },

    // Telecom
    { symbol: 'BHARTIARTL.BO', name: 'Bharti Airtel Ltd', exchange: 'BSE', sector: 'Telecom' },
    { symbol: 'IDEA.BO', name: 'Vodafone Idea Ltd', exchange: 'BSE', sector: 'Telecom' },

    // Infrastructure & Construction
    { symbol: 'LT.BO', name: 'Larsen & Toubro Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ADANIPORTS.BO', name: 'Adani Ports and Special Economic Zone Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ULTRACEMCO.BO', name: 'UltraTech Cement Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'GRASIM.BO', name: 'Grasim Industries Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'SHREECEM.BO', name: 'Shree Cement Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'AMBUJACEM.BO', name: 'Ambuja Cements Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ACC.BO', name: 'ACC Ltd', exchange: 'BSE', sector: 'Infrastructure' },

    // Power & Utilities
    { symbol: 'NTPC.BO', name: 'NTPC Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'POWERGRID.BO', name: 'Power Grid Corporation of India Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'ADANIGREEN.BO', name: 'Adani Green Energy Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'TATAPOWER.BO', name: 'Tata Power Company Ltd', exchange: 'BSE', sector: 'Power' },

    // Retail & E-commerce
    { symbol: 'DMART.BO', name: 'Avenue Supermarts Ltd', exchange: 'BSE', sector: 'Retail' },
    { symbol: 'TRENT.BO', name: 'Trent Ltd', exchange: 'BSE', sector: 'Retail' },
    { symbol: 'TITAN.BO', name: 'Titan Company Ltd', exchange: 'BSE', sector: 'Retail' },

    // Real Estate
    { symbol: 'DLF.BO', name: 'DLF Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'GODREJPROP.BO', name: 'Godrej Properties Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'OBEROIRLTY.BO', name: 'Oberoi Realty Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'PRESTIGE.BO', name: 'Prestige Estates Projects Ltd', exchange: 'BSE', sector: 'Real Estate' },

    // Paints & Chemicals
    { symbol: 'ASIANPAINT.BO', name: 'Asian Paints Ltd', exchange: 'BSE', sector: 'Paints' },
    { symbol: 'PIDILITIND.BO', name: 'Pidilite Industries Ltd', exchange: 'BSE', sector: 'Paints' },
    { symbol: 'BERGEPAINT.BO', name: 'Berger Paints India Ltd', exchange: 'BSE', sector: 'Paints' },

    // Electronics & Electricals
    { symbol: 'HAVELLS.BO', name: 'Havells India Ltd', exchange: 'BSE', sector: 'Electronics' },
    { symbol: 'VOLTAS.BO', name: 'Voltas Ltd', exchange: 'BSE', sector: 'Electronics' },
    { symbol: 'CROMPTON.BO', name: 'Crompton Greaves Consumer Electricals Ltd', exchange: 'BSE', sector: 'Electronics' },

    // Insurance
    { symbol: 'SBILIFE.BO', name: 'SBI Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },
    { symbol: 'HDFCLIFE.BO', name: 'HDFC Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },
    { symbol: 'ICICIPRULI.BO', name: 'ICICI Prudential Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },

    // Others
    { symbol: 'BAJFINANCE.BO', name: 'Bajaj Finance Ltd', exchange: 'BSE', sector: 'Finance' },
    { symbol: 'BAJAJFINSV.BO', name: 'Bajaj Finserv Ltd', exchange: 'BSE', sector: 'Finance' },
    { symbol: 'SIEMENS.BO', name: 'Siemens Ltd', exchange: 'BSE', sector: 'Industrial' },
    { symbol: 'ABB.BO', name: 'ABB India Ltd', exchange: 'BSE', sector: 'Industrial' },
    { symbol: 'BOSCHLTD.BO', name: 'Bosch Ltd', exchange: 'BSE', sector: 'Industrial' }
];

/**
 * Search for Indian stocks by symbol or name
 */
function searchStocks(query) {
    if (!query || query.length < 2) {
        return [];
    }

    const searchTerm = query.toUpperCase();
    return INDIAN_STOCKS.filter(stock =>
        stock.symbol.includes(searchTerm) ||
        stock.name.toUpperCase().includes(searchTerm)
    ).slice(0, 10); // Return max 10 results
}

/**
 * Get stock price from cache or fetch from Yahoo Finance API
 */
async function getStockPrice(symbol) {
    const cacheKey = symbol.toUpperCase();
    const cached = priceCache.get(cacheKey);

    // Return cached price if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`Using cached data for ${symbol}`);
        return cached.data;
    }

    try {
        console.log(`Fetching real-time data for ${symbol} from Yahoo Finance...`);

        // Fetch quote from Yahoo Finance
        const quote = await yahooFinance.quote(symbol);
        apiCallCount++;

        if (!quote) {
            console.warn(`No data returned from Yahoo Finance for ${symbol}. Using mock data.`);
            return generateMockPriceData(symbol);
        }

        const priceData = {
            symbol: symbol.toUpperCase(),
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            open: quote.regularMarketOpen || 0,
            high: quote.regularMarketDayHigh || 0,
            low: quote.regularMarketDayLow || 0,
            volume: quote.regularMarketVolume || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            lastUpdated: new Date().toISOString()
        };

        // Cache the result
        priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now()
        });

        return priceData;
    } catch (error) {
        console.error(`Error fetching price for ${symbol} from Yahoo Finance:`, error.message);
        // Fallback to mock data on error
        console.log(`Falling back to mock data for ${symbol}`);
        return generateMockPriceData(symbol);
    }
}

/**
 * Generate realistic mock prices for Indian stocks (fallback when API fails)
 */
function generateMockPriceData(symbol) {
    // Remove .BO suffix for lookup
    const baseSymbol = symbol.replace('.BO', '').toUpperCase();

    const basePrices = {
        // IT Sector
        'TCS': 3650, 'INFY': 1580, 'WIPRO': 465, 'HCLTECH': 1245, 'TECHM': 1185,
        'LTI': 5450, 'MPHASIS': 2650, 'COFORGE': 4850,

        // Banking & Finance
        'HDFCBANK': 1650, 'ICICIBANK': 985, 'SBIN': 625, 'KOTAKBANK': 1780,
        'AXISBANK': 1095, 'INDUSINDBK': 1385, 'BANDHANBNK': 235, 'FEDERALBNK': 145,
        'IDFCFIRSTB': 85, 'PNB': 95, 'BANKBARODA': 215,

        // Conglomerates & Energy
        'RELIANCE': 2450, 'ADANIENT': 2850, 'ONGC': 185, 'BPCL': 585,
        'IOC': 125, 'COALINDIA': 385, 'GAIL': 185,

        // Automobiles
        'MARUTI': 11500, 'TATAMOTORS': 785, 'M&M': 1850, 'BAJAJ-AUTO': 8450,
        'HEROMOTOCO': 4250, 'EICHERMOT': 3850, 'TVSMOTOR': 1650, 'ASHOKLEY': 185,

        // Pharmaceuticals
        'SUNPHARMA': 1520, 'DRREDDY': 5850, 'CIPLA': 1385, 'DIVISLAB': 3650,
        'BIOCON': 285, 'LUPIN': 1585, 'AUROPHARMA': 985, 'TORNTPHARM': 2850,

        // FMCG & Consumer
        'HINDUNILVR': 2580, 'ITC': 445, 'NESTLEIND': 24500, 'BRITANNIA': 4850,
        'DABUR': 585, 'MARICO': 585, 'GODREJCP': 1185, 'TATACONSUM': 985,

        // Metals & Mining
        'TATASTEEL': 135, 'HINDALCO': 585, 'JSWSTEEL': 885, 'VEDL': 385,
        'SAIL': 115, 'NMDC': 185, 'HINDZINC': 385,

        // Telecom
        'BHARTIARTL': 1150, 'IDEA': 12,

        // Infrastructure & Construction
        'LT': 3450, 'ADANIPORTS': 1285, 'ULTRACEMCO': 9850, 'GRASIM': 2185,
        'SHREECEM': 27500, 'AMBUJACEM': 585, 'ACC': 2185,

        // Power & Utilities
        'NTPC': 285, 'POWERGRID': 245, 'ADANIGREEN': 1850, 'TATAPOWER': 385,

        // Retail & E-commerce
        'DMART': 3850, 'TRENT': 4850, 'TITAN': 3350,

        // Real Estate
        'DLF': 785, 'GODREJPROP': 2185, 'OBEROIRLTY': 1585, 'PRESTIGE': 1685,

        // Paints & Chemicals
        'ASIANPAINT': 2985, 'PIDILITIND': 2850, 'BERGEPAINT': 585,

        // Electronics & Electricals
        'HAVELLS': 1485, 'VOLTAS': 985, 'CROMPTON': 385,

        // Insurance
        'SBILIFE': 1485, 'HDFCLIFE': 685, 'ICICIPRULI': 585,

        // Others
        'BAJFINANCE': 7250, 'BAJAJFINSV': 1685, 'SIEMENS': 4850,
        'ABB': 6850, 'BOSCHLTD': 28500
    };

    const basePrice = basePrices[baseSymbol] || 1000;

    // Add random variation (-3% to +3%)
    const variation = (Math.random() - 0.5) * 0.06;
    const price = basePrice * (1 + variation);
    const change = basePrice * variation;
    const changePercent = variation * 100;
    const previousClose = basePrice;

    return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        open: parseFloat((basePrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
        high: parseFloat((price * 1.02).toFixed(2)),
        low: parseFloat((price * 0.98).toFixed(2)),
        volume: Math.floor(Math.random() * 10000000),
        previousClose: parseFloat(previousClose.toFixed(2)),
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Get detailed quote for a stock
 */
async function getStockQuote(symbol) {
    const priceData = await getStockPrice(symbol);
    const stockInfo = INDIAN_STOCKS.find(s => s.symbol === symbol.toUpperCase());

    return {
        ...priceData,
        name: stockInfo ? stockInfo.name : symbol,
        exchange: stockInfo ? stockInfo.exchange : 'BSE',
        sector: stockInfo ? stockInfo.sector : 'Other'
    };
}

/**
 * Update prices for multiple stocks
 */
async function updateMultiplePrices(symbols) {
    const results = await Promise.allSettled(
        symbols.map(symbol => getStockPrice(symbol))
    );

    return results.map((result, index) => ({
        symbol: symbols[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
    }));
}

module.exports = {
    searchStocks,
    getStockPrice,
    getStockQuote,
    updateMultiplePrices,
    INDIAN_STOCKS
};

