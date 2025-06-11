import { useEffect, useState, useCallback } from 'react';
import { useConversation } from './hooks/useConversation';
import { ChatInput } from './components/ChatInput';
import { Header } from './components/Header';
import { ReviewEditPage } from './components/ReviewEditPage';
import type { VideoConceptSummary } from './types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import sub components
import { usePdfActions } from './hooks/usePdfActions';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { ChatArea } from './components/ChatArea';
import { SafetyResetUI } from './components/SafetyResetUI';
import { ConversationCompletionActions } from './components/ConversationCompletionActions';

function App() {
    const {
        messages,
        isTyping,
        conversationComplete,
        handleSubmit: handleChatMessageSubmit,
        handleStartOver: handleConversationStartOver,
        currentQuestionIndex,
        showSafetyResetButton,

        // Destructure new summarization states and function
        videoSummary,
        isSummarizing,
        summaryError,
        generateConceptSummary,

        sessionId, 
        isConversationProcessingComplete,
        setVideoSummary,
    } = useConversation();

    // State for managing the summary editing and approval UI flow
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [isSummaryApproved, setIsSummaryApproved] = useState(false);
    const [approvedSummaryForPdf, setApprovedSummaryForPdf] = useState<VideoConceptSummary | null>(null);
    
    // State for errors primarily from summary saving operations
    const [saveSummaryError, setSaveSummaryError] = useState<string | null>(null);

    // PDF related actions and state are managed by this custom hook
    const {
        isPreviewingPdf,
        pdfPreviewUrl,
        pdfError,
        handlePreviewPdf,
        handleDownloadFinalPdf,
        handleClosePdfPreview,
        clearPdfError,
    } = usePdfActions();

    // Initialize with AI welcome message
    useEffect(() => {
        handleConversationStartOver();
    }, []);

    /**
     * Callback to process a newly generated or updated summary.
     * It sets the summary for display and PDF actions, and resets UI flags
     * to ensure the user is directed to the review step first.
     */
    const onSummaryGeneratedOrUpdated = useCallback((summary: VideoConceptSummary) => {
        setVideoSummary(summary);
        setApprovedSummaryForPdf(summary); // Set this for PDF actions
        setIsSummaryApproved(false);
        setIsEditingSummary(false);       // Ensure edit mode is off
        clearPdfError(); // Clear any previous PDF errors
    }, [setVideoSummary, clearPdfError]);

    // This useEffect will handle setting the approved state after initial summary generation
    useEffect(() => { 
        if (videoSummary && !isSummarizing && !summaryError && !isEditingSummary && !isSummaryApproved) { onSummaryGeneratedOrUpdated(videoSummary); } 
    }, [videoSummary, isSummarizing, summaryError, isEditingSummary, isSummaryApproved, onSummaryGeneratedOrUpdated]);

    // This function will now be the primary way to save/update the summary in Firestore.
    const updateSummaryInFirestore = async (summaryToSave: VideoConceptSummary) => {
        setSaveSummaryError(null);
        console.log(`Updating summary in Firestore for session ${sessionId}:`, summaryToSave);
        try {
            const response = await fetch('/api/save-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: sessionId, summary: summaryToSave }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: "Failed to save summary."}));
                throw new Error(errData.error || "Failed to save summary to Firestore.");
            }

            const result = await response.json();
            console.log("Summary successfully updated in Firestore.");

            // Use the data returned from the server, which includes the server-generated timestamps
            setVideoSummary(result.data as VideoConceptSummary); 
            setApprovedSummaryForPdf(result.data as VideoConceptSummary); 
            setIsSummaryApproved(true); // Mark as "approved" after review & save, enabling PDF options
            setIsEditingSummary(false); // Close the edit page

            toast.success("Changes saved successfully!");
        } catch (error: any) {
            console.error("Error saving summary changes:", error);
            const errMsg = `Failed to save changes: ${error.message}`;

            setSaveSummaryError(errMsg);
            toast.error(errMsg);
            throw error; 
        }
    };

    // Wrapper function to handle full start over, including App-specific UI states
    const handleFullStartOver = useCallback(() => {
        handleConversationStartOver();

        setIsEditingSummary(false);
        setIsSummaryApproved(false);
        setApprovedSummaryForPdf(null);
        setSaveSummaryError(null);
        
        handleClosePdfPreview(); // Also closes PDF preview and clears its errors
    }, [handleConversationStartOver, handleClosePdfPreview]);

    // Dynamic padding for the main content area
    const getMainContentPaddingBottom = () => {
        if (!conversationComplete && !showSafetyResetButton) return '5rem'; // Chat input visible
        if (conversationComplete && !videoSummary && !showSafetyResetButton && !isEditingSummary && !isSummaryApproved) return '6rem'; // Space for generate summary button
        
        return '1rem';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex flex-col">
            <Header />
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
            
            {/* Main Content Area - paddingBottom is dynamically adjusted */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-4" 
                 style={{ 
                    paddingBottom: getMainContentPaddingBottom()
                 }}>
                
                {pdfPreviewUrl ? (
                    <PdfPreviewModal pdfUrl={pdfPreviewUrl} onClose={handleClosePdfPreview} />
                ) : isEditingSummary && videoSummary ? (
                    <ReviewEditPage
                        initialSummary={videoSummary}
                        onSave={updateSummaryInFirestore} // "Save Changes" in ReviewEditPage calls this
                        onCancel={() => { setIsEditingSummary(false); setSaveSummaryError(null); handleClosePdfPreview(); }}
                    />
                ) : (
                <>
                    <ChatArea
                        messages={messages}
                        isTyping={isTyping}
                        currentQuestionIndex={currentQuestionIndex}
                    />

                    {/* Conditional UI for post-chat actions or safety reset */}
                    <div className="mt-4 flex-shrink-0">
                        {showSafetyResetButton ? (
                            <SafetyResetUI onStartNewConversation={handleFullStartOver} />
                        ) : conversationComplete ? (
                            <ConversationCompletionActions
                                isConversationProcessingComplete={isConversationProcessingComplete}
                                videoSummary={videoSummary}
                                isSummarizing={isSummarizing}
                                summaryError={summaryError}
                                saveSummaryError={saveSummaryError} 
                                pdfError={pdfError} 
                                isSummaryApproved={isSummaryApproved}
                                isPreviewingPdf={isPreviewingPdf}
                                onGenerateConceptSummary={generateConceptSummary}
                                onEditSummary={() => setIsEditingSummary(true)}
                                onPreviewPdf={() => handlePreviewPdf(approvedSummaryForPdf)}
                                onDownloadPdf={() => handleDownloadFinalPdf(approvedSummaryForPdf)}
                                onReEditSummary={() => {
                                    setIsEditingSummary(true);
                                    setIsSummaryApproved(false);
                                }}
                                onStartNewConversation={handleFullStartOver}
                            />
                        ) : null}
                    </div>
                </>
                )}
            </div>
            
            {/* Chat Input - Fixed at bottom of screen */}
            {/* Show input if conversation is not complete AND no safety reset button is active */}
            {!conversationComplete && !showSafetyResetButton && ( 
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent">
                    <div className="max-w-4xl mx-auto w-full px-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-purple-700 p-2">
                            <ChatInput 
                                onSubmit={handleChatMessageSubmit} 
                                isTyping={isTyping} 
                                showSafetyResetButton={showSafetyResetButton} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;