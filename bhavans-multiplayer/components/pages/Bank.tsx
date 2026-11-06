"use client";
import { useState } from "react";
import { useGame } from "@/lib/store";
import * as E from "@/lib/game/engine";
import { LOAN_RATE, SAVINGS_RATE } from "@/lib/game/rules";
import { Stat, ago, fmt } from "../ui";

export function Bank() {
  const n = useGame((s) => s.nation)!;
  const world = useGame((s) => s.world);
  const bank = useGame((s) => s.bank);
  const sendMoney = useGame((s) => s.sendMoney);
  const [amt, setAmt] = useState("100");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const has = E.has(n, "bank");
  const a = +amt || 0;
  const rate = (n.role === "banker" ? 0.03 : SAVINGS_RATE) + 0.005 * (n.tech.finance ?? 0);
  const others = Object.values(world).filter((p) => p.id !== n.id && !p.ai);
  const flow = E.moneyFlow(n);
  const sheet = E.balanceSheet(n);
  const maxV = Math.max(1, ...flow.inc.map((x) => x.v));

  return (
    <main className="page">
      <header>
        <p className="kicker">{n.flag} National Bank of {n.name}</p>
        <h1 className="page-title">Bank</h1>
      </header>
      {!has && (
        <div className="banner gold">
          <span className="e">🏦</span>
          <b className="grow">Build the National Bank in your city to unlock savings, loans and transfers.</b>
        </div>
      )}
      <div className="grid3">
        <Stat icon="👛" v={fmt(n.res.coins)} l="wallet" />
        <Stat icon="🏦" v={fmt(n.bank.savings)} l={`savings · ${(rate * 100).toFixed(1)}%/day`} />
        <Stat icon="📉" v={fmt(n.bank.loan)} l={`loan · ${n.role === "banker" ? 3.5 : LOAN_RATE * 100}%/day`} />
      </div>
      <div className="cols">
        <section className="card green">
          <div className="card-h">
            <h3>💹 Money flow</h3>
            <b className="mono">{flow.net >= 0 ? "+" : ""}{fmt(flow.net)} 🪙/hour</b>
          </div>
          {flow.inc.map((x) => (
            <div key={x.label} className="stack" style={{ gap: 3 }}>
              <div className="row between small">
                <span>{x.label}</span>
                <b>+{x.v.toFixed(1)}/h</b>
              </div>
              <div className="bar">
                <i style={{ width: `${(x.v / maxV) * 100}%`, background: "#138808" }} />
              </div>
            </div>
          ))}
          {flow.out.map((x) => (
            <div key={x.label} className="row between small">
              <span>{x.label}</span>
              <b style={{ color: "#d23a3a" }}>−{x.v.toFixed(1)}/h</b>
            </div>
          ))}
          <p className="tiny muted" style={{ margin: 0 }}>
            ≈ {fmt(flow.net * 24)} coins a day. Happy citizens, partners and Finance research all boost income.
          </p>
        </section>
        <section className="card gold">
          <div className="card-h">
            <h3>📊 Net worth</h3>
            <b className="big">{fmt(sheet.total)}</b>
          </div>
          {sheet.items.map((x) => (
            <div key={x.label} className="row between small">
              <span>{x.label}</span>
              <b style={{ color: x.v < 0 ? "#d23a3a" : undefined }}>{fmt(x.v)}</b>
            </div>
          ))}
        </section>
      </div>
      <div className="cols">
        <div className="stack">
          <section className="card">
            <h3 className="h3">Savings & loans</h3>
            <input className="input" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, "").slice(0, 8))} />
            <div className="grid2">
              <button className="btn green" disabled={!has} onClick={() => bank("deposit", a)}>
                Deposit
              </button>
              <button className="btn" disabled={!has} onClick={() => bank("withdraw", a)}>
                Withdraw
              </button>
              <button className="btn navy" disabled={!has} onClick={() => bank("borrow", a)}>
                Borrow (max {fmt(E.loanLimit(n))})
              </button>
              <button className="btn" disabled={!has || !n.bank.loan} onClick={() => bank("repay", a)}>
                Repay loan
              </button>
            </div>
            <p className="tiny muted" style={{ margin: 0 }}>
              Savings grow every hour, and raiders can&apos;t steal them. Net worth: {fmt(E.netWorth(n))} 🪙.
            </p>
          </section>
          <section className="card">
            <h3 className="h3">💸 Send money</h3>
            <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Choose a country…</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.flag} {p.name} ({p.president})
                </option>
              ))}
            </select>
            <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value.slice(0, 80))} />
            <button className="btn primary" disabled={!has || !to || !a} onClick={() => sendMoney(to, a, note)}>
              Send {fmt(a)} 🪙 {E.transferFee(n) ? `(+${Math.ceil(a * E.transferFee(n))} fee)` : "(no fee)"}
            </button>
          </section>
        </div>
        <section className="card">
          <h3 className="h3">📄 Statement</h3>
          <div className="list">
            {n.ledger.map((l, i) => (
              <div key={i} className="row small">
                <span className="grow">
                  {l.text}
                  <div className="tiny muted">{ago(l.at)}</div>
                </span>
                {l.coins !== undefined && (
                  <b style={{ color: l.coins >= 0 ? "#138808" : "#d23a3a" }}>
                    {l.coins >= 0 ? "+" : ""}
                    {fmt(l.coins)}
                  </b>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
