"""
UPI Transaction Intelligence Platform — Flask Backend
Handles CSV upload, in-memory Pandas storage, and pre-aggregated API endpoints.
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------
store = {"df": None}

# ---------------------------------------------------------------------------
# Column name normalizer
# ---------------------------------------------------------------------------

CANONICAL = {
    "transaction_id": "transaction_id",
    "transaction id": "transaction_id",
    "txn_id": "transaction_id",
    "timestamp": "timestamp",
    "date": "timestamp",
    "transaction_type": "transaction_type",
    "transaction type": "transaction_type",
    "type": "transaction_type",
    "merchant_category": "merchant_category",
    "category": "merchant_category",
    "amount": "amount",
    "amount (inr)": "amount",
    "amount_inr": "amount",
    "transaction_status": "transaction_status",
    "status": "transaction_status",
    "sender_age_group": "sender_age_group",
    "sender age group": "sender_age_group",
    "receiver_age_group": "receiver_age_group",
    "receiver age group": "receiver_age_group",
    "sender_state": "sender_state",
    "sender state": "sender_state",
    "state": "sender_state",
    "sender_bank": "sender_bank",
    "sender bank": "sender_bank",
    "receiver_bank": "receiver_bank",
    "receiver bank": "receiver_bank",
    "device_type": "device_type",
    "device type": "device_type",
    "device": "device_type",
    "network_type": "network_type",
    "network type": "network_type",
    "network": "network_type",
    "fraud_flag": "fraud_flag",
    "fraud flag": "fraud_flag",
    "fraud": "fraud_flag",
    "hour_of_day": "hour_of_day",
    "hour of day": "hour_of_day",
    "hour": "hour_of_day",
    "day_of_week": "day_of_week",
    "day of week": "day_of_week",
    "day": "day_of_week",
    "is_weekend": "is_weekend",
    "is weekend": "is_weekend",
    "weekend": "is_weekend",
}


def normalize_columns(df):
    """Rename columns to canonical names."""
    mapping = {}
    for col in df.columns:
        key = col.strip().lower()
        if key in CANONICAL:
            mapping[col] = CANONICAL[key]
    df.rename(columns=mapping, inplace=True)
    return df


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_df():
    if store["df"] is None:
        return None
    return store["df"].copy()


def apply_filters(df, args):
    """Apply query-string filters to df."""
    if args.get("date_start"):
        df = df[df["timestamp"] >= pd.to_datetime(args["date_start"])]
    if args.get("date_end"):
        df = df[df["timestamp"] <= pd.to_datetime(args["date_end"])]
    if args.get("state"):
        df = df[df["sender_state"] == args["state"]]
    if args.get("category"):
        df = df[df["merchant_category"] == args["category"]]
    if args.get("device_type"):
        df = df[df["device_type"] == args["device_type"]]
    if args.get("network_type"):
        df = df[df["network_type"] == args["network_type"]]
    if args.get("age_group"):
        df = df[df["sender_age_group"] == args["age_group"]]
    if args.get("transaction_type"):
        df = df[df["transaction_type"] == args["transaction_type"]]
    return df


def safe_json(obj):
    """Convert numpy/pandas types for JSON serialization."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return round(float(obj), 2)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj


