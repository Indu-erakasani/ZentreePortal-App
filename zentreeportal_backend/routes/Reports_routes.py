
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from extensions import mongo

reports_bp = Blueprint("reports", __name__)

FUNNEL_STAGES    = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired"]
INTERVIEW_STAGES = ["Technical Interview", "HR Interview", "Final Interview"]


def _date_range(period: str):
    now   = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if period == "thisWeek":
        return today - timedelta(days=today.weekday()), now
    if period == "lastMonth":
        first_this = today.replace(day=1)
        last_month = first_this - timedelta(days=1)
        return last_month.replace(day=1), first_this
    if period == "thisQuarter":
        q = (today.month - 1) // 3
        return today.replace(month=q * 3 + 1, day=1), now
    if period == "thisYear":
        return today.replace(month=1, day=1), now
    return today.replace(day=1), now  # thisMonth


# ── GET /api/reports/overview ──────────────────────────────────────────────────
@reports_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    period = request.args.get("period", "thisMonth")
    start, end = _date_range(period)
    pmatch = {"joining_date": {"$gte": start, "$lte": end}}

    total_jobs       = mongo.db.jobs.count_documents({})
    open_jobs        = mongo.db.jobs.count_documents({"status": "Open"})
    total_candidates = mongo.db.resume_bank.count_documents({})
    total_placements = mongo.db.placements.count_documents(pmatch)

    fill_rate = round(total_placements / open_jobs * 100, 1) if open_jobs else 0

    ttf = list(mongo.db.placements.aggregate([
        {"$match": {"time_to_fill": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$time_to_fill"}}},
    ]))
    avg_time_to_fill = round(ttf[0]["avg"], 1) if ttf else 0

    rev = list(mongo.db.placements.aggregate([
        {"$match": pmatch},
        {"$group": {"_id": None, "total": {"$sum": "$billing_amount"}}},
    ]))
    revenue = rev[0]["total"] if rev else 0

    job_status = {r["_id"]: r["count"] for r in mongo.db.jobs.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]) if r["_id"]}

    candidate_counts = {r["_id"]: r["count"] for r in mongo.db.resume_bank.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]) if r["_id"]}

    return jsonify(success=True, data={
        "total_jobs":        total_jobs,
        "open_jobs":         open_jobs,
        "total_candidates":  total_candidates,
        "total_placements":  total_placements,
        "fill_rate":         fill_rate,
        "avg_time_to_fill":  avg_time_to_fill,
        "revenue":           revenue,
        "job_status_counts": job_status,
        "candidate_counts":  candidate_counts,
    }), 200


# ── GET /api/reports/funnel ────────────────────────────────────────────────────
@reports_bp.route("/funnel", methods=["GET"])
@jwt_required()
def funnel():
    status_map = {r["_id"]: r["count"] for r in mongo.db.resume_bank.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]) if r["_id"]}

    total = mongo.db.resume_bank.count_documents({})

    def pct(num, denom):
        return f"{round(num / denom * 100, 1)}%" if denom else "0%"

    result, prev = [], total
    for stage in FUNNEL_STAGES:
        count = status_map.get(stage, 0)
        result.append({
            "stage":      stage,
            "count":      count,
            "conversion": "100%" if stage == "New" else pct(count, prev),
        })
        if count > 0:
            prev = count

    return jsonify(success=True, data=result), 200


