


from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from extensions import mongo, resourcing_db

rbot_analytics_bp = Blueprint("rbot_dashboard", __name__)


def _get_rb_user_id(zentree_user_id: str):
    try:
        zentree_user = mongo.db.users.find_one({"_id": ObjectId(zentree_user_id)})
        if not zentree_user:
            return None, None, None
        email = zentree_user.get("email", "")
        role  = zentree_user.get("role", "")
        rb_user = resourcing_db["users"].find_one({"email": email})
        rb_id = str(rb_user["_id"]) if rb_user else None
        return rb_id, role, email
    except Exception:
        return None, None, None


def _date_range(period: str, date_from: str = "", date_to: str = ""):
    """Return (start_dt, end_dt) based on period string or custom range."""
    now = datetime.utcnow()
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    elif period == "year":
        start = now - timedelta(days=365)
    elif period == "custom" and date_from:
        try:
            start = datetime.fromisoformat(date_from)
            end   = datetime.fromisoformat(date_to) if date_to else now
            return start, end
        except Exception:
            start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=30)
    return start, now


# ── GET /api/rbot-dashboard/recruiter ────────────────────────────────────────
@rbot_analytics_bp.route("/recruiter", methods=["GET"])
@jwt_required()
def recruiter_dashboard():
    identity = get_jwt_identity()
    rb_recruiter_id, role, _ = _get_rb_user_id(identity)

    if not rb_recruiter_id:
        return jsonify(success=False, message="No ResourcingBot account found"), 404

    col = resourcing_db["candidate_profiles"]
    all_candidates = list(col.find({"recruiterid": rb_recruiter_id}))

    status_counts = {}
    for c in all_candidates:
        s = c.get("overallStatus", "Unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    jd_map = {}
    for c in all_candidates:
        jd_id = c.get("jdID", "")
        if jd_id not in jd_map:
            jd_map[jd_id] = {
                "jdID": jd_id,
                "jobRole": c.get("jobRole", ""),
                "companyName": c.get("companyName", ""),
                "total": 0,
                "status_counts": {},
                "candidates": [],
            }
        jd_map[jd_id]["total"] += 1
        s = c.get("overallStatus", "Unknown")
        jd_map[jd_id]["status_counts"][s] = jd_map[jd_id]["status_counts"].get(s, 0) + 1
        jd_map[jd_id]["candidates"].append({
            "_id":                   str(c["_id"]),
            "candidateID":           c.get("candidateID", ""),
            "candidatename":         c.get("candidatename", ""),
            "candidateEmail":        c.get("candidateEmail", ""),
            "phone":                 c.get("phone", ""),
            "jobRole":               c.get("jobRole", ""),
            "overallStatus":         c.get("overallStatus", ""),
            "match_score":           c.get("match_score", 0),
            "recruiterFeedback":     c.get("recruiterFeedback", ""),
            "hiringManagerFeedback": c.get("hiringManagerFeedback", ""),
            "ScreeningTestScore":    c.get("ScreeningTestScore", 0),
            "resumeUrl":             c.get("resumeUrl", ""),
            "created_at":            c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else "",
        })

    total       = len(all_candidates)
    shortlisted = status_counts.get("Shortlisted", 0)
    selected    = status_counts.get("Selected", 0)
    rejected    = sum(v for k, v in status_counts.items() if "Reject" in k)
    in_progress = total - selected - rejected

    return jsonify(
        success       = True,
        kpis = {
            "total":       total,
            "shortlisted": shortlisted,
            "selected":    selected,
            "rejected":    rejected,
            "in_progress": in_progress,
            "total_jds":   len(jd_map),
        },
        status_counts = status_counts,
        jd_breakdown  = list(jd_map.values()),
    ), 200


# ── GET /api/rbot-dashboard/manager ──────────────────────────────────────────
@rbot_analytics_bp.route("/manager", methods=["GET"])
@jwt_required()
def manager_dashboard():
    identity = get_jwt_identity()
    zentree_user = mongo.db.users.find_one({"_id": ObjectId(identity)})
    if not zentree_user or zentree_user.get("role") not in ("manager", "admin"):
        return jsonify(success=False, message="Unauthorized"), 403

    period    = request.args.get("period", "month")
    date_from = request.args.get("date_from", "")
    date_to   = request.args.get("date_to", "")
    start_dt, end_dt = _date_range(period, date_from, date_to)

    col = resourcing_db["candidate_profiles"]

    # All candidates (no date filter for totals — date filter applied to timeline only)
    all_candidates = list(col.find({}))

    # Candidates within the selected date range (for trend graphs)
    ranged_candidates = list(col.find({
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }))

    # ── Resolve recruiter names from RBot users ───────────────────────────────
    rb_user_map = {}
    for rb_user in resourcing_db["users"].find({"userType": "recruiter"}):
        rb_user_map[str(rb_user["_id"])] = {
            "name":  rb_user.get("name", rb_user.get("email", "Unknown")),
            "email": rb_user.get("email", ""),
        }

    # ── Per-recruiter full breakdown ──────────────────────────────────────────
    recruiter_map = {}
    for c in all_candidates:
        rid = str(c.get("recruiterid", "")) or "unassigned"
        if rid not in recruiter_map:
            rb_info = rb_user_map.get(rid, {"name": "Unassigned", "email": ""})
            recruiter_map[rid] = {
                "recruiter_id":   rid,
                "recruiter_name": rb_info["name"],
                "recruiter_email":rb_info["email"],
                "total":          0,
                "status_counts":  {},
                "jd_map":         {},   # jdID → { jobRole, companyName, total, status_counts, rejected }
            }
        rm = recruiter_map[rid]
        rm["total"] += 1
        s = c.get("overallStatus", "Unknown")
        rm["status_counts"][s] = rm["status_counts"].get(s, 0) + 1

        # Per-JD drill-down
        jd_id = c.get("jdID", "") or "unknown"
        if jd_id not in rm["jd_map"]:
            rm["jd_map"][jd_id] = {
                "jdID":          jd_id,
                "jobRole":       c.get("jobRole", ""),
                "companyName":   c.get("companyName", ""),
                "total":         0,
                "status_counts": {},
                "rejected":      0,
                "selected":      0,
            }
        jd = rm["jd_map"][jd_id]
        jd["total"] += 1
        jd["status_counts"][s] = jd["status_counts"].get(s, 0) + 1
        if "Reject" in s:
            jd["rejected"] += 1
        if s == "Selected":
            jd["selected"] += 1

    # ── Build timeline data for graphs (group by day/week) ───────────────────
    # For each recruiter, count candidates added per day in the range
    timeline_map = {}   # recruiter_id → { "YYYY-MM-DD": count }
    for c in ranged_candidates:
        rid  = str(c.get("recruiterid", "")) or "unassigned"
        dt   = c.get("created_at")
        if not isinstance(dt, datetime):
            continue
        day_key = dt.strftime("%Y-%m-%d")
        if rid not in timeline_map:
            timeline_map[rid] = {}
        timeline_map[rid][day_key] = timeline_map[rid].get(day_key, 0) + 1

    # Build sorted day labels for the range
    all_days = sorted({
        day for days in timeline_map.values() for day in days
    })

    # ── Serialize ─────────────────────────────────────────────────────────────
    recruiter_stats = []
    for rid, data in recruiter_map.items():
        selected  = data["status_counts"].get("Selected", 0)
        rejected  = sum(v for k, v in data["status_counts"].items() if "Reject" in k)
        jd_list   = []
        for jd_id, jd in data["jd_map"].items():
            jd_list.append({
                "jdID":          jd["jdID"],
                "jobRole":       jd["jobRole"],
                "companyName":   jd["companyName"],
                "total":         jd["total"],
                "rejected":      jd["rejected"],
                "selected":      jd["selected"],
                "status_counts": jd["status_counts"],
            })
        jd_list.sort(key=lambda x: x["total"], reverse=True)

        timeline_counts = [timeline_map.get(rid, {}).get(d, 0) for d in all_days]

        recruiter_stats.append({
            "recruiter_id":   rid,
            "recruiter_name": data["recruiter_name"],
            "recruiter_email":data["recruiter_email"],
            "total":          data["total"],
            "total_jds":      len(data["jd_map"]),
            "selected":       selected,
            "rejected":       rejected,
            "in_progress":    data["total"] - selected - rejected,
            "status_counts":  data["status_counts"],
            "jd_breakdown":   jd_list,
            "timeline":       timeline_counts,
        })

    recruiter_stats.sort(key=lambda x: x["total"], reverse=True)

    # ── Team-wide status counts ───────────────────────────────────────────────
    team_status_counts = {}
    for c in all_candidates:
        s = c.get("overallStatus", "Unknown")
        team_status_counts[s] = team_status_counts.get(s, 0) + 1

    total    = len(all_candidates)
    selected = team_status_counts.get("Selected", 0)
    rejected = sum(v for k, v in team_status_counts.items() if "Reject" in k)

    return jsonify(
        success             = True,
        kpis = {
            "total":            total,
            "selected":         selected,
            "rejected":         rejected,
            "in_progress":      total - selected - rejected,
            "total_recruiters": len([r for r in recruiter_stats if r["recruiter_id"] != "unassigned"]),
            "ranged_total":     len(ranged_candidates),
        },
        team_status_counts  = team_status_counts,
        recruiter_breakdown = recruiter_stats,
        timeline_labels     = all_days,
        period              = period,
        range_start         = start_dt.isoformat(),
        range_end           = end_dt.isoformat(),
    ), 200