def to_serializable(data):
    """Recursively convert data structure."""
    if isinstance(data, dict):
        return {k: to_serializable(v) for k, v in data.items()}
    if isinstance(data, (list, tuple)):
        return [to_serializable(i) for i in data]
    return safe_json(data)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        df = pd.read_csv(f, low_memory=False)
        df = normalize_columns(df)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
        if "fraud_flag" in df.columns:
            df["fraud_flag"] = pd.to_numeric(df["fraud_flag"], errors="coerce").fillna(0).astype(int)
        if "hour_of_day" in df.columns:
            df["hour_of_day"] = pd.to_numeric(df["hour_of_day"], errors="coerce")
        if "is_weekend" in df.columns:
            df["is_weekend"] = pd.to_numeric(df["is_weekend"], errors="coerce")

        store["df"] = df

        # Build summary
        total_transactions = len(df)
        total_value = float(df["amount"].sum()) if "amount" in df.columns else 0
        date_min = df["timestamp"].min().isoformat() if "timestamp" in df.columns else None
        date_max = df["timestamp"].max().isoformat() if "timestamp" in df.columns else None
        num_states = int(df["sender_state"].nunique()) if "sender_state" in df.columns else 0
        num_categories = int(df["merchant_category"].nunique()) if "merchant_category" in df.columns else 0
        fraud_pct = round(float(df["fraud_flag"].mean() * 100), 2) if "fraud_flag" in df.columns else 0
        success_rate = round(float((df["transaction_status"].str.upper() == "SUCCESS").mean() * 100), 2) if "transaction_status" in df.columns else 0

        # Filter options
        states = sorted(df["sender_state"].dropna().unique().tolist()) if "sender_state" in df.columns else []
        categories = sorted(df["merchant_category"].dropna().unique().tolist()) if "merchant_category" in df.columns else []
        devices = sorted(df["device_type"].dropna().unique().tolist()) if "device_type" in df.columns else []
        networks = sorted(df["network_type"].dropna().unique().tolist()) if "network_type" in df.columns else []
        age_groups = sorted(df["sender_age_group"].dropna().unique().tolist()) if "sender_age_group" in df.columns else []

        return jsonify(to_serializable({
            "status": "ok",
            "summary": {
                "total_transactions": total_transactions,
                "total_value": total_value,
                "date_min": date_min,
                "date_max": date_max,
                "num_states": num_states,
                "num_categories": num_categories,
                "fraud_pct": fraud_pct,
                "success_rate": success_rate,
            },
            "filters": {
                "states": states,
                "categories": categories,
                "devices": devices,
                "networks": networks,
                "age_groups": age_groups,
            }
        }))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/summary")
def summary():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)
    total = len(df)
    total_value = float(df["amount"].sum())
    avg_amount = float(df["amount"].mean()) if total > 0 else 0
    success = (df["transaction_status"].str.upper() == "SUCCESS").sum()
    failed = (df["transaction_status"].str.upper() == "FAILED").sum()
    fraud = int(df["fraud_flag"].sum()) if "fraud_flag" in df.columns else 0

    return jsonify(to_serializable({
        "total_transactions": total,
        "total_value": total_value,
        "avg_amount": avg_amount,
        "success_rate": round(success / total * 100, 2) if total else 0,
        "failure_rate": round(failed / total * 100, 2) if total else 0,
        "fraud_rate": round(fraud / total * 100, 2) if total else 0,
        "success_count": int(success),
        "failed_count": int(failed),
        "fraud_count": fraud,
    }))


@app.route("/api/overview")
def overview():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    # Transactions over time (daily)
    if "timestamp" in df.columns:
        daily = df.set_index("timestamp").resample("D")["amount"].agg(["count", "sum"]).reset_index()
        daily.columns = ["date", "count", "value"]
        daily["date"] = daily["date"].dt.strftime("%Y-%m-%d")
        txn_over_time = daily.to_dict("records")
    else:
        txn_over_time = []

    # Category distribution
    cat_dist = df.groupby("merchant_category")["amount"].agg(["count", "sum"]).reset_index()
    cat_dist.columns = ["category", "count", "value"]
    cat_dist = cat_dist.sort_values("count", ascending=False).to_dict("records")

    # State distribution
    state_dist = df.groupby("sender_state")["amount"].agg(["count", "sum"]).reset_index()
    state_dist.columns = ["state", "count", "value"]
    state_dist = state_dist.sort_values("count", ascending=False).to_dict("records")

    # Hourly heatmap (hour x day_of_week)
    if "hour_of_day" in df.columns and "day_of_week" in df.columns:
        heatmap = df.groupby(["day_of_week", "hour_of_day"]).size().reset_index(name="count")
        heatmap_data = heatmap.to_dict("records")
    else:
        heatmap_data = []

    return jsonify(to_serializable({
        "txn_over_time": txn_over_time,
        "category_distribution": cat_dist,
        "state_distribution": state_dist,
        "heatmap": heatmap_data,
    }))


