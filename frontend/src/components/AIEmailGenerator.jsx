import { useState } from 'react';
import { FaLightbulb, FaMagic, FaRobot } from 'react-icons/fa';
import { generateAIEmail } from '../services/api';

const AIEmailGenerator = ({ resumePath, onEmailGenerated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        recipient_name: 'Hiring Manager',
        company: '',
        job_role: '',
    });

    const handleGenerate = async () => {
        if (!formData.company) {
            alert('Please enter a company name');
            return;
        }

        setLoading(true);
        try {
            const result = await generateAIEmail({
                ...formData,
                resume_file: resumePath,
            });

            if (result.success) {
                onEmailGenerated({
                    subject: result.subject,
                    body: result.body,
                });
            } else {
                alert('Failed to generate email: ' + result.error);
            }
        } catch (error) {
            console.error('AI generation error:', error);
            alert('Failed to generate email. Please check if Gemini API is configured.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2><FaRobot /> AI Email Generator</h2>
            <p className="card-description">
                Generate highly personalized email content using Gemini AI.
                The more details you provide, the better the personalization.
            </p>

            <div className="form-group">
                <label>Recipient Name:</label>
                <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="e.g., Hiring Manager, John Doe"
                    className="input"
                />
                <small>Leave as "Hiring Manager" for generic outreach</small>
            </div>

            <div className="form-group">
                <label>Company Name: <span className="required">*</span></label>
                <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Google, Microsoft, Amazon"
                    className="input"
                    required
                />
                <small>AI will research the company to personalize your email</small>
            </div>

            <div className="form-group">
                <label>Target Role:</label>
                <input
                    type="text"
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    placeholder="e.g., Software Engineer, Data Analyst"
                    className="input"
                />
                <small>Optional: Specify the role you're targeting for better results</small>
            </div>

            <button
                className="btn btn-primary btn-large"
                onClick={handleGenerate}
                disabled={loading || !resumePath}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
                {loading ? (
                    <>
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span style={{ marginLeft: '8px' }}>AI is crafting your email...</span>
                    </>
                ) : (
                    <><FaMagic /> Generate Personalized Email</>
                )}
            </button>

            {!resumePath && (
                <p className="warning" style={{ marginTop: '1rem' }}>
                    ⚠️ Upload your resume in Setup to enable AI generation
                </p>
            )}

            {/* AI Tips */}
            <div className="preview-info" style={{ marginTop: '1.5rem' }}>
                <strong><FaLightbulb style={{ marginRight: '6px' }} />Pro Tips for Better Results:</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <li>Include specific company names for personalized introductions</li>
                    <li>Specify target roles to highlight relevant skills</li>
                    <li>Your uploaded resume is analyzed for skill matching</li>
                </ul>
            </div>
        </div>
    );
};

export default AIEmailGenerator;
