"""
Gemini AI Service for Email Generation
Generates personalized email content using Google's Gemini AI
"""

import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

class GeminiEmailGenerator:
    """Service for generating personalized emails using Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini AI with API key"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_email(self, recipient_name='Hiring Manager', company='', job_role=None, resume_text=None):
        """
        Generate personalized email body using Gemini AI
        
        Args:
            recipient_name (str): Name of the recipient
            company (str): Company name
            job_role (str, optional): Specific job role
            resume_text (str, optional): Text extracted from resume for context
            
        Returns:
            str: Generated email body
        """
        
        # Build context from resume if available
        resume_context = ""
        if resume_text:
            resume_context = f"\n\nCandidate Background (from resume):\n{resume_text[:1500]}"
        
        prompt = f"""Generate a professional, personalized cold email for a job application with the following details:

Recipient: {recipient_name}
Company: {company if company else 'the company'}
Job Role: {job_role if job_role else 'any suitable position or internship'}
{resume_context}

Requirements:
1. Professional and respectful tone
2. Concise (150-200 words maximum)
3. Highlight relevant skills and experience naturally
4. Express genuine interest in the company
5. Include a clear call-to-action (request for consideration/referral)
6. Personalized to the recipient and company
7. Warm and approachable, not overly formal
8. Start with a proper greeting
9. End with professional closing

IMPORTANT: Return ONLY the email body text. Do NOT include:
- Subject line
- Email signature with contact details (the signature will be added separately)
- Any meta-commentary or explanations

Just return the email content from greeting to closing."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating email body: {e}")
            # Return a fallback template
            return self._get_fallback_email(recipient_name, company, job_role)
    
    def generate_subject(self, recipient_name='Hiring Manager', company='', job_role=None):
        """
        Generate email subject line using Gemini AI
        
        Args:
            recipient_name (str): Name of the recipient
            company (str): Company name
            job_role (str, optional): Specific job role
            
        Returns:
            str: Generated subject line
        """
        
        prompt = f"""Generate a professional email subject line for a job application to {company if company else 'a company'}.
Job role: {job_role if job_role else 'Internship/Entry-level opportunity'}

Requirements:
- Professional and attention-grabbing
- Specific to the company if company name is provided
- Under 60 characters
- Clear purpose (job application/referral request)
- No quotes, brackets, or special formatting
- Direct and to the point

Return ONLY the subject line text, nothing else."""
        
        try:
            response = self.model.generate_content(prompt)
            subject = response.text.strip().strip('"').strip("'")
            # Ensure it's not too long
            if len(subject) > 70:
                subject = subject[:67] + "..."
            return subject
        except Exception as e:
            print(f"Error generating subject: {e}")
            # Return a fallback subject
            return self._get_fallback_subject(company, job_role)
    
    def extract_resume_text(self, pdf_path):
        """
        Extract text from resume PDF
        
        Args:
            pdf_path (str): Path to PDF file
            
        Returns:
            str: Extracted text or None if error
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ''
                for page in reader.pages:
                    text += page.extract_text() + '\n'
                return text.strip()
        except Exception as e:
            print(f"Error extracting resume text: {e}")
            return None
    
    def _get_fallback_email(self, recipient_name, company, job_role):
        """Fallback email template if AI generation fails"""
        return f"""Dear {recipient_name},

I hope this message finds you well.

I am reaching out to express my interest in {job_role if job_role else 'opportunities'} at {company if company else 'your organization'}. I am currently pursuing my B.Tech in Information Technology and have developed strong skills in full-stack development and data analytics.

I have hands-on experience working with modern technologies and am eager to contribute to your team. I believe my technical skills and enthusiasm for learning would make me a valuable addition to {company if company else 'your organization'}.

I would greatly appreciate the opportunity to discuss how I can contribute to your team, or if you could provide any guidance on relevant openings.

Thank you for your time and consideration.

Warm regards"""
    
    def _get_fallback_subject(self, company, job_role):
        """Fallback subject line if AI generation fails"""
        if company and job_role:
            return f"Application for {job_role} at {company}"
        elif company:
            return f"Seeking Opportunities at {company}"
        else:
            return "Seeking Internship/Job Opportunity & Referral Consideration"


# Singleton instance
_gemini_service = None

def get_gemini_service():
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiEmailGenerator()
    return _gemini_service
