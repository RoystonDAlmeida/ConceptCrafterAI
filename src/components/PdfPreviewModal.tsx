import React from 'react';

interface PdfPreviewModalProps {
    pdfUrl: string;
    onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ pdfUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col z-50 p-4">
            <div className="mb-4 flex justify-end">
                <button
                    onClick={onClose}
                    className="bg-white text-gray-800 hover:bg-gray-200 font-semibold py-2 px-4 rounded shadow transition-colors"
                >
                    Close Preview
                </button>
            </div>
            <iframe src={pdfUrl} className="w-full h-full flex-1 border-0" title="PDF Preview"></iframe>
        </div>
    );
};