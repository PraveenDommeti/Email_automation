import { useEffect, useState } from 'react';
import { FaExchangeAlt, FaGoogle, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import { checkGmailStatus, disconnectGmail, getGmailAuthUrl } from '../services/api';

const GmailAuth = ({ onAuthSuccess, onEmailReceived }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connectedEmail, setConnectedEmail] = useState('user@gmail.com');
    const [lastVerified, setLastVerified] = useState('just now');

    useEffect(() => {
        checkAuth();

        // Check for auth success in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            setAuthenticated(true);
            setLastVerified('just now');
            onAuthSuccess();
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('auth') === 'error') {
            alert('Gmail authentication failed: ' + (params.get('message') || 'Unknown error'));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const result = await checkGmailStatus();
            setAuthenticated(result.authenticated);
            if (result.authenticated) {
                onAuthSuccess();
                if (result.email) {
                    setConnectedEmail(result.email);
                    if (onEmailReceived) onEmailReceived(result.email);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const result = await getGmailAuthUrl();
            if (result.success) {
                window.location.href = result.auth_url;
            } else {
                alert('Failed to get authorization URL. Please check Gmail OAuth configuration.');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Failed to initiate Gmail authentication. Please check backend configuration.');
        }
    };

    const handleChangeAccount = async () => {
        if (window.confirm('Switch to a different Gmail account?')) {
            try {
                await disconnectGmail();
                setAuthenticated(false);
                // Immediately start new auth flow
                handleConnect();
            } catch (error) {
                console.error('Disconnect error:', error);
                alert('Failed to disconnect Gmail account');
            }
        }
    };

    if (loading) {
        return (
            <div className="auth-loading">
                <FaSpinner className="spin" /> Checking authentication status...
            </div>
        );
    }

    return (
        <div className="gmail-auth">
            {authenticated ? (
                <div className="auth-success">
                    {/* Header with Gmail badge */}
                    <div className="auth-success-header">
                        <div className="gmail-logo-badge">
                            <FaGoogle />
                        </div>
                        <div className="auth-success-info">
                            <h3>Connected Email Account</h3>
                            <p className="connected-email">{connectedEmail}</p>
                        </div>
                    </div>

                    {/* Status details */}
                    <div className="auth-success-details">
                        <div className="auth-detail">
                            <span className="auth-detail-label">Status</span>
                            <span className="auth-detail-value">
                                <span className="status-dot"></span>
                                Active
                            </span>
                        </div>
                        <div className="auth-detail">
                            <span className="auth-detail-label">Provider</span>
                            <span className="auth-detail-value">Google Workspace</span>
                        </div>
                        <div className="auth-detail">
                            <span className="auth-detail-label">Last Verified</span>
                            <span className="auth-detail-value">{lastVerified}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="auth-success-actions">
                        <button className="btn btn-ghost" onClick={handleChangeAccount}>
                            <FaExchangeAlt /> Change Account
                        </button>
                    </div>
                </div>
            ) : (
                <div className="auth-prompt">
                    <FaGoogle className="google-icon" />
                    <h3>Connect Your Gmail Account</h3>
                    <p>Securely authenticate using OAuth 2.0 to send emails directly from your account</p>
                    <button className="btn btn-primary btn-large" onClick={handleConnect}>
                        <FaGoogle /> Connect with Google
                    </button>
                    <p className="security-note">
                        <FaShieldAlt /> Your credentials are never stored. We use secure, temporary access tokens.
                    </p>
                </div>
            )}
        </div>
    );
};

export default GmailAuth;
