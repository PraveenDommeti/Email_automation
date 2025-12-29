
import csv
import smtplib
import ssl
from email.message import EmailMessage
import PyPDF2
import re
import os

# ---------- USER CONFIGURATION ----------
YOUR_EMAIL = "praveendommeti333@gmail.com"
APP_PASSWORD = "efxm vcbq bafo lvqd"  # 16-digit app password
SUBJECT = "Seeking Internship/Job Opportunity & Referral Consideration"
RESUME_PATH = "uploads/Dommeti.pdf"
PDF_WITH_EMAILS = "hr_email.csv"  # CSV file containing emails
MAX_EMAILS = 1
SENT_EMAILS_FILE = "sent_emails.txt"
# ----------------------------------------

# Custom Message
def get_email_body():
    return """Dear Hiring Manager,

I hope you're doing well.

My name is Praveen Dommeti, and I’m currently pursuing a B.Tech in Information Technology. I’m reaching out to explore any internship or entry-level opportunities that align with my skills in full-stack development and data analytics.

I’ve gained hands-on experience as an Associate Trainee at Technosprint Info Solutions, working with HTML, CSS, JS, Python, and MySQL. I also completed a Deloitte Data Analytics Job Simulation through Forage, where I worked on real-world tasks using Excel and Tableau.

While I may not come from a Tier-1 institute, I’m eager to learn, committed to contributing value, and open to any opportunity the team deems a good fit. I’d sincerely appreciate any guidance on relevant openings or a referral if you find my profile suitable.

Please find my resume attached, and I’d be happy to share more details if needed.

Thank you for your time and consideration.

Warm regards,
Praveen Dommeti
"""

# Step 1: Extract emails from CSV
def extract_emails_from_csv(csv_path, max_count=200):
    emails = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                if len(row) >= 3 and row[2].strip():  # Email is in 3rd column
                    email = row[2].strip()
                    if '@' in email and '.' in email:  # Basic email validation
                        emails.append(email)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return []
    return emails[:max_count]

# Step 1: Extract emails from PDF (backup function)
def extract_emails_from_pdf(pdf_path, max_count=200):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text()
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        emails = re.findall(email_pattern, text)
        unique_emails = list(dict.fromkeys(emails))  # remove duplicates
        return unique_emails[:max_count]
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return []

# Step 2: Send email with resume attachment
def send_email(to_email, subject, body, resume_path):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = YOUR_EMAIL
        msg['To'] = to_email
        msg.set_content(body)

        # Attach resume if file exists
        if os.path.exists(resume_path):
            with open(resume_path, 'rb') as f:
                file_data = f.read()
                file_name = os.path.basename(resume_path)
            msg.add_attachment(file_data, maintype='application', subtype='pdf', filename=file_name)
        else:
            print(f"Warning: Resume file not found at {resume_path}")

        # Send using Gmail SMTP
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(YOUR_EMAIL, APP_PASSWORD)
            smtp.send_message(msg)
            return True
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False

# Function to send a single test email
def send_test_email(test_email="praveendommeti333@gmail.com"):
    """Send a test email to verify the setup"""
    print(f"Sending test email to {test_email}...")
    success = send_email(test_email, SUBJECT, get_email_body(), RESUME_PATH)
    if success:
        print("✅ Test email sent successfully!")
        return True
    else:
        print("❌ Failed to send test email")
        return False

# Main
if __name__ == "__main__":
    # Check if this is a test run
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        send_test_email()
        exit()

    # Load already sent emails
    sent_emails = set()
    if os.path.exists(SENT_EMAILS_FILE):
        with open(SENT_EMAILS_FILE, 'r') as f:
            sent_emails = set(line.strip() for line in f if line.strip())

    # Extract emails from CSV
    print(f"Reading emails from {PDF_WITH_EMAILS}...")
    emails = extract_emails_from_csv(PDF_WITH_EMAILS, MAX_EMAILS * 10)

    if not emails:
        print("❌ No emails found in the CSV file!")
        exit(1)

    to_send = [email for email in emails if email not in sent_emails][:MAX_EMAILS]
    print(f"Found {len(emails)} total emails, {len(to_send)} new emails to send...")

    if not to_send:
        print("No new emails to send!")
        exit(0)

    # Send emails
    successful = 0
    failed = 0

    for idx, email in enumerate(to_send, 1):
        print(f"Sending {idx}/{len(to_send)} to {email}...")
        success = send_email(email, SUBJECT, get_email_body(), RESUME_PATH)

        if success:
            print(f"✅ {idx}. Email sent to {email}")
            successful += 1
            # Record sent email
            with open(SENT_EMAILS_FILE, 'a') as f:
                f.write(email + '\n')
        else:
            print(f"❌ {idx}. Failed to send to {email}")
            failed += 1

    print(f"\n📊 Summary: {successful} sent, {failed} failed")
