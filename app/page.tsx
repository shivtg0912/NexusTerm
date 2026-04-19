"use client";

import { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { Search, Activity, Zap, TrendingUp, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const [trending, setTrending] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(d => setTrending(d))
      .catch(e => console.error(e));

    fetch('/api/symbols')
      .then(r => r.json())
      .then(d => setAllSymbols(d))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (data && chartContainerRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.05)' },
          horzLines: { color: 'rgba(255,255,255,0.05)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        timeScale: { timeVisible: true, secondsVisible: false },
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff003c',
        borderVisible: false,
        wickUpColor: '#00ff88',
        wickDownColor: '#ff003c',
      });
      candleSeries.setData(data.chartData);

      const ema9Series = chart.addLineSeries({ color: '#00f2fe', lineWidth: 2, title: 'EMA9' });
      ema9Series.setData(data.ema9Data);

      const ema21Series = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2, title: 'EMA21' });
      ema21Series.setData(data.ema21Data);

      chart.timeScale().fitContent();
      chartRef.current = chart;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
      };
    }
  }, [data]);

  const analyze = async (sym: string) => {
    if (!sym) return;
    setLoading(true);
    setSymbol(sym);
    setSearchInput(sym);
    setShowDropdown(false);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym })
      });
      const d = await res.json();
      if (!res.ok || d.error) {
        alert(d.error || 'Failed to fetch analysis.');
        setData(null);
        return;
      }
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-charcoal/50 border-r border-white/5 flex flex-col p-6 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-12">
          <Activity className="text-neon-blue w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tighter text-glow-blue uppercase">Nexus<span className="text-neon-green">Term</span></h1>
        </div>
        
        <h2 className="text-xs uppercase text-gray-500 font-bold mb-4 tracking-widest">Trending Volume</h2>
        <div className="flex flex-col gap-3">
          {trending.map((t: any) => (
            <div 
              key={t.symbol} 
              onClick={() => analyze(t.symbol)}
              className="glass-panel p-4 cursor-pointer hover:border-neon-blue/40 transition-all group"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white group-hover:text-neon-blue transition-colors">{t.symbol}</span>
                <span className={parseFloat(t.changePercent) >= 0 ? "text-neon-green" : "text-neon-red"}>
                  {parseFloat(t.changePercent) > 0 ? '+' : ''}{t.changePercent}%
                </span>
              </div>
              <div className="text-sm text-gray-400 font-mono">${t.price}</div>
            </div>
          ))}
          {trending.length === 0 && <div className="text-gray-500 text-sm animate-pulse">Scanning network...</div>}
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto cyber-scroll">
        <div className="flex justify-between flex-row items-center mb-8 gap-6">
            <h2 className="text-2xl font-black uppercase text-white/90 tracking-widest">Global Market Matrix</h2>
            <div className="relative w-96">
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5 z-10" />
                <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSearchInput(val);
                        if(val) {
                            setFilteredSymbols(allSymbols.filter(s => s.includes(val)).slice(0, 8));
                            setShowDropdown(true);
                        } else {
                            setShowDropdown(false);
                        }
                    }}
                    onFocus={() => {
                        if(searchInput) setShowDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="ENTER SYMBOL (e.g. BTCUSDT)..."
                    className="w-full bg-charcoal border border-white/10 rounded-full py-3 pl-12 pr-6 text-white uppercase focus:outline-none focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all font-mono placeholder:normal-case relative z-10"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            setShowDropdown(false);
                            if (allSymbols.includes(searchInput)) analyze(searchInput);
                            else alert("Invalid Binance Symbol. Please select from the dropdown.");
                        }
                    }}
                />
                {showDropdown && filteredSymbols.length > 0 && (
                    <div className="absolute top-14 left-0 w-full bg-charcoal/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl">
                        {filteredSymbols.map(sym => (
                            <div 
                                key={sym}
                                onClick={() => analyze(sym)}
                                className="px-6 py-3 cursor-pointer hover:bg-neon-green/20 hover:text-neon-green text-white/80 font-mono transition-colors"
                            >
                                {sym}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-charcoal border-t-neon-green rounded-full animate-spin"></div>
                    <p className="text-neon-green font-mono animate-pulse">Running computational models...</p>
                </div>
            </div>
        ) : !data ? (
            <div className="flex-1 flex items-center justify-center flex-col opacity-50">
               <BarChart2 className="w-24 h-24 text-gray-600 mb-4" />
               <p className="text-xl font-mono">AWAITING COMM INSTRUCTION</p>
            </div>
        ) : (
            <div className="flex-1 grid grid-cols-12 gap-6 pb-6">
                
                {/* Chart Area */}
                <div className="col-span-8 flex flex-col gap-6">
                    <div className="glass-panel-neon p-6 h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold tracking-wider">{data.symbol} <span className="text-sm text-gray-400 ml-2">1H TIMEFRAME</span></h3>
                            <div className="flex gap-4">
                                <span className={data.metrics.trend === 'Bullish' ? 'text-neon-green border border-neon-green px-3 py-1 rounded-sm text-xs' : 'text-neon-red border border-neon-red px-3 py-1 rounded-sm text-xs'}>
                                    {data.metrics.trend.toUpperCase()} TREND
                                </span>
                            </div>
                        </div>
                        <div ref={chartContainerRef} className="flex-1 w-full" />
                    </div>
                </div>

                {/* Right Panel - AI Analysis */}
                <div className="col-span-4 flex flex-col gap-6">
                    {/* Recommendation Chip */}
                    <div className={`glass-panel p-8 text-center flex flex-col items-center justify-center ${data.ai.recommendation === 'Buy' ? 'border-neon-green/50 shadow-[0_0_30px_rgba(0,255,136,0.1)]' : data.ai.recommendation === 'Sell' ? 'border-neon-red/50 shadow-[0_0_30px_rgba(255,0,60,0.1)]' : 'border-neon-blue/50'}`}>
                        <div className="text-xs tracking-widest text-gray-400 mb-4">SYSTEM DIRECTIVE</div>
                        <h1 className={`text-4xl font-black uppercase tracking-widest ${data.ai.recommendation === 'Buy' ? 'text-neon-green text-glow-green' : data.ai.recommendation === 'Sell' ? 'text-neon-red text-glow-red' : 'text-neon-blue'}`}>
                            {data.ai.recommendation}
                        </h1>
                    </div>

                    {/* Gauges */}
                    <div className="glass-panel p-6">
                        <h3 className="text-sm text-gray-400 mb-6 uppercase tracking-widest">Telemetry</h3>
                        <div className="flex justify-around items-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-[3px] border-charcoal">
                                    <div className="absolute inset-0 rounded-full border-[3px] border-t-neon-blue border-r-neon-blue border-l-transparent border-b-transparent transform rotate-45"></div>
                                    <span className="font-bold">{data.metrics.rsi.toFixed(0)}</span>
                                </div>
                                <span className="text-xs text-gray-500">RSI 14</span>
                                <span className={`text-[10px] ${data.metrics.momentum === 'Overbought' ? 'text-neon-red' : data.metrics.momentum === 'Oversold' ? 'text-neon-green' : 'text-gray-400'}`}>{data.metrics.momentum.toUpperCase()}</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                 <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-[3px] border-charcoal">
                                    <div className={`absolute inset-0 rounded-full border-[3px] ${data.metrics.trend === 'Bullish' ? 'border-t-neon-green border-r-neon-green' : 'border-t-neon-red border-r-neon-red'} border-l-transparent border-b-transparent transform -rotate-45`}></div>
                                    <TrendingUp className={data.metrics.trend === 'Bullish' ? 'text-neon-green' : 'text-neon-red'} />
                                </div>
                                <span className="text-xs text-gray-500">EMA CROSS</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Syntax */}
                    <div className="glass-panel p-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="text-neon-blue w-5 h-5" />
                            <h3 className="text-sm uppercase tracking-widest text-white/80">AI Synthesis Core</h3>
                        </div>
                        <div className="text-sm text-gray-300 leading-relaxed space-y-4 font-mono">
                            {data.ai.summary.split('\n\n').map((para:string, i:number) => (
                                <p key={i}>
                                    <span className="text-neon-blue/50 mr-2">{'>'}</span>{para}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        )}
      </main>
    </div>
  );
}
