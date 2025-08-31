'use client';

import { useMemo, useState } from 'react';
import AmountInput from '@/components/AmountInput';
import CurrencySelect from '@/components/CurrencySelect';
import SwapButton from '@/components/SwapButton';
import ResultPanel from '@/components/ResultPanel';
import ErrorBanner from '@/components/ErrorBanner';
import { convert } from '@/core/convert';
import type { Currency } from '@/core/money';
import { StaticRateProvider } from '@/providers/static';
import { HttpRateProvider } from '@/providers/http';

export default function Home() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState<Currency>('USD');
  const [to, setTo] = useState<Currency>('BRL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [useDynamic, setUseDynamic] = useState(true);

  const canConvert = useMemo(() => {
    if (amount.trim() === '') return false;
    if (Number.isNaN(Number(amount))) return false;
    if (Number(amount) < 0) return false;
    return true;
  }, [amount]);

  async function doConvert() {
    setError('');
    setLoading(true);
    setResult(null);
    setDetails(null);
    const controller = new AbortController();

    try {
      const rate = useDynamic
        ? await HttpRateProvider.getRate(from, to, controller.signal)
        : StaticRateProvider.getRate(from, to);

      const value = convert(amount, rate);
      const nf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: to });

      setResult(`${nf.format(Number(value))}`);
      setDetails(
        `Taxa usada: 1 ${from} = ${Number(rate.value).toFixed(6)} ${to} ` +
        (useDynamic ? '(API)' : '(estática)')
      );
    } catch {
      // fallback para estático se a API falhar
      try {
        const rate = StaticRateProvider.getRate(from, to);
        const value = convert(amount, rate);
        const nf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: to });
        setResult(`${nf.format(Number(value))}`);
        setDetails(
          `Taxa (fallback estático): 1 ${from} = ${Number(rate.value).toFixed(6)} ${to}`
        );
        setError('Não foi possível obter taxa dinâmica. Usando tabela fixa.');
      } catch {
        setError('Erro ao converter. Verifique o valor e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setResult(null);
    setDetails(null);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Conversor de Moedas</h1>
        <p className="text-sm text-gray-600 mb-6">
          Suporta USD, EUR e BRL. Você pode alternar entre taxa dinâmica (API) e tabela fixa. 
        </p>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <AmountInput amount={amount} onChange={setAmount} />
          <div className="flex justify-center mb-2">
            <SwapButton onClick={swap} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CurrencySelect label="De" value={from} onChange={setFrom} />
            <CurrencySelect label="Para" value={to} onChange={setTo} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            onClick={doConvert}
            disabled={!canConvert || loading}
          >
            Converter
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDynamic}
              onChange={(e) => setUseDynamic(e.target.checked)}
            />
            Usar taxa dinâmica (API)
          </label>
        </div>

        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>

        <div className="mt-3">
          <ResultPanel loading={loading} resultText={result} details={details} />
        </div>

        <hr className="my-6" />
        <section className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>Moedas:</strong> USD, EUR, BRL
          </div>
          <div>
            <strong>Como funciona:</strong> Tentamos taxa dinâmica via API; se falhar, caímos no estático.
          </div>
        </section>
      </div>
    </main>
  );
}
