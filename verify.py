import csv
import smtplib
import dns.resolver
import re
from validate_email_address import validate_email

def is_valid_syntax(email):
    # Basic format check
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def get_mx_record(domain):
    try:
        records = dns.resolver.resolve(domain, 'MX')
        return str(records[0].exchange)
    except:
        return None

def smtp_check(email, mail_server):
    try:
        server = smtplib.SMTP(timeout=10)
        server.connect(mail_server)
        server.helo("example.com")
        server.mail("test@example.com")  # fake sender
        code, message = server.rcpt(email)
        server.quit()
        return code == 250 or code == 251
    except:
        return False

def check_email(email):
    result = {
        "email": email,
        "valid_format": False,
        "domain_exists": False,
        "smtp_deliverable": False
    }

    if not is_valid_syntax(email):
        return result

    result["valid_format"] = True
    domain = email.split("@")[1]
    mx_server = get_mx_record(domain)

    if not mx_server:
        return result

    result["domain_exists"] = True
    result["smtp_deliverable"] = smtp_check(email, mx_server)
    return result

# ----------- MAIN LOGIC -------------

input_file = "hr_email.csv"      # your input file with email addresses
output_file = "email_verification_results.csv"

with open(input_file, 'r') as infile, open(output_file, 'w', newline='') as outfile:
    reader = csv.reader(infile)
    writer = csv.DictWriter(outfile, fieldnames=["email", "valid_format", "domain_exists", "smtp_deliverable"])
    writer.writeheader()

    count = 0
    for row in reader:
        if not row: continue
        email = row[0].strip()
        if email.lower() == "email":  # skip header
            continue

        result = check_email(email)
        writer.writerow(result)
        count += 1

        print(f"{count}. Checked: {email} => Format: {result['valid_format']}, Domain: {result['domain_exists']}, SMTP: {result['smtp_deliverable']}")

print(f"\n✅ Verification complete. Results saved to: {output_file}")
