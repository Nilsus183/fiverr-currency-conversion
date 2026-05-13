import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import fiverrLogo from "../fiverr.jpg";
import {
  getLocaleFromPath,
  localeOrder,
  locales,
} from "./locales.js";
import "./styles.css";

function fiverrUsdToEur(usd) {
  return Math.round(usd * 0.89281 * 100) / 100;
}

function fiverrEurToUsd(eur) {
  return Math.round((eur / 0.89281) * 100) / 100;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function formatTemplate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

function App() {
  const localeCode = getLocaleFromPath(window.location.pathname);
  const locale = locales[localeCode];
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState("usdToEur");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.lang = locale.htmlLang;
    document.documentElement.dir = locale.dir;
    document.title = locale.title;
  }, [locale]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!languageMenuRef.current?.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsLanguageOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale.locale],
  );

  function formatMoney(value) {
    return value === null ? "--" : numberFormatter.format(value);
  }

  const calculation = useMemo(() => {
    const value = Number.parseFloat(amount.replace(",", "."));

    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    const isUsdToEur = direction === "usdToEur";
    const fiverrPriceUsd = isUsdToEur ? value : fiverrEurToUsd(value);
    const converted = isUsdToEur ? fiverrUsdToEur(value) : fiverrEurToUsd(value);
    const sellerUsd = roundMoney(fiverrPriceUsd * 0.8);
    const sellerEur = fiverrUsdToEur(sellerUsd);
    const buyerFixedFee = fiverrPriceUsd < 200 ? 3.5 : 0;
    const buyerUsd = roundMoney(fiverrPriceUsd * 1.055 + buyerFixedFee);
    const buyerEur = fiverrUsdToEur(buyerUsd);

    return {
      buyerEur,
      buyerFixedFee,
      buyerUsd,
      converted,
      fiverrPriceEur: fiverrUsdToEur(fiverrPriceUsd),
      fiverrPriceUsd: roundMoney(fiverrPriceUsd),
      sellerEur,
      sellerUsd,
    };
  }, [amount, direction]);

  const isUsdToEur = direction === "usdToEur";
  const inputCurrency = isUsdToEur ? "USD" : "EUR";
  const outputCurrency = isUsdToEur ? "EUR" : "USD";
  const inputSymbol = isUsdToEur ? "$" : "€";
  const resultLabel = isUsdToEur ? locale.resultUsdToEur : locale.resultEurToUsd;
  const converted = calculation?.converted ?? null;

  function handleDirectionChange(nextDirection) {
    if (nextDirection === direction) {
      return;
    }

    if (converted !== null) {
      setAmount(String(converted));
    }

    setDirection(nextDirection);
  }

  function handleLocaleChange(nextLocaleCode) {
    setIsLanguageOpen(false);
    window.location.href = `/${nextLocaleCode}/`;
  }

  return (
    <main className="grid min-h-screen min-w-80 place-items-center bg-linear-to-br from-emerald-50 via-slate-50 to-teal-100 px-4 py-8 font-sans text-[#18221e]">
      <div className="fixed right-4 top-4 z-30" ref={languageMenuRef}>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cdd8d2] bg-white/95 px-3.5 text-sm font-extrabold uppercase text-[#0d6e45] shadow-lg shadow-emerald-950/10 backdrop-blur transition hover:border-[#1dbf73] hover:text-[#17231e] focus:outline-none focus:ring-4 focus:ring-[#1dbf73]/20"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isLanguageOpen}
          aria-label={locale.language}
          onClick={() => setIsLanguageOpen((isOpen) => !isOpen)}
        >
          <span>{localeCode}</span>
          <span
            className={`text-[10px] transition ${isLanguageOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {isLanguageOpen ? (
          <div
            className="absolute right-0 top-12 z-40 max-h-[min(28rem,calc(100vh-5rem))] w-56 overflow-y-auto rounded-lg border border-[#d8e1dc] bg-white p-1.5 shadow-2xl shadow-emerald-950/15"
            role="listbox"
            aria-label={locale.language}
          >
            {localeOrder.map((code) => {
              const option = locales[code];
              const isActive = code === localeCode;

              return (
                <button
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#e8f7f0] text-[#0d6e45]"
                      : "text-[#42514a] hover:bg-[#f3f7f5] hover:text-[#17231e]"
                  }`}
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleLocaleChange(code)}
                >
                  <span>{option.name}</span>
                  <span className="text-xs font-extrabold uppercase text-[#789087]">
                    {code}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <section className="w-full max-w-110 rounded-lg border border-[#18221e]/10 bg-white/95 p-6 shadow-2xl shadow-emerald-950/15 max-[420px]:p-4.5">
        <div className="mb-5.5 flex items-center gap-2.5 text-[15px] font-bold text-[#42514a]">
          <div
            className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold text-[#42514a]"
            aria-label={locale.appName}
          >
            <img
              className="size-8.5 shrink-0 rounded-full object-cover"
              src={fiverrLogo}
              alt="Fiverr"
            />
            <h1 className="m-0 truncate text-[15px] font-bold text-[#42514a]">
              {locale.appName}
            </h1>
          </div>
        </div>

        <div
          className="mb-4.5 grid grid-cols-2 gap-1 rounded-lg border border-[#cdd8d2] bg-[#edf3f0] p-1"
          aria-label={locale.directionLabel}
        >
          <button
            className={`min-h-10 rounded-md text-sm font-extrabold transition ${
              isUsdToEur
                ? "bg-white text-[#0d6e45] shadow-sm shadow-[#18221e]/15"
                : "text-[#516059] hover:text-[#17231e]"
            }`}
            type="button"
            onClick={() => handleDirectionChange("usdToEur")}
          >
            {locale.usdToEur}
          </button>
          <button
            className={`min-h-10 rounded-md text-sm font-extrabold transition ${
              !isUsdToEur
                ? "bg-white text-[#0d6e45] shadow-sm shadow-[#18221e]/15"
                : "text-[#516059] hover:text-[#17231e]"
            }`}
            type="button"
            onClick={() => handleDirectionChange("eurToUsd")}
          >
            {locale.eurToUsd}
          </button>
        </div>

        <div className="rounded-lg border border-[#1dbf73]/25 bg-[#f7fbf9] p-5">
          <p className="m-0 text-sm font-semibold text-[#5f6d66]">{resultLabel}</p>
          <output
            className="mt-2 block text-[clamp(34px,8vw,48px)] font-extrabold leading-none text-[#17231e]"
            aria-live="polite"
          >
            {formatMoney(converted)} {outputCurrency}
          </output>
        </div>

        <label className="mt-5.5 grid gap-2" htmlFor="amount">
          <span className="text-sm font-semibold text-[#5f6d66]">
            {formatTemplate(locale.amountLabel, { currency: inputCurrency })}
          </span>
          <div className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-2.5 rounded-lg border border-[#bac6c0] bg-white px-3.5 focus-within:border-[#1dbf73] focus-within:shadow-[0_0_0_4px_rgba(29,191,115,0.15)]">
            <span className="text-xl text-[#1f7d53]">{inputSymbol}</span>
            <input
              className="w-full min-w-0 border-0 bg-transparent text-2xl font-bold text-[#17231e] outline-none"
              id="amount"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        </label>

        <div className="mt-4.5 grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <article className="grid min-w-0 gap-1.5 rounded-lg border border-[#18221e]/10 bg-white p-3.5">
            <span className="text-sm font-semibold text-[#5f6d66]">
              {locale.sellerGets}
            </span>
            <strong className="text-2xl leading-tight text-[#17231e]">
              {formatMoney(calculation?.sellerEur ?? null)} EUR
            </strong>
            <small className="text-xs leading-normal text-[#607169]">
              {formatTemplate(locale.sellerFeeNote, {
                amount: formatMoney(calculation?.sellerUsd ?? null),
              })}
            </small>
          </article>

          <article className="grid min-w-0 gap-1.5 rounded-lg border border-[#18221e]/10 bg-white p-3.5">
            <span className="text-sm font-semibold text-[#5f6d66]">
              {locale.buyerPays}
            </span>
            <strong className="text-2xl leading-tight text-[#17231e]">
              {formatMoney(calculation?.buyerUsd ?? null)} USD
            </strong>
            <small className="text-xs leading-normal text-[#607169]">
              {formatTemplate(locale.buyerFeeNote, {
                amount: formatMoney(calculation?.buyerEur ?? null),
                fixedFee: calculation?.buyerFixedFee ? locale.fixedFee : "",
              })}
            </small>
          </article>
        </div>

        <div className="mt-4.5 grid gap-2.5 border-t border-[#18221e]/10 pt-4.5">
          <div className="flex justify-between gap-4 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-1.5">
            <span className="text-sm font-semibold text-[#5f6d66]">
              {locale.fiverrPrice}
            </span>
            <strong className="text-right text-sm text-[#17231e] max-[420px]:text-left">
              {formatMoney(calculation?.fiverrPriceUsd ?? null)} USD /{" "}
              {formatMoney(calculation?.fiverrPriceEur ?? null)} EUR
            </strong>
          </div>
          <div className="flex justify-between gap-4 max-[420px]:flex-col max-[420px]:items-start max-[420px]:gap-1.5">
            <span className="text-sm font-semibold text-[#5f6d66]">
              {locale.conversion}
            </span>
            <strong className="text-right text-sm text-[#17231e] max-[420px]:text-left">
              {isUsdToEur ? "USD x 0.89281" : "EUR / 0.89281"}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
