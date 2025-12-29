import { FaEdit, FaEye, FaPaperclip, FaUser } from 'react-icons/fa';

const EmailPreview = ({ subject, body, onEdit }) => {
    const wordCount = body.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = body.length;

    return (
        <div className="card">
            <h2><FaEye /> Email Preview</h2>
            <p className="card-description">
                Review and customize your email before launching the campaign
            </p>

            <div className="email-preview">
                {/* Email Header Simulation */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <FaUser />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>From: Your Gmail Account</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To: Recipients from your CSV file</div>
                    </div>
                </div>

                <div className="preview-section">
                    <label className="preview-label">
                        <FaEdit style={{ marginRight: '6px' }} />
                        Subject Line:
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => onEdit({ subject: e.target.value, body })}
                        className="subject-input"
                        placeholder="Enter a compelling subject line"
                    />
                </div>

                <div className="preview-section">
                    <label className="preview-label">
                        <FaEdit style={{ marginRight: '6px' }} />
                        Email Body:
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => onEdit({ subject, body: e.target.value })}
                        rows={16}
                        className="body-textarea"
                        placeholder="Enter your email content..."
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                    }}>
                        <span>{wordCount} words</span>
                        <span>{charCount} characters</span>
                    </div>
                </div>

                {/* Attachment indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: '16px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                }}>
                    <FaPaperclip />
                    <span>Your resume will be attached to each email</span>
                </div>
            </div>

            <div className="preview-info" style={{ marginTop: '16px' }}>
                <p style={{ margin: 0 }}>
                    💡 <strong>Best Practices:</strong> Keep subject lines under 50 characters.
                    Personalized emails have 26% higher open rates. Consider A/B testing different approaches.
                </p>
            </div>
        </div>
    );
};

export default EmailPreview;
