import { useState } from 'react';
import { FaCheckCircle, FaCloudUploadAlt, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { uploadFile } from '../services/api';

const FileUpload = ({ label, accept, onUploadSuccess, id }) => {
    const [fileName, setFileName] = useState('No file selected');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setStatus('uploading');
        setFileName('Uploading...');

        try {
            const result = await uploadFile(file);
            setFileName(result.filename);
            setStatus('success');
            onUploadSuccess(result.path);
        } catch (error) {
            setFileName('Upload failed');
            setStatus('error');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-section">
            <label className="upload-label">{label}</label>
            <div className="file-upload">
                <input
                    type="file"
                    id={id}
                    accept={accept}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="file-input"
                />
                <label htmlFor={id} className="file-label">
                    <FaCloudUploadAlt /> Choose File
                </label>
                <span className={`file-name status-${status}`}>
                    {status === 'uploading' && <FaSpinner className="spin" />}
                    {status === 'success' && <FaCheckCircle />}
                    {status === 'error' && <FaTimesCircle />}
                    {' '}{fileName}
                </span>
            </div>
        </div>
    );
};

export default FileUpload;
