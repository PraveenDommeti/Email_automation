import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    FileText,
    Lightbulb,
    Mail,
    RefreshCw,
    Send,
    ShieldCheck,
    UploadCloud,
    Wand2,
    XOctagon
} from 'lucide-react';
import { useEffect, useState } from 'react';
import './index.css';
import {
    analyzeResume,
    cancelEmails,
    checkGmailStatus,
    generateAIEmail,
    getGmailAuthUrl,
    getProgress,
    sendEmails,
    uploadFile
} from './services/api';

// --- Sidebar Component ---
const Sidebar = ({ activeTab, setActiveTab, gmailStatus }) => {
    const menuItems = [
        { id: 'setup', label: 'Setup & Upload', icon: <UploadCloud size={20} /> },
        { id: 'ats', label: 'ATS Scanner', icon: <FileText size={20} /> },
        { id: 'ai', label: 'AI Generator', icon: <Wand2 size={20} /> },
        { id: 'preview', label: 'Preview & Send', icon: <Send size={20} /> },
        { id: 'progress', label: 'Campaign Progress', icon: <BarChart3 size={20} /> },
    ];

    return (
        <aside className="sidebar">
            <div className="logo-container">
                <div className="logo-icon">
                    <Mail color="var(--color-accent)" size={24} />
                </div>
                <h1 className="logo-text">ColdMail <span className="text-accent">AI</span></h1>
            </div>

            <nav className="nav-menu">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="active-indicator"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item text-danger mb-2 w-full justify-start" onClick={() => window.location.reload()}>
                    <XOctagon size={20} />
                    <span>Logout</span>
                </button>
                <div className={`status-badge ${gmailStatus ? 'connected' : 'disconnected'}`}>
                    {gmailStatus ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{gmailStatus ? 'Gmail Connected' : 'Gmail Disconnected'}</span>
                </div>
            </div>
        </aside>
    );
};

// --- Setup Component ---
const SetupAndUpload = ({ gmailStatus, onConnectGmail, onUploadComplete, resumeInfo, csvInfo, onNext, maxEmails, setMaxEmails }) => {
    const [uploadingResume, setUploadingResume] = useState(false);
    const [uploadingCsv, setUploadingCsv] = useState(false);

    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'resume') setUploadingResume(true);
        else setUploadingCsv(true);

        try {
            const result = await uploadFile(file);
            onUploadComplete(type, result);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed: " + error.message);
        } finally {
            if (type === 'resume') setUploadingResume(false);
            else setUploadingCsv(false);
        }
    };

    return (
        <div className="content-container">
            <div className="header-section">
                <h2>Campaign Setup</h2>
                <p className="subtitle">Connect your account and upload necessary documents.</p>
            </div>

            <div className="grid-2">
                {/* Gmail Auth Card */}
                <div className="card">
                    <div className="card-header">
                        <h3><Mail className="text-accent" size={20} /> Gmail Connection</h3>
                    </div>
                    <div className="card-body">
                        <p className="text-secondary mb-4">Securely connect your Gmail account via OAuth 2.0 to send campaigns.</p>
                        {gmailStatus ? (
                            <div className="success-banner">
                                <CheckCircle2 color="var(--color-success)" /> Account Connected Successfully
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={onConnectGmail}>
                                Connect Gmail Account
                            </button>
                        )}
                    </div>
                </div>

                {/* File Uploads */}
                <div className="card">
                    <div className="card-header">
                        <h3><UploadCloud className="text-accent" size={20} /> File Uploads</h3>
                    </div>
                    <div className="card-body stack">
                        <div className="upload-row">
                            <label className="text-sm uppercase text-secondary">Resume (PDF)</label>
                            <div className="file-input-wrapper">
                                <input type="file" accept=".pdf" onChange={(e) => handleUpload(e, 'resume')} />
                                <div className={`fake-input ${resumeInfo ? 'has-file' : ''}`}>
                                    {resumeInfo ? (
                                        <span className="flex-center"><CheckCircle2 size={14} className="mr-2 text-success" /> {resumeInfo.filename}</span>
                                    ) : "Choose PDF..."}
                                    {uploadingResume && <RefreshCw className="spin" size={14} />}
                                </div>
                            </div>
                        </div>

                        <div className="upload-row">
                            <label className="text-sm uppercase text-secondary">Email List (CSV)</label>
                            <div className="file-input-wrapper">
                                <input type="file" accept=".csv" onChange={(e) => handleUpload(e, 'csv')} />
                                <div className={`fake-input ${csvInfo ? 'has-file' : ''}`}>
                                    {csvInfo ? (
                                        <span className="flex-center"><CheckCircle2 size={14} className="mr-2 text-success" /> {csvInfo.filename}</span>
                                    ) : "Choose CSV..."}
                                    {uploadingCsv && <RefreshCw className="spin" size={14} />}
                                </div>
                            </div>
                        </div>

                        <div className="upload-row">
                            <label className="text-sm uppercase text-secondary">Max Emails to Send</label>
                            <input
                                type="number"
                                className="input-field"
                                value={maxEmails}
                                onChange={(e) => setMaxEmails(e.target.value)}
                                placeholder="Default: 50"
                                min="1"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {resumeInfo && csvInfo && (
                <div className="flex justify-end mt-4">
                    <button className="btn btn-secondary" onClick={onNext}>
                        Next: ATS Scanner &rarr;
                    </button>
                </div>
            )}
        </div>
    );
};

