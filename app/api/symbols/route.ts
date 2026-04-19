import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!res.ok) throw new Error('Binance API error');
    
    const data = await res.json();
    // Only return symbols that are trading
    const symbols = data.symbols
      .filter((s: any) => s.status === 'TRADING')
      .map((s: any) => s.symbol);
      
    return NextResponse.json(symbols);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
