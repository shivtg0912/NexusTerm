# AI Market Analyst Pro

## What Does This Project Give?
This project provides a **lightweight, AI-driven technical analysis web application** for cryptocurrency markets. Instead of manually looking at charts and indicators across different timeframes, this app does the heavy lifting for you by:

1. **Fetching Real-time Data**: It connects directly to the Binance API to fetch live OHLC (Open, High, Low, Close) pricing data.
2. **Computing Indicators**: It automatically calculates key momentum and trend indicators (EMA 9, EMA 21, and RSI 14) across four different timeframes simultaneously (5-minute, 15-minute, 1-hour, and 1-day).
3. **AI Interpretation**: It acts as a professional financial analyst. It feeds the technical data into Google's Gemini AI, which writes a professional, concise summary of the current market state and spits out a definitive **Buy, Sell, or Neutral** recommendation.
4. **Beautiful UI**: It presents all this information in a modern, dark-mode, glassmorphism dashboard.

## Example Input
When you launch the application and open it in your browser, you will see a search bar. 
You need to input a valid Binance trading pair symbol.

**Example Inputs:**
- `BTCUSDT` (Bitcoin vs US Dollar Tether)
- `ETHUSDT` (Ethereum vs US Dollar Tether)
- `SOLUSDT` (Solana vs US Dollar Tether)
- `DOGEUSDT` (Dogecoin vs US Dollar Tether)

## How to Run

1. **Add Your API Key**
   Open the `.env` file in the root folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_key_here
   ```

2. **Install Dependencies**
   Open a terminal in the project folder and run:
   ```cmd
   pip install -r requirements.txt
   ```

3. **Start the Server**
   Run the backend FastAPI server with:
   ```cmd
   uvicorn backend.main:app --reload
   ```

4. **View the App**
   Open your browser and navigate to: `http://127.0.0.1:8000`
