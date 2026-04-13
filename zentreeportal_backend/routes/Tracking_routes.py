
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import re, os, smtplib, ssl, uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from extensions import mongo
from models.Tracking_model import (
    tracking_schema, serialize_tracking,
    STAGES, PIPELINE_STATUSES,
)

tracking_bp = Blueprint("tracking", __name__)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _find(tid: str):
    try:
        oid = ObjectId(tid)
    except InvalidId:
        return None, (jsonify(success=False, message="Invalid tracking ID"), 400)
    doc = mongo.db.candidate_tracking.find_one({"_id": oid})
    if not doc:
        return None, (jsonify(success=False, message="Tracking record not found"), 404)
    return doc, None


def is_object_id(val: str) -> bool:
    return bool(re.match(r'^[a-f0-9]{24}$', (val or "").strip()))


# ═══════════════════════════════════════════════════════════════════════════════
#  GOOGLE MEET CREATOR
# ═══════════════════════════════════════════════════════════════════════════════
def _create_google_meet(
    summary: str,
    description: str,
    start_dt: datetime,
    duration_minutes: int,
    attendee_emails: list,
    timezone: str = "Asia/Kolkata",
) -> dict:
    """
    Creates Google Calendar event with Meet link using OAuth2 (works with personal Gmail).
    Requires google_token.json — run generate_token.py once to create it.
    """
    import json as _json

    token_file  = os.environ.get("GOOGLE_TOKEN_FILE",  "google_token.json")
    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID", "indu18002@gmail.com")

    if not os.path.exists(token_file):
        print(f"[MEET] ❌ {token_file} not found — run: python3 generate_token.py")
        return {"meet_link": "", "event_id": "", "calendar_link": ""}

    try:
        from googleapiclient.discovery      import build
        from google.oauth2.credentials      import Credentials
        from google.auth.transport.requests import Request

        with open(token_file) as f:
            td = _json.load(f)

        creds = Credentials(
            token         = td.get("token"),
            refresh_token = td.get("refresh_token"),
            token_uri     = td.get("token_uri",     "https://oauth2.googleapis.com/token"),
            client_id     = td.get("client_id"),
            client_secret = td.get("client_secret"),
            scopes        = td.get("scopes"),
        )

        # Auto-refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            td["token"] = creds.token
            with open(token_file, "w") as f:
                _json.dump(td, f, indent=2)
            print("[MEET] Token refreshed")

        service = build("calendar", "v3", credentials=creds)
        end_dt  = start_dt + timedelta(minutes=duration_minutes)

        event = {
            "summary":     summary,
            "description": description,
            "start":  {"dateTime": start_dt.isoformat(), "timeZone": timezone},
            "end":    {"dateTime": end_dt.isoformat(),   "timeZone": timezone},
            "attendees": [{"email": e} for e in attendee_emails if e and "@" in e],
            "conferenceData": {
                "createRequest": {
                    "requestId":             f"zentree-{int(start_dt.timestamp())}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 60},
                    {"method": "popup", "minutes": 15},
                ],
            },
        }

        created = service.events().insert(
            calendarId            = calendar_id,
            body                  = event,
            conferenceDataVersion = 1,
            sendUpdates           = "all",
        ).execute()

        meet_link = ""
        for ep in created.get("conferenceData", {}).get("entryPoints", []):
            if ep.get("entryPointType") == "video":
                meet_link = ep.get("uri", "")
                break

        if meet_link:
            print(f"[MEET] ✅ Google Meet created: {meet_link}")
        else:
            print("[MEET] ⚠️ Event created but no Meet link returned")

        return {
            "meet_link":     meet_link,
            "event_id":      created.get("id", ""),
            "calendar_link": created.get("htmlLink", ""),
        }

    except Exception as e:
        print(f"[MEET] ❌ Error: {repr(e)}")
        return {"meet_link": "", "event_id": "", "calendar_link": ""}
    
    

