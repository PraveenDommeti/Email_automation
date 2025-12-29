import { useEffect, useState } from 'react';
import { FaChartLine, FaCheckCircle, FaClock, FaExclamationTriangle, FaPaperPlane, FaTimesCircle } from 'react-icons/fa';
import { getProgress } from '../services/api';

const ProgressTracker = ({ isActive, onComplete }) => {
    const [progress, setProgress] = useState({
        current: 0,
        total: 0,
        sent: 0,
        failed: 0,
        status: 'idle',
        logs: []
    });

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(async () => {
                try {
                    const data = await getProgress();
                    setProgress(data);

                    if (['completed', 'error', 'cancelled'].includes(data.status)) {
                        clearInterval(interval);
                        onComplete(data);
                    }
                } catch (error) {
                    console.error('Progress update error:', error);
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, onComplete]);

    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    const pending = progress.total - progress.current;
    const successRate = progress.sent > 0 ? ((progress.sent / (progress.sent + progress.failed)) * 100).toFixed(1) : 0;

    const getStatusIcon = () => {
        switch (progress.status) {
            case 'running':
                return <FaPaperPlane className="spin" />;
            case 'completed':
                return <FaCheckCircle />;
            case 'cancelled':
                return <FaExclamationTriangle />;
            case 'error':
                return <FaTimesCircle />;
            default:
                return <FaClock />;
        }
    };

    const getStatusText = () => {
        switch (progress.status) {
            case 'running':
                return 'Sending emails...';
            case 'completed':
                return 'Campaign completed';
            case 'cancelled':
                return 'Campaign cancelled';
            case 'error':
                return 'Campaign error';
            default:
                return 'Ready to start';
        }
    };

    return (
        <div className="card">
            <h2><FaChartLine /> Campaign Analytics</h2>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-card info">
                    <div className="metric-value">{progress.total}</div>
                    <div className="metric-label">Total Emails</div>
                </div>
                <div className="metric-card success">
                    <div className="metric-value">{progress.sent}</div>
                    <div className="metric-label">Delivered</div>
                </div>
                <div className="metric-card warning">
                    <div className="metric-value">{pending}</div>
                    <div className="metric-label">Pending</div>
                </div>
                <div className="metric-card error">
                    <div className="metric-value">{progress.failed}</div>
                    <div className="metric-label">Failed</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                    >
                        {percentage > 10 && <span className="progress-text">{Math.round(percentage)}%</span>}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="progress-stats" style={{ justifyContent: 'space-between' }}>
                    <div className="stat-item">
                        {getStatusIcon()}
                        <span className="stat-value">{getStatusText()}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Progress:</span>
                        <span className="stat-value">{progress.current} / {progress.total}</span>
                    </div>
                    {progress.sent > 0 && (
                        <div className="stat-item success">
                            <span className="stat-label">Success Rate:</span>
                            <span className="stat-value">{successRate}%</span>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {progress.status === 'completed' && (
                    <div className="status-message success">
                        <FaCheckCircle style={{ marginRight: '8px' }} />
                        Campaign completed successfully! {progress.sent} emails delivered.
                    </div>
                )}

                {progress.status === 'cancelled' && (
                    <div className="status-message warning">
                        <FaExclamationTriangle style={{ marginRight: '8px' }} />
                        Campaign was cancelled. {progress.sent} emails were sent before cancellation.
                    </div>
                )}

                {progress.status === 'error' && (
                    <div className="status-message error">
                        <FaTimesCircle style={{ marginRight: '8px' }} />
                        Campaign encountered an error. Please check logs for details.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressTracker;
