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

import type { RateWithMeta } from '@/providers/types';

import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
import { logger } from '@/lib/logger';

import { useToast } from '@/components/ToastProvider';


import {
  normalizeAmountInput,
  validateAmount,
  MAX_INPUT_LENGTH,
  MAX_INT_DIGITS,
  MAX_DEC_DIGITS,
} from '@/core/input';

export default function Home() {
  const [amount, setAmount] = useState('100');
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState<Currency>('USD');
  const [to, setTo] = useState<Currency>('BRL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [useDynamic, setUseDynamic] = useState(true);
  const [attributionUrl, setAttributionUrl] = useState<string | null>(null);
  const { toast } = useToast();

  function handleAmountChange(v: string) {
    const cleaned = normalizeAmountInput(v);
    setAmount(cleaned);

    const check = validateAmount(cleaned);
    if (check.ok) {
      setAmountError(undefined);
    } else if (check.reason === 'incomplete') {
      // estado intermediário: não exibir erro
      setAmountError(undefined);
    } else {
      setAmountError(check.message);
    }
  }

  const canConvert = useMemo(() => {
    const v = validateAmount(amount);
    return v.ok; // botão só habilita quando valor final está ok
  }, [amount]);

  async function doConvert(opts?: { forceDynamic?: boolean }) {
    setError('');
    setLoading(true);
    setResult(null);
    setDetails(null);
    setAttributionUrl(null);

    const controller = new AbortController();

    try {
      const wantDynamic = opts?.forceDynamic ?? useDynamic;

      let rate: RateWithMeta;
      if (wantDynamic) {
        rate = await HttpRateProvider.getRate(from, to, controller.signal);
      } else {
        rate = StaticRateProvider.getRate(from, to);
      }

      const value = convert(amount, rate);
      const nf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: to });

      setResult(nf.format(Number(value)));

      const providerNote = rate.provider ? ` • Fonte: ${rate.provider}` : '';
      setDetails(
        `Taxa usada: 1 ${from} = ${Number(rate.value).toFixed(6)} ${to} ` +
          (wantDynamic ? '(API)' : '(estática)') +
          providerNote
      );

      setAttributionUrl(
        rate.provider === 'open-er-api'
          ? rate.attributionUrl ?? 'https://www.exchangerate-api.com'
          : null
      );

      if (opts?.forceDynamic && rate.provider) {
        toast({ type: 'success', message: 'Taxa dinâmica obtida com sucesso!', duration: 3000 });
      }
    } catch {
      logger.warn('Falha ao obter taxa dinâmica. Tentando fallback estático.');
      try {
        const rate = StaticRateProvider.getRate(from, to);
        const value = convert(amount, rate);
        const nf = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: to });

        setResult(nf.format(Number(value)));
        setDetails(`Taxa (fallback estático): 1 ${from} = ${Number(rate.value).toFixed(6)} ${to}`);
        setError('Não foi possível obter taxa dinâmica. Usando tabela fixa.');
        setAttributionUrl(null);

        toast({
          type: 'warning',
          message: 'Não foi possível obter a taxa dinâmica.',
          action: {
            label: 'Tentar novamente',
            onClick: () => doConvert({ forceDynamic: true }),
          },
          duration: 8000,
        });
      } catch {
        logger.error('Falha no fallback estático durante a conversão.');
        setError('Erro ao converter. Verifique o valor e tente novamente.');
        setAttributionUrl(null);

        toast({
          type: 'error',
          message: 'Falha geral na conversão.',
          action: { label: 'Repetir', onClick: () => doConvert({ forceDynamic: true }) },
          duration: 8000,
        });
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
    <ClientErrorBoundary>
      <main id="content" role="main" className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)]">
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Conversor de Moedas</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Suporta USD, EUR e BRL. Você pode alternar entre taxa dinâmica (API) e tabela fixa. 
          </p>

          <div className="grid gap-3 items-end grid-cols-1 md:grid-cols-[1fr_auto_1fr] order-1">
            <AmountInput
              amount={amount}
              onChange={handleAmountChange}
              error={amountError}
              hint={`Máximo ${MAX_INT_DIGITS} dígitos inteiros e ${MAX_DEC_DIGITS} decimais`}
              maxLength={MAX_INPUT_LENGTH}
            />
            <div className="flex justify-center mb-2 order-2">
              <SwapButton onClick={swap} />
            </div>
            <div className="grid grid-cols-2 gap-3 order-3">
              <CurrencySelect label="De" value={from} onChange={setFrom} />
              <CurrencySelect label="Para" value={to} onChange={setTo} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              className="h-11 px-5 rounded-lg bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] 
              hover:bg-[var(--button-primary-hover)] disabled:opacity-50 focus-visible:ring-2 
              focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 cursor-pointer"
              onClick={() => { void doConvert(); }}
              disabled={!canConvert || loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Convertendo
                </span>
              ) : (
                'Converter'
              )}
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

          {attributionUrl && (
            <p className="text-xs text-gray-500 mt-2">
              <a 
                href={attributionUrl} 
                target="_blank" rel="noreferrer" 
                className="underline text-[var(--link)] hover:text-[var(--link-hover)]" >
                Rates By Exchange Rate API
              </a>
            </p>
          )}


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
    </ClientErrorBoundary>
  );
}