def _send_candidate_email(
    to_email: str,
    candidate_name: str,
    interviewer_name: str,
    job_title: str,
    client_name: str,
    interview_date: str,
    interview_time: str,
    duration_minutes: int,
    interview_type: str,
    meeting_link: str,
    calendar_link: str,
    stage: str,
    notes: str = "",
    tracking_id: str = "",
    schedule_id: str = "",
) -> bool:
    smtp_host    = os.environ.get("SMTP_SERVER",   "smtp.sendgrid.net").strip().strip('"')
    smtp_port    = int(os.environ.get("SMTP_PORT", 587))
    smtp_user    = os.environ.get("SMTP_USERNAME", "apikey").strip().strip('"')
    smtp_pass    = os.environ.get("SMTP_PASSWORD", "").strip().strip('"')
    from_email   = os.environ.get("FROM_EMAIL",    "").strip().strip('"')
    frontend_url = os.environ.get("FRONTEND_URL",  "http://localhost:3000").strip().strip('"')

    if not smtp_pass or not from_email: return False
    if not to_email or "@" not in to_email: return False

    accept_url  = f"{frontend_url}/interview/respond/{tracking_id}/{schedule_id}/accept"
    decline_url = f"{frontend_url}/interview/respond/{tracking_id}/{schedule_id}/decline"

    # Meet button (right side panel like Gmail calendar invite)
    meet_panel = ""
    if meeting_link:
        meet_panel = f"""
        <td width="200" valign="top" style="padding-left:20px">
          <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;text-align:center">
            <a href="{meeting_link}"
               style="display:block;padding:10px 16px;background:#1a73e8;color:#fff;
                      border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;
                      margin-bottom:12px">
              Join with Google Meet
            </a>
            <p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:#333;text-align:left">Meeting link</p>
            <a href="{meeting_link}" style="font-size:11px;color:#1a73e8;word-break:break-all;text-align:left;display:block">
              {meeting_link.replace("https://", "")}
            </a>
          </div>
        </td>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
  <tr><td align="center">
    <table width="680" cellpadding="0" cellspacing="0"
           style="max-width:680px;width:100%;background:#fff;
                  border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">

      <!-- Header -->
      <tr>
        <td colspan="2" style="background:#1a237e;padding:20px 28px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="color:#fff;font-size:11px;font-weight:600;
                            text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">
                  Zentreelabs Recruitment
                </div>
                <div style="color:#fff;font-size:20px;font-weight:700">
                  Interview Scheduled
                </div>
                <div style="color:#90caf9;font-size:13px;margin-top:4px">
                  {stage} · {client_name}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px 28px" valign="top">

          <p style="margin:0 0 16px;font-size:15px;color:#333">
            Hi <strong>{candidate_name}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">
            You have been scheduled for a <strong>{interview_type}</strong> interview
            for the position of <strong>{job_title}</strong> at <strong>{client_name}</strong>.
          </p>

          <!-- RSVP -->
          <div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;
                      padding:14px 16px;margin-bottom:20px">
            <p style="margin:0 0 10px;font-size:13px;color:#333;font-weight:600">
              Can you attend this interview?
            </p>
            <a href="{accept_url}"
               style="display:inline-block;padding:8px 20px;background:#2e7d32;
                      color:#fff;border-radius:4px;text-decoration:none;
                      font-size:13px;font-weight:bold;margin-right:8px">
              ✓ Yes, I'll Attend
            </a>
            <a href="{decline_url}"
               style="display:inline-block;padding:8px 20px;background:#fff;
                      color:#c62828;border:1px solid #c62828;border-radius:4px;
                      text-decoration:none;font-size:13px;font-weight:bold">
              ✗ Can't Attend
            </a>
          </div>

          <!-- Details table — MNC style -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e0e0e0;border-radius:6px;
                        border-collapse:separate;overflow:hidden;margin-bottom:20px">
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;width:38%;border-bottom:1px solid #e8e8e8">
                Candidate
              </td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;
                         color:#333;border-bottom:1px solid #e8e8e8">
                {candidate_name}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8;background:#fafafa">
                Job
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333;
                         border-bottom:1px solid #e8e8e8">
                {job_title}
              </td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8">
                Interview Date &amp; Time
              </td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;
                         color:#1a237e;border-bottom:1px solid #e8e8e8">
                {interview_date}<br>
                <span style="font-size:12px;font-weight:400;color:#555">{interview_time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8;background:#fafafa">
                Duration
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333;
                         border-bottom:1px solid #e8e8e8">
                {duration_minutes} minutes
              </td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8">
                Format
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333;
                         border-bottom:1px solid #e8e8e8">
                {interview_type}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;background:#fafafa">
                Interviewer
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333">
                {interviewer_name}
              </td>
            </tr>
          </table>

          {f'<div style="background:#fff8e1;border-left:3px solid #f9a825;padding:10px 14px;border-radius:4px;margin-bottom:16px"><p style="margin:0;color:#e65100;font-size:13px"><strong>Notes:</strong> {notes}</p></div>' if notes else ""}

          <p style="margin:0;font-size:13px;color:#555;line-height:1.6">Regards,<br>
          <strong style="color:#1a237e">Zentreelabs Hiring Team</strong></p>
        </td>

        <!-- Right panel: Meet button (shown if link exists) -->
        {'<td width="200" valign="top" style="padding:24px 20px 24px 0"><div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;text-align:center"><a href="' + meeting_link + '" style="display:block;padding:10px 16px;background:#1a73e8;color:#fff;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;margin-bottom:12px">Join with Google Meet</a><p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#333;text-align:left">Meeting link</p><a href="' + meeting_link + '" style="font-size:11px;color:#1a73e8;word-break:break-all;text-align:left;display:block">' + meeting_link.replace("https://", "") + '</a></div></td>' if meeting_link else '<td width="20"></td>'}
      </tr>

      <!-- When section (like Google Calendar invite) -->
      <tr>
        <td colspan="2" style="padding:0 28px 20px">
          <div style="border-top:1px solid #e0e0e0;padding-top:16px">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#333">When</p>
            <p style="margin:0;font-size:13px;color:#555">
              {interview_date} · {interview_time} ({duration_minutes} min)
            </p>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td colspan="2" style="background:#f8f9fa;padding:14px 28px;
                   border-top:1px solid #e0e0e0;text-align:center">
          <p style="margin:0;color:#999;font-size:11px">
            Invitation from <strong style="color:#1a237e">Zentreelabs Recruitment System</strong> ·
            Please do not reply to this email.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>"""

    return _smtp_send(smtp_host, smtp_port, smtp_user, smtp_pass, from_email, to_email,
                      f"Interview Scheduled: {job_title} — {stage} ({interview_date})", html)


