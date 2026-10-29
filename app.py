from __future__ import annotations
import io
from datetime import date, timedelta
import pandas as pd
import plotly.express as px
import streamlit as st
from database import init_db, audit, product_id_for, customer_id_for, add_transaction, query_df, dashboard_metrics, analytics, reorder_recommendations
from nvidia_ai import ERROR_PREFIX, ask_nemotron

st.set_page_config(page_title="STOCK AI", page_icon="📦", layout="wide", initial_sidebar_state="expanded")
init_db()

st.markdown("""<style>
  :root {--navy:#102a43;--blue:#245b7a;--teal:#167d8d;--ink:#243b53;--muted:#627d98;--line:#d9e2ec;--surface:#ffffff}
  .stApp {background:#f4f7fa;color:var(--ink)}
  section[data-testid="stSidebar"] {background:#eef3f8;border-right:1px solid var(--line)}
  section[data-testid="stSidebar"] h1 {color:var(--navy);font-size:1.35rem}
  .block-container {max-width:1440px;padding-top:2rem;padding-bottom:3rem}
  .hero {padding:2rem 2.2rem;border:1px solid #d9e2ec;border-left:4px solid var(--teal);border-radius:14px;color:var(--ink);background:var(--surface);margin-bottom:1.4rem}
  .hero .eyebrow {color:var(--teal);font-size:.76rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
  .hero h1 {font-size:2.15rem;line-height:1.2;color:var(--navy);margin:.55rem 0}
  .hero p {font-size:1rem;color:var(--muted);margin:0;max-width:760px}
  div[data-testid="stMetric"] {background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:1rem 1.1rem;box-shadow:0 2px 8px rgba(16,42,67,.04)}
  div[data-testid="stMetricLabel"] {color:var(--muted)}
  div[data-testid="stMetricValue"] {color:var(--navy)}
  div[data-testid="stTabs"] button {font-weight:600}
  div[data-testid="stDataFrame"] {border:1px solid var(--line);border-radius:10px;overflow:hidden}
  div.stButton > button[kind="primary"], div.stFormSubmitButton > button[kind="primary"] {background:#145e75;border-color:#145e75}
  h1,h2,h3 {color:var(--navy)}
  @media (max-width:700px) {
    .block-container {padding:1.1rem 1rem 2rem}
    .hero {padding:1.4rem}
    .hero h1 {font-size:1.7rem}
  }
 </style>""", unsafe_allow_html=True)

def normalize(col): return str(col).strip().lower().replace(" ", "_").replace("-", "_")
def read_upload(file):
    return pd.read_excel(file) if file.name.lower().endswith((".xlsx",".xls")) else pd.read_csv(file)
def col(df, options, default=""):
    names={normalize(x):x for x in df.columns}
    for candidate in options:
        if candidate in names: return names[candidate]
    return default

def import_file(file, kind):
    df=read_upload(file); df.columns=[normalize(c) for c in df.columns]
    inserted=0
    if kind == "products":
        sku_c=col(df,["sku","product_code","code"]); name_c=col(df,["name","product_name","product"],sku_c)
        if not sku_c: raise ValueError("Product file needs a SKU or product_code column.")
        for _,r in df.iterrows(): product_id_for(str(r[sku_c]),str(r[name_c]),str(r.get("category","")),str(r.get("supplier","")),float(r.get("unit_cost",0) or 0),int(r.get("reorder_point",0) or 0)); inserted+=1
    elif kind == "customers":
        name_c=col(df,["name","customer","customer_name"])
        if not name_c: raise ValueError("Customer file needs a name or customer_name column.")
        for _,r in df.iterrows(): customer_id_for(str(r[name_c]),str(r.get("phone","")),str(r.get("city",""))); inserted+=1
    else:
        sku_c=col(df,["sku","product_code","code"]); qty_c=col(df,["quantity","qty","units"]); date_c=col(df,["date","txn_date","transaction_date"])
        if not sku_c or not qty_c: raise ValueError("Transaction file needs SKU and quantity columns.")
        default_type={"opening":"opening","purchases":"purchase","sales":"sale"}[kind]
        for _,r in df.iterrows():
            txn_date=str(r.get(date_c,date.today().isoformat()))[:10] if date_c else date.today().isoformat()
            add_transaction(str(r[sku_c]),default_type,int(r[qty_c]),txn_date,float(r.get("unit_price",r.get("price",0)) or 0),str(r.get("customer",r.get("customer_name",""))),str(r.get("reference","")),"Imported file",source="import"); inserted+=1
    audit("file_imported",{"kind":kind,"rows":inserted,"file":file.name}); return inserted