# ── GET /api/reports/recruiter-performance ────────────────────────────────────
@reports_bp.route("/recruiter-performance", methods=["GET"])
@jwt_required()
def recruiter_performance():
    period = request.args.get("period", "thisMonth")
    start, end = _date_range(period)

    # placements.recruiter
    placement_data = {
        r["_id"]: {"placements": r["placements"], "revenue": r["revenue"]}
        for r in mongo.db.placements.aggregate([
            {"$match": {"joining_date": {"$gte": start, "$lte": end}}},
            {"$group": {
                "_id":        "$recruiter",
                "placements": {"$sum": 1},
                "revenue":    {"$sum": "$billing_amount"},
            }},
        ])
        if r["_id"]
    }

    # candidate_tracking.recruiter — interview stage counts
    interview_data = {
        r["_id"]: r["count"]
        for r in mongo.db.candidate_tracking.aggregate([
            {"$match": {"current_stage": {"$in": INTERVIEW_STAGES}}},
            {"$group": {"_id": "$recruiter", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    # candidate_tracking.recruiter — offer stage counts
    offer_data = {
        r["_id"]: r["count"]
        for r in mongo.db.candidate_tracking.aggregate([
            {"$match": {"current_stage": "Offer"}},
            {"$group": {"_id": "$recruiter", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    # jobs.posted_by_name
    jobs_posted = {
        r["_id"]: r["count"]
        for r in mongo.db.jobs.aggregate([
            {"$match": {"posted_by_name": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$posted_by_name", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    all_names = set(
        list(placement_data.keys()) + list(interview_data.keys()) +
        list(offer_data.keys()) + list(jobs_posted.keys())
    )

    result = []
    for name in all_names:
        p          = placement_data.get(name, {"placements": 0, "revenue": 0})
        interviews = interview_data.get(name, 0)
        offers     = offer_data.get(name, 0)
        placed     = p["placements"]
        conversion = round(placed / interviews * 100, 1) if interviews else 0
        result.append({
            "name":            name,
            "jobs_posted":     jobs_posted.get(name, 0),
            "interviews":      interviews,
            "offers":          offers,
            "placements":      placed,
            "revenue":         p["revenue"],
            "conversion_rate": conversion,
        })

    result.sort(key=lambda x: (x["placements"], x["revenue"]), reverse=True)
    return jsonify(success=True, data=result), 200


# ── GET /api/reports/client-wise ──────────────────────────────────────────────
@reports_bp.route("/client-wise", methods=["GET"])
@jwt_required()
def client_wise():
    period = request.args.get("period", "thisMonth")
    start, end = _date_range(period)

    jobs_by_client = {
        r["_id"]: {
            "jobs": r["jobs"], "open": r["open"],
            "filled": r["filled"], "client_id": r.get("client_id", ""),
        }
        for r in mongo.db.jobs.aggregate([
            {"$group": {
                "_id":       "$client_name",
                "jobs":      {"$sum": 1},
                "open":      {"$sum": {"$cond": [{"$eq": ["$status", "Open"]},   1, 0]}},
                "filled":    {"$sum": {"$cond": [{"$eq": ["$status", "Filled"]}, 1, 0]}},
                "client_id": {"$first": "$client_id"},
            }},
        ])
        if r["_id"]
    }

    placements_by_client = {
        r["_id"]: {"placements": r["placements"], "revenue": r["revenue"]}
        for r in mongo.db.placements.aggregate([
            {"$match": {"joining_date": {"$gte": start, "$lte": end}}},
            {"$group": {
                "_id":        "$client_name",
                "placements": {"$sum": 1},
                "revenue":    {"$sum": "$billing_amount"},
            }},
        ])
        if r["_id"]
    }

    pipeline_by_client = {
        r["_id"]: r["count"]
        for r in mongo.db.candidate_tracking.aggregate([
            {"$match": {"pipeline_status": "Active"}},
            {"$group": {"_id": "$client_name", "count": {"$sum": 1}}},
        ])
        if r["_id"]
    }

    all_clients = set(list(jobs_by_client.keys()) + list(placements_by_client.keys()))
    result = []
    for name in all_clients:
        j         = jobs_by_client.get(name, {"jobs": 0, "open": 0, "filled": 0, "client_id": ""})
        p         = placements_by_client.get(name, {"placements": 0, "revenue": 0})
        total     = j["jobs"]
        placed    = p["placements"]
        fill_rate = round(placed / total * 100, 1) if total else 0
        result.append({
            "name":            name,
            "client_id":       j["client_id"],
            "jobs":            total,
            "open_jobs":       j["open"],
            "filled_jobs":     j["filled"],
            "active_pipeline": pipeline_by_client.get(name, 0),
            "placements":      placed,
            "revenue":         p["revenue"],
            "fill_rate":       fill_rate,
        })

    result.sort(key=lambda x: x["revenue"], reverse=True)
    return jsonify(success=True, data=result), 200


# ── GET /api/reports/time-to-fill ─────────────────────────────────────────────
@reports_bp.route("/time-to-fill", methods=["GET"])
@jwt_required()
def time_to_fill():
    buckets = [
        {"label": "<2 weeks",   "min": 0,  "max": 14},
        {"label": "2–4 weeks",  "min": 14, "max": 28},
        {"label": "1–2 months", "min": 28, "max": 60},
        {"label": "2–3 months", "min": 60, "max": 90},
        {"label": ">3 months",  "min": 90, "max": 9999},
    ]
    distribution = [
        {"label": b["label"], "count": mongo.db.placements.count_documents(
            {"time_to_fill": {"$gte": b["min"], "$lt": b["max"]}}
        )}
        for b in buckets
    ]

    by_client = list(mongo.db.placements.aggregate([
        {"$match": {"time_to_fill": {"$gt": 0}}},
        {"$group": {
            "_id":      "$client_name",
            "avg_days": {"$avg": "$time_to_fill"},
            "count":    {"$sum": 1},
        }},
        {"$sort": {"avg_days": 1}},
        {"$limit": 8},
    ]))

    return jsonify(success=True, data={
        "distribution": distribution,
        "by_client": [
            {"name": r["_id"], "avg_days": round(r["avg_days"], 1), "count": r["count"]}
            for r in by_client if r["_id"]
        ],
    }), 200


# ── GET /api/reports/source-effectiveness ─────────────────────────────────────
@reports_bp.route("/source-effectiveness", methods=["GET"])
@jwt_required()
def source_effectiveness():
    result = list(mongo.db.resume_bank.aggregate([
        {"$group": {
            "_id":         "$source",
            "candidates":  {"$sum": 1},
            "shortlisted": {"$sum": {"$cond": [
                {"$in": ["$status", ["Shortlisted","Interviewed","Offered","Hired"]]}, 1, 0
            ]}},
            "interviewed": {"$sum": {"$cond": [
                {"$in": ["$status", ["Interviewed","Offered","Hired"]]}, 1, 0
            ]}},
            "offered":     {"$sum": {"$cond": [
                {"$in": ["$status", ["Offered","Hired"]]}, 1, 0
            ]}},
            "hired":       {"$sum": {"$cond": [{"$eq": ["$status","Hired"]}, 1, 0]}},
        }},
        {"$sort": {"candidates": -1}},
    ]))

    data = []
    for r in result:
        if not r["_id"]:
            continue
        cands      = r["candidates"]
        hired      = r["hired"]
        efficiency = round(hired / cands * 100, 1) if cands else 0
        data.append({
            "source":      r["_id"],
            "candidates":  cands,
            "shortlisted": r["shortlisted"],
            "interviewed": r["interviewed"],
            "offered":     r["offered"],
            "hires":       hired,
            "efficiency":  efficiency,
        })

    return jsonify(success=True, data=data), 200