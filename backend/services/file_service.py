"""
File handling utilities for resume and email list uploads
"""

import os
from werkzeug.utils import secure_filename
import pandas as pd
import csv

class FileService:
    """Service for handling file uploads and processing"""
    
    ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx', 'xls'}
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in FileService.ALLOWED_EXTENSIONS
    
    @staticmethod
    def save_uploaded_file(file, upload_folder):
        """
        Save uploaded file securely
        
        Args:
            file: File object from request
            upload_folder (str): Directory to save file
            
        Returns:
            str: Path to saved file or None if error
        """
        if file and FileService.allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            import time
            timestamp = str(int(time.time()))
            name, ext = os.path.splitext(filename)
            filename = f"{name}_{timestamp}{ext}"
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            return filepath
        return None
    
    @staticmethod
    def extract_emails_from_csv(csv_path, max_count=1000):
        """
        Extract email addresses from CSV file
        
        Args:
            csv_path (str): Path to CSV file
            max_count (int): Maximum number of emails to extract
            
        Returns:
            list: List of dictionaries with email data
        """
        emails = []
        try:
            # Try pandas first for better CSV handling
            df = pd.read_csv(csv_path, encoding='utf-8')
            
            # Look for email column (case-insensitive)
            email_col = None
            name_col = None
            company_col = None
            
            for col in df.columns:
                col_lower = col.lower()
                if 'email' in col_lower and email_col is None:
                    email_col = col
                elif 'name' in col_lower and name_col is None:
                    name_col = col
                elif 'company' in col_lower and company_col is None:
                    company_col = col
            
            if email_col is None:
                # Try to find email by position (assume 3rd column)
                if len(df.columns) >= 3:
                    email_col = df.columns[2]
                else:
                    raise ValueError("Could not find email column in CSV")
            
            for idx, row in df.iterrows():
                if idx >= max_count:
                    break
                
                email = str(row[email_col]).strip() if email_col else ''
                
                # Basic email validation
                if email and '@' in email and '.' in email:
                    email_data = {
                        'email': email,
                        'name': str(row[name_col]).strip() if name_col and pd.notna(row[name_col]) else 'Hiring Manager',
                        'company': str(row[company_col]).strip() if company_col and pd.notna(row[company_col]) else ''
                    }
                    emails.append(email_data)
            
        except Exception as e:
            print(f"Error reading CSV with pandas: {e}")
            # Fallback to basic CSV reader
            try:
                with open(csv_path, 'r', encoding='utf-8') as file:
                    reader = csv.reader(file)
                    next(reader)  # Skip header
                    for idx, row in enumerate(reader):
                        if idx >= max_count:
                            break
                        if len(row) >= 3 and row[2].strip():
                            email = row[2].strip()
                            if '@' in email and '.' in email:
                                emails.append({
                                    'email': email,
                                    'name': row[1].strip() if len(row) > 1 and row[1].strip() else 'Hiring Manager',
                                    'company': ''
                                })
            except Exception as e2:
                print(f"Error reading CSV with basic reader: {e2}")
                return []
        
        return emails
    
    @staticmethod
    def get_file_info(filepath):
        """
        Get information about a file
        
        Args:
            filepath (str): Path to file
            
        Returns:
            dict: File information
        """
        if not os.path.exists(filepath):
            return None
        
        stat = os.stat(filepath)
        return {
            'filename': os.path.basename(filepath),
            'size': stat.st_size,
            'size_mb': round(stat.st_size / (1024 * 1024), 2),
            'path': filepath
        }