@app.route("/api/categories")
def categories():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    by_cat = df.groupby("merchant_category")["amount"].agg(["count", "sum", "mean"]).reset_index()
    by_cat.columns = ["category", "count", "total_value", "avg_amount"]
    by_cat = by_cat.sort_values("count", ascending=False)

    # Category trends over time (monthly)
    if "timestamp" in df.columns:
        df["month"] = df["timestamp"].dt.to_period("M").astype(str)
        trends = df.groupby(["month", "merchant_category"]).size().reset_index(name="count")
        trends_data = trends.to_dict("records")
    else:
        trends_data = []

    return jsonify(to_serializable({
        "by_category": by_cat.to_dict("records"),
        "trends": trends_data,
    }))


@app.route("/api/time")
def time_analysis():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    # Hourly distribution
    hourly = df.groupby("hour_of_day")["amount"].agg(["count", "sum", "mean"]).reset_index()
    hourly.columns = ["hour", "count", "total_value", "avg_amount"]

    # Daily distribution
    day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    daily = df.groupby("day_of_week")["amount"].agg(["count", "sum", "mean"]).reset_index()
    daily.columns = ["day", "count", "total_value", "avg_amount"]

    # Weekend vs weekday
    if "is_weekend" in df.columns:
        wknd = df.groupby("is_weekend")["amount"].agg(["count", "sum", "mean"]).reset_index()
        wknd.columns = ["is_weekend", "count", "total_value", "avg_amount"]
        wknd["label"] = wknd["is_weekend"].map({0: "Weekday", 1: "Weekend"})
        weekend_data = wknd.to_dict("records")
    else:
        weekend_data = []

    # Heatmap
    if "hour_of_day" in df.columns and "day_of_week" in df.columns:
        heatmap = df.groupby(["day_of_week", "hour_of_day"]).size().reset_index(name="count")
        heatmap_data = heatmap.to_dict("records")
    else:
        heatmap_data = []

    return jsonify(to_serializable({
        "hourly": hourly.to_dict("records"),
        "daily": daily.to_dict("records"),
        "weekend_weekday": weekend_data,
        "heatmap": heatmap_data,
    }))


@app.route("/api/geography")
def geography():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    state_data = df.groupby("sender_state").agg(
        count=("amount", "count"),
        total_value=("amount", "sum"),
        avg_amount=("amount", "mean"),
    ).reset_index()
    state_data.columns = ["state", "count", "total_value", "avg_amount"]

    if "fraud_flag" in df.columns:
        fraud_by_state = df.groupby("sender_state")["fraud_flag"].mean().reset_index()
        fraud_by_state.columns = ["state", "fraud_rate"]
        fraud_by_state["fraud_rate"] = (fraud_by_state["fraud_rate"] * 100).round(2)
        state_data = state_data.merge(fraud_by_state, on="state", how="left")
    else:
        state_data["fraud_rate"] = 0

    state_data = state_data.sort_values("count", ascending=False)

    return jsonify(to_serializable({
        "by_state": state_data.to_dict("records"),
    }))


