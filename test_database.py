import os, tempfile
from pathlib import Path
import database as db

def test_metrics_and_recommendations():
    old=db.DB_PATH
    try:
        with tempfile.TemporaryDirectory() as t:
            db.DB_PATH=Path(t)/"test.db"; db.init_db()
            db.product_id_for("A","Apple",reorder_point=5)
            db.add_transaction("A","opening",10,"2026-01-01")
            db.add_transaction("A","sale",6,"2026-01-02",10)
            m=db.dashboard_metrics("2026-01-01","2026-01-31")
            assert m["sold"] == 6 and m["current_stock"] == 4 and m["revenue"] == 60
            rec=db.reorder_recommendations("2026-01-01","2026-01-31")[0]
            assert rec["status"] == "reorder" and rec["recommended_qty"] >= 0
    finally: db.DB_PATH=old
