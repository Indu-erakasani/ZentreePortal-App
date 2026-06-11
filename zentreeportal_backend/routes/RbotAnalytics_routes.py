
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

    period    = request.args.get("period", "month")
    date_from = request.args.get("date_from", "")
    date_to   = request.args.get("date_to", "")
    start_dt, end_dt = _date_range(period, date_from, date_to)

    col = resourcing_db["candidate_profiles"]
    all_candidates = list(col.find({"recruiterid": rb_recruiter_id}))

    status_counts = {}
    for c in all_candidates:
        s = c.get("overallStatus", "Unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    # ── Build jd_map from candidates first ────────────────────────────────────
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
                "rejected": 0,
                "selected": 0,
                "ranged_total": 0,
                "has_candidates": True,
            }
        jd_map[jd_id]["total"] += 1
        s = c.get("overallStatus", "Unknown")
        jd_map[jd_id]["status_counts"][s] = jd_map[jd_id]["status_counts"].get(s, 0) + 1
        if "Reject" in s:
            jd_map[jd_id]["rejected"] += 1
        if s == "Selected":
            jd_map[jd_id]["selected"] += 1

        # ── interview feedback as a clean list ─────────────────────────────────
        raw_feedback = c.get("interviewFeedback", []) or []
        interview_feedback = []
        for fb in raw_feedback:
            if isinstance(fb, dict):
                interview_feedback.append({
                    "feedbackText":          fb.get("feedbackText", ""),
                    "reviewRating":          fb.get("reviewRating", ""),
                    "programmingRating":     fb.get("programmingRating"),
                    "communicationSkills":   fb.get("communicationSkills"),
                    "problemSolvingSkills":  fb.get("problemSolvingSkills"),
                    "technicalSkills":       fb.get("technicalSkills"),
                })

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
            "interviewFeedback":     interview_feedback,   # NEW
            "created_at":            c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else "",
        })

    # ── Pull assigned JDs from jd_details for this recruiter (zero-candidate JDs) ─
    for jd_doc in resourcing_db["jd_details"].find(
        {"recruiterContacts": ObjectId(rb_recruiter_id)},
        {"_id": 1, "jdID": 1, "jobRole": 1, "companyName": 1}
    ):
        jd_id_key = str(jd_doc.get("jdID") or str(jd_doc["_id"]))
        if jd_id_key not in jd_map:
            jd_map[jd_id_key] = {
                "jdID": jd_id_key,
                "jobRole": jd_doc.get("jobRole", ""),
                "companyName": jd_doc.get("companyName", ""),
                "total": 0,
                "status_counts": {},
                "candidates": [],
                "rejected": 0,
                "selected": 0,
                "ranged_total": 0,
                "has_candidates": False,
            }

    # ── Fill ranged_total based on selected period ────────────────────────────
    ranged = list(col.find({
        "recruiterid": rb_recruiter_id,
        "created_at": {"$gte": start_dt, "$lte": end_dt}
    }))
    for c in ranged:
        jd_id = c.get("jdID", "")
        if jd_id in jd_map:
            jd_map[jd_id]["ranged_total"] += 1

    total       = len(all_candidates)
    shortlisted = status_counts.get("Shortlisted", 0)
    selected    = status_counts.get("Selected", 0)
    rejected    = sum(v for k, v in status_counts.items() if "Reject" in k)
    in_progress = total - selected - rejected

    return jsonify(
        success       = True,
        kpis = {
            "total":        total,
            "shortlisted":  shortlisted,
            "selected":     selected,
            "rejected":     rejected,
            "in_progress":  in_progress,
            "total_jds":    len(jd_map),
            "ranged_total": len(ranged),
        },
        status_counts = status_counts,
        jd_breakdown  = list(jd_map.values()),
        period        = period,
        range_start   = start_dt.isoformat(),
        range_end     = end_dt.isoformat(),
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
    jd_filter = request.args.get("jd_id", "")
    start_dt, end_dt = _date_range(period, date_from, date_to)

    col = resourcing_db["candidate_profiles"]

    # ── Status ordering ───────────────────────────────────────────────────────
    STATUS_ORDER = [
        "NewCandidate",
        "Recruiter_Rejected", "Recruiter_Accepted", "Recruiter_Hold",
        "HiringManager_Rejected", "HiringManager_Accepted", "HiringManager_Hold",
        "ScreeningTest_Sent", "ScreeningTest_Resent",
        "Candidate_Declined", "Candidate_OnHold", "Candidate_Quit",
        "ScreeningTest_Passed", "ReScreeningTest_Passed",
        "OnHold_ReScreening", "OnHold_Screening",
        "TestPassed_Rejected", "ReTestPassed_Rejected",
        "ScreeningTest_Failed", "ReScreeningTest_Failed",
        "OnHold_TestPassed",
        "Interview_Scheduled", "Round1_Rejected", "Round2_Suggested",
        "Round2_Scheduled", "Interviewer_Selected", "Interviewer_Rejected",
        "Selected", "Rejected",
    ]

    def _order_counts(raw: dict) -> dict:
        ordered = {}
        for s in STATUS_ORDER:
            if s in raw:
                ordered[s] = raw[s]
        for s, v in raw.items():
            if s not in ordered:
                ordered[s] = v
        return ordered

    # ── All candidates (totals) ───────────────────────────────────────────────
    base_query = {}
    if jd_filter:
        base_query["jdID"] = jd_filter
    all_candidates = list(col.find(base_query))

    # ── Ranged candidates (for timeline + period KPI) ─────────────────────────
    ranged_query = dict(base_query)
    ranged_query["created_at"] = {"$gte": start_dt, "$lte": end_dt}
    ranged_candidates = list(col.find(ranged_query))

    # ── Resolve recruiter names from RBot users ───────────────────────────────
    rb_user_map = {}
    for rb_user in resourcing_db["users"].find({"userType": "recruiter"}):
        rb_user_map[str(rb_user["_id"])] = {
            "name":  rb_user.get("name", rb_user.get("email", "Unknown")),
            "email": rb_user.get("email", ""),
        }

    # ── Fetch JD metadata from jd_details once ───────────────────────────────
    jd_meta_map = {}   # jdID string → { jobRole, companyName, recruiterContacts: [str, ...] }
    for jd_doc in resourcing_db["jd_details"].find(
        {},
        {"_id": 1, "jdID": 1, "jobRole": 1, "companyName": 1, "recruiterContacts": 1}
    ):
        jd_id_key = str(jd_doc.get("jdID") or str(jd_doc["_id"]))
        # recruiterContacts is stored as a list of ObjectIds in jd_details
        raw_contacts = jd_doc.get("recruiterContacts") or []
        str_contacts = [str(c) for c in raw_contacts if c]
        jd_meta_map[jd_id_key] = {
            "jobRole":            jd_doc.get("jobRole", ""),
            "companyName":        jd_doc.get("companyName", ""),
            "recruiterContacts":  str_contacts,   # ← who is ASSIGNED to this JD
            "jd_details_id":      str(jd_doc["_id"]),
        }

    # ── Build assigned-JD sets per recruiter from jd_details ─────────────────
    # This is the CORRECT source of truth for "how many JDs does recruiter X have"
    # A recruiter's ObjectId appears in jd_details.recruiterContacts[]
    recruiter_assigned_jds = {}   # rb_user_id (str) → set of jdID strings
    for jd_id_key, meta in jd_meta_map.items():
        for rid in meta["recruiterContacts"]:
            if rid not in recruiter_assigned_jds:
                recruiter_assigned_jds[rid] = set()
            recruiter_assigned_jds[rid].add(jd_id_key)

    # ── Per-recruiter full breakdown (all time, from candidate_profiles) ───────
    recruiter_map = {}
    for c in all_candidates:
        rid = str(c.get("recruiterid", "")) or "Other"
        if rid not in recruiter_map:
            rb_info = rb_user_map.get(rid, {"name": "Other", "email": ""})
            recruiter_map[rid] = {
                "recruiter_id":    rid,
                "recruiter_name":  rb_info["name"],
                "recruiter_email": rb_info["email"],
                "total":           0,
                "status_counts":   {},
                "jd_map":          {},   # JDs with actual candidates
            }
        rm = recruiter_map[rid]
        rm["total"] += 1
        s = c.get("overallStatus", "Unknown")
        rm["status_counts"][s] = rm["status_counts"].get(s, 0) + 1

        jd_id = c.get("jdID", "") or "unknown"
        meta  = jd_meta_map.get(jd_id, {})
        if jd_id not in rm["jd_map"]:
            rm["jd_map"][jd_id] = {
                "jdID":          jd_id,
                "jobRole":       c.get("jobRole", "") or meta.get("jobRole", ""),
                "companyName":   c.get("companyName", "") or meta.get("companyName", ""),
                "total":         0,
                "status_counts": {},
                "rejected":      0,
                "selected":      0,
                "ranged_total":  0,
                "has_candidates": True,   # ← this JD has candidates
            }
        jd = rm["jd_map"][jd_id]
        jd["total"] += 1
        jd["status_counts"][s] = jd["status_counts"].get(s, 0) + 1
        if "Reject" in s:
            jd["rejected"] += 1
        if s == "Selected":
            jd["selected"] += 1

    # ── Merge assigned JDs (no candidates yet) into each recruiter's jd_map ───
    # For every JD assigned in jd_details but not yet in jd_map (zero candidates),
    # add a zero-count entry so the recruiter's JD count is accurate.
    for rid, assigned_set in recruiter_assigned_jds.items():
        # Ensure the recruiter exists in recruiter_map even if they have 0 candidates
        if rid not in recruiter_map:
            rb_info = rb_user_map.get(rid, {"name": "Other", "email": ""})
            recruiter_map[rid] = {
                "recruiter_id":    rid,
                "recruiter_name":  rb_info["name"],
                "recruiter_email": rb_info["email"],
                "total":           0,
                "status_counts":   {},
                "jd_map":          {},
            }
        rm = recruiter_map[rid]
        for jd_id_key in assigned_set:
            if jd_id_key not in rm["jd_map"]:
                meta = jd_meta_map.get(jd_id_key, {})
                rm["jd_map"][jd_id_key] = {
                    "jdID":           jd_id_key,
                    "jobRole":        meta.get("jobRole", ""),
                    "companyName":    meta.get("companyName", ""),
                    "total":          0,
                    "status_counts":  {},
                    "rejected":       0,
                    "selected":       0,
                    "ranged_total":   0,
                    "has_candidates": False,   # ← assigned but no candidates yet
                }

    # ── Second pass: fill ranged_total per recruiter-JD combo ─────────────────
    for c in ranged_candidates:
        rid   = str(c.get("recruiterid", "")) or "Other"
        jd_id = c.get("jdID", "") or "unknown"
        if rid in recruiter_map and jd_id in recruiter_map[rid]["jd_map"]:
            recruiter_map[rid]["jd_map"][jd_id]["ranged_total"] += 1

    # ── Timeline (per-day counts, per recruiter) ──────────────────────────────
    timeline_map = {}
    for c in ranged_candidates:
        rid = str(c.get("recruiterid", "")) or "Other"
        dt  = c.get("created_at")
        if not isinstance(dt, datetime):
            continue
        day_key = dt.strftime("%Y-%m-%d")
        if rid not in timeline_map:
            timeline_map[rid] = {}
        timeline_map[rid][day_key] = timeline_map[rid].get(day_key, 0) + 1

    all_days = sorted({day for days in timeline_map.values() for day in days})

    # ── Per-JD overall counts (across ALL recruiters) ─────────────────────────
    jd_overall_map = {}
    for c in all_candidates:
        jd_id = c.get("jdID", "") or "unknown"
        meta  = jd_meta_map.get(jd_id, {})
        if jd_id not in jd_overall_map:
            jd_overall_map[jd_id] = {
                "jdID":          jd_id,
                "jobRole":       c.get("jobRole", "") or meta.get("jobRole", ""),
                "companyName":   c.get("companyName", "") or meta.get("companyName", ""),
                "total":         0,
                "ranged_total":  0,
                "status_counts": {},
                "rejected":      0,
                "selected":      0,
            }
        jd = jd_overall_map[jd_id]
        jd["total"] += 1
        s = c.get("overallStatus", "Unknown")
        jd["status_counts"][s] = jd["status_counts"].get(s, 0) + 1
        if "Reject" in s:
            jd["rejected"] += 1
        if s == "Selected":
            jd["selected"] += 1

    for c in ranged_candidates:
        jd_id = c.get("jdID", "") or "unknown"
        if jd_id in jd_overall_map:
            jd_overall_map[jd_id]["ranged_total"] += 1

    for jd in jd_overall_map.values():
        jd["status_counts"] = _order_counts(jd["status_counts"])

    jd_overall_list = sorted(jd_overall_map.values(), key=lambda x: x["total"], reverse=True)

    # ── Serialize recruiter stats ─────────────────────────────────────────────
    recruiter_stats = []
    for rid, data in recruiter_map.items():
        selected = data["status_counts"].get("Selected", 0)
        rejected = sum(v for k, v in data["status_counts"].items() if "Reject" in k)

        jd_list = []
        for jd_id, jd in data["jd_map"].items():
            jd_list.append({
                "jdID":           jd["jdID"],
                "jobRole":        jd["jobRole"],
                "companyName":    jd["companyName"],
                "total":          jd["total"],
                "ranged_total":   jd["ranged_total"],
                "rejected":       jd["rejected"],
                "selected":       jd["selected"],
                "has_candidates": jd.get("has_candidates", True),
                "status_counts":  _order_counts(jd["status_counts"]),
            })
        jd_list.sort(key=lambda x: x["total"], reverse=True)

        timeline_counts = [timeline_map.get(rid, {}).get(d, 0) for d in all_days]

        # ── total_jds: count from jd_details (assigned) ───────────────────────
        # Fall back to candidate-derived count only if not in assigned map.
        assigned_count = len(recruiter_assigned_jds.get(rid, set()))
        candidate_derived_count = len(data["jd_map"])
        # Use whichever is larger — covers edge cases where candidates exist for
        # JDs that were removed from recruiterContacts after being added
        total_jds_count = max(assigned_count, candidate_derived_count)

        recruiter_stats.append({
            "recruiter_id":         rid,
            "recruiter_name":       data["recruiter_name"],
            "recruiter_email":      data["recruiter_email"],
            "total":                data["total"],
            "total_jds":            total_jds_count,   # ← FIXED: from jd_details
            "total_jds_assigned":   assigned_count,    # ← new: assigned in jd_details
            "total_jds_with_candidates": len([j for j in jd_list if j["has_candidates"]]),
            "selected":             selected,
            "rejected":             rejected,
            "in_progress":          data["total"] - selected - rejected,
            "status_counts":        _order_counts(data["status_counts"]),
            "jd_breakdown":         jd_list,
            "timeline":             timeline_counts,
        })

    # recruiter_stats.sort(key=lambda x: x["total"], reverse=True)
    recruiter_stats = [r for r in recruiter_stats if r["recruiter_id"] != "Other"]
    recruiter_stats.sort(key=lambda x: x["total"], reverse=True)

    # ── Team-wide status counts (ordered) ─────────────────────────────────────
    team_status_counts_raw = {}
    for c in all_candidates:
        s = c.get("overallStatus", "Unknown")
        team_status_counts_raw[s] = team_status_counts_raw.get(s, 0) + 1

    team_status_counts = _order_counts(team_status_counts_raw)

    total    = len(all_candidates)
    selected = team_status_counts_raw.get("Selected", 0)
    rejected = sum(v for k, v in team_status_counts_raw.items() if "Reject" in k)

    return jsonify(
        success             = True,
        kpis = {
            "total":            total,
            "selected":         selected,
            "rejected":         rejected,
            "in_progress":      total - selected - rejected,
            "total_recruiters": len([r for r in recruiter_stats if r["recruiter_id"] != "Other"]),
            "ranged_total":     len(ranged_candidates),
        },
        team_status_counts  = team_status_counts,
        recruiter_breakdown = recruiter_stats,
        jd_overall          = jd_overall_list,
        timeline_labels     = all_days,
        period              = period,
        range_start         = start_dt.isoformat(),
        range_end           = end_dt.isoformat(),
    ), 200