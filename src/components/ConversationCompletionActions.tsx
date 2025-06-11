import React from 'react';
import { VideoConceptSummary } from '../types';
import { SummaryActions } from './SummaryActions';

interface ConversationCompletionActionsProps {
    isConversationProcessingComplete: boolean;
    videoSummary: VideoConceptSummary | null;
    isSummarizing: boolean;
    summaryError: string | null;
    saveSummaryError: string | null; 
    pdfError: string | null; 
    isSummaryApproved: boolean;
    isPreviewingPdf: boolean; 
    onGenerateConceptSummary: () => void;
    onEditSummary: () => void;
    onPreviewPdf: () => void;
    onDownloadPdf: () => void;
    onReEditSummary: () => void;
    onStartNewConversation: () => void;
}

export const ConversationCompletionActions: React.FC<ConversationCompletionActionsProps> = ({
    isConversationProcessingComplete,
    videoSummary,
    isSummarizing,
    summaryError,
    saveSummaryError,
    pdfError,
    isSummaryApproved,
    isPreviewingPdf,
    onGenerateConceptSummary,
    onEditSummary,
    onPreviewPdf,
    onDownloadPdf,
    onReEditSummary,
    onStartNewConversation,
}) => {
    const displayError = saveSummaryError || pdfError;

    return (
        <div className="p-4 border-t border-indigo-200 space-y-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-xl">
            {isConversationProcessingComplete && !videoSummary && !isSummarizing && !summaryError && (
                <button
                    onClick={onGenerateConceptSummary}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2.5 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md font-medium"
                >
                    Generate Concept Summary
                </button>
            )}

            {!isConversationProcessingComplete && !isSummarizing && !summaryError && (
                <div className="text-center py-2.5 text-indigo-500 text-sm">
                    Processing conversation, please wait...
                </div>
            )}

            {isSummarizing && (
                <div className="text-center py-2.5 text-indigo-700 font-medium">
                    Generating summary...
                    <div className="flex justify-center items-center space-x-1 mt-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0s]" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                </div>
            )}

            {summaryError && !isSummarizing && (
                <div className="text-center text-red-600 bg-red-50 p-3 rounded-md text-sm">
                    <p className="font-semibold">Error generating summary:</p>
                    <p>{summaryError}</p>
                </div>
            )}

            {videoSummary && !isSummarizing && (
                <SummaryActions
                    summary={videoSummary}
                    isApproved={isSummaryApproved}
                    isPreviewingPdf={isPreviewingPdf}
                    onEdit={onEditSummary}
                    onPreviewPdf={onPreviewPdf}
                    onDownloadPdf={onDownloadPdf}
                    onReEdit={onReEditSummary}
                />
            )}

            {displayError && (
                <div className="text-center text-red-600 bg-red-50 p-2 rounded-md text-xs mt-3">{displayError}</div>
            )}
            
            <button
                onClick={onStartNewConversation}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md font-medium"
            >
                Start New Conversation
            </button>
        </div>
    );
};