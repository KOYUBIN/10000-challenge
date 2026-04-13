import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { cachedCall } from '../../utils/cache';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

// 인터벌별 캐시 TTL (짧은 봉은 짧게, 긴 봉은 길게)
const CACHE_TTL = { '1m': 60_000, '5m': 2 * 60_000, '15m': 3 * 60_000, '1h': 5 * 60_000, '4h': 10 * 60_000, '1d': 30 * 60_000 };

export default function TradingChart({ symbol, interval, onSymbolChange, onIntervalChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!containerRef.current || useFallback) return;

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
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [useFallback]);

  // 심볼/인터벌 변경 시 캐시 우선 조회 (자동 호출)
  useEffect(() => {
    if (useFallback) return;
    loadCandles(false);
  }, [symbol, interval, useFallback]);

  async function loadCandles(forceRefresh = false) {
    if (!seriesRef.current) return;
    setLoading(true);
    try {
      const cacheKey = `klines_${symbol}_${interval}`;
      const ttl = CACHE_TTL[interval] || 5 * 60_000;

      const data = await cachedCall(
        cacheKey,
        () => api.getKlines(symbol, interval, 200),
        ttl,
        forceRefresh
      );

      seriesRef.current.setData(data);
      if (data.length > 0) setPrice(data[data.length - 1].close);
      setLastUpdated(new Date());
    } catch {
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <ChartControls
        symbol={symbol}
        interval={interval}
        price={price}
        loading={loading}
        lastUpdated={lastUpdated}
        onSymbolChange={onSymbolChange}
        onIntervalChange={onIntervalChange}
        onRefresh={() => loadCandles(true)}
      />

      {useFallback ? (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">TradingView 차트</p>
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}&interval=${interval.toUpperCase().replace('M', '')}&theme=dark&style=1&locale=kr`}
            style={{ width: '100%', height: 380 }}
            className="rounded-lg border border-dark-600"
            title="TradingView Chart"
          />
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex items-center justify-center h-16 text-gray-500 text-sm mt-2">
              차트 로딩 중...
            </div>
          )}
          <div ref={containerRef} className="mt-2 rounded-lg overflow-hidden" />
        </>
      )}
    </div>
  );
}

function ChartControls({ symbol, interval, price, loading, lastUpdated, onSymbolChange, onIntervalChange, onRefresh }) {
  const fmtTime = (d) => d ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : '';

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <select className="input py-1 text-sm w-auto" value={symbol} onChange={(e) => onSymbolChange(e.target.value)}>
          {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {price && <span className="text-brand-500 font-bold">${price.toLocaleString()}</span>}
        {lastUpdated && (
          <span className="text-xs text-gray-600">{fmtTime(lastUpdated)} 기준</span>
        )}
        {/* 새로고침 버튼 - 누를 때만 Cloud Function 호출 */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="최신 데이터 불러오기"
          className="text-gray-500 hover:text-brand-500 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
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
