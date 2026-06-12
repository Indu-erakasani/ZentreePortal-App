import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart






SMTP_HOST = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USERNAME", "")
SMTP_PASS = os.environ.get("SMTP_PASSWORD", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "")   
FROM_NAME = os.environ.get("FROM_NAME", "ZentreeLabs Recruitment")

def _send(to_email: str, subject: str, html: str):
    if not SMTP_USER:
        print(f"[EMAIL SKIP] To: {to_email} | Subject: {subject}")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>" 
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(FROM_EMAIL, to_email, msg.as_string())


def send_candidate_jd_email(to_email, candidate_name, job_title, client_name,
                             job_description, skills_required, upload_url):
    _send(to_email, f"Action Required: Prepare Your Resume for {job_title}", f"""
    <h2>Hi {candidate_name},</h2>
    <p>You have been shortlisted for the following opportunity. Please tailor your resume
    to match the JD below and upload it using the link.</p>
    <hr/>
    <h3>Job: {job_title} @ {client_name}</h3>
    <p><strong>Job Description:</strong><br/>{job_description}</p>
    <p><strong>Required Skills:</strong> {skills_required}</p>
    <hr/>
    <p><a href="{upload_url}" style="background:#0369a1;color:#fff;padding:10px 20px;
    border-radius:6px;text-decoration:none;font-weight:bold;">Upload Your Resume →</a></p>
    <p style="color:#888;font-size:12px;">This link is specific to you. Do not share it.</p>
    """)

    
def send_senior_review_email(to_email,reviewer_name,candidate_name,job_title,job_description,skills_required,review_url):
    _send(
        to_email,
        f"Resume Review Required: {candidate_name} for {job_title}",
        f"""
        <h2>Hi {reviewer_name},</h2>
        <p><strong>{candidate_name}</strong> has uploaded a tailored resume for<strong>{job_title}</strong>.</p
        <hr/>
        <h3>Job Details</h3>
        <p><strong>Job Title:</strong> {job_title}</p>
        <p><strong>Job Description:</strong><br/> {job_description}</p>
        <p> <strong>Required Skills:</strong> {skills_required}</p>
        <hr/>
        <p>Please review the candidate's resume against the job requirements and provide your decision.</p>
        <p>
            <a href="{review_url}"
               style="background:#0369a1;color:#fff;padding:10px 20px;
               border-radius:6px;text-decoration:none;font-weight:bold;">
               Review Resume →
            </a>
        </p>
        """
    )


def send_recruiter_accepted_email(to_email, candidate_name, job_title, reviewer_name, review_url):
    _send(to_email, f"✅ Resume Accepted: {candidate_name} for {job_title}", f"""
    <h2>Resume Accepted!</h2>
    <p><strong>{reviewer_name}</strong> has <strong>accepted</strong> 
    {candidate_name}'s resume for <strong>{job_title}</strong>.</p>
    <p>You can now proceed to add this candidate to the pipeline.</p>
    <p><a href="{review_url}" style="background:#15803d;color:#fff;padding:10px 20px;
    border-radius:6px;text-decoration:none;font-weight:bold;">View Resume →</a></p>
    """)


def send_candidate_rejection_email(to_email, candidate_name, job_title, feedback, upload_url):
    _send(to_email, f"Resume Feedback: {job_title} — Please Re-upload", f"""
    <h2>Hi {candidate_name},</h2>
    <p>Your resume for <strong>{job_title}</strong> was reviewed and needs revision.</p>
    <p><strong>Feedback:</strong></p>
    <blockquote style="border-left:4px solid #ef4444;padding-left:12px;color:#333">
    {feedback}</blockquote>
    <p>Please revise your resume based on the feedback and re-upload:</p>
    <p><a href="{upload_url}" style="background:#0369a1;color:#fff;padding:10px 20px;
    border-radius:6px;text-decoration:none;font-weight:bold;">Re-upload Resume →</a></p>
    """)
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

# ─────────────────────────────────────────────────────────────────────────────
#  NEW FUNCTIONS — Offer letter flow
# ─────────────────────────────────────────────────────────────────────────────
 
# Documents the candidate needs to upload (shown in the email body)
_REQUIRED_DOCS = [
    "Aadhar Card",
    "PAN Card",
    "10th &amp; 12th Marksheets",
    "Graduation Certificate",
    "Previous Experience / Relieving Letter",
    "Last 3 Months Payslips",
    "Passport-size Photograph",
    "Signed Offer Letter",
]
 
 
def send_offer_letter_email(to_email: str, candidate_name: str, job_title: str,
                             company_name: str, portal_link: str,
                             offer_letter_url: str = None):
    """
    Sent by HR when releasing an offer to a selected candidate.
 
    Parameters
    ----------
    to_email         : candidate's email address
    candidate_name   : full name of the candidate
    job_title        : role they were selected for
    company_name     : client / hiring company name
    portal_link      : tokenised URL  →  /offer/<jwt_token>
    offer_letter_url : optional direct link to the offer PDF (can be None)
    """
    offer_btn = (
        f'<a href="{offer_letter_url}" '
        f'style="display:inline-block;margin-right:12px;padding:10px 20px;'
        f'background:#f0f4ff;color:#1a237e;border:1px solid #c5cae9;'
        f'border-radius:6px;font-size:14px;text-decoration:none;font-weight:bold;">'
        f'View Offer Letter</a>'
    ) if offer_letter_url else ""
 
    doc_rows = "".join(
        f'<tr><td style="padding:5px 0;font-size:13px;color:#475569;">'
        f'<span style="display:inline-block;width:7px;height:7px;background:#0369a1;'
        f'border-radius:50%;margin-right:8px;vertical-align:middle;"></span>'
        f'{doc}</td></tr>'
        for doc in _REQUIRED_DOCS
    )
 
    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
 
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    border:1px solid #e2e8f0;max-width:600px;width:100%;">
 
        <!-- ── Header ── -->
        <tr>
          <td style="background:#0369a1;padding:28px 36px;">
            <p style="margin:0;color:rgba(255,255,255,0.75);font-size:12px;
                      text-transform:uppercase;letter-spacing:0.08em;">
              {company_name} &nbsp;·&nbsp; Offer Letter
            </p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;
                       line-height:1.3;">
              Congratulations, {candidate_name}!
            </h1>
          </td>
        </tr>
 
        <!-- ── Body ── -->
        <tr>
          <td style="padding:28px 36px 0;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
              We are delighted to extend an offer for the position of
              <strong style="color:#0f172a;">{job_title}</strong> at
              <strong style="color:#0f172a;">{company_name}</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">
              Please review your offer letter and confirm your acceptance using
              the button below. Once accepted, you will be asked to upload a few
              required documents to complete your onboarding.
            </p>
 
            <!-- CTA buttons -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-right:12px;">{offer_btn}</td>
                <td>
                  <a href="{portal_link}"
                     style="display:inline-block;padding:10px 22px;
                            background:#0369a1;color:#ffffff;border-radius:6px;
                            font-size:14px;text-decoration:none;font-weight:bold;">
                    Accept / Decline Offer &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
 
        <!-- ── Documents checklist ── -->
        <tr>
          <td style="padding:0 36px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8fafc;border-radius:8px;
                          border:1px solid #e2e8f0;padding:20px;">
              <tr>
                <td>
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;
                            color:#0f172a;text-transform:uppercase;
                            letter-spacing:0.06em;">
                    Documents to upload after acceptance
                  </p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    {doc_rows}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
 
        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                     padding:18px 36px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              This link is valid for <strong>7 days</strong>. Do not share it —
              it is unique to you.<br>
              Questions? Reply to this email or contact your HR representative.
            </p>
          </td>
        </tr>
 
      </table>
    </td></tr>
  </table>
 
</body>
</html>
"""
    _send(to_email, f"Your Offer Letter — {job_title} at {company_name}", html)
 
 
def send_offer_accepted_hr_email(to_email: str, hr_name: str, candidate_name: str,
                                  job_title: str, company_name: str,
                                  dashboard_url: str):
    """
    Sent to the HR team when a candidate accepts their offer.
    Notifies HR to proceed with onboarding.
 
    Parameters
    ----------
    to_email      : HR team / recruiter email
    hr_name       : HR person's name (can be "Team" if unknown)
    candidate_name: candidate who accepted
    job_title     : role
    company_name  : client company
    dashboard_url : deep link to HR dashboard onboarding queue
    """
    _send(
        to_email,
        f"✅ Offer Accepted: {candidate_name} for {job_title}",
        f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    border:1px solid #e2e8f0;max-width:600px;width:100%;">
 
        <!-- Header -->
        <tr>
          <td style="background:#15803d;padding:24px 36px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
              ✅ Offer Accepted
            </h1>
          </td>
        </tr>
 
        <!-- Body -->
        <tr>
          <td style="padding:28px 36px;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
              Hi {hr_name},
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
              <strong style="color:#0f172a;">{candidate_name}</strong> has accepted
              the offer for <strong style="color:#0f172a;">{job_title}</strong>
              at <strong style="color:#0f172a;">{company_name}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
              Their documents have been uploaded and their employee record has been
              created. You can now proceed with the onboarding checklist.
            </p>
            <p>
              <a href="{dashboard_url}"
                 style="display:inline-block;padding:10px 22px;
                        background:#0369a1;color:#ffffff;border-radius:6px;
                        font-size:14px;text-decoration:none;font-weight:bold;">
                Open Onboarding Dashboard &rarr;
              </a>
            </p>
          </td>
        </tr>
 
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                     padding:16px 36px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              ZentreeLabs HR Portal &nbsp;·&nbsp; Automated notification
            </p>
          </td>
        </tr>
 
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    )
 
 
def send_offer_declined_hr_email(to_email: str, hr_name: str, candidate_name: str,
                                  job_title: str, company_name: str,
                                  dashboard_url: str):
    """
    Sent to the HR team when a candidate declines their offer.
 
    Parameters
    ----------
    to_email      : HR team / recruiter email
    hr_name       : HR person's name
    candidate_name: candidate who declined
    job_title     : role
    company_name  : client company
    dashboard_url : link back to HR dashboard
    """
    _send(
        to_email,
        f"Offer Declined: {candidate_name} for {job_title}",
        f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    border:1px solid #e2e8f0;max-width:600px;width:100%;">
 
        <!-- Header -->
        <tr>
          <td style="background:#dc2626;padding:24px 36px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
              Offer Declined
            </h1>
          </td>
        </tr>
 
        <!-- Body -->
        <tr>
          <td style="padding:28px 36px;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
              Hi {hr_name},
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
              <strong style="color:#0f172a;">{candidate_name}</strong> has
              <strong style="color:#dc2626;">declined</strong> the offer for
              <strong style="color:#0f172a;">{job_title}</strong>
              at <strong style="color:#0f172a;">{company_name}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
              You may want to revisit the candidate pipeline or reach out to
              understand the reason.
            </p>
            <p>
              <a href="{dashboard_url}"
                 style="display:inline-block;padding:10px 22px;
                        background:#0369a1;color:#ffffff;border-radius:6px;
                        font-size:14px;text-decoration:none;font-weight:bold;">
                Back to Dashboard &rarr;
              </a>
            </p>
          </td>
        </tr>
 
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                     padding:16px 36px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              ZentreeLabs HR Portal &nbsp;·&nbsp; Automated notification
            </p>
          </td>
        </tr>
 
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    )