def generate_demo():
    products=[("TEA-001","Premium Tea 250g","Grocery","Evergreen Foods",135,20),("RICE-005","Sona Masoori Rice 5kg","Grocery","Grain House",310,15),("SOAP-002","Herbal Soap","Personal Care","CareCo",35,30),("BISC-010","Butter Biscuits","Snacks","BakeWell",45,25),("OIL-003","Sunflower Oil 1L","Grocery","FreshPress",120,18),("NOTE-001","A4 Notebook","Stationery","PaperCraft",40,20)]
    for p in products: product_id_for(*p,sample=1)
    customers=["Anand Stores","Lakshmi Mart","City Wholesale","Green Grocers"]
    for c in customers: customer_id_for(c,sample=1)
    today=date.today()
    for i,p in enumerate(products):
        add_transaction(p[0],"opening",80+i*20,(today-timedelta(days=30)).isoformat(),p[4]*1.25,source="sample",sample=1)
        add_transaction(p[0],"purchase",30+i*5,(today-timedelta(days=14)).isoformat(),p[4]*1.3,source="sample",sample=1)
        sales = [42,25,12,30,22,0][i]
        for j in range(max(1,sales//6)):
            q=min(6,sales-j*6)
            if q>0: add_transaction(p[0],"sale",q,(today-timedelta(days=(j*3)%25)).isoformat(),p[4]*1.55,customers[(i+j)%4],source="sample",sample=1)
    audit("sample_data_generated",{"products":len(products)})

def navigate_to(page):
    """Persist the selected workspace across Streamlit reruns."""
    st.session_state.workspace = page


with st.sidebar:
    st.title("STOCK AI")
    st.caption("Intelligent Inventory Management")
    workspace = st.radio(
        "Workspace",
        ["Home", "Data Entry", "Analysis"],
        label_visibility="collapsed",
        key="workspace",
    )
    st.caption("Inventory workspace")
    if st.button("Load optional sample data", use_container_width=True):
        generate_demo()
        st.success("Sample data added — clearly tagged in the audit log.")
        st.rerun()
    st.divider()
    st.caption("Inventory operations and decision support")

if workspace == "Home":
    st.markdown("""<div class="hero"><div class="eyebrow">Intelligent Inventory Management &amp; Decision Support</div><h1>Welcome to STOCK AI</h1><p>Turn inventory activity into clear operational decisions. Track stock movement, understand sales trends, and identify replenishment needs from your recorded business data.</p></div>""", unsafe_allow_html=True)
    home_end = date.today()
    home_start = home_end - timedelta(days=30)
    home_metrics = dashboard_metrics(home_start.isoformat(), home_end.isoformat())
    st.subheader("Inventory snapshot")
    st.caption(f"Recorded activity from {home_start.isoformat()} through {home_end.isoformat()}")
    m1,m2,m3,m4=st.columns(4)
    m1.metric("Stock received",f"{home_metrics['received']:,} units")
    m2.metric("Stock dispatched / sold",f"{home_metrics['sold']:,} units")
    m3.metric("Current stock",f"{home_metrics['current_stock']:,} units")
    m4.metric("Sales value",f"₹{home_metrics['revenue']:,.0f}")
    st.subheader("Get started")
    a,b=st.columns(2)
    with a:
        st.markdown("#### Data Entry")
        st.write("Import existing records or capture goods received, sales, and stock adjustments.")
        st.button(
            "Open Data Entry",
            type="primary",
            use_container_width=True,
            on_click=navigate_to,
            args=("Data Entry",),
        )
    with b:
        st.markdown("#### Analysis")
        st.write("Review inventory performance, product trends, reorder signals, and AI-assisted insights.")
        st.button(
            "Open Analysis",
            use_container_width=True,
            on_click=navigate_to,
            args=("Analysis",),
        )
    st.info("Optional sample data is available for demonstrations and onboarding. It is clearly marked separately from business records.")

if workspace == "Data Entry":
    st.title("Data Entry")
    st.caption("Import validated records and capture stock movements. All changes are recorded in the audit trail.")
    tab1,tab2,tab3=st.tabs(["Stock movement", "Import files", "Products & customers"])
    with tab1:
        products=query_df("SELECT sku,name FROM products ORDER BY name")
        if products.empty: st.warning("Add/import products first.")
        with st.form("movement"):
            sku=st.selectbox("Product",products["sku"].tolist(),format_func=lambda x: f"{x} — {products.loc[products.sku==x,'name'].iloc[0]}" if not products.empty else x)
            typ=st.selectbox("Movement",["purchase","sale","adjustment","opening"],format_func=lambda x:{"purchase":"Stock received (purchase)","sale":"Stock dispatched / sold","adjustment":"Stock adjustment (+/-)","opening":"Opening stock"}[x])
            qty=st.number_input("Quantity",step=1,value=1,help="Use a negative quantity only for a stock reduction adjustment.")
            d=st.date_input("Date",date.today()); price=st.number_input("Selling / unit price",min_value=0.0,step=1.0)
            customer=st.text_input("Customer (for sales)"); reference=st.text_input("Invoice / reference")
            submitted=st.form_submit_button("Save movement",type="primary")
        if submitted:
            try: add_transaction(sku,typ,int(qty),d.isoformat(),price,customer,reference); st.success("Movement saved and audit logged.")
            except Exception as e: st.error(str(e))
    with tab2:
        st.write("Accepted: CSV or Excel. Product import must include `sku`; transaction imports need `sku`, `quantity`, and optionally `date`, `unit_price`, `customer`.")
        kind=st.selectbox("Import type",["products","opening","purchases","sales","customers"])
        file=st.file_uploader("Choose file",type=["csv","xlsx","xls"])
        if file and st.button("Validate & import",type="primary"):
            try: n=import_file(file,kind); st.success(f"Imported {n} rows. Existing product SKUs were updated safely.")
            except Exception as e: st.error(f"Nothing imported: {e}")
    with tab3:
        with st.form("product"):
            c1,c2,c3=st.columns(3); sku_new=c1.text_input("SKU"); name=c2.text_input("Product name"); category=c3.text_input("Category")
            supplier=st.text_input("Supplier"); cost=st.number_input("Unit cost",min_value=0.0); rp=st.number_input("Reorder point",min_value=0,step=1)
            if st.form_submit_button("Save product"):
                if not sku_new or not name: st.error("SKU and product name are required.")
                else: product_id_for(sku_new,name,category,supplier,cost,rp); audit("product_saved",{"sku":sku_new}); st.success("Product saved.")

if workspace == "Analysis":
    st.title("Analysis")
    st.caption("A decision-support workspace built from your recorded transactions and current inventory.")
    c1,c2=st.columns(2); default_start=date.today()-timedelta(days=30)
    start=c1.date_input("From",default_start); end=c2.date_input("To",date.today())
    if start>end: st.error("The start date must be before the end date."); st.stop()
    start_s,end_s=start.isoformat(),end.isoformat(); m=dashboard_metrics(start_s,end_s); data=analytics(start_s,end_s)
    x1,x2,x3,x4=st.columns(4); x1.metric("Stock received",f"{m['received']:,} units"); x2.metric("Stock dispatched / sold",f"{m['sold']:,} units"); x3.metric("Current stock",f"{m['current_stock']:,} units"); x4.metric("Sales value",f"₹{m['revenue']:,.0f}")
    tabs=st.tabs(["Trends & Products","Reorder Desk","AI Assistant","Audit Trail"])
    with tabs[0]:
        if data["daily"].empty: st.info("No sales recorded in this period yet.")
        else:
            chart=px.line(data["daily"],x="txn_date",y="revenue",markers=True,title="Sales revenue trend",color_discrete_sequence=["#167d8d"])
            chart.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#243b53",
                margin=dict(l=12,r=12,t=54,b=12),
                xaxis_title="Date",
                yaxis_title="Revenue",
            )
            st.plotly_chart(chart,use_container_width=True)
        st.caption("Product and customer summaries reflect activity in the selected date range.")
        a,b=st.columns(2)
        with a: st.subheader("Top-selling products"); st.dataframe(data["top"],use_container_width=True,hide_index=True)
        with b: st.subheader("Slow-moving products"); st.dataframe(data["slow"],use_container_width=True,hide_index=True)
        st.subheader("Top customers"); st.dataframe(data["customers"],use_container_width=True,hide_index=True)
    with tabs[1]:
        st.caption("Recommendations use average sales in this date range multiplied by each product’s target cover days. Products with no sales are marked as insufficient data rather than guessed.")
        recs=pd.DataFrame(reorder_recommendations(start_s,end_s)); st.dataframe(recs,use_container_width=True,hide_index=True)
    with tabs[2]:
        st.subheader("NVIDIA Nemotron AI Assistant")
        st.caption("AI-powered inventory insights and decision support")

        reorder_df = pd.DataFrame(reorder_recommendations(start_s, end_s))
        context_parts = [
            f"Selected date range: {start_s} to {end_s}",
            "Dashboard metrics: " + pd.Series(m).to_json(),
        ]
        if not data["top"].empty:
            context_parts.append(
                "Top-selling products: " + data["top"].head(10).to_json(orient="records")
            )
        if not data["slow"].empty:
            context_parts.append(
                "Slow-moving products: " + data["slow"].head(10).to_json(orient="records")
            )
        if not reorder_df.empty:
            context_parts.append(
                "Reorder recommendations: " + reorder_df.head(30).to_json(orient="records")
            )
        inventory_context = "\n\n".join(context_parts)

        with st.form("nvidia_question_form", clear_on_submit=False):
            question = st.text_input(
                "Inventory question",
                placeholder="Ask a question about your inventory...",
                key="nvidia_stock_question",
            )
            submitted = st.form_submit_button("Ask AI", type="primary")

        if submitted:
            if not question.strip():
                st.warning("Please enter a question.")
            else:
                with st.spinner("Analyzing inventory with NVIDIA Nemotron..."):
                    answer = ask_nemotron(question, context=inventory_context)
                if answer.startswith(ERROR_PREFIX):
                    st.markdown("#### AI Assistant Unavailable")
                    st.error(answer[len(ERROR_PREFIX):].strip())
                else:
                    st.markdown("#### Nemotron Insight")
                    st.markdown(answer)
                    st.caption(
                        "AI responses are generated from the inventory summary shown to the configured provider. "
                        "Verify important business decisions against the original records."
                    )
    with tabs[3]:
        st.caption("Recent audited inventory and data-entry actions.")
        log=query_df("SELECT event_at,actor,action,details FROM audit_log ORDER BY id DESC LIMIT 100")
        st.dataframe(log,use_container_width=True,hide_index=True)
