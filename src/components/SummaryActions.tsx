import React from 'react';
import { VideoConceptSummary } from '../types';

interface SummaryActionsProps {
    summary: VideoConceptSummary;
    isApproved: boolean;
    isPreviewingPdf: boolean;
    onEdit: () => void;
    onPreviewPdf: () => void;
    onDownloadPdf: () => void;
    onReEdit: () => void;
}

export const SummaryActions: React.FC<SummaryActionsProps> = ({
    summary,
    isApproved,
    isPreviewingPdf,
    onEdit,
    onPreviewPdf,
    onDownloadPdf,
    onReEdit,
}) => {
    return (
        <div className="bg-indigo-50 p-3 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-indigo-700 mb-2">Video Concept Summary:</h3>
            <p className="text-sm text-gray-700 truncate"><strong>Title:</strong> {summary.videoTitleSuggestion}</p>
            <p className="text-sm text-gray-700 truncate"><strong>Concept:</strong> {summary.coreConcept}</p>

            {!isApproved ? (
                <div className="mt-3 space-x-2">
                    <button
                        onClick={onEdit}
                        className="text-sm bg-yellow-500 text-white hover:bg-yellow-600 font-medium px-3 py-1.5 rounded shadow hover:shadow-md transition-all"
                    >
                        Review & Edit Summary
                    </button>
                </div>
            ) : (
                <div className="mt-4 pt-3 border-t border-indigo-200">
                    <p className="text-sm text-green-600 font-semibold mb-2">Summary Approved!</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onPreviewPdf}
                            disabled={isPreviewingPdf}
                            className="text-sm bg-blue-500 text-white hover:bg-blue-600 font-medium px-3 py-1.5 rounded shadow hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {isPreviewingPdf ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                </span>
                            ) : ('Preview PDF')}
                        </button>
                        <button
                            onClick={onDownloadPdf}
                            className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 font-medium px-3 py-1.5 rounded shadow hover:shadow-md transition-all"
                        >
                            Finalize & Download PDF
                        </button>
                        <button
                            onClick={onReEdit}
                            className="text-sm bg-yellow-500 text-white hover:bg-yellow-600 font-medium px-3 py-1.5 rounded shadow hover:shadow-md transition-all"
                        >
                            Re-Edit Summary
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};