@app.route("/api/devices")
def devices():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    # Device breakdown
    device_data = df.groupby("device_type").agg(
        count=("amount", "count"),
        total_value=("amount", "sum"),
        avg_amount=("amount", "mean"),
    ).reset_index()
    device_data.columns = ["device", "count", "total_value", "avg_amount"]

    if "transaction_status" in df.columns:
        dev_success = df.groupby("device_type").apply(
            lambda g: round((g["transaction_status"].str.upper() == "SUCCESS").mean() * 100, 2)
        ).reset_index(name="success_rate")
        dev_success.columns = ["device", "success_rate"]
        device_data = device_data.merge(dev_success, on="device", how="left")

    # Network breakdown
    net_data = df.groupby("network_type").agg(
        count=("amount", "count"),
        total_value=("amount", "sum"),
        avg_amount=("amount", "mean"),
    ).reset_index()
    net_data.columns = ["network", "count", "total_value", "avg_amount"]

    if "transaction_status" in df.columns:
        net_success = df.groupby("network_type").apply(
            lambda g: round((g["transaction_status"].str.upper() == "SUCCESS").mean() * 100, 2)
        ).reset_index(name="success_rate")
        net_success.columns = ["network", "success_rate"]
        net_fail = df.groupby("network_type").apply(
            lambda g: round((g["transaction_status"].str.upper() == "FAILED").mean() * 100, 2)
        ).reset_index(name="failure_rate")
        net_fail.columns = ["network", "failure_rate"]
        net_data = net_data.merge(net_success, on="network", how="left")
        net_data = net_data.merge(net_fail, on="network", how="left")

    return jsonify(to_serializable({
        "by_device": device_data.to_dict("records"),
        "by_network": net_data.to_dict("records"),
    }))


@app.route("/api/fraud")
def fraud():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    total = len(df)
    fraud_count = int(df["fraud_flag"].sum()) if "fraud_flag" in df.columns else 0
    fraud_rate = round(fraud_count / total * 100, 2) if total else 0

    # Fraud by category
    fraud_cat = df.groupby("merchant_category")["fraud_flag"].agg(["sum", "mean"]).reset_index()
    fraud_cat.columns = ["category", "fraud_count", "fraud_rate"]
    fraud_cat["fraud_rate"] = (fraud_cat["fraud_rate"] * 100).round(2)
    fraud_cat = fraud_cat.sort_values("fraud_count", ascending=False)

    # Fraud by state
    fraud_state = df.groupby("sender_state")["fraud_flag"].agg(["sum", "mean"]).reset_index()
    fraud_state.columns = ["state", "fraud_count", "fraud_rate"]
    fraud_state["fraud_rate"] = (fraud_state["fraud_rate"] * 100).round(2)
    fraud_state = fraud_state.sort_values("fraud_count", ascending=False)

    # Fraud by hour
    fraud_hour = df.groupby("hour_of_day")["fraud_flag"].agg(["sum", "mean"]).reset_index()
    fraud_hour.columns = ["hour", "fraud_count", "fraud_rate"]
    fraud_hour["fraud_rate"] = (fraud_hour["fraud_rate"] * 100).round(2)

    # Fraud by device
    fraud_dev = df.groupby("device_type")["fraud_flag"].agg(["sum", "mean"]).reset_index()
    fraud_dev.columns = ["device", "fraud_count", "fraud_rate"]
    fraud_dev["fraud_rate"] = (fraud_dev["fraud_rate"] * 100).round(2)

    return jsonify(to_serializable({
        "total_fraud": fraud_count,
        "fraud_rate": fraud_rate,
        "by_category": fraud_cat.to_dict("records"),
        "by_state": fraud_state.to_dict("records"),
        "by_hour": fraud_hour.to_dict("records"),
        "by_device": fraud_dev.to_dict("records"),
    }))


@app.route("/api/banks")
def banks():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    # Sender banks
    sender = df.groupby("sender_bank")["amount"].agg(["count", "sum", "mean"]).reset_index()
    sender.columns = ["bank", "count", "total_value", "avg_amount"]
    sender = sender.sort_values("count", ascending=False)

    # Receiver banks
    receiver = df.groupby("receiver_bank")["amount"].agg(["count", "sum", "mean"]).reset_index()
    receiver.columns = ["bank", "count", "total_value", "avg_amount"]
    receiver = receiver.sort_values("count", ascending=False)

    # Cross-bank patterns (top flows)
    cross = df.groupby(["sender_bank", "receiver_bank"]).size().reset_index(name="count")
    cross = cross.sort_values("count", ascending=False).head(20)

    # Bank success rates
    if "transaction_status" in df.columns:
        bank_sr = df.groupby("sender_bank").apply(
            lambda g: round((g["transaction_status"].str.upper() == "SUCCESS").mean() * 100, 2)
        ).reset_index(name="success_rate")
        bank_sr.columns = ["bank", "success_rate"]
        sender = sender.merge(bank_sr, on="bank", how="left")

    return jsonify(to_serializable({
        "sender_banks": sender.to_dict("records"),
        "receiver_banks": receiver.to_dict("records"),
        "cross_bank": cross.to_dict("records"),
    }))