def _send_interviewer_email(
    to_email: str,
    interviewer_name: str,
    candidate_name: str,
    job_title: str,
    client_name: str,
    interview_date: str,
    interview_time: str,
    duration_minutes: int,
    interview_type: str,
    meeting_link: str,
    calendar_link: str,
    stage: str,
    notes: str = "",
    tracking_id: str = "",
    schedule_id: str = "",
) -> bool:
    smtp_host    = os.environ.get("SMTP_SERVER",   "smtp.sendgrid.net").strip().strip('"')
    smtp_port    = int(os.environ.get("SMTP_PORT", 587))
    smtp_user    = os.environ.get("SMTP_USERNAME", "apikey").strip().strip('"')
    smtp_pass    = os.environ.get("SMTP_PASSWORD", "").strip().strip('"')
    from_email   = os.environ.get("FROM_EMAIL",    "").strip().strip('"')
    frontend_url = os.environ.get("FRONTEND_URL",  "http://localhost:3000").strip().strip('"')

    if not smtp_pass or not from_email: return False
    if not to_email or "@" not in to_email: return False

    feedback_url = f"{frontend_url}/interview/feedback/{tracking_id}/{schedule_id}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
  <tr><td align="center">
    <table width="680" cellpadding="0" cellspacing="0"
           style="max-width:680px;width:100%;background:#fff;
                  border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">

      <!-- Header -->
      <tr>
        <td colspan="2" style="background:#1a237e;padding:20px 28px">
          <div style="color:#fff;font-size:11px;font-weight:600;
                      text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">
            Zentreelabs Recruitment
          </div>
          <div style="color:#fff;font-size:20px;font-weight:700">
            Online Interview Scheduled
          </div>
          <div style="color:#90caf9;font-size:13px;margin-top:4px">
            {stage} · {client_name}
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px 28px" valign="top">

          <p style="margin:0 0 16px;font-size:15px;color:#333">
            Greetings, <strong>{interviewer_name}</strong>,
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6">
            You have been assigned to interview <strong>{candidate_name}</strong>
            for the position of <strong>{job_title}</strong>.
          </p>

          <!-- Details table — MNC style (Image 3) -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #e0e0e0;border-radius:6px;
                        border-collapse:separate;overflow:hidden;margin-bottom:20px">
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;width:38%;border-bottom:1px solid #e8e8e8">
                Candidate
              </td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;
                         color:#333;border-bottom:1px solid #e8e8e8">
                {candidate_name}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8;background:#fafafa">
                Job
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333;
                         border-bottom:1px solid #e8e8e8">
                {job_title}
              </td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8">
                Interview Date &amp; Time
              </td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;
                         color:#1a237e;border-bottom:1px solid #e8e8e8">
                {interview_date}<br>
                <span style="font-size:12px;font-weight:400;color:#555">{interview_time}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555;border-bottom:1px solid #e8e8e8;background:#fafafa">
                Panel Members
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333;
                         border-bottom:1px solid #e8e8e8">
                {interviewer_name}
              </td>
            </tr>
            <tr style="background:#f8f9fa">
              <td style="padding:10px 14px;font-size:12px;font-weight:700;
                         color:#555">
                Feedback Link
              </td>
              <td style="padding:10px 14px;font-size:13px;color:#333">
                <a href="{feedback_url}"
                   style="color:#7b1fa2;font-weight:600;text-decoration:none">
                  Give Feedback
                </a>
              </td>
            </tr>
          </table>

          {f'<div style="background:#fff8e1;border-left:3px solid #f9a825;padding:10px 14px;border-radius:4px;margin-bottom:16px"><p style="margin:0;color:#e65100;font-size:13px"><strong>Notes:</strong> {notes}</p></div>' if notes else ""}

          <p style="margin:0;font-size:13px;color:#555;line-height:1.6">Regards,<br>
          <strong style="color:#1a237e">Zentreelabs Hiring Team</strong></p>
        </td>

        <!-- Right panel: Meet button -->
        {'<td width="200" valign="top" style="padding:24px 20px 24px 0"><div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;text-align:center"><a href="' + meeting_link + '" style="display:block;padding:10px 16px;background:#1a73e8;color:#fff;border-radius:4px;text-decoration:none;font-size:13px;font-weight:bold;margin-bottom:12px">Join with Google Meet</a><p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#333;text-align:left">Meeting link</p><a href="' + meeting_link + '" style="font-size:11px;color:#1a73e8;word-break:break-all;text-align:left;display:block">' + meeting_link.replace("https://", "") + '</a></div></td>' if meeting_link else '<td width="20"></td>'}
      </tr>

      <!-- When section -->
      <tr>
        <td colspan="2" style="padding:0 28px 20px">
          <div style="border-top:1px solid #e0e0e0;padding-top:16px">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#333">When</p>
            <p style="margin:0 0 8px;font-size:13px;color:#555">
              {interview_date} · {interview_time} ({duration_minutes} min)
            </p>
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#333">Guests</p>
            <p style="margin:0;font-size:13px;color:#555">
              {interviewer_name}<br>
              {candidate_name}
            </p>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td colspan="2" style="background:#f8f9fa;padding:14px 28px;
                   border-top:1px solid #e0e0e0;text-align:center">
          <p style="margin:0;color:#999;font-size:11px">
            Invitation from <strong style="color:#1a237e">Zentreelabs Recruitment System</strong> ·
            Please do not reply to this email.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>"""

    return _smtp_send(smtp_host, smtp_port, smtp_user, smtp_pass, from_email, to_email,
                      f"Interview Scheduled: {candidate_name} — {stage} ({interview_date})", html)












# ═══════════════════════════════════════════════════════════════════════════════
#  SHARED SMTP SENDER
# ═══════════════════════════════════════════════════════════════════════════════

def _smtp_send(smtp_host, smtp_port, smtp_user, smtp_pass,
               from_email, to_email, subject, html) -> bool:
    msg            = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = from_email
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"[EMAIL] ✅ Sent: '{subject}' → {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[EMAIL] ❌ Auth failed: {e}"); return False
    except smtplib.SMTPServerDisconnected as e:
        print(f"[EMAIL] ❌ Disconnected: {e}"); return False
    except smtplib.SMTPConnectError as e:
        print(f"[EMAIL] ❌ Connect failed: {e}"); return False
    except Exception as e:
        print(f"[EMAIL] ❌ {type(e).__name__}: {e}"); return False


def _serialize_schedule(s: dict) -> dict:
    doc = dict(s)
    doc["_id"] = str(doc.get("_id", ""))
    for f in ("scheduled_at", "created_at", "updated_at"):
        if isinstance(doc.get(f), datetime):
            doc[f] = doc[f].isoformat()
    return doc


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    stage    = request.args.get("stage",    "")
    status   = request.args.get("status",   "")
    job_id   = request.args.get("job_id",   "")
    q        = request.args.get("q",        "").strip()
    page     = int(request.args.get("page",     1))
    per_page = int(request.args.get("per_page", 50))

    query = {}
    if stage:  query["current_stage"]   = stage
    if status: query["pipeline_status"] = status
    if job_id: query["job_id"]          = job_id
    if q:
        query["$or"] = [
            {"candidate_name": {"$regex": q, "$options": "i"}},
            {"job_title":      {"$regex": q, "$options": "i"}},
            {"client_name":    {"$regex": q, "$options": "i"}},
        ]

    total = mongo.db.candidate_tracking.count_documents(query)
    docs  = list(
        mongo.db.candidate_tracking.find(query)
        .sort("stage_date", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return jsonify(
        success=True,
        data=[serialize_tracking(d) for d in docs],
        total=total, page=page, per_page=per_page
    ), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/pipeline
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/pipeline", methods=["GET"])
@jwt_required()
def get_pipeline():
    pipeline = list(mongo.db.candidate_tracking.aggregate([
        {"$match": {"pipeline_status": "Active"}},
        {"$group": {
            "_id":   "$current_stage",
            "count": {"$sum": 1},
            "candidates": {"$push": {
                "name":     "$candidate_name",
                "jobTitle": "$job_title",
                "client":   "$client_name",
            }},
        }},
        {"$sort": {"_id": 1}},
    ]))
    return jsonify(success=True, data=pipeline), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/by-resume/<resume_id>
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/by-resume/<resume_id>", methods=["GET"])
@jwt_required()
def get_by_resume(resume_id):
    docs = list(
        mongo.db.candidate_tracking
        .find({
            "resume_id": {
                "$regex":   f"^\\s*{resume_id.strip()}\\s*$",
                "$options": "i"
            }
        })
        .sort("created_at", -1)
    )
    return jsonify(success=True, data=[serialize_tracking(d) for d in docs]), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/calendar
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/calendar", methods=["GET"])
@jwt_required()
def get_calendar():
    year  = int(request.args.get("year",  datetime.utcnow().year))
    month = int(request.args.get("month", datetime.utcnow().month))
    start = datetime(year, month, 1)
    end   = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

    docs   = list(mongo.db.candidate_tracking.find(
        {"scheduled_interviews": {"$exists": True, "$ne": []}}
    ))
    events = []
    for doc in docs:
        for sched in (doc.get("scheduled_interviews") or []):
            sat = sched.get("scheduled_at")
            if isinstance(sat, str):
                try:    sat = datetime.fromisoformat(sat)
                except: continue
            if sat and start <= sat < end:
                events.append({
                    "tracking_id":        str(doc["_id"]),
                    "schedule_id":        sched.get("schedule_id", ""),
                    "candidate_name":     doc.get("candidate_name", ""),
                    "job_title":          doc.get("job_title", ""),
                    "client_name":        doc.get("client_name", ""),
                    "current_stage":      doc.get("current_stage", ""),
                    "resume_id":          doc.get("resume_id", ""),
                    "interviewer_name":   sched.get("interviewer_name", ""),
                    "interviewer_email":  sched.get("interviewer_email", ""),
                    "candidate_email":    sched.get("candidate_email", ""),
                    "interview_type":     sched.get("interview_type", "Video"),
                    "scheduled_at":       sat.isoformat(),
                    "duration_minutes":   sched.get("duration_minutes", 60),
                    "meeting_link":       sched.get("meeting_link", ""),
                    "calendar_link":      sched.get("calendar_link", ""),
                    "google_event_id":    sched.get("google_event_id", ""),
                    "stage":              sched.get("stage", ""),
                    "status":             sched.get("status", "Scheduled"),
                    "candidate_rsvp":     sched.get("candidate_rsvp", "Pending"),
                    "feedback_submitted": sched.get("feedback_submitted", False),
                    "notes":              sched.get("notes", ""),
                })
    events.sort(key=lambda e: e["scheduled_at"])
    return jsonify(success=True, data=events), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/upcoming
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/upcoming", methods=["GET"])
@jwt_required()
def get_upcoming():
    now  = datetime.utcnow()
    end  = now + timedelta(days=7)
    docs = list(mongo.db.candidate_tracking.find(
        {"scheduled_interviews": {"$exists": True, "$ne": []}}
    ))
    events = []
    for doc in docs:
        for sched in (doc.get("scheduled_interviews") or []):
            sat = sched.get("scheduled_at")
            if isinstance(sat, str):
                try:    sat = datetime.fromisoformat(sat)
                except: continue
            if sat and now <= sat <= end:
                events.append({
                    "tracking_id":        str(doc["_id"]),
                    "schedule_id":        sched.get("schedule_id", ""),
                    "candidate_name":     doc.get("candidate_name", ""),
                    "job_title":          doc.get("job_title", ""),
                    "client_name":        doc.get("client_name", ""),
                    "current_stage":      doc.get("current_stage", ""),
                    "interviewer_name":   sched.get("interviewer_name", ""),
                    "interview_type":     sched.get("interview_type", "Video"),
                    "scheduled_at":       sat.isoformat(),
                    "duration_minutes":   sched.get("duration_minutes", 60),
                    "meeting_link":       sched.get("meeting_link", ""),
                    "calendar_link":      sched.get("calendar_link", ""),
                    "stage":              sched.get("stage", ""),
                    "status":             sched.get("status", "Scheduled"),
                    "candidate_rsvp":     sched.get("candidate_rsvp", "Pending"),
                    "feedback_submitted": sched.get("feedback_submitted", False),
                })
    events.sort(key=lambda e: e["scheduled_at"])
    return jsonify(success=True, data=events), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/:id
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>", methods=["GET"])
@jwt_required()
def get_one(tid):
    doc, err = _find(tid)
    if err: return err
    return jsonify(success=True, data=serialize_tracking(doc)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /api/tracking/
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json(silent=True) or {}
    for f in ["resume_id", "candidate_name", "job_id"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    job_id = data.get("job_id", "")
    if is_object_id(job_id):
        try:
            job_doc = mongo.db.jobs.find_one({"_id": ObjectId(job_id)})
            if job_doc:
                job_id = job_doc.get("job_id", job_id)
        except Exception:
            pass

    resume_id  = data["resume_id"].strip()
    new_stage  = data.get("current_stage",   "Screening")
    new_status = data.get("pipeline_status", "Active")

    existing = mongo.db.candidate_tracking.find_one({
        "resume_id": {"$regex": f"^\\s*{resume_id}\\s*$", "$options": "i"},
        "job_id":    job_id,
    })

    if existing:
        upd = {
            "pipeline_status": new_status,
            "recruiter":       data.get("recruiter", existing.get("recruiter", "")),
            "next_step":       data.get("next_step",  ""),
            "notes":           data.get("notes",      ""),
            "updated_at":      datetime.utcnow(),
        }
        if new_stage != existing.get("current_stage"):
            upd["current_stage"] = new_stage
            upd["stage_date"]    = datetime.utcnow()
            upd["days_in_stage"] = 0
            mongo.db.candidate_tracking.update_one(
                {"_id": existing["_id"]},
                {"$set": upd, "$push": {"stage_history": {
                    "stage": new_stage, "entered_at": datetime.utcnow(),
                    "exited_at": None, "notes": data.get("notes", ""),
                }}}
            )
        else:
            mongo.db.candidate_tracking.update_one({"_id": existing["_id"]}, {"$set": upd})
        updated = mongo.db.candidate_tracking.find_one({"_id": existing["_id"]})
        return jsonify(success=True, message="Tracking record updated",
                       data=serialize_tracking(updated), was_updated=True), 200

    try:
        doc = tracking_schema(
            resume_id=resume_id, candidate_name=data["candidate_name"],
            job_id=job_id, client_name=data.get("client_name", ""),
            job_title=data.get("job_title", ""), current_stage=new_stage,
            pipeline_status=new_status, recruiter=data.get("recruiter", ""),
            next_step=data.get("next_step", ""), notes=data.get("notes", ""),
        )
        result     = mongo.db.candidate_tracking.insert_one(doc)
        doc["_id"] = result.inserted_id
        return jsonify(success=True, message="Tracking record created",
                       data=serialize_tracking(doc), was_updated=False), 201
    except ValueError as e:
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        return jsonify(success=False, message="Failed to create", error=str(e)), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  PUT /api/tracking/:id
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>", methods=["PUT"])
@jwt_required()
def update(tid):
    doc, err = _find(tid)
    if err: return err
    data    = request.get_json(silent=True) or {}
    allowed = ["current_stage", "pipeline_status", "recruiter", "next_step",
               "next_date", "salary_offered", "offer_status", "offer_date",
               "joining_date", "notes", "rejection_reason"]
    upd = {k: data[k] for k in allowed if k in data}
    if "current_stage" in upd and upd["current_stage"] != doc.get("current_stage"):
        if upd["current_stage"] not in STAGES:
            return jsonify(success=False, message="Invalid stage"), 400
        upd["stage_date"]    = datetime.utcnow()
        upd["days_in_stage"] = 0
        mongo.db.candidate_tracking.update_one(
            {"_id": doc["_id"]},
            {"$push": {"stage_history": {
                "stage": upd["current_stage"], "entered_at": datetime.utcnow(),
                "exited_at": None, "outcome": data.get("stage_notes", ""),
                "notes": data.get("stage_notes", ""),
            }}}
        )
    upd["updated_at"] = datetime.utcnow()
    mongo.db.candidate_tracking.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Updated", data=serialize_tracking(updated)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /api/tracking/:id/schedule
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>/schedule", methods=["POST"])
@jwt_required()
def schedule_interview(tid):
    doc, err = _find(tid)
    if err: return err

    data = request.get_json(silent=True) or {}
    for f in ["interviewer_name", "interview_date", "interview_time"]:
        if not data.get(f):
            return jsonify(success=False, message=f"'{f}' is required"), 400

    interviewer_name  = data.get("interviewer_name",  "").strip()
    interviewer_email = data.get("interviewer_email", "").strip()
    candidate_email   = data.get("candidate_email",   "").strip()
    interview_date    = data.get("interview_date",    "")
    interview_time    = data.get("interview_time",    "")
    duration_minutes  = int(data.get("duration_minutes", 60))
    interview_type    = data.get("interview_type",    "Video")
    stage             = data.get("stage", doc.get("current_stage", "Screening"))
    notes             = data.get("notes", "")
    timezone          = data.get("timezone", "Asia/Kolkata")

    try:
        scheduled_at = datetime.strptime(f"{interview_date} {interview_time}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify(success=False,
                       message="Invalid date/time. Use YYYY-MM-DD and HH:MM"), 400

    # ── Google Meet ───────────────────────────────────────────────────────────
    meeting_link = google_event_id = calendar_link = ""
    if interview_type in ("Video", "Online"):
        attendees   = [e for e in [interviewer_email, candidate_email] if e and "@" in e]
        meet_result = _create_google_meet(
            summary      = f"{stage} Interview — {doc.get('candidate_name')} for {doc.get('job_title')}",
            description  = (
                f"Candidate   : {doc.get('candidate_name')}\n"
                f"Position    : {doc.get('job_title')} at {doc.get('client_name')}\n"
                f"Stage       : {stage}\n"
                f"Interviewer : {interviewer_name}\n"
                f"Duration    : {duration_minutes} minutes"
            ),
            start_dt         = scheduled_at,
            duration_minutes = duration_minutes,
            attendee_emails  = attendees,
            timezone         = timezone,
        )
        meeting_link    = meet_result["meet_link"]
        google_event_id = meet_result["event_id"]
        calendar_link   = meet_result["calendar_link"]

    schedule_id    = str(uuid.uuid4())[:8].upper()
    schedule_entry = {
        "schedule_id":        schedule_id,
        "interviewer_name":   interviewer_name,
        "interviewer_email":  interviewer_email,
        "candidate_email":    candidate_email,
        "scheduled_at":       scheduled_at,
        "duration_minutes":   duration_minutes,
        "interview_type":     interview_type,
        "stage":              stage,
        "meeting_link":       meeting_link,
        "google_event_id":    google_event_id,
        "calendar_link":      calendar_link,
        "timezone":           timezone,
        "notes":              notes,
        "status":             "Scheduled",
        "candidate_rsvp":     "Pending",   # Pending | Accepted | Declined
        "feedback_submitted": False,
        "created_at":         datetime.utcnow(),
    }

    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {"$push": {"scheduled_interviews": schedule_entry},
         "$set":  {"updated_at": datetime.utcnow()}}
    )

    fmt_date   = scheduled_at.strftime("%A, %d %B %Y")
    fmt_time   = scheduled_at.strftime("%I:%M %p") + f" ({timezone})"
    tracking_id_str = str(doc["_id"])

    # ── Email candidate (join link + RSVP buttons) ────────────────────────────
    candidate_email_sent = False
    if candidate_email:
        candidate_email_sent = _send_candidate_email(
            to_email         = candidate_email,
            candidate_name   = doc.get("candidate_name", "Candidate"),
            interviewer_name = interviewer_name,
            job_title        = doc.get("job_title", ""),
            client_name      = doc.get("client_name", ""),
            interview_date   = fmt_date,
            interview_time   = fmt_time,
            duration_minutes = duration_minutes,
            interview_type   = interview_type,
            meeting_link     = meeting_link,
            calendar_link    = calendar_link,
            stage            = stage,
            notes            = notes,
            tracking_id      = tracking_id_str,
            schedule_id      = schedule_id,
        )

    # ── Email interviewer (join link + feedback link) ─────────────────────────
    interviewer_email_sent = False
    if interviewer_email:
        interviewer_email_sent = _send_interviewer_email(
            to_email         = interviewer_email,
            interviewer_name = interviewer_name,
            candidate_name   = doc.get("candidate_name", ""),
            job_title        = doc.get("job_title", ""),
            client_name      = doc.get("client_name", ""),
            interview_date   = fmt_date,
            interview_time   = fmt_time,
            duration_minutes = duration_minutes,
            interview_type   = interview_type,
            meeting_link     = meeting_link,
            calendar_link    = calendar_link,
            stage            = stage,
            notes            = notes,
            tracking_id      = tracking_id_str,
            schedule_id      = schedule_id,
        )

    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(
        success                = True,
        message                = "Interview scheduled successfully",
        schedule_id            = schedule_id,
        meeting_link           = meeting_link,
        calendar_link          = calendar_link,
        candidate_email_sent   = candidate_email_sent,
        interviewer_email_sent = interviewer_email_sent,
        data                   = serialize_tracking(updated),
    ), 201


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/:id/schedule/:schedule_id/respond
#  Candidate clicks Accept or Decline from email link — no login needed
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>/schedule/<schedule_id>/respond/<response>", methods=["GET"])
def candidate_rsvp(tid, schedule_id, response):
    """
    Called when candidate clicks Accept or Decline in their email.
    response: "accept" | "decline"
    Returns a simple HTML page — no JWT needed.
    """
    if response not in ("accept", "decline"):
        return "<h2>Invalid response</h2>", 400

    doc, err = _find(tid)
    if err:
        return "<h2>Interview not found</h2>", 404

    schedules = doc.get("scheduled_interviews", [])
    idx       = next(
        (i for i, s in enumerate(schedules) if s.get("schedule_id") == schedule_id), None
    )
    if idx is None:
        return "<h2>Schedule not found</h2>", 404

    rsvp_status = "Accepted" if response == "accept" else "Declined"
    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            f"scheduled_interviews.{idx}.candidate_rsvp": rsvp_status,
            "updated_at": datetime.utcnow(),
        }}
    )

    sched         = schedules[idx]
    candidate_name = doc.get("candidate_name", "")
    stage          = sched.get("stage", "")
    scheduled_at   = sched.get("scheduled_at")
    fmt_dt         = scheduled_at.strftime("%A, %d %B %Y at %I:%M %p") if isinstance(scheduled_at, datetime) else str(scheduled_at)

    if response == "accept":
        html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Interview Confirmed</title></head>
        <body style="margin:0;padding:40px 20px;background:#f0f2f5;font-family:Arial,sans-serif;text-align:center">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;
                      padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
            <div style="font-size:64px;margin-bottom:16px">✅</div>
            <h2 style="color:#2e7d32;margin:0 0 10px">Interview Confirmed!</h2>
            <p style="color:#555;font-size:15px;line-height:1.6">
              Thank you, <strong>{candidate_name}</strong>!<br>
              You have confirmed your attendance for the <strong>{stage}</strong> interview
              scheduled on <strong>{fmt_dt}</strong>.
            </p>
            <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin-top:20px">
              <p style="margin:0;color:#1b5e20;font-size:13px">
                ⏰ Please be ready <strong>5 minutes before</strong> the scheduled time.<br>
                The recruiter has been notified of your confirmation.
              </p>
            </div>
          </div>
        </body></html>"""
    else:
        html = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Interview Declined</title></head>
        <body style="margin:0;padding:40px 20px;background:#f0f2f5;font-family:Arial,sans-serif;text-align:center">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;
                      padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.1)">
            <div style="font-size:64px;margin-bottom:16px">❌</div>
            <h2 style="color:#c62828;margin:0 0 10px">Interview Declined</h2>
            <p style="color:#555;font-size:15px;line-height:1.6">
              We've noted that <strong>{candidate_name}</strong> cannot attend the
              <strong>{stage}</strong> interview scheduled on <strong>{fmt_dt}</strong>.
            </p>
            <div style="background:#ffebee;border-radius:8px;padding:16px;margin-top:20px">
              <p style="margin:0;color:#b71c1c;font-size:13px">
                The recruiter has been notified and will be in touch to reschedule.
              </p>
            </div>
          </div>
        </body></html>"""

    return html, 200


# ═══════════════════════════════════════════════════════════════════════════════
#  PUT /api/tracking/:id/schedule/:schedule_id
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>/schedule/<schedule_id>", methods=["PUT"])
@jwt_required()
def update_schedule(tid, schedule_id):
    doc, err = _find(tid)
    if err: return err
    data      = request.get_json(silent=True) or {}
    schedules = doc.get("scheduled_interviews", [])
    idx       = next(
        (i for i, s in enumerate(schedules) if s.get("schedule_id") == schedule_id), None
    )
    if idx is None:
        return jsonify(success=False, message="Schedule not found"), 404

    upd = {}
    if data.get("status"):
        upd[f"scheduled_interviews.{idx}.status"] = data["status"]
    if data.get("notes"):
        upd[f"scheduled_interviews.{idx}.notes"]  = data["notes"]
    if data.get("interview_date") and data.get("interview_time"):
        try:
            new_dt = datetime.strptime(
                f"{data['interview_date']} {data['interview_time']}", "%Y-%m-%d %H:%M"
            )
            upd[f"scheduled_interviews.{idx}.scheduled_at"] = new_dt
            upd[f"scheduled_interviews.{idx}.status"]       = "Rescheduled"
        except ValueError:
            return jsonify(success=False, message="Invalid date/time format"), 400
    upd["updated_at"] = datetime.utcnow()
    mongo.db.candidate_tracking.update_one({"_id": doc["_id"]}, {"$set": upd})
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Schedule updated", data=serialize_tracking(updated)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /api/tracking/:id/schedule/:schedule_id/feedback
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>/schedule/<schedule_id>/feedback", methods=["POST"])
@jwt_required()
def submit_schedule_feedback(tid, schedule_id):
    doc, err = _find(tid)
    if err: return err
    data = request.get_json(silent=True) or {}
    if not data.get("feedback_summary"):
        return jsonify(success=False, message="'feedback_summary' is required"), 400

    schedules = doc.get("scheduled_interviews", [])
    idx       = next(
        (i for i, s in enumerate(schedules) if s.get("schedule_id") == schedule_id), None
    )
    if idx is None:
        return jsonify(success=False, message="Schedule not found"), 404

    schedule        = schedules[idx]
    interview_entry = {
        "stage":            schedule.get("stage", doc.get("current_stage", "")),
        "interviewer":      schedule.get("interviewer_name", ""),
        "interview_date":   schedule.get("scheduled_at", datetime.utcnow()),
        "interview_type":   data.get("interview_type", schedule.get("interview_type", "Video")),
        "feedback_score":   int(data.get("feedback_score", 3)),
        "feedback_summary": data.get("feedback_summary", ""),
        "strengths": (
            data.get("strengths", []) if isinstance(data.get("strengths"), list)
            else [s.strip() for s in data.get("strengths", "").split(",") if s.strip()]
        ),
        "weaknesses": (
            data.get("weaknesses", []) if isinstance(data.get("weaknesses"), list)
            else [w.strip() for w in data.get("weaknesses", "").split(",") if w.strip()]
        ),
        "recommendation": data.get("recommendation", "Maybe"),
        "schedule_id":    schedule_id,
    }

    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {
            "$push": {"interviews": interview_entry},
            "$set": {
                f"scheduled_interviews.{idx}.status":             "Completed",
                f"scheduled_interviews.{idx}.feedback_submitted": True,
                "updated_at":                                     datetime.utcnow(),
            }
        }
    )
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Feedback submitted", data=serialize_tracking(updated)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /api/tracking/:id/interview
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>/interview", methods=["POST"])
@jwt_required()
def add_interview(tid):
    doc, err = _find(tid)
    if err: return err
    data = request.get_json(silent=True) or {}
    if not data.get("interviewer"):
        return jsonify(success=False, message="'interviewer' is required"), 400
    interview = {
        "stage":            doc.get("current_stage", ""),
        "interviewer":      data.get("interviewer",       ""),
        "interview_date":   datetime.utcnow(),
        "interview_type":   data.get("interview_type",   "Video"),
        "feedback_score":   int(data.get("feedback_score", 3)),
        "feedback_summary": data.get("feedback_summary", ""),
        "strengths":        data.get("strengths",  []),
        "weaknesses":       data.get("weaknesses", []),
        "recommendation":   data.get("recommendation", "Maybe"),
    }
    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {"$push": {"interviews": interview}, "$set": {"updated_at": datetime.utcnow()}}
    )
    updated = mongo.db.candidate_tracking.find_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Interview feedback added", data=serialize_tracking(updated)), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  DELETE /api/tracking/:id
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/<tid>", methods=["DELETE"])
@jwt_required()
def delete(tid):
    doc, err = _find(tid)
    if err: return err
    mongo.db.candidate_tracking.delete_one({"_id": doc["_id"]})
    return jsonify(success=True, message="Deleted"), 200


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/meta/options
# ═══════════════════════════════════════════════════════════════════════════════

@tracking_bp.route("/meta/options", methods=["GET"])
@jwt_required()
def options():
    return jsonify(success=True, stages=STAGES, pipeline_statuses=PIPELINE_STATUSES), 200




# ═══════════════════════════════════════════════════════════════════════════════
#  GET /api/tracking/:id/schedule/:schedule_id/feedback-form  (public — no JWT)
#  Serves the feedback form data so frontend can render it
# ═══════════════════════════════════════════════════════════════════════════════



@tracking_bp.route("/<tid>/schedule/<schedule_id>/feedback-form", methods=["GET"])
def get_feedback_form(tid, schedule_id):
    """Public endpoint — no JWT. Returns interview details for feedback form."""
    doc, err = _find(tid)
    if err:
        return jsonify(success=False, message="Interview not found"), 404

    schedules = doc.get("scheduled_interviews", [])
    sched     = next(
        (s for s in schedules if s.get("schedule_id") == schedule_id), None
    )
    if not sched:
        return jsonify(success=False, message="Schedule not found"), 404

    if sched.get("feedback_submitted"):
        return jsonify(
            success=False,
            message="Feedback already submitted",
            already_submitted=True
        ), 200

    sat = sched.get("scheduled_at")
    return jsonify(success=True, data={
        "tracking_id":        tid,
        "schedule_id":        schedule_id,
        "candidate_name":     doc.get("candidate_name", ""),
        "job_title":          doc.get("job_title", ""),
        "client_name":        doc.get("client_name", ""),
        "stage":              sched.get("stage", doc.get("current_stage", "")),
        "interviewer_name":   sched.get("interviewer_name", ""),
        "interview_type":     sched.get("interview_type", "Video"),
        "scheduled_at":       sat.isoformat() if isinstance(sat, datetime) else str(sat or ""),
        "meeting_link":       sched.get("meeting_link", ""),
        "feedback_submitted": sched.get("feedback_submitted", False),
    }), 200


@tracking_bp.route("/<tid>/schedule/<schedule_id>/feedback-form", methods=["POST"])
def submit_feedback_form(tid, schedule_id):
    """Public endpoint — no JWT. Submits feedback and updates tracking."""
    doc, err = _find(tid)
    if err:
        return jsonify(success=False, message="Interview not found"), 404

    data = request.get_json(silent=True) or {}
    if not data.get("feedback_summary"):
        return jsonify(success=False, message="Feedback summary is required"), 400

    schedules = doc.get("scheduled_interviews", [])
    idx       = next(
        (i for i, s in enumerate(schedules) if s.get("schedule_id") == schedule_id), None
    )
    if idx is None:
        return jsonify(success=False, message="Schedule not found"), 404

    if schedules[idx].get("feedback_submitted"):
        return jsonify(success=False, message="Feedback already submitted"), 409

    schedule        = schedules[idx]
    interview_entry = {
        "stage":            schedule.get("stage", doc.get("current_stage", "")),
        "interviewer":      schedule.get("interviewer_name", ""),
        "interview_date":   schedule.get("scheduled_at", datetime.utcnow()),
        "interview_type":   data.get("interview_type", schedule.get("interview_type", "Video")),
        "feedback_score":   int(data.get("feedback_score", 3)),
        "feedback_summary": data.get("feedback_summary", ""),
        "strengths": (
            data.get("strengths", []) if isinstance(data.get("strengths"), list)
            else [s.strip() for s in data.get("strengths", "").split(",") if s.strip()]
        ),
        "weaknesses": (
            data.get("weaknesses", []) if isinstance(data.get("weaknesses"), list)
            else [w.strip() for w in data.get("weaknesses", "").split(",") if w.strip()]
        ),
        "recommendation": data.get("recommendation", "Maybe"),
        "schedule_id":    schedule_id,
    }

    # Save feedback + mark schedule completed
    mongo.db.candidate_tracking.update_one(
        {"_id": doc["_id"]},
        {
            "$push": {"interviews": interview_entry},
            "$set": {
                f"scheduled_interviews.{idx}.status":             "Completed",
                f"scheduled_interviews.{idx}.feedback_submitted": True,
                "updated_at":                                     datetime.utcnow(),
            }
        }
    )

    # Auto-advance stage on Strong Hire or Hire
    recommendation = data.get("recommendation", "Maybe")
    auto_advanced  = False
    stage_map = {
        "Screening":         "Technical Round 1",
        "Technical Round 1": "Technical Round 2",
        "Technical Round 2": "HR Round",
        "HR Round":          "Manager Round",
        "Manager Round":     "Final Round",
        "Final Round":       "Offer Stage",
    }
    current_stage = doc.get("current_stage", "")

    if recommendation in ("Strong Hire", "Hire") and current_stage in stage_map:
        next_stage = stage_map[current_stage]
        mongo.db.candidate_tracking.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "current_stage": next_stage,
                    "stage_date":    datetime.utcnow(),
                    "days_in_stage": 0,
                    "updated_at":    datetime.utcnow(),
                },
                "$push": {"stage_history": {
                    "stage":      next_stage,
                    "entered_at": datetime.utcnow(),
                    "exited_at":  None,
                    "notes": (
                        f"Auto-advanced after {recommendation} from "
                        f"{schedule.get('interviewer_name', 'interviewer')}"
                    ),
                }}
            }
        )
        auto_advanced = True
        print(f"[TRACKING] ✅ Auto-advanced {doc.get('candidate_name')} → {next_stage}")

    return jsonify(
        success       = True,
        message       = "Feedback submitted successfully",
        auto_advanced = auto_advanced,
    ), 200