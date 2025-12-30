"""
AI Routes - Endpoints for Gemini AI email generation
"""

from flask import Blueprint, request, jsonify, session
from services.gemini_service import get_gemini_service
from services.file_service import FileService

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/generate_email_ai', methods=['POST'])
def generate_email_ai():
    """
    Generate AI-powered email content using Gemini
    
    Request JSON:
        - recipient_name (str, optional): Name of recipient
        - company (str, optional): Company name
        - job_role (str, optional): Specific job role
        - experience_level (str, optional): Experience level
        - resume_file (str, optional): Path to uploaded resume
    
    Returns:
        JSON with subject and body
    """
    try:
        data = request.json
        recipient_name = data.get('recipient_name', 'Hiring Manager')
        company = data.get('company', '')
        job_role = data.get('job_role')
        experience_level = data.get('experience_level')
        resume_file = data.get('resume_file')
        
        # Get Gemini service
        gemini_service = get_gemini_service()
        
        # Extract resume text if provided
        resume_text = None
        if resume_file:
            resume_text = gemini_service.extract_resume_text(resume_file)
            if resume_text:
                print(f"Extracted {len(resume_text)} characters from resume")
        
        # Generate email content
        print(f"Generating email for {recipient_name} at {company}...")
        subject = gemini_service.generate_subject(recipient_name, company, job_role)
        body = gemini_service.generate_email(recipient_name, company, job_role, experience_level, resume_text)
        
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body,
            'metadata': {
                'recipient_name': recipient_name,
                'company': company,
                'job_role': job_role,
                'used_resume': resume_text is not None
            }
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Please configure GEMINI_API_KEY in your .env file'
        }), 400
    except Exception as e:
        print(f"Error in generate_email_ai: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to generate email content'
        }), 500

@ai_bp.route('/analyze_resume', methods=['POST'])
def analyze_resume():
    """
    Analyze resume and return ATS score and feedback
    
    Request JSON:
        - resume_file (str): Path to uploaded resume
        - job_description (str, optional): Target JD
        
    Returns:
        JSON with analysis result
    """
    try:
        data = request.json
        resume_file = data.get('resume_file')
        job_description = data.get('job_description')
        
        if not resume_file:
            return jsonify({'success': False, 'error': 'No resume file provided'}), 400
            
        gemini_service = get_gemini_service()
        resume_text = gemini_service.extract_resume_text(resume_file)
        
        if not resume_text:
             return jsonify({'success': False, 'error': 'Could not read resume text'}), 400
             
        analysis = gemini_service.analyze_resume(resume_text, job_description)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        print(f"Error in analyze_resume: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/generate_batch_emails', methods=['POST'])
def generate_batch_emails():
    """
    Generate AI emails for multiple recipients
    
    Request JSON:
        - recipients (list): List of recipient data
        - resume_file (str, optional): Path to uploaded resume
        - job_role (str, optional): Default job role
    
    Returns:
        JSON with generated emails for each recipient
    """
    try:
        data = request.json
        recipients = data.get('recipients', [])
        resume_file = data.get('resume_file')
        default_job_role = data.get('job_role')
        
        if not recipients:
            return jsonify({
                'success': False,
                'error': 'No recipients provided'
            }), 400
        
        # Get Gemini service
        gemini_service = get_gemini_service()
        
        # Extract resume text once
        resume_text = None
        if resume_file:
            resume_text = gemini_service.extract_resume_text(resume_file)
        
        # Generate emails for each recipient
        generated_emails = []
        for recipient in recipients[:10]:  # Limit to 10 for batch generation
            try:
                name = recipient.get('name', 'Hiring Manager')
                company = recipient.get('company', '')
                job_role = recipient.get('job_role', default_job_role)
                
                subject = gemini_service.generate_subject(name, company, job_role)
                body = gemini_service.generate_email(name, company, job_role, resume_text)
                
                generated_emails.append({
                    'recipient': recipient,
                    'subject': subject,
                    'body': body,
                    'success': True
                })
            except Exception as e:
                generated_emails.append({
                    'recipient': recipient,
                    'error': str(e),
                    'success': False
                })
        
        return jsonify({
            'success': True,
            'emails': generated_emails,
            'count': len(generated_emails)
        })
        
    except Exception as e:
        print(f"Error in generate_batch_emails: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