@app.route("/api/demographics")
def demographics():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    age_data = df.groupby("sender_age_group")["amount"].agg(["count", "sum", "mean"]).reset_index()
    age_data.columns = ["age_group", "count", "total_value", "avg_amount"]

    # Category preference by age
    age_cat = df.groupby(["sender_age_group", "merchant_category"]).size().reset_index(name="count")
    age_cat = age_cat.sort_values("count", ascending=False)

    # Fraud by age
    if "fraud_flag" in df.columns:
        fraud_age = df.groupby("sender_age_group")["fraud_flag"].agg(["sum", "mean"]).reset_index()
        fraud_age.columns = ["age_group", "fraud_count", "fraud_rate"]
        fraud_age["fraud_rate"] = (fraud_age["fraud_rate"] * 100).round(2)
        age_data = age_data.merge(fraud_age, on="age_group", how="left")

    return jsonify(to_serializable({
        "by_age": age_data.to_dict("records"),
        "age_category": age_cat.to_dict("records"),
    }))


@app.route("/api/insights")
def insights():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    df = apply_filters(df, request.args)

    insights_list = []

    # Peak hour
    if "hour_of_day" in df.columns:
        peak_hour = int(df.groupby("hour_of_day").size().idxmax())
        h = peak_hour
        period = "AM" if h < 12 else "PM"
        h12 = h if h <= 12 else h - 12
        if h12 == 0:
            h12 = 12
        insights_list.append({
            "icon": "clock",
            "title": "Peak Transaction Hour",
            "description": f"Transactions peak at {h12} {period} with the highest volume of activity.",
            "type": "time"
        })

    # Top category
    if "merchant_category" in df.columns:
        top_cat = df["merchant_category"].value_counts().idxmax()
        top_cat_pct = round(df["merchant_category"].value_counts(normalize=True).max() * 100, 1)
        insights_list.append({
            "icon": "shopping-bag",
            "title": "Dominant Category",
            "description": f"{top_cat} contributes the highest transaction volume at {top_cat_pct}% of all transactions.",
            "type": "category"
        })

    # Device insight
    if "device_type" in df.columns:
        dev_counts = df["device_type"].value_counts()
        top_dev = dev_counts.idxmax()
        top_dev_pct = round(dev_counts.max() / dev_counts.sum() * 100, 1)
        insights_list.append({
            "icon": "smartphone",
            "title": "Device Preference",
            "description": f"{top_dev} users perform {top_dev_pct}% of all transactions, leading overall device usage.",
            "type": "device"
        })

    # Fraud timing
    if "fraud_flag" in df.columns and "hour_of_day" in df.columns:
        fraud_df = df[df["fraud_flag"] == 1]
        if len(fraud_df) > 0:
            fraud_peak = int(fraud_df.groupby("hour_of_day").size().idxmax())
            fh = fraud_peak
            fp = "AM" if fh < 12 else "PM"
            fh12 = fh if fh <= 12 else fh - 12
            if fh12 == 0:
                fh12 = 12
            insights_list.append({
                "icon": "alert-triangle",
                "title": "Fraud Timing",
                "description": f"Fraudulent transactions are most frequent around {fh12} {fp}.",
                "type": "fraud"
            })

    # Top state
    if "sender_state" in df.columns:
        top_state = df["sender_state"].value_counts().idxmax()
        top_state_pct = round(df["sender_state"].value_counts(normalize=True).max() * 100, 1)
        insights_list.append({
            "icon": "map-pin",
            "title": "Top State",
            "description": f"{top_state} leads with {top_state_pct}% of total transaction volume.",
            "type": "geography"
        })

    # Weekend vs weekday
    if "is_weekend" in df.columns:
        wkd_avg = df[df["is_weekend"] == 0]["amount"].mean()
        wknd_avg = df[df["is_weekend"] == 1]["amount"].mean()
        if wknd_avg > wkd_avg:
            diff = round((wknd_avg - wkd_avg) / wkd_avg * 100, 1)
            insights_list.append({
                "icon": "calendar",
                "title": "Weekend Spending",
                "description": f"Average weekend transaction is {diff}% higher than weekday transactions.",
                "type": "time"
            })
        else:
            diff = round((wkd_avg - wknd_avg) / wknd_avg * 100, 1)
            insights_list.append({
                "icon": "calendar",
                "title": "Weekday Spending",
                "description": f"Average weekday transaction is {diff}% higher than weekend transactions.",
                "type": "time"
            })

    # P2P vs P2M
    if "transaction_type" in df.columns:
        type_counts = df["transaction_type"].value_counts()
        if len(type_counts) >= 2:
            top_type = type_counts.idxmax()
            top_type_pct = round(type_counts.max() / type_counts.sum() * 100, 1)
            insights_list.append({
                "icon": "repeat",
                "title": "Transaction Type Split",
                "description": f"{top_type} transactions dominate at {top_type_pct}% of total volume.",
                "type": "category"
            })

    # Network insight
    if "network_type" in df.columns and "transaction_status" in df.columns:
        net_success = df.groupby("network_type").apply(
            lambda g: (g["transaction_status"].str.upper() == "SUCCESS").mean()
        )
        best_net = net_success.idxmax()
        best_net_rate = round(net_success.max() * 100, 1)
        insights_list.append({
            "icon": "wifi",
            "title": "Best Network",
            "description": f"{best_net} has the highest success rate at {best_net_rate}%.",
            "type": "device"
        })

    # Top bank
    if "sender_bank" in df.columns:
        top_bank = df["sender_bank"].value_counts().idxmax()
        top_bank_pct = round(df["sender_bank"].value_counts(normalize=True).max() * 100, 1)
        insights_list.append({
            "icon": "building",
            "title": "Most Used Bank",
            "description": f"{top_bank} is the most used sending bank with {top_bank_pct}% of transactions.",
            "type": "bank"
        })

    # Age group insight
    if "sender_age_group" in df.columns:
        age_spending = df.groupby("sender_age_group")["amount"].mean()
        top_age = age_spending.idxmax()
        top_age_val = round(age_spending.max(), 0)
        insights_list.append({
            "icon": "users",
            "title": "Highest Spending Age Group",
            "description": f"The {top_age} age group has the highest average transaction of ₹{top_age_val:,.0f}.",
            "type": "demographics"
        })

    return jsonify(to_serializable({"insights": insights_list}))


@app.route("/api/filters")
def filters():
    df = _get_df()
    if df is None:
        return jsonify({"error": "No data uploaded"}), 400
    states = sorted(df["sender_state"].dropna().unique().tolist()) if "sender_state" in df.columns else []
    categories = sorted(df["merchant_category"].dropna().unique().tolist()) if "merchant_category" in df.columns else []
    devices = sorted(df["device_type"].dropna().unique().tolist()) if "device_type" in df.columns else []
    networks = sorted(df["network_type"].dropna().unique().tolist()) if "network_type" in df.columns else []
    age_groups = sorted(df["sender_age_group"].dropna().unique().tolist()) if "sender_age_group" in df.columns else []
    return jsonify({
        "states": states,
        "categories": categories,
        "devices": devices,
        "networks": networks,
        "age_groups": age_groups,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)
