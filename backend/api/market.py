import os
import httpx
import pandas as pd
import ta
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env variables
load_dotenv()

router = APIRouter()

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key and api_key != "your_api_key_here":
    genai.configure(api_key=api_key)

class AnalyzeRequest(BaseModel):
    symbol: str

async def fetch_binance_data(symbol: str, interval: str, limit: int = 100):
    url = "https://api.binance.com/api/v3/klines"
    params = {
        "symbol": symbol.upper(),
        "interval": interval,
        "limit": limit
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch data for {symbol}")
        
        data = response.json()
        df = pd.DataFrame(data, columns=[
            "timestamp", "open", "high", "low", "close", "volume",
            "close_time", "quote_asset_volume", "number_of_trades",
            "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume", "ignore"
        ])
        df['close'] = df['close'].astype(float)
        return df

def calculate_indicators(df: pd.DataFrame):
    # RSI 14
    rsi_indicator = ta.momentum.RSIIndicator(close=df['close'], window=14)
    df['rsi'] = rsi_indicator.rsi()
    
    # EMA 9 and EMA 21
    ema9_indicator = ta.trend.EMAIndicator(close=df['close'], window=9)
    df['ema_9'] = ema9_indicator.ema_indicator()
    
    ema21_indicator = ta.trend.EMAIndicator(close=df['close'], window=21)
    df['ema_21'] = ema21_indicator.ema_indicator()
    
    last_row = df.iloc[-1]
    
    rsi_val = last_row['rsi']
    ema9_val = last_row['ema_9']
    ema21_val = last_row['ema_21']
    close_val = last_row['close']
    
    trend = "Bullish" if ema9_val > ema21_val else "Bearish"
    momentum = "Overbought" if rsi_val >= 70 else ("Oversold" if rsi_val <= 30 else "Neutral")
    
    return {
        "close": round(close_val, 4),
        "ema_9": round(ema9_val, 4) if not pd.isna(ema9_val) else None,
        "ema_21": round(ema21_val, 4) if not pd.isna(ema21_val) else None,
        "rsi_14": round(rsi_val, 2) if not pd.isna(rsi_val) else None,
        "trend": trend,
        "momentum": momentum
    }

@router.post("/analyze")
async def analyze_market(req: AnalyzeRequest):
    symbol = req.symbol.upper()
    timeframes = ["5m", "15m", "1h", "1d"]
    results = {}
    
    for tf in timeframes:
        try:
            df = await fetch_binance_data(symbol, tf)
            indicators = calculate_indicators(df)
            results[tf] = indicators
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
    # Compile prompt for Gemini
    if not os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") == "your_api_key_here":
        return {
            "timeframes": results,
            "ai_analysis": {
                "summary": "Gemini API key is not configured. Please add it to the .env file.",
                "recommendation": "Neutral"
            }
        }
        
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        prompt = f"""
        Act as a professional technical market analyst. Analyze the following technical indicator data for cryptocurrency {symbol} across multiple timeframes.
        
        Data:
        {results}
        
        Provide a concise, professional market analysis report (approx. 3-4 paragraphs) highlighting the overall market context, key observations across timeframes, and potential shifts in momentum.
        At the very end of your response, provide a definitive action recommendation exactly in this format:
        RECOMMENDATION: [Buy/Sell/Neutral]
        """
        response = model.generate_content(prompt)
        text = response.text
        
        recommendation = "Neutral"
        if "RECOMMENDATION: Buy" in text or "RECOMMENDATION: BUY" in text:
            recommendation = "Buy"
        elif "RECOMMENDATION: Sell" in text or "RECOMMENDATION: SELL" in text:
            recommendation = "Sell"
            
        summary = text.split("RECOMMENDATION:")[0].strip()
        
        return {
            "timeframes": results,
            "ai_analysis": {
                "summary": summary,
                "recommendation": recommendation
            }
        }
        
    except Exception as e:
         return {
            "timeframes": results,
            "ai_analysis": {
                "summary": f"Failed to generate AI analysis: {str(e)}",
                "recommendation": "Neutral"
            }
        }
