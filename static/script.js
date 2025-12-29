// Global variables
let progressInterval;
let uploadedFiles = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePreview();
    addAnimations();
    addModernInteractions();
});

function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function(e) {
            openTab(e, this.getAttribute('onclick').match(/'([^']+)'/)[1]);
        });
    });

    // File uploads
    document.getElementById('resume-file').addEventListener('change', handleFileUpload);
    document.getElementById('email-csv').addEventListener('change', handleFileUpload);
    document.getElementById('verify-csv').addEventListener('change', handleFileUpload);

    // Form inputs
    document.getElementById('subject').addEventListener('input', updatePreview);

    // Buttons
    document.getElementById('test-btn').addEventListener('click', sendTestEmail);
    document.getElementById('send-btn').addEventListener('click', startEmailSending);
    document.getElementById('cancel-btn').addEventListener('click', cancelEmailSending);
    document.getElementById('verify-btn').addEventListener('click', startEmailVerification);
    document.getElementById('download-btn').addEventListener('click', downloadResults);
}

function openTab(evt, tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to the clicked button
    evt.currentTarget.classList.add('active');
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const fileType = event.target.id;
    
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show loading state with animation
        const nameSpan = document.getElementById(getFileNameSpanId(fileType));
        nameSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        nameSpan.style.color = '#667eea';

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadedFiles[fileType] = data.path;
                nameSpan.innerHTML = `<i class="fas fa-check-circle"></i> ${data.filename}`;
                nameSpan.style.color = '#10b981';
                showSuccess(`File "${data.filename}" uploaded successfully!`);
            } else {
                nameSpan.innerHTML = '<i class="fas fa-times-circle"></i> Upload failed';
                nameSpan.style.color = '#ef4444';
                showError('File upload failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            nameSpan.innerHTML = '<i class="fas fa-times-circle"></i> Upload failed';
            nameSpan.style.color = '#ef4444';
            showError('Network error during upload. Please check your connection.');
        });
    }
}

function getFileNameSpanId(fileType) {
    const mapping = {
        'resume-file': 'resume-name',
        'email-csv': 'csv-name',
        'verify-csv': 'verify-csv-name'
    };
    return mapping[fileType];
}

function updatePreview() {
    const subject = document.getElementById('subject').value;
    document.getElementById('preview-subject').textContent = subject;
}

function startEmailSending() {
    // Validate form
    if (!validateSendForm()) {
        return;
    }

    const config = {
        sender_email: document.getElementById('sender-email').value,
        app_password: document.getElementById('app-password').value,
        subject: document.getElementById('subject').value,
        max_emails: parseInt(document.getElementById('max-emails').value),
        resume_file: uploadedFiles['resume-file'],
        csv_file: uploadedFiles['email-csv'],
        email_source: 'csv'
    };

    // Show progress section with animation
    const progressSection = document.getElementById('progress-section');
    progressSection.style.display = 'block';
    progressSection.classList.add('fade-in');

    // Update button states
    document.getElementById('send-btn').disabled = true;
    document.getElementById('send-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Emails...';
    document.getElementById('test-btn').disabled = true;
    document.getElementById('cancel-btn').style.display = 'inline-block';

    fetch('/send_emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            startProgressMonitoring();
        } else {
            showError('Failed to start email sending: ' + data.error);
            resetSendButton();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Failed to start email sending');
        resetSendButton();
    });
}

function validateSendForm() {
    const requiredFields = ['sender-email', 'app-password', 'subject', 'max-emails'];
    const requiredFiles = ['resume-file', 'email-csv'];

    for (let field of requiredFields) {
        if (!document.getElementById(field).value.trim()) {
            showError(`Please fill in the ${field.replace('-', ' ')} field`);
            return false;
        }
    }

    for (let file of requiredFiles) {
        if (!uploadedFiles[file]) {
            showError(`Please upload the ${file.replace('-', ' ')} file`);
            return false;
        }
    }

    return true;
}

function startProgressMonitoring() {
    progressInterval = setInterval(updateProgress, 1000);
}