// --- ATS Scanner ---
const ATSScanner = ({ resumePath, onNext }) => {
    const [jobDesc, setJobDesc] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        if (!resumePath) {
            alert("Please upload a resume in Setup tab first.");
            return;
        }
        setAnalyzing(true);
        try {
            const res = await analyzeResume({ resume_file: resumePath, job_description: jobDesc });
            if (res.success) setAnalysis(res.analysis);
        } catch (e) {
            console.error("Analysis Error:", e);
            alert("Analysis failed: " + e.message);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="content-container">
            <div className="header-section">
                <h2>ATS Resume Scanner</h2>
                <p className="subtitle">Analyze your resume against job descriptions to improve deliverability.</p>
            </div>

            {!resumePath ? (
                <div className="card empty-state text-center p-8">
                    <AlertCircle size={48} className="text-muted mx-auto mb-4" />
                    <h3>Resume Not Found</h3>
                    <p className="text-secondary mb-4">Please upload a resume in the Setup tab first.</p>
                </div>
            ) : (
                <div className="grid-2-1">
                    <div className="card h-full flex flex-col">
                        <h3>Target Job Description (Optional)</h3>
                        <p className="text-sm text-secondary mb-3">
                            Paste the JD to check keyword matching. Analyzing without JD provides a general text audit.
                        </p>
                        <textarea
                            className="input-field textarea-large mt-auto flex-1 h-64"
                            placeholder="Paste the job description here for better matching..."
                            value={jobDesc}
                            onChange={e => setJobDesc(e.target.value)}
                        />
                        <button className="btn btn-primary mt-4 w-full" onClick={handleAnalyze} disabled={analyzing}>
                            {analyzing ? <RefreshCw className="spin" /> : <ShieldCheck size={18} />}
                            {analyzing ? 'Analyzing Resume...' : 'Run ATS Analysis'}
                        </button>
                    </div>

                    <div className="card">
                        {!analysis ? (
                            <div className="flex-center flex-col h-full min-h-[400px] text-center text-muted">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>Ready to analyze.<br />Paste a JD and click Run.</p>
                            </div>
                        ) : (
                            <div className="analysis-results">
                                <div className="score-container mb-6 text-center">
                                    <div className="relative inline-flex items-center justify-center score-circle-container">
                                        <svg className="w-40 h-40 transform -rotate-90">
                                            <circle
                                                className="text-gray-700"
                                                strokeWidth="8"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="70"
                                                cx="80"
                                                cy="80"
                                            />
                                            <motion.circle
                                                className="text-accent"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="70"
                                                cx="80"
                                                cy="80"
                                                initial={{ strokeDasharray: "440 440", strokeDashoffset: 440 }}
                                                animate={{ strokeDashoffset: 440 - (440 * (analysis.score || 0)) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-4xl font-bold font-mono">{analysis.score || 0}%</span>
                                            <span className="text-xs text-secondary uppercase tracking-widest">ATS Score</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary mt-2 max-w-xs mx-auto italic">"{analysis.summary}"</p>
                                </div>

                                <div className="analysis-section space-y-4">
                                    <div className="bg-subtle p-3 rounded">
                                        <h4 className="flex-center text-sm uppercase text-secondary mb-2">
                                            <AlertTriangle size={14} className="text-warning mr-2" /> Missing Keywords
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.missing_keywords && analysis.missing_keywords.length > 0 ? (
                                                analysis.missing_keywords.map((kw, i) => (
                                                    <span key={i} className="text-xs bg-red-900/30 text-red-200 border border-red-900/50 px-2 py-1 rounded">
                                                        {kw}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-secondary italic">No critical keywords missing found.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="flex-center text-sm uppercase text-success mb-2">
                                            <CheckCircle2 size={14} className="mr-2" /> Strengths
                                        </h4>
                                        <ul className="text-sm text-secondary list-disc pl-4 space-y-1">
                                            {analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="flex-center text-sm uppercase text-accent mb-2">
                                            <Lightbulb size={14} className="mr-2" /> Suggestions
                                        </h4>
                                        <ul className="text-sm text-secondary list-disc pl-4 space-y-1">
                                            {analysis.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="flex justify-end mt-4">
                <button className="btn btn-secondary" onClick={onNext}>
                    Next: AI Generator &rarr;
                </button>
            </div>
        </div>
    );
};

// --- AI Generator ---
const AIGenerator = ({ resumePath, onGenerateComplete, onNext }) => {
    const [jobRole, setJobRole] = useState('');
    const [experience, setExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        if (!resumePath) {
            alert("Please upload a resume first!");
            return;
        }
        setLoading(true);
        try {
            const res = await generateAIEmail({
                job_role: jobRole,
                experience_level: experience,
                resume_file: resumePath
            });
            if (res.success) {
                setResult(res);
                onGenerateComplete(res.subject, res.body);
            }
        } catch (err) {
            console.error(err);
            alert("Error generating email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-container">
            <div className="header-section">
                <h2>AI Email Generator</h2>
                <p className="subtitle">Generate personalized cold emails using Gemini AI.</p>
            </div>

            <div className="grid-2-1">
                <div className="card">
                    <h3 className="mb-4">Context & Configuration</h3>

                    <div className="form-group mb-4">
                        <label className="text-sm text-secondary mb-1 block">Job Role</label>
                        <input
                            className="input-field"
                            placeholder="e.g. Senior Frontend Developer"
                            value={jobRole}
                            onChange={e => setJobRole(e.target.value)}
                        />
                    </div>

                    <div className="form-group mb-6">
                        <label className="text-sm text-secondary mb-1 block">Experience Level / Highlights</label>
                        <input
                            className="input-field"
                            placeholder="e.g. 5 years exp, React specialist"
                            value={experience}
                            onChange={e => setExperience(e.target.value)}
                        />
                    </div>

                    <button className="btn btn-primary w-full" onClick={handleGenerate} disabled={loading}>
                        {loading ? <RefreshCw className="spin" /> : <Wand2 size={18} />}
                        Generate Draft
                    </button>
                </div>

                <div className="card bg-darker">
                    <h3>Generated Output</h3>
                    {result ? (
                        <div className="preview-box mt-4">
                            <div className="mb-2">
                                <span className="text-accent text-sm">Subject:</span>
                                <p>{result.subject}</p>
                            </div>
                            <div className="divider my-2 border-t border-subtle"></div>
                            <div>
                                <span className="text-accent text-sm">Body:</span>
                                <p className="whitespace-pre-wrap text-sm text-secondary mt-1">{result.body}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-center h-full text-muted italic p-8">
                            Configure options and click Generate to see the magic...
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end mt-4">
                <button className="btn btn-secondary" onClick={onNext}>
                    Next: Preview &rarr;
                </button>
            </div>
        </div>
    );
};

// --- Preview & Send ---
const PreviewAndSend = ({ subject, body, setSubject, setBody, resumePath, csvPath, onLaunch, onNext }) => {

    if (!subject && !body) {
        return (
            <div className="content-container">
                <div className="card empty-state text-center p-12">
                    <Wand2 size={48} className="text-muted mx-auto mb-4" />
                    <h3>No Draft Generated</h3>
                    <p className="text-secondary mb-4">Please use the AI Generator tab to create your email content first.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="content-container">
            <div className="header-section">
                <h2>Preview & Launch</h2>
                <p className="subtitle">Review and edit your campaign before sending.</p>
            </div>

            <div className="card">
                <div className="preview-header mb-4">
                    <div className="bg-darker p-4 rounded-md mb-4 border border-subtle">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-secondary w-16">To:</span>
                            <span className="bg-subtle px-2 py-1 rounded text-sm">{csvPath ? 'Recipients from CSV' : 'No CSV selected'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-secondary w-16">Subject:</span>
                            <input
                                className="input-field flex-1"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="preview-body mb-6">
                    <label className="text-sm text-secondary mb-2 block">Email Content</label>
                    <textarea
                        className="input-field textarea-large w-full h-64"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                </div>

                <div className="preview-footer flex justify-between items-center border-t border-subtle pt-4">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                        <div className={`w-3 h-3 rounded-full ${resumePath ? 'bg-success' : 'bg-danger'}`}></div>
                        Resume: {resumePath ? 'Attached' : 'Missing'}
                    </div>

                    <button className="btn btn-primary" onClick={onLaunch} disabled={!csvPath || !resumePath}>
                        <Send size={18} /> Launch Campaign
                    </button>
                </div>
            </div>
            <div className="flex justify-end mt-4">
                <button className="btn btn-secondary" onClick={onNext}>
                    Next: Campaign Progress &rarr;
                </button>
            </div>
        </div>
    );
};

// --- Progress ---
const ProgressDashboard = () => {
    const [stats, setStats] = useState({
        status: 'idle',
        current: 0,
        total: 0,
        sent: 0,
        failed: 0,
        logs: []
    });

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getProgress();
                if (data) setStats(data);
            } catch (e) { }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleStop = async () => {
        if (confirm("Are you sure you want to stop the campaign?")) {
            await cancelEmails();
        }
    };

    return (
        <div className="content-container">
            <div className="header-section flex justify-between items-end">
                <div>
                    <h2>Live Campaign Progress</h2>
                    <p className="subtitle">Real-time metrics of your active campaign.</p>
                </div>
                <div className="text-right">
                    <span className={`status-badge ${stats.status === 'running' ? 'running' : 'idle'}`}>
                        Status: {stats.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="stats-grid mb-6">
                <div className="card stat-card">
                    <h4 className="text-secondary mb-2">Emails Sent</h4>
                    <div className="stat-value text-accent">{stats.sent}</div>
                    <div className="text-xs text-secondary mt-1">/ {stats.total} Total</div>
                </div>
                <div className="card stat-card">
                    <h4 className="text-secondary mb-2">Pending</h4>
                    <div className="stat-value">{stats.total - stats.sent - stats.failed}</div>
                </div>
                <div className="card stat-card">
                    <h4 className="text-secondary mb-2">Failed</h4>
                    <div className="stat-value text-danger">{stats.failed}</div>
                </div>
            </div>

            <div className="card h-96 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3>Activity Log</h3>
                    {stats.status === 'running' && (
                        <button className="btn btn-danger-outline btn-sm" onClick={handleStop}>
                            <XOctagon size={16} /> Stop
                        </button>
                    )}
                </div>

                <div className="log-window flex-1 overflow-y-auto font-mono text-sm bg-darker p-4 rounded border border-subtle">
                    {stats.logs && stats.logs.length > 0 ? (
                        stats.logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-subtle pb-1 last:border-0">
                                <span className="opacity-50 mr-2">[{i + 1}]</span>
                                {log}
                            </div>
                        ))
                    ) : (
                        <div className="text-muted italic">Waiting for activity...</div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main App ---
function App() {
    const [activeTab, setActiveTab] = useState('setup');
    const [gmailStatus, setGmailStatus] = useState(false);

    // App State
    const [resumeInfo, setResumeInfo] = useState(null); // { filename, path }
    const [csvInfo, setCsvInfo] = useState(null); // { filename, path }
    const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
    const [maxEmails, setMaxEmails] = useState(50);

    useEffect(() => {
        checkGmailStatus().then(res => setGmailStatus(res.authenticated)).catch(() => setGmailStatus(false));
    }, []);

    const handleConnectGmail = async () => {
        try {
            const res = await getGmailAuthUrl();
            if (res.auth_url) window.location.href = res.auth_url;
        } catch (e) {
            console.error(e);
        }
    };

    const handleUploadComplete = (type, result) => {
        // result = { filename, path, ... }
        if (type === 'resume') setResumeInfo(result);
        if (type === 'csv') setCsvInfo(result);
    };

    const handleAIGenerated = (subject, body) => {
        setEmailDraft({ subject, body });
        setActiveTab('preview'); // Auto-switch to preview
    };

    const handleLaunchCampaign = async () => {
        if (!csvInfo || !resumeInfo) return;
        try {
            await sendEmails({
                csv_file: csvInfo.path,
                resume_file: resumeInfo.path,
                subject: emailDraft.subject,
                body: emailDraft.body,
                use_ai: true, // or toggle
                max_emails: parseInt(maxEmails) || 50
            });
            setActiveTab('progress');
        } catch (e) {
            alert("Failed to start campaign: " + e.message);
        }
    };

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} gmailStatus={gmailStatus} />

            <main className="main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'setup' && (
                            <SetupAndUpload
                                gmailStatus={gmailStatus}
                                onConnectGmail={handleConnectGmail}
                                onUploadComplete={handleUploadComplete}
                                resumeInfo={resumeInfo}
                                csvInfo={csvInfo}
                                onNext={() => setActiveTab('ats')}
                                maxEmails={maxEmails}
                                setMaxEmails={setMaxEmails}
                            />
                        )}

                        {activeTab === 'ats' && (
                            <ATSScanner
                                resumePath={resumeInfo?.path}
                                onNext={() => setActiveTab('ai')}
                            />
                        )}

                        {activeTab === 'ai' && (
                            <AIGenerator
                                resumePath={resumeInfo?.path}
                                onGenerateComplete={handleAIGenerated}
                                onNext={() => setActiveTab('preview')}
                            />
                        )}

                        {activeTab === 'preview' && (
                            <PreviewAndSend
                                subject={emailDraft.subject}
                                setSubject={(s) => setEmailDraft(prev => ({ ...prev, subject: s }))}
                                body={emailDraft.body}
                                setBody={(b) => setEmailDraft(prev => ({ ...prev, body: b }))}
                                resumePath={resumeInfo?.path}
                                csvPath={csvInfo?.path}
                                onLaunch={handleLaunchCampaign}
                                onNext={() => setActiveTab('progress')}
                            />
                        )}

                        {activeTab === 'progress' && <ProgressDashboard />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
