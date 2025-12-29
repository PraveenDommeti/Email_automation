import { useState } from 'react';
import { FaCloudUploadAlt, FaGoogle, FaPaperPlane, FaQuestionCircle, FaRobot } from 'react-icons/fa';
import './App.css';
import AIEmailGenerator from './components/AIEmailGenerator';
import EmailPreview from './components/EmailPreview';
import FileUpload from './components/FileUpload';
import GmailAuth from './components/GmailAuth';
import LogsTable from './components/LogsTable';
import ProgressTracker from './components/ProgressTracker';
import { cancelEmails, sendEmails } from './services/api';

// Help content for each tab
const helpContent = {
    setup: {
        title: 'Getting Started',
        items: [
            {
                title: 'Why Connect Gmail?',
                desc: 'Gmail OAuth 2.0 ensures secure sending without storing your password. Emails are sent directly from your account.'
            },
            {
                title: 'Email Limits',
                desc: 'Gmail allows ~500 emails/day for personal accounts, ~2000/day for Workspace. We recommend 30-50 per campaign.'
            },
            {
                title: 'Privacy & Security',
                desc: 'We never store your Gmail credentials. Only temporary access tokens are used during the session.'
            }
        ]
    },
    ai: {
        title: 'AI Email Generation',
        items: [
            {
                title: 'How AI Works',
                desc: 'Our Gemini AI analyzes your resume and recipient details to craft personalized, professional emails.'
            },
            {
                title: 'Best Practices',
                desc: 'Include specific company names and roles for better personalization. Review AI output before sending.'
            },
            {
                title: 'Customization',
                desc: 'AI-generated content is fully editable. Use it as a starting point and add your personal touch.'
            }
        ]
    },
    preview: {
        title: 'Review & Launch',
        items: [
            {
                title: 'Before Sending',
                desc: 'Double-check subject line, email body, and ensure your resume attachment is correct.'
            },
            {
                title: 'Campaign Timing',
                desc: 'Best times to send: Tuesday-Thursday, 9-11 AM recipient\'s local time.'
            },
            {
                title: 'Rate Limiting',
                desc: 'Emails are sent with delays to avoid spam filters and maintain deliverability.'
            }
        ]
    },
    progress: {
        title: 'Campaign Analytics',
        items: [
            {
                title: 'Real-time Tracking',
                desc: 'Monitor sent, failed, and pending emails as your campaign runs.'
            },
            {
                title: 'Error Handling',
                desc: 'Failed emails are logged with reasons. You can retry or skip as needed.'
            },
            {
                title: 'Campaign Control',
                desc: 'You can pause or cancel the campaign at any time without losing progress data.'
            }
        ]
    }
};

