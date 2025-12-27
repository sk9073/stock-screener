# Stock Alert Trading Guide

This project includes automated scanners that run daily at **8:00 AM IST** on NSE 500 stocks. Below is a guide on how to interpret the signals and potential trading strategies for each.

> **Disclaimer**: These are algorithmic signals based on technical analysis. They represent *opportunities* to investigate, not financial advice. Always perform your own analysis and use proper risk management (Stop Losses).

---

## 1. Falling Knives (>6% Drop)

### **The Signal**
*   **Logic**: Identifies stocks that have fallen by **-6% or more** over the last **6 calendar days**.
*   **Meaning**: These stocks are experiencing heavy selling pressure.

### **How to Trade**
This is a **High Risk** strategy, often called "Catching a Falling Knife".
*   **Be Careful**: Do NOT buy just because it fell. It might fall another 10%.
*   **Wait for Support**: Look for the price to reach a major support level (Moving Average, previous Swing Low).
*   **Confirmation**: Wait for a "Green Candle" day or a Hammer candle pattern before entering.
*   **Strategy**: Quick Scalp / Short-term Swing. Expect a "Dead Cat Bounce" (a quick recovery of 2-4%) and exit.

---

## 2. RSI Reversion (Momentum)

### **The Signal**
We use the **Relative Strength Index (RSI 14)** to measure if a stock is "Overbought" or "Oversold". We combine this with the **200-day Simple Moving Average (SMA)** to filter for trend.

### **A. OVERSOLD IN UPTREND (⭐ High Quality Buy)**
*   **Logic**: RSI < 30 **AND** Price > 200 SMA.
*   **Context**: The long-term trend is **UP**, but the stock is having a temporary pullback.
*   **Strategy**: "Buy The Dip".
    *   **Entry**: When price starts breaking the previous day's High.
    *   **Stop Loss**: Below the recent swing low.
    *   **Target**: When RSI returns to 50 or Price hits the 20 SMA.

### **B. OVERBOUGHT IN DOWNTREND (High Quality Short)**
*   **Logic**: RSI > 75 **AND** Price < 200 SMA.
*   **Context**: The long-term trend is **DOWN**, but the stock has rallied (perhaps a "sucker's rally").
*   **Strategy**: "Short The Rip".
    *   **Entry**: Look for bearish reversal candles (Shooting Star, Engulfing).
    *   **Target**: Previous lows.

### **C. OVERSOLD / OVERBOUGHT (Standard)**
*   **Logic**: RSI < 30 (Oversold) or RSI > 75 (Overbought) *without* trend confirmation.
*   **Context**: A standard "Reversion to the Mean" play.
*   **Strategy**: 
    *   **Oversold**: Watch for a bounce. Risky if the stock is crashing due to bad news.
    *   **Overbought**: Watch for a pullback. Good time to book profits if you already own it.

---

## 3. Golden Cross (Trend Reversal)

### **The Signal**
*   **Logic**: **50-day SMA** crosses **ABOVE** the **200-day SMA**.
*   **Meaning**: Short-term momentum has overpowered long-term inertia. This is a classic **Long-Term Bullish** signal.

### How to Trade
*   **Timeframe**: Months to Years.
*   **Strategy**: Trend Following (Hybrid Entry).

**New: Use the RSI Column in your email to decide:**

| RSI at Crossover | Scenario | Action |
| :--- | :--- | :--- |
| **> 70 (Red)** | Value is exhausted | **WAIT**. 90% chance it pulls back. Set GTT at 50 SMA. |
| **50 - 65 (Green)** | Steady Rally | **BUY PILOT (30%)**. Add more on dip. |
| **< 50 (Green)** | Consolidation breakout | **BUY AGGRESSIVE**. Perfect entry. |

#### General Rules:
1.  **Don't FOMO**: Often the price jumps high to cause the cross.
2.  **Stop Loss**: Close if price falls back below the 200 SMA.
3.  **Target**: Ride the trend until the 50 SMA crosses back *below* the 200 SMA ("Death Cross").

---

## Summary Cheat Sheet

| Alert Type | Trend | Action | Risk |
| :--- | :--- | :--- | :--- |
| **Falling Knife** | Down | Watch for bounce | 🔴 High |
| **Oversold in Uptrend** | **UP** | **BUY (Dip)** | 🟢 Low/Med |
| **Overbought in Downtrend** | **DOWN** | **SELL / SHORT** | 🟢 Low/Med |
| **RSI Extremes** | Any | Scalp Reversal | 🟡 Medium |
| **Golden Cross** | Changes to UP | **INVEST / HOLD** | 🟢 Low |
