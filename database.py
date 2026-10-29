"""SQLite storage and trusted analytics functions for StockSense."""
from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).with_name("stocksense.db")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
          category TEXT, supplier TEXT, unit_cost REAL DEFAULT 0,
          reorder_point INTEGER DEFAULT 0, target_days INTEGER DEFAULT 14,
          is_sample INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, phone TEXT, city TEXT,
          is_sample INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, customer_id INTEGER,
          txn_date TEXT NOT NULL, txn_type TEXT NOT NULL CHECK(txn_type IN ('opening','purchase','sale','adjustment')),
          quantity INTEGER NOT NULL, unit_price REAL DEFAULT 0, reference TEXT,
          notes TEXT, source TEXT DEFAULT 'manual', is_sample INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(customer_id) REFERENCES customers(id)
        );
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY, event_at TEXT DEFAULT CURRENT_TIMESTAMP, actor TEXT,
          action TEXT NOT NULL, details TEXT
        );
        """)


def audit(action: str, details: dict[str, Any], actor: str = "app") -> None:
    with connect() as c:
        c.execute("INSERT INTO audit_log(actor, action, details) VALUES (?, ?, ?)",
                  (actor, action, json.dumps(details, default=str)))


def product_id_for(sku: str, name: str, category: str = "", supplier: str = "", cost: float = 0, reorder_point: int = 0, sample: int = 0) -> int:
    with connect() as c:
        c.execute("""INSERT INTO products(sku,name,category,supplier,unit_cost,reorder_point,is_sample)
                     VALUES(?,?,?,?,?,?,?) ON CONFLICT(sku) DO UPDATE SET
                     name=excluded.name, category=COALESCE(NULLIF(excluded.category,''),products.category),
                     supplier=COALESCE(NULLIF(excluded.supplier,''),products.supplier)""",
                  (sku.strip(), name.strip() or sku.strip(), category, supplier, cost or 0, reorder_point or 0, sample))
        return c.execute("SELECT id FROM products WHERE sku=?", (sku.strip(),)).fetchone()[0]


def customer_id_for(name: str, phone: str = "", city: str = "", sample: int = 0) -> int | None:
    if not name or str(name).lower() in {"nan", "none"}: return None
    with connect() as c:
        c.execute("INSERT INTO customers(name,phone,city,is_sample) VALUES(?,?,?,?) ON CONFLICT(name) DO NOTHING", (str(name), phone, city, sample))
        return c.execute("SELECT id FROM customers WHERE name=?", (str(name),)).fetchone()[0]


def add_transaction(sku: str, txn_type: str, quantity: int, txn_date: str, unit_price: float = 0,
                    customer: str = "", reference: str = "", notes: str = "", source: str = "manual", sample: int = 0) -> None:
    if txn_type not in {"opening", "purchase", "sale", "adjustment"}: raise ValueError("Invalid transaction type")
    if not sku or int(quantity) == 0: raise ValueError("SKU and a non-zero quantity are required")
    with connect() as c:
        row = c.execute("SELECT id FROM products WHERE sku=?", (sku.strip(),)).fetchone()
        if not row: raise ValueError("Unknown SKU. Add/import the product first.")
        customer_id = customer_id_for(customer, sample=sample) if txn_type == "sale" else None
        c.execute("""INSERT INTO transactions(product_id,customer_id,txn_date,txn_type,quantity,unit_price,reference,notes,source,is_sample)
                     VALUES(?,?,?,?,?,?,?,?,?,?)""", (row[0], customer_id, txn_date, txn_type, int(quantity), float(unit_price or 0), reference, notes, source, sample))
    audit("transaction_added", {"sku": sku, "type": txn_type, "quantity": quantity, "source": source})


def query_df(sql: str, params: tuple = ()):  # imported lazily to keep core simple
    import pandas as pd
    # `sqlite3.Connection`'s context manager commits/rolls back but does not
    # close the handle. Close explicitly so Windows can release temporary/test
    # databases immediately.
    c = connect()
    try:
        return pd.read_sql_query(sql, c, params=params)
    finally:
        c.close()


def inventory_snapshot(as_of: str | None = None):
    cutoff = as_of or date.today().isoformat()
    return query_df("""SELECT p.sku,p.name,p.category,p.supplier,p.reorder_point,p.target_days,p.unit_cost,
        COALESCE(SUM(CASE WHEN t.txn_type IN ('opening','purchase','adjustment') THEN t.quantity ELSE -t.quantity END),0) AS current_stock
        FROM products p LEFT JOIN transactions t ON t.product_id=p.id AND t.txn_date<=?
        GROUP BY p.id ORDER BY p.name""", (cutoff,))


def dashboard_metrics(start: str, end: str) -> dict[str, Any]:
    received = query_df("""SELECT COALESCE(SUM(quantity),0) total FROM transactions WHERE txn_date BETWEEN ? AND ?
                         AND txn_type IN ('opening','purchase','adjustment')""", (start,end)).iloc[0,0]
    sold = query_df("SELECT COALESCE(SUM(quantity),0) total FROM transactions WHERE txn_date BETWEEN ? AND ? AND txn_type='sale'", (start,end)).iloc[0,0]
    revenue = query_df("SELECT COALESCE(SUM(quantity*unit_price),0) total FROM transactions WHERE txn_date BETWEEN ? AND ? AND txn_type='sale'", (start,end)).iloc[0,0]
    current = inventory_snapshot(end)["current_stock"].sum()
    return {"received": int(received), "sold": int(sold), "revenue": float(revenue), "current_stock": int(current)}


def analytics(start: str, end: str) -> dict[str, Any]:
    daily = query_df("""SELECT txn_date, SUM(quantity) units, SUM(quantity*unit_price) revenue FROM transactions
                        WHERE txn_type='sale' AND txn_date BETWEEN ? AND ? GROUP BY txn_date ORDER BY txn_date""", (start,end))
    top = query_df("""SELECT p.sku,p.name,SUM(t.quantity) units_sold,SUM(t.quantity*t.unit_price) revenue
                      FROM transactions t JOIN products p ON p.id=t.product_id WHERE t.txn_type='sale' AND t.txn_date BETWEEN ? AND ?
                      GROUP BY p.id ORDER BY units_sold DESC LIMIT 10""", (start,end))
    slow = query_df("""SELECT p.sku,p.name,COALESCE(SUM(t.quantity),0) units_sold FROM products p LEFT JOIN transactions t
                       ON p.id=t.product_id AND t.txn_type='sale' AND t.txn_date BETWEEN ? AND ? GROUP BY p.id ORDER BY units_sold ASC LIMIT 10""", (start,end))
    customers = query_df("""SELECT c.name, SUM(t.quantity) units, SUM(t.quantity*t.unit_price) spend FROM transactions t JOIN customers c ON c.id=t.customer_id
                           WHERE t.txn_type='sale' AND t.txn_date BETWEEN ? AND ? GROUP BY c.id ORDER BY spend DESC LIMIT 10""", (start,end))
    return {"daily": daily, "top": top, "slow": slow, "customers": customers, "inventory": inventory_snapshot(end)}


def reorder_recommendations(start: str, end: str) -> list[dict[str, Any]]:
    inv = inventory_snapshot(end)
    days = max((datetime.fromisoformat(end).date() - datetime.fromisoformat(start).date()).days + 1, 1)
    sales = query_df("""SELECT p.sku, SUM(t.quantity) units_sold FROM transactions t JOIN products p ON p.id=t.product_id
                        WHERE t.txn_type='sale' AND t.txn_date BETWEEN ? AND ? GROUP BY p.sku""", (start,end))
    merged = inv.merge(sales, on="sku", how="left").fillna({"units_sold": 0})
    results = []
    for r in merged.itertuples():
        daily = r.units_sold / days
        if r.units_sold == 0:
            status, qty, reason = "insufficient_data", 0, "No sales in selected period; do not recommend a purchase."
        else:
            desired = round(daily * r.target_days)
            qty = max(0, desired - r.current_stock)
            status = "reorder" if r.current_stock <= r.reorder_point or qty > 0 else "healthy"
            reason = f"{r.units_sold:.0f} sold in {days} days; target cover: {r.target_days} days."
        results.append({"sku":r.sku,"product":r.name,"on_hand":int(r.current_stock),"sold":int(r.units_sold),"recommended_qty":int(qty),"status":status,"basis":reason})
    return results