function App() {
    const [resumePath, setResumePath] = useState(null);
    const [csvPath, setCsvPath] = useState(null);
    const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
    const [connectedEmail, setConnectedEmail] = useState('');
    const [emailContent, setEmailContent] = useState({
        subject: 'Seeking Internship/Job Opportunity & Referral Consideration',
        body: `Dear Hiring Manager,

I hope this message finds you well.

My name is [Your Name], and I'm currently pursuing a B.Tech in Information Technology. I'm reaching out to explore any internship or entry-level opportunities that align with my skills in full-stack development and data analytics.

I've gained hands-on experience working with modern technologies and am eager to contribute to your team. I believe my technical skills and enthusiasm for learning would make me a valuable addition to your organization.

I would greatly appreciate the opportunity to discuss how I can contribute to your team, or if you could provide any guidance on relevant openings.

Thank you for your time and consideration.

Warm regards,
[Your Name]`
    });
    const [maxEmails, setMaxEmails] = useState(30);
    const [useAI, setUseAI] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [activeTab, setActiveTab] = useState('setup');
    const [campaignName, setCampaignName] = useState('New Campaign');

    // Calculate step completion status
    const isSetupComplete = gmailAuthenticated && resumePath && csvPath;
    const isAIComplete = useAI || emailContent.subject.length > 0;
    const isPreviewComplete = isSending;

    const getTabStatus = (tab) => {
        switch (tab) {
            case 'setup':
                return isSetupComplete ? 'completed' : 'active';
            case 'ai':
                if (!isSetupComplete) return 'locked';
                return isAIComplete ? 'completed' : 'active';
            case 'preview':
                if (!isSetupComplete) return 'locked';
                return isPreviewComplete ? 'completed' : 'active';
            case 'progress':
                if (!isSetupComplete) return 'locked';
                return 'active';
            default:
                return 'active';
        }
    };

    const canAccessTab = (tab) => {
        if (tab === 'setup') return true;
        return isSetupComplete;
    };

    const handleTabClick = (tab) => {
        if (canAccessTab(tab)) {
            setActiveTab(tab);
        }
    };

    const handleEmailGenerated = (generated) => {
        setEmailContent(generated);
        setUseAI(true);
    };

    const handleStartCampaign = async () => {
        if (!gmailAuthenticated) {
            alert('Please connect your Gmail account first');
            return;
        }

        if (!resumePath || !csvPath) {
            alert('Please upload both resume and email list');
            return;
        }

        try {
            setIsSending(true);
            await sendEmails({
                csv_file: csvPath,
                resume_file: resumePath,
                subject: emailContent.subject,
                body: emailContent.body,
                max_emails: maxEmails,
                use_ai: useAI
            });
            setActiveTab('progress');
        } catch (error) {
            console.error('Error starting campaign:', error);
            alert('Failed to start campaign: ' + (error.response?.data?.message || error.message));
            setIsSending(false);
        }
    };

    const handleCancelCampaign = async () => {
        if (window.confirm('Are you sure you want to cancel the campaign?')) {
            try {
                await cancelEmails();
            } catch (error) {
                console.error('Error cancelling campaign:', error);
            }
        }
    };

    const handleCampaignComplete = () => {
        setIsSending(false);
    };

    const getCampaignStatus = () => {
        if (isSending) return { text: 'Sending', class: 'sending' };
        if (isSetupComplete) return { text: 'Ready', class: 'ready' };
        return { text: 'Setup Required', class: 'pending' };
    };

    const currentHelp = helpContent[activeTab];
    const campaignStatus = getCampaignStatus();

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <h1>
                        <FaPaperPlane className="header-icon" />
                        Email Automation System
                    </h1>
                    <p className="subtitle">
                        <FaRobot /> AI-Powered Cold Email Campaign Platform
                    </p>
                </div>
            </header>

            {/* Campaign Summary Bar */}
            <div className="campaign-summary-bar">
                <div className="summary-item">
                    <span className="summary-label">Campaign:</span>
                    <span className="summary-value">{campaignName}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Emails:</span>
                    <span className="summary-value">{maxEmails}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Status:</span>
                    <span className={`summary-badge ${campaignStatus.class}`}>
                        {campaignStatus.text}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Gmail:</span>
                    <span className={`summary-badge ${gmailAuthenticated ? 'connected' : 'disconnected'}`}>
                        {gmailAuthenticated ? '✓ Connected' : '○ Not Connected'}
                    </span>
                </div>
            </div>

            {/* Step Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'setup' ? 'active' : ''} ${getTabStatus('setup') === 'completed' ? 'completed' : ''}`}
                        onClick={() => handleTabClick('setup')}
                    >
                        <span className="step-number">1</span>
                        Setup
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'ai' ? 'active' : ''} ${getTabStatus('ai') === 'completed' ? 'completed' : ''}`}
                        onClick={() => handleTabClick('ai')}
                        disabled={!canAccessTab('ai')}
                    >
                        <span className="step-number">2</span>
                        AI Generator
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'preview' ? 'active' : ''} ${getTabStatus('preview') === 'completed' ? 'completed' : ''}`}
                        onClick={() => handleTabClick('preview')}
                        disabled={!canAccessTab('preview')}
                    >
                        <span className="step-number">3</span>
                        Preview & Send
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                        onClick={() => handleTabClick('progress')}
                        disabled={!canAccessTab('progress')}
                    >
                        <span className="step-number">4</span>
                        Progress
                    </button>
                </div>
            </div>

            {/* Main Container with Content + Help Panel */}
            <div className="main-container">
                {/* Content Area */}
                <div className="content-area">
                    {activeTab === 'setup' && (
                        <div className="tab-content">
                            <div className="card">
                                <h2><FaGoogle /> Connect Email Account</h2>
                                <GmailAuth
                                    onAuthSuccess={() => setGmailAuthenticated(true)}
                                    onEmailReceived={setConnectedEmail}
                                />
                            </div>

                            <div className="card">
                                <h2><FaCloudUploadAlt /> Campaign Assets</h2>
                                <FileUpload
                                    label="Resume (PDF)"
                                    accept=".pdf"
                                    id="resume-upload"
                                    onUploadSuccess={setResumePath}
                                />
                                <FileUpload
                                    label="Email List (CSV)"
                                    accept=".csv"
                                    id="csv-upload"
                                    onUploadSuccess={setCsvPath}
                                />
                                <div className="form-group">
                                    <label>Campaign Name:</label>
                                    <input
                                        type="text"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        className="input"
                                        placeholder="e.g., Software Developer Outreach"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Maximum Emails to Send:</label>
                                    <input
                                        type="number"
                                        value={maxEmails}
                                        onChange={(e) => setMaxEmails(parseInt(e.target.value))}
                                        min="1"
                                        max="200"
                                        className="input"
                                    />
                                    <small>Recommended: 30-50 emails per campaign to maintain deliverability</small>
                                </div>

                                {isSetupComplete && (
                                    <div className="action-section" style={{ marginTop: '1.5rem', border: 'none', background: 'transparent', padding: 0 }}>
                                        <button
                                            className="btn btn-primary btn-large"
                                            onClick={() => setActiveTab('ai')}
                                        >
                                            Continue to AI Generator →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="tab-content">
                            <AIEmailGenerator
                                resumePath={resumePath}
                                onEmailGenerated={handleEmailGenerated}
                            />
                            {emailContent.subject && (
                                <div className="card success-message">
                                    <h3>✅ Email Content Ready</h3>
                                    <p>Your email template is ready. Continue to preview and launch your campaign.</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setActiveTab('preview')}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        Continue to Preview →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'preview' && (
                        <div className="tab-content">
                            <EmailPreview
                                subject={emailContent.subject}
                                body={emailContent.body}
                                onEdit={setEmailContent}
                            />
                            <div className="action-section">
                                <button
                                    className="btn btn-primary btn-large"
                                    onClick={handleStartCampaign}
                                    disabled={isSending || !gmailAuthenticated || !resumePath || !csvPath}
                                >
                                    <FaPaperPlane /> Launch Campaign
                                </button>
                                {!gmailAuthenticated && (
                                    <p className="warning">⚠️ Gmail account required — Go to Setup</p>
                                )}
                                {(!resumePath || !csvPath) && (
                                    <p className="warning">⚠️ Missing files — Go to Setup</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div className="tab-content">
                            <ProgressTracker
                                isActive={isSending}
                                onComplete={handleCampaignComplete}
                            />
                            {isSending && (
                                <div className="action-section">
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleCancelCampaign}
                                    >
                                        🛑 Cancel Campaign
                                    </button>
                                </div>
                            )}
                            <LogsTable />
                        </div>
                    )}
                </div>

                {/* Contextual Help Panel */}
                <div className="help-panel">
                    <div className="help-card">
                        <h3><FaQuestionCircle /> {currentHelp.title}</h3>
                        {currentHelp.items.map((item, index) => (
                            <div className="help-item" key={index}>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="app-footer">
                <p>🔐 Secure OAuth 2.0 • 🤖 Powered by Gemini AI • ⚡ Built for Professionals</p>
            </footer>
        </div>
    );
}

export default App;
