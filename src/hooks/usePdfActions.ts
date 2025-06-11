import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { VideoConceptSummary } from '../types';

export const usePdfActions = () => {
    const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);

    const handlePreviewPdf = useCallback(async (summary: VideoConceptSummary | null) => {
        if (!summary) {
            setPdfError("No summary available to preview.");
            toast.error("No summary available to preview.");
            return;
        }
        if (isPreviewingPdf) return;

        setPdfError(null);
        setIsPreviewingPdf(true);

        if (pdfPreviewUrl) {
            window.URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }

        try {
            const response = await fetch('/api/generate-summary-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summary),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `PDF generation failed: ${response.statusText}` }));
                throw new Error(errorData.message || `PDF generation failed: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setPdfPreviewUrl(url);
        } catch (error: any) {
            const errorMessage = `Failed to preview PDF: ${error.message}`;
            setPdfError(errorMessage);
            toast.error(errorMessage);
            setPdfPreviewUrl(null);
        } finally {
            setIsPreviewingPdf(false);
        }
    }, [isPreviewingPdf, pdfPreviewUrl]);

    const handleDownloadFinalPdf = useCallback(async (summary: VideoConceptSummary | null) => {
        if (!summary) {
            setPdfError("No summary available to download.");
            toast.error("No summary available to download.");
            return;
        }
        setPdfError(null);

        try {
            const response = await fetch('/api/generate-summary-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summary),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: "Failed to process PDF." }));
                throw new Error(errData.error || `Failed to download PDF. Status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = (summary.videoTitleSuggestion || 'final_concept').replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Final PDF downloaded successfully!");
        } catch (error: any) {
            const errorMessage = `Failed to download PDF: ${error.message}`;
            setPdfError(errorMessage);
            toast.error(errorMessage);
        }
    }, []);

    const handleClosePdfPreview = useCallback(() => {
        if (pdfPreviewUrl) {
            window.URL.revokeObjectURL(pdfPreviewUrl);
        }
        setPdfPreviewUrl(null);
        setPdfError(null); // Clear PDF error when closing preview
    }, [pdfPreviewUrl]);

    return {
        isPreviewingPdf,
        pdfPreviewUrl,
        pdfError,
        handlePreviewPdf,
        handleDownloadFinalPdf,
        handleClosePdfPreview,
        clearPdfError: useCallback(() => setPdfError(null), []),
    };
};