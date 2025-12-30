"""
Gemini AI Service for Email Generation
Generates personalized email content using Google's Gemini AI
"""

import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2
import random

load_dotenv(override=True)

class GeminiEmailGenerator:
    """Service for generating personalized emails using Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini AI with API key"""
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_email(self, recipient_name='Hiring Manager', company='', job_role=None, experience_level=None, resume_text=None):
        """
        Generate personalized email body using Gemini AI
        
        Args:
            recipient_name (str): Name of the recipient
            company (str): Company name
            job_role (str, optional): Specific job role
            experience_level (str, optional): Experience level (e.g. Entry, Senior)
            resume_text (str, optional): Text extracted from resume for context
            
        Returns:
            str: Generated email body
        """
        
        # Build context from resume if available
        resume_context = ""
        if resume_text:
            resume_context = f"\n\nCandidate Background (from resume):\n{resume_text[:2000]}"
        
        # Determine the user's intent (Internship vs Job)
        position_type = "Job Opportunity"
        if job_role and "intern" in job_role.lower():
            position_type = "Internship"
        elif experience_level and "intern" in experience_level.lower():
            position_type = "Internship"
            
        custom_instructions = ""
        if job_role:
            custom_instructions += f"- Tailor the content specifically for the role of '{job_role}'.\n"
        if experience_level:
            custom_instructions += f"- Emphasize the following experience/highlights: {experience_level}\n"
            
        prompt = f"""Generate a professional, personalized cold email for a {position_type} application.
        
Context:
- Recipient: {recipient_name}
- Company: {company if company else 'the company'}
- Target Role: {job_role if job_role else 'any suitable position'}
- User's Experience/Highlights: {experience_level if experience_level else 'Not specified'}

{resume_context}

Requirements:
1. **Subject Line Context**: The email should align with the theme "Seeking {position_type} & Referral Consideration".
2. **Personalization**:
   - If applying for an Internship: Focus on eagerness to learn, academic background, and potential to contribute.
   - If applying for a Full-time Job: Focus on professional experience, specific skills matching the role, and value add.
   - Use the provided 'User's Experience/Highlights' to make it specific.
3. **Tone**: Professional, confident, yet humble and warm. Not generic or robotic.
4. **Structure**:
   - Professional Greeting
   - Hook: Why you are writing (mentioning the specific role if known).
   - The 'Why Me': Connect the resume details/highlights to the company's needs.
   - call to Action: Request for a brief chat or referral.
   - **MANDATORY Closing**: You MUST end the email body with a sentence explicitly mentioning "Please find my resume attached" or "I have attached my resume for your review" before the sign-off.
   - Professional Sign-off.

{custom_instructions}

IMPORTANT: Return ONLY the email body text. Do NOT include:
- Subject line
- Placeholders like [Your Name] (unless unavoidable)
- Any meta-commentary

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
            
    def analyze_resume(self, resume_text, job_description=None):
        """
        Analyze resume and provide ATS score and feedback (MOCKED)
        """
        # Mock Response Data
        score = random.randint(78, 85)
        
        return {
            "score": score,
            "missing_keywords": ["Docker", "Kubernetes", "Microservices", "System Design"],
            "strengths": [
                "Strong academic background in Computer Science",
                "Clear and professional formatting",
                "Relevant full-stack development projects",
                "Good usage of action verbs (e.g., Developed, implemented)"
            ],
            "weaknesses": [
                "Lack of quantified results (e.g. 'Improved performance by 20%')",
                "Some technical skills listed but not demonstrated in work experience"
            ],
            "suggestions": [
                "Quantify your impact: Add metrics to your project descriptions to show tangible results.",
                "Tailor your skills section: Group skills by category (Languages, Frameworks, Tools) for better readability.",
                "Add a professional summary: Create a summary tailored to the specific role you are targeting.",
                "Include a link to your GitHub or portfolio in the header."
            ],
            "summary": "Solid profile with good technical foundations. Needs more quantitative achievements to reach a top-tier score."
        }

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
