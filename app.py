from flask import Flask, render_template, request, jsonify, send_file
import os
import json
import subprocess
import threading
import time
from werkzeug.utils import secure_filename
import csv
import pandas as pd

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables for progress tracking
email_progress = {
    'status': 'idle',
    'current': 0,
    'total': 0,
    'sent': 0,
    'failed': 0,
    'logs': [],
    'cancelled': False
}

# Global variable to track the email sending process
email_process = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({'success': True, 'filename': filename, 'path': file_path})

@app.route('/send_emails', methods=['POST'])
def send_emails():
    global email_progress
    
    data = request.json
    
    # Reset progress
    email_progress = {
        'status': 'running',
        'current': 0,
        'total': 0,
        'sent': 0,
        'failed': 0,
        'logs': []
    }
    
    # Start email sending in background thread
    thread = threading.Thread(target=run_email_script, args=(data,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'message': 'Email sending started'})

@app.route('/cancel_emails', methods=['POST'])
def cancel_emails():
    global email_progress, email_process

    if email_progress['status'] == 'running':
        email_progress['cancelled'] = True
        email_progress['status'] = 'cancelled'
        email_progress['logs'].append('Email sending cancelled by user')

        # Try to terminate the process if it exists
        if email_process and email_process.poll() is None:
            email_process.terminate()

        return jsonify({'success': True, 'message': 'Email sending cancelled'})
    else:
        return jsonify({'error': 'No email sending process is currently running'}), 400

@app.route('/send_test_email', methods=['POST'])
def send_test_email():
    global email_progress

    data = request.json
    test_email = data.get('test_email', 'praveendommeti333@gmail.com')

    # Reset progress for test
    email_progress = {
        'status': 'running',
        'current': 0,
        'total': 1,
        'sent': 0,
        'failed': 0,
        'logs': [f'Sending test email to {test_email}...'],
        'cancelled': False
    }

    # Start test email in background thread
    thread = threading.Thread(target=run_test_email, args=(test_email,))
    thread.daemon = True
    thread.start()

    return jsonify({'success': True, 'message': 'Test email sending started'})

@app.route('/verify_emails', methods=['POST'])
def verify_emails():
    data = request.json
    csv_file = data.get('csv_file')

    if not csv_file:
        return jsonify({'error': 'No CSV file provided'}), 400

    # Run verification script
    thread = threading.Thread(target=run_verification_script, args=(csv_file,))
    thread.daemon = True
    thread.start()

    return jsonify({'success': True, 'message': 'Email verification started'})

@app.route('/progress')
def get_progress():
    return jsonify(email_progress)

@app.route('/download_results')
def download_results():
    if os.path.exists('email_verification_results.csv'):
        return send_file('email_verification_results.csv', as_attachment=True)
    return jsonify({'error': 'No results file found'}), 404

def run_test_email(test_email):
    global email_progress

    try:
        # Import mail functions
        import sys
        sys.path.append('.')
        from mail import send_email, get_email_body, YOUR_EMAIL, SUBJECT, RESUME_PATH

        email_progress['logs'].append(f'Attempting to send test email to {test_email}...')

        # Send test email
        success = send_email(test_email, SUBJECT, get_email_body(), RESUME_PATH)

        if success:
            email_progress['sent'] = 1
            email_progress['current'] = 1
            email_progress['logs'].append(f'✅ Test email sent successfully to {test_email}')
            email_progress['status'] = 'completed'
        else:
            email_progress['failed'] = 1
            email_progress['current'] = 1
            email_progress['logs'].append(f'❌ Failed to send test email to {test_email}')
            email_progress['status'] = 'error'

    except Exception as e:
        email_progress['status'] = 'error'
        email_progress['failed'] = 1
        email_progress['current'] = 1
        email_progress['logs'].append(f'Error sending test email: {str(e)}')

