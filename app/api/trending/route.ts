import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
    
    // Binance 24hr ticker returns an array if no symbol, but we'll fetch specific symbols or all and filter.
    // Easiest is to fetch all tickers and filter to avoid 6 requests.
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!res.ok) throw new Error('Binance API error');
    
    const data = await res.json();
    const trending = data
      .filter((d: any) => symbols.includes(d.symbol))
      .map((d: any) => ({
        symbol: d.symbol,
        price: parseFloat(d.lastPrice).toFixed(4),
        changePercent: parseFloat(d.priceChangePercent).toFixed(2),
        volume: parseFloat(d.volume).toFixed(0)
      }))
      .sort((a: any, b: any) => parseFloat(b.volume) - parseFloat(a.volume));
      
    return NextResponse.json(trending);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
