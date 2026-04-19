import { NextResponse } from 'next/server';
import { RSI, EMA } from 'technicalindicators';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { symbol } = await req.json();
    const cleanSym = symbol.toUpperCase();

    // Fetch primary OHLC (1h) for chart
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${cleanSym}&interval=1h&limit=100`);
    if (!res.ok) throw new Error('Failed to fetch from Binance');
    const rawData = await res.json();
    
    const timestamps: number[] = [];
    const closes: number[] = [];
    const chartData = rawData.map((d: any) => {
        const time = d[0] / 1000; // unix seconds
        const open = parseFloat(d[1]);
        const high = parseFloat(d[2]);
        const low = parseFloat(d[3]);
        const close = parseFloat(d[4]);
        
        timestamps.push(time);
        closes.push(close);
        
        return { time, open, high, low, close };
    });

    // Calculate indicators on 1h
    const rsi14 = RSI.calculate({ values: closes, period: 14 });
    const ema9 = EMA.calculate({ values: closes, period: 9 });
    const ema21 = EMA.calculate({ values: closes, period: 21 });
    
    // We pad the beginning of indicator arrays to match chartData length if we want to plot lines
    const ema9Data = chartData.map((c:any, i:number) => ({
      time: c.time,
      value: i >= 8 ? ema9[i - 8] : null
    })).filter((d:any) => d.value !== null);

    const ema21Data = chartData.map((c:any, i:number) => ({
      time: c.time,
      value: i >= 20 ? ema21[i - 20] : null
    })).filter((d:any) => d.value !== null);

    const lastRsi = rsi14[rsi14.length - 1] || 50;
    const lastEma9 = ema9[ema9.length - 1] || 0;
    const lastEma21 = ema21[ema21.length - 1] || 0;
    const lastClose = closes[closes.length - 1];

    const trend = lastEma9 > lastEma21 ? 'Bullish' : 'Bearish';
    const momentum = lastRsi >= 70 ? 'Overbought' : (lastRsi <= 30 ? 'Oversold' : 'Neutral');

    let aiSummary = "Set GEMINI_API_KEY in .env.local to activate AI.";
    let recommendation = "Neutral";

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `Act as a quantitative FinTech analyst. Analyze ${cleanSym}. Current 1H metrics: Close: ${lastClose}, RSI: ${lastRsi.toFixed(2)}, EMA9: ${lastEma9.toFixed(2)}, EMA21: ${lastEma21.toFixed(2)}. Trend: ${trend}.
        Provide a 2 paragraph high-conviction analysis of the market structure. End exactly with RECOMMENDATION: [Buy/Sell/Neutral]`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        if(text.includes('RECOMMENDATION: Buy') || text.includes('RECOMMENDATION: BUY')) recommendation = 'Buy';
        if(text.includes('RECOMMENDATION: Sell') || text.includes('RECOMMENDATION: SELL')) recommendation = 'Sell';
        
        aiSummary = text.split('RECOMMENDATION:')[0].trim();
      } catch (aiErr: any) {
        console.error("Gemini AI Error:", aiErr);
        aiSummary = `AI analysis failed: ${aiErr.message || "Unknown error"}`;
      }
    }

    return NextResponse.json({
        symbol: cleanSym,
        metrics: {
            close: lastClose,
            rsi: lastRsi,
            ema9: lastEma9,
            ema21: lastEma21,
            trend,
            momentum
        },
        chartData,
        ema9Data,
        ema21Data,
        ai: {
            summary: aiSummary,
            recommendation
        }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
