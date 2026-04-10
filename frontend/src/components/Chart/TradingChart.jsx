import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

export default function TradingChart({ symbol, interval, onSymbolChange, onIntervalChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#111827' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: { borderColor: '#374151', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 380,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    loadCandles();
  }, [symbol, interval]);

  async function loadCandles() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/chart/klines?symbol=${symbol}&interval=${interval}&limit=200`
      );
      if (!res.ok) throw new Error('차트 데이터 로드 실패');
      const data = await res.json();
      seriesRef.current.setData(data);
      if (data.length > 0) setPrice(data[data.length - 1].close);
    } catch (err) {
      // 백엔드 없을 때 TradingView 위젯으로 폴백
      setError('백엔드 서버에 연결할 수 없습니다. TradingView 위젯을 사용합니다.');
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="card">
        <ChartControls
          symbol={symbol}
          interval={interval}
          onSymbolChange={onSymbolChange}
          onIntervalChange={onIntervalChange}
        />
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">{error}</p>
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=${interval.toUpperCase().replace('M', '')}&theme=dark&style=1&locale=kr`}
            style={{ width: '100%', height: 380 }}
            className="rounded-lg border border-dark-600"
            title="TradingView Chart"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <ChartControls
        symbol={symbol}
        interval={interval}
        price={price}
        onSymbolChange={onSymbolChange}
        onIntervalChange={onIntervalChange}
      />
      {loading && (
        <div className="flex items-center justify-center h-16 text-gray-500 text-sm mt-2">
          차트 로딩 중...
        </div>
      )}
      <div ref={containerRef} className="mt-2 rounded-lg overflow-hidden" />
    </div>
  );
}

function ChartControls({ symbol, interval, price, onSymbolChange, onIntervalChange }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <select
          className="input py-1 text-sm w-auto"
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {price && (
          <span className="text-brand-500 font-bold">${price.toLocaleString()}</span>
        )}
      </div>
      <div className="flex gap-1">
        {INTERVALS.map((i) => (
          <button
            key={i}
            onClick={() => onIntervalChange(i)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              interval === i ? 'bg-brand-500 text-black font-bold' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}
