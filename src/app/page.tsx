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
import FeatureCard from '@/components/FeatureCard';

import RateChart from '@/components/RateChart';
import Modal from '@/components/Modal';


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
  const [chartOpen, setChartOpen] = useState(false);

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
      <>
        {/* HERO */}
        <header className="bg-hero bg-grid">
          <div className="container section-sm">
            <nav className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[var(--button-primary-bg)]" />
                <span className="font-semibold">Currency Converter</span>
              </div>
              <div className="hidden sm:flex gap-5 text-sm">
                <a href="#converter" className="underline text-[var(--link)] hover:text-[var(--link-hover)]">Converter</a>
                <a href="#features" className="underline text-[var(--link)] hover:text-[var(--link-hover)]">Diferenciais</a>
                <a href="#sources" className="underline text-[var(--link)] hover:text-[var(--link-hover)]">Fontes</a>
                <a href="#currencies" className="underline text-[var(--link)] hover:text-[var(--link-hover)]">Moedas</a>
                <a href="#faq" className="underline text-[var(--link)] hover:text-[var(--link-hover)]">FAQ</a>
              </div>
            </nav>

            <div className="py-10 sm:py-14">
              <h1 className="text-3xl sm:text-4xl font-bold max-w-2xl">
                Conversão de moedas simples, precisa e resiliente.
              </h1>
              <p className="text-[var(--text-secondary)] mt-3 max-w-2xl">
                USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF e também BTC, ETH e USDT — taxa dinâmica
                de múltiplas fontes (intraday e diário) com fallback automático e arredondamento
                bancário para resultados confiáveis.
              </p>
              <div className="mt-6">
                <a
                  href="#converter"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[var(--button-primary-bg)] 
                  text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover)] focus-visible:ring-2 
                  focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                >
                  Começar agora →
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main id="content" role="main" className="bg-[var(--background-primary)] text-[var(--text-primary)]">
          {/* CONVERSOR */}
          <section id="converter" className="section">
            <div className="container">
              <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
                <div className="card p-5 h-full flex flex-col">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">Conversor</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Informe o valor, escolha as moedas e clique em converter.
                  </p>

                  {/* GRID dos campos (Valor | Swap | De | Para) */}
                  <div
                    className="
                      grid gap-x-3 gap-y-2 items-end
                      grid-cols-1
                      md:grid-cols-[2fr_auto_1fr_1fr]
                      md:grid-rows-[auto_auto]
                      md:[&>*]:min-w-0
                    "
                  >
                    {/* Valor (mais largo) */}
                    <div>
                      <AmountInput
                        amount={amount}
                        onChange={handleAmountChange}
                        error={amountError}
                        hint={`Máximo ${MAX_INT_DIGITS} dígitos inteiros e ${MAX_DEC_DIGITS} decimais`}
                        maxLength={MAX_INPUT_LENGTH}
                        hintClassName="md:hidden"
                      />
                    </div>

                    {/* Swap (estreito, alinhado à base) */}
                    <div className="flex justify-center self-end">
                      <SwapButton onClick={swap} />
                    </div>

                    {/* De */}
                    <div>
                      <CurrencySelect label="De" value={from} onChange={setFrom} />
                    </div>

                    {/* Para */}
                    <div>
                      <CurrencySelect label="Para" value={to} onChange={setTo} />
                    </div>

                    {/* Hint do Valor — somente desktop, logo abaixo da 1ª coluna */}
                    <p className="hidden md:block text-xs text-[var(--text-secondary)] mt-1 md:col-start-1 md:col-end-2">
                      Máximo {MAX_INT_DIGITS} dígitos inteiros e {MAX_DEC_DIGITS} decimais
                    </p>
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
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-[var(--link)] hover:text-[var(--link-hover)]"
                      >
                        Rates By Exchange Rate API
                      </a>
                    </p>
                  )}
                </div>

                {/* Ações extras */}
                <div className="mt-3 md:hidden">
                  <button
                    onClick={() => setChartOpen(true)}
                    className="h-10 px-4 rounded-lg border border-[color:var(--border)] 
                    hover:bg-[var(--background-secondary)] focus-visible:ring-2 
                    focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Ver gráfico (7d)
                  </button>
                </div>

                <Modal open={chartOpen} onClose={() => setChartOpen(false)} title="Taxa">
                  <RateChart from={from} to={to} days={7} />
                </Modal>

                {/* CARD: Gráfico (desktop) */}
                <div className="hidden md:block card p-5 h-full">
                  <h3 className="text-base font-semibold mb-2">Taxa</h3>
                  <RateChart from={from} to={to} days={7} />
                </div>

                <div className="card p-5">
                  <h3 className="text-base font-semibold mb-2">Como funciona</h3>
                  <ul className="text-sm text-[var(--text-secondary)] list-disc pl-5 space-y-2">
                    <li>Ordem de busca: <strong>Yahoo (intraday)</strong> → <strong>Frankfurter (diário)</strong> → <strong>Open ER-API</strong> → <strong>Currency-API (CDN)</strong>.</li>
                    <li>Criptomoedas (BTC, ETH, USDT) sem chave, via <strong>Currency-API</strong> (e gráfico via Yahoo quando disponível).</li>
                    <li>Se tudo falhar, usamos <strong>tabela estática</strong> e informamos via toast.</li>
                    <li>Precisão com <strong>decimal.js</strong> e <strong>ROUND_HALF_EVEN</strong>.</li>
                  </ul>
                  <div className="mt-3 text-xs text-[var(--text-secondary)]">
                    Observação: fontes diárias mostram apenas <em>dias úteis</em>; intraday cobre o intervalo completo.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DIFERENCIAIS */}
          <section id="features" className="section bg-[var(--background-secondary)]">
            <div className="container">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Diferenciais</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Foco em qualidade do código, acessibilidade e UX.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureCard
                  icon="🛡️"
                  title="Resiliência de rede"
                  desc="Fallback entre múltiplas fontes e mensagens claras em caso de indisponibilidade."
                />
                <FeatureCard
                  icon="📐"
                  title="Precisão monetária"
                  desc="Cálculos com decimal.js e ROUND_HALF_EVEN para valores financeiros."
                />
                <FeatureCard
                  icon="♿"
                  title="Acessível por padrão"
                  desc="Rótulos, aria-live, foco visível e sequência de tab coerente."
                />
              </div>
            </div>
          </section>

          {/* FONTES */}
          <section id="sources" className="section">
            <div className="container">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Fontes de câmbio</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                A aplicação escolhe a melhor fonte disponível. Para FIAT↔FIAT, priorizamos intraday (quando há),
                depois diário. Para pares com cripto, usamos Currency-API sem chave.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card p-4">
                  <div className="text-sm font-medium">Yahoo Finance</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Intraday (vários pontos por dia), sem chave.</p>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium">Frankfurter (ECB)</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Diário (dias úteis), estável e confiável.</p>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium">Open ER-API</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Fallback FIAT, sem chave.</p>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium">Currency-API (CDN)</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">FIAT + CRYPTO sem chave; também usado como fallback final.</p>
                </div>
              </div>
            </div>
          </section>


          {/* MOEDAS SUPORTADAS */}
          <section id="currencies" className="section bg-[var(--background-secondary)]">
            <div className="container">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Moedas suportadas</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Principais moedas fiat e criptos populares. Criptomoedas aparecem como “· CRYPTO” no seletor.
              </p>

              <div className="mb-3 text-sm font-medium">FIAT</div>
              <div className="flex flex-wrap gap-2 mb-6">
                {['USD','EUR','BRL','GBP','JPY','CAD','AUD','CHF'].map(c => (
                  <span key={c} className="px-2 py-1 rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-xs">
                    {c}
                  </span>
                ))}
              </div>

              <div className="mb-3 text-sm font-medium">CRYPTO</div>
              <div className="flex flex-wrap gap-2">
                {['BTC','ETH','USDT'].map(c => (
                  <span key={c} className="px-2 py-1 rounded-full border border-[color:var(--border)] bg-[var(--surface)] text-xs">
                    {c} <span className="opacity-70">· CRYPTO</span>
                  </span>
                ))}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-4">
                Notas: valores de cripto no <em>fallback estático</em> são apenas estimativas. Prefira a taxa dinâmica sempre que possível.
              </p>
            </div>
          </section>



          {/* FAQ */}
          <section id="faq" className="section bg-[var(--background-secondary)]">
            <div className="container">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Perguntas frequentes</h2>
              <div className="grid gap-3">
                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">O que acontece se a API cair?</summary>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    A aplicação tenta em cascata: <strong>Yahoo</strong> → <strong>Frankfurter</strong> → <strong>Open ER-API</strong> → <strong>Currency-API</strong>.
                    Se ainda assim falhar, usa a <strong>tabela estática</strong> e mostra um toast com opção de tentar novamente.
                  </p>
                </details>

                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">Por que às vezes não aparecem 7 pontos no gráfico?</summary>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    O <strong>Frankfurter</strong> é diário e cobre apenas <em>dias úteis</em>. Já o <strong>Yahoo</strong> retorna dados intraday
                    (vários pontos por dia). A aplicação escolhe a melhor fonte disponível.
                  </p>
                </details>

                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">Vocês suportam criptomoedas?</summary>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    Sim. BTC, ETH e USDT. Na taxa dinâmica usamos a <strong>Currency-API (CDN)</strong> sem chave; o gráfico utiliza
                    o <strong>Yahoo</strong> quando há símbolo disponível. No fallback estático, os valores de cripto são aproximados.
                  </p>
                </details>
              </div>
            </div>
          </section>


          {/* RODAPÉ */}
          <footer className="section-sm">
            <div className="container text-xs text-[var(--text-secondary)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>© {new Date().getFullYear()} Conversor de Moedas</span>
                <a
                  href="https://github.com/carlosvale03/currency-converter"
                  className="underline text-[var(--link)] hover:text-[var(--link-hover)]"
                  target="_blank" rel="noreferrer"
                >
                  Ver repositório no GitHub →
                </a>
              </div>
            </div>
          </footer>
        </main>
      </>
    </ClientErrorBoundary>
  );
}