function updateProgress() {
    fetch('/progress')
    .then(response => response.json())
    .then(data => {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const sentCount = document.getElementById('sent-count');
        const failedCount = document.getElementById('failed-count');

        // Update progress bar
        const percentage = data.total > 0 ? (data.current / data.total) * 100 : 0;
        progressFill.style.width = percentage + '%';

        // Update text
        progressText.textContent = `${data.current} / ${data.total} emails processed`;
        sentCount.textContent = data.sent;
        failedCount.textContent = data.failed;

        // Update logs
        updateLogs(data.logs);

        // Check if completed
        if (data.status === 'completed' || data.status === 'error' || data.status === 'cancelled') {
            clearInterval(progressInterval);
            resetSendButton();

            if (data.status === 'completed') {
                showSuccess('Email sending completed!');
            } else if (data.status === 'cancelled') {
                showSuccess('Email sending cancelled successfully!');
            } else {
                showError('Email sending failed. Check logs for details.');
            }
        }
    })
    .catch(error => {
        console.error('Progress update error:', error);
    });
}

function updateLogs(logs) {
    const logsContainer = document.getElementById('email-logs');
    
    if (logs.length === 0) {
        logsContainer.innerHTML = '<p class="no-logs">No logs available yet...</p>';
        return;
    }

    logsContainer.innerHTML = '';
    logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        if (log.includes('Email sent to')) {
            logEntry.classList.add('log-success');
        } else if (log.includes('Failed to send')) {
            logEntry.classList.add('log-error');
        } else {
            logEntry.classList.add('log-info');
        }
        
        logEntry.textContent = log;
        logsContainer.appendChild(logEntry);
    });

    // Scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function resetSendButton() {
    document.getElementById('send-btn').disabled = false;
    document.getElementById('send-btn').innerHTML = '<i class="fas fa-paper-plane"></i> Start Sending Emails';
    document.getElementById('test-btn').disabled = false;
    document.getElementById('cancel-btn').style.display = 'none';
}

function startEmailVerification() {
    if (!uploadedFiles['verify-csv']) {
        showError('Please upload a CSV file for verification');
        return;
    }

    document.getElementById('verification-status').style.display = 'block';
    document.getElementById('verify-btn').disabled = true;

    fetch('/verify_emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            csv_file: uploadedFiles['verify-csv']
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            setTimeout(() => {
                document.getElementById('verification-status').style.display = 'none';
                document.getElementById('verify-btn').disabled = false;
                showSuccess('Email verification completed! Check the download section for results.');
            }, 5000); // Simulate verification time
        } else {
            showError('Verification failed: ' + data.error);
            document.getElementById('verify-btn').disabled = false;
        }
    })
    .catch(error => {
        console.error('Verification error:', error);
        showError('Verification failed');
        document.getElementById('verify-btn').disabled = false;
    });
}

function sendTestEmail() {
    const testEmail = document.getElementById('sender-email').value;

    if (!testEmail) {
        showError('Please enter your email address first');
        return;
    }

    // Show progress section
    const progressSection = document.getElementById('progress-section');
    progressSection.style.display = 'block';
    progressSection.classList.add('fade-in');

    // Update button states
    document.getElementById('test-btn').disabled = true;
    document.getElementById('test-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Test...';
    document.getElementById('send-btn').disabled = true;

    fetch('/send_test_email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            test_email: testEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            startProgressMonitoring();
        } else {
            showError('Failed to start test email: ' + data.error);
            resetSendButton();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Failed to start test email');
        resetSendButton();
    });
}

function cancelEmailSending() {
    if (confirm('Are you sure you want to cancel email sending?')) {
        fetch('/cancel_emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Email sending cancelled');
            } else {
                showError('Failed to cancel: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to cancel email sending');
        });
    }
}

function downloadResults() {
    window.location.href = '/download_results';
}

function showError(message) {
    // Create and show error notification
    const notification = createNotification(message, 'error');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function showSuccess(message) {
    // Create and show success notification
    const notification = createNotification(message, 'success');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ${type === 'error' ?
            'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);' :
            'background: linear-gradient(135deg, #10b981 0%, #059669 100%);'}
    `;

    const icon = type === 'error' ? '❌' : '✅';
    notification.innerHTML = `${icon} ${message}`;

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Animate out before removal
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
    }, 4500);

    return notification;
}

function addAnimations() {
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

function addModernInteractions() {
    // Add hover effects to form inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn, .file-label');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);