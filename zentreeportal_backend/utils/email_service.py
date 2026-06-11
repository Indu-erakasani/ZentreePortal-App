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