def run_email_script(config):
    global email_progress, email_process

    try:
        # Update mail.py configuration
        update_mail_config(config)

        # Count total emails
        csv_file = config.get('csv_file')
        if csv_file and os.path.exists(csv_file):
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # Skip header
                total_emails = min(len(list(reader)), int(config.get('max_emails', 30)))
        else:
            email_progress['status'] = 'error'
            email_progress['logs'].append('CSV file not found!')
            return

        email_progress['total'] = total_emails
        email_progress['logs'].append(f'Found {total_emails} emails to process')

        # Run the mail script
        python_exe = '"C:\\Program Files\\Python\\Python312\\python.exe"'
        email_process = subprocess.Popen([python_exe, 'mail.py'],
                                       stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE,
                                       text=True,
                                       cwd=os.getcwd())

        # Monitor output
        while True:
            if email_progress.get('cancelled'):
                email_process.terminate()
                break

            output = email_process.stdout.readline()
            if output == '' and email_process.poll() is not None:
                break

            if output:
                line = output.strip()
                email_progress['logs'].append(line)

                if '✅' in line and 'Email sent to' in line:
                    email_progress['sent'] += 1
                    email_progress['current'] += 1
                elif '❌' in line and 'Failed to send to' in line:
                    email_progress['failed'] += 1
                    email_progress['current'] += 1

        if not email_progress.get('cancelled'):
            email_progress['status'] = 'completed'
            email_progress['logs'].append(f'📊 Summary: {email_progress["sent"]} sent, {email_progress["failed"]} failed')

    except Exception as e:
        email_progress['status'] = 'error'
        email_progress['logs'].append(f'Error: {str(e)}')

def run_verification_script(csv_file):
    try:
        # Update verify.py to use the uploaded CSV
        with open('verify.py', 'r') as f:
            content = f.read()
        
        content = content.replace('input_file = "hr_email.csv"', f'input_file = "{csv_file}"')
        
        with open('verify_temp.py', 'w') as f:
            f.write(content)
        
        subprocess.run(['python', 'verify_temp.py'])
        os.remove('verify_temp.py')
        
    except Exception as e:
        print(f"Verification error: {e}")

def update_mail_config(config):
    # Read current mail.py
    with open('mail.py', 'r') as f:
        content = f.read()
    
    # Update configuration values
    content = content.replace(
        'YOUR_EMAIL = "praveendommeti333@gmail.com"',
        f'YOUR_EMAIL = "{config.get("sender_email", "praveendommeti333@gmail.com")}"'
    )
    content = content.replace(
        'APP_PASSWORD = "efxm vcbq bafo lvqd"',
        f'APP_PASSWORD = "{config.get("app_password", "efxm vcbq bafo lvqd")}"'
    )
    content = content.replace(
        'SUBJECT = "Seeking Internship/Job Opportunity & Referral Consideration"',
        f'SUBJECT = "{config.get("subject", "Seeking Internship/Job Opportunity & Referral Consideration")}"'
    )
    content = content.replace(
        'MAX_EMAILS = 30',
        f'MAX_EMAILS = {config.get("max_emails", 30)}'
    )
    
    if config.get('resume_file'):
        content = content.replace(
            'RESUME_PATH = "Dommeti.pdf"',
            f'RESUME_PATH = "{config.get("resume_file")}"'
        )
    
    if config.get('csv_file'):
        # Modify to read from CSV instead of PDF
        csv_reader_code = '''
# Read emails from CSV
def extract_emails_from_csv(csv_path, max_count=200):
    emails = []
    with open(csv_path, 'r') as file:
        reader = csv.reader(file)
        next(reader)  # Skip header
        for row in reader:
            if len(row) >= 3:  # Assuming email is in 3rd column
                emails.append(row[2])
    return emails[:max_count]

import csv
'''
        content = csv_reader_code + content
        content = content.replace(
            'emails = extract_emails_from_pdf(PDF_WITH_EMAILS, MAX_EMAILS * 10)',
            f'emails = extract_emails_from_csv("{config.get("csv_file")}", MAX_EMAILS * 10)'
        )
    
    # Write updated content
    with open('mail.py', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    app.run(debug=True, port=5000)