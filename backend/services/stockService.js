const axios = require('axios');

// Cache for stock prices to reduce API calls
const priceCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes (to respect API rate limits)

// AlphaVantage API configuration
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY || 'FP0DR34GVP8HFE4G';
const ALPHAVANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Rate limit tracking
let apiCallCount = 0;
const API_CALL_LIMIT = 25; // Free tier daily limit

// Popular Indian stocks data - Expanded to 100+ stocks
// Using BSE exchange for AlphaVantage API compatibility
const INDIAN_STOCKS = [
    // IT Sector
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'INFY.BSE', name: 'Infosys Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'WIPRO.BSE', name: 'Wipro Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'HCLTECH.BSE', name: 'HCL Technologies Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'TECHM.BSE', name: 'Tech Mahindra Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'LTI.BSE', name: 'LTI Mindtree Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'MPHASIS.BSE', name: 'Mphasis Ltd', exchange: 'BSE', sector: 'IT' },
    { symbol: 'COFORGE.BSE', name: 'Coforge Ltd', exchange: 'BSE', sector: 'IT' },

    // Banking & Finance
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'SBIN.BSE', name: 'State Bank of India', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'KOTAKBANK.BSE', name: 'Kotak Mahindra Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'AXISBANK.BSE', name: 'Axis Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'INDUSINDBK.BSE', name: 'IndusInd Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'BANDHANBNK.BSE', name: 'Bandhan Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'FEDERALBNK.BSE', name: 'Federal Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'IDFCFIRSTB.BSE', name: 'IDFC First Bank Ltd', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'PNB.BSE', name: 'Punjab National Bank', exchange: 'BSE', sector: 'Banking' },
    { symbol: 'BANKBARODA.BSE', name: 'Bank of Baroda', exchange: 'BSE', sector: 'Banking' },

    // Conglomerates & Energy
    { symbol: 'RELIANCE.BSE', name: 'Reliance Industries Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'ADANIENT.BSE', name: 'Adani Enterprises Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'ONGC.BSE', name: 'Oil and Natural Gas Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'BPCL.BSE', name: 'Bharat Petroleum Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'IOC.BSE', name: 'Indian Oil Corporation Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'COALINDIA.BSE', name: 'Coal India Ltd', exchange: 'BSE', sector: 'Energy' },
    { symbol: 'GAIL.BSE', name: 'GAIL (India) Ltd', exchange: 'BSE', sector: 'Energy' },

    // Automobiles
    { symbol: 'MARUTI.BSE', name: 'Maruti Suzuki India Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'TATAMOTORS.BSE', name: 'Tata Motors Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'M&M.BSE', name: 'Mahindra & Mahindra Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'BAJAJ-AUTO.BSE', name: 'Bajaj Auto Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'HEROMOTOCO.BSE', name: 'Hero MotoCorp Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'EICHERMOT.BSE', name: 'Eicher Motors Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'TVSMOTOR.BSE', name: 'TVS Motor Company Ltd', exchange: 'BSE', sector: 'Automobile' },
    { symbol: 'ASHOKLEY.BSE', name: 'Ashok Leyland Ltd', exchange: 'BSE', sector: 'Automobile' },

    // Pharmaceuticals
    { symbol: 'SUNPHARMA.BSE', name: 'Sun Pharmaceutical Industries Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'DRREDDY.BSE', name: 'Dr Reddys Laboratories Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'CIPLA.BSE', name: 'Cipla Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'DIVISLAB.BSE', name: 'Divi\'s Laboratories Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'BIOCON.BSE', name: 'Biocon Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'LUPIN.BSE', name: 'Lupin Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'AUROPHARMA.BSE', name: 'Aurobindo Pharma Ltd', exchange: 'BSE', sector: 'Pharma' },
    { symbol: 'TORNTPHARM.BSE', name: 'Torrent Pharmaceuticals Ltd', exchange: 'BSE', sector: 'Pharma' },

    // FMCG & Consumer
    { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'ITC.BSE', name: 'ITC Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'NESTLEIND.BSE', name: 'Nestle India Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'BRITANNIA.BSE', name: 'Britannia Industries Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'DABUR.BSE', name: 'Dabur India Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'MARICO.BSE', name: 'Marico Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'GODREJCP.BSE', name: 'Godrej Consumer Products Ltd', exchange: 'BSE', sector: 'FMCG' },
    { symbol: 'TATACONSUM.BSE', name: 'Tata Consumer Products Ltd', exchange: 'BSE', sector: 'FMCG' },

    // Metals & Mining
    { symbol: 'TATASTEEL.BSE', name: 'Tata Steel Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'HINDALCO.BSE', name: 'Hindalco Industries Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'JSWSTEEL.BSE', name: 'JSW Steel Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'VEDL.BSE', name: 'Vedanta Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'SAIL.BSE', name: 'Steel Authority of India Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'NMDC.BSE', name: 'NMDC Ltd', exchange: 'BSE', sector: 'Metals' },
    { symbol: 'HINDZINC.BSE', name: 'Hindustan Zinc Ltd', exchange: 'BSE', sector: 'Metals' },

    // Telecom
    { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel Ltd', exchange: 'BSE', sector: 'Telecom' },
    { symbol: 'IDEA.BSE', name: 'Vodafone Idea Ltd', exchange: 'BSE', sector: 'Telecom' },

    // Infrastructure & Construction
    { symbol: 'LT.BSE', name: 'Larsen & Toubro Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ADANIPORTS.BSE', name: 'Adani Ports and Special Economic Zone Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ULTRACEMCO.BSE', name: 'UltraTech Cement Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'GRASIM.BSE', name: 'Grasim Industries Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'SHREECEM.BSE', name: 'Shree Cement Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'AMBUJACEM.BSE', name: 'Ambuja Cements Ltd', exchange: 'BSE', sector: 'Infrastructure' },
    { symbol: 'ACC.BSE', name: 'ACC Ltd', exchange: 'BSE', sector: 'Infrastructure' },

    // Power & Utilities
    { symbol: 'NTPC.BSE', name: 'NTPC Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'POWERGRID.BSE', name: 'Power Grid Corporation of India Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'ADANIGREEN.BSE', name: 'Adani Green Energy Ltd', exchange: 'BSE', sector: 'Power' },
    { symbol: 'TATAPOWER.BSE', name: 'Tata Power Company Ltd', exchange: 'BSE', sector: 'Power' },

    // Retail & E-commerce
    { symbol: 'DMART.BSE', name: 'Avenue Supermarts Ltd', exchange: 'BSE', sector: 'Retail' },
    { symbol: 'TRENT.BSE', name: 'Trent Ltd', exchange: 'BSE', sector: 'Retail' },
    { symbol: 'TITAN.BSE', name: 'Titan Company Ltd', exchange: 'BSE', sector: 'Retail' },

    // Real Estate
    { symbol: 'DLF.BSE', name: 'DLF Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'GODREJPROP.BSE', name: 'Godrej Properties Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'OBEROIRLTY.BSE', name: 'Oberoi Realty Ltd', exchange: 'BSE', sector: 'Real Estate' },
    { symbol: 'PRESTIGE.BSE', name: 'Prestige Estates Projects Ltd', exchange: 'BSE', sector: 'Real Estate' },

    // Paints & Chemicals
    { symbol: 'ASIANPAINT.BSE', name: 'Asian Paints Ltd', exchange: 'BSE', sector: 'Paints' },
    { symbol: 'PIDILITIND.BSE', name: 'Pidilite Industries Ltd', exchange: 'BSE', sector: 'Paints' },
    { symbol: 'BERGEPAINT.BSE', name: 'Berger Paints India Ltd', exchange: 'BSE', sector: 'Paints' },

    // Electronics & Electricals
    { symbol: 'HAVELLS.BSE', name: 'Havells India Ltd', exchange: 'BSE', sector: 'Electronics' },
    { symbol: 'VOLTAS.BSE', name: 'Voltas Ltd', exchange: 'BSE', sector: 'Electronics' },
    { symbol: 'CROMPTON.BSE', name: 'Crompton Greaves Consumer Electricals Ltd', exchange: 'BSE', sector: 'Electronics' },

    // Insurance
    { symbol: 'SBILIFE.BSE', name: 'SBI Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },
    { symbol: 'HDFCLIFE.BSE', name: 'HDFC Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },
    { symbol: 'ICICIPRULI.BSE', name: 'ICICI Prudential Life Insurance Company Ltd', exchange: 'BSE', sector: 'Insurance' },

    // Others
    { symbol: 'BAJFINANCE.BSE', name: 'Bajaj Finance Ltd', exchange: 'BSE', sector: 'Finance' },
    { symbol: 'BAJAJFINSV.BSE', name: 'Bajaj Finserv Ltd', exchange: 'BSE', sector: 'Finance' },
    { symbol: 'SIEMENS.BSE', name: 'Siemens Ltd', exchange: 'BSE', sector: 'Industrial' },
    { symbol: 'ABB.BSE', name: 'ABB India Ltd', exchange: 'BSE', sector: 'Industrial' },
    { symbol: 'BOSCHLTD.BSE', name: 'Bosch Ltd', exchange: 'BSE', sector: 'Industrial' }
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
 * Get stock price from cache or fetch from AlphaVantage API
 */
async function getStockPrice(symbol) {
    const cacheKey = symbol.toUpperCase();
    const cached = priceCache.get(cacheKey);

    // Return cached price if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`Using cached data for ${symbol}`);
        return cached.data;
    }

    // Check rate limit
    if (apiCallCount >= API_CALL_LIMIT) {
        console.warn(`API rate limit reached (${apiCallCount}/${API_CALL_LIMIT}). Using mock data for ${symbol}`);
        return generateMockPriceData(symbol);
    }

    try {
        // Call AlphaVantage GLOBAL_QUOTE API
        const url = `${ALPHAVANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHAVANTAGE_API_KEY}`;
        console.log(`Fetching real-time data for ${symbol} from AlphaVantage...`);

        const response = await axios.get(url, { timeout: 10000 });
        apiCallCount++;
        console.log(`API call count: ${apiCallCount}/${API_CALL_LIMIT}`);

        const globalQuote = response.data['Global Quote'];

        if (!globalQuote || Object.keys(globalQuote).length === 0) {
            console.warn(`No data returned from AlphaVantage for ${symbol}. Using mock data.`);
            return generateMockPriceData(symbol);
        }

        const priceData = {
            symbol: globalQuote['01. symbol'] || symbol.toUpperCase(),
            price: parseFloat(globalQuote['05. price']) || 0,
            change: parseFloat(globalQuote['09. change']) || 0,
            changePercent: parseFloat(globalQuote['10. change percent']?.replace('%', '')) || 0,
            open: parseFloat(globalQuote['02. open']) || 0,
            high: parseFloat(globalQuote['03. high']) || 0,
            low: parseFloat(globalQuote['04. low']) || 0,
            volume: parseInt(globalQuote['06. volume']) || 0,
            previousClose: parseFloat(globalQuote['08. previous close']) || 0,
            lastUpdated: new Date().toISOString()
        };

        // Cache the result
        priceCache.set(cacheKey, {
            data: priceData,
            timestamp: Date.now()
        });

        return priceData;
    } catch (error) {
        console.error(`Error fetching price for ${symbol} from AlphaVantage:`, error.message);
        // Fallback to mock data on error
        console.log(`Falling back to mock data for ${symbol}`);
        return generateMockPriceData(symbol);
    }
}

/**
 * Generate realistic mock prices for Indian stocks (fallback when API fails)
 */
function generateMockPriceData(symbol) {
    // Remove .BSE suffix for lookup
    const baseSymbol = symbol.replace('.BSE', '').toUpperCase();

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
