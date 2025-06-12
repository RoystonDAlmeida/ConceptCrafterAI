import { useState, useEffect, ChangeEvent } from 'react';
import { VideoConceptSummary } from '../types';
import { toast } from 'react-toastify';

export const useSummaryForm = (initialSummary: VideoConceptSummary, onSave: (summary: VideoConceptSummary) => Promise<void>) => {
    const [summary, setSummary] = useState<VideoConceptSummary>(initialSummary);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloadingDraft, setIsDownloadingDraft] = useState(false);
    const [durationError, setDurationError] = useState<string | null>(null);

    const validateDuration = (durationStr: string | undefined): string | null => {
        if (!durationStr || durationStr.trim() === '') {
            return "Target duration is required.";
        }
        const minutes = parseFloat(durationStr);
        if (isNaN(minutes)) {
            return "Invalid format. Please enter a number for minutes (e.g., 0.5 or 1).";
        }
        if (minutes <= 0) {
            return "Duration must be greater than 0 minutes.";
        }
        if (minutes > 1) {
            return "Duration cannot exceed 1 minute.";
        }
        return null;
    };

    useEffect(() => {
        setSummary(initialSummary);
        const initialDuration = initialSummary.technicalSpecifications?.targetDuration;
        setDurationError(validateDuration(initialDuration));
    }, [initialSummary]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        if (keys.length === 2) {
            const outerKey = keys[0] as keyof VideoConceptSummary;
            const innerKey = keys[1];

            setSummary(prev => ({
                ...prev,
                [outerKey]: {
                    ...(prev[outerKey] as object),
                    [innerKey]: value,
                },
            }));

            if (outerKey === 'technicalSpecifications' && innerKey === 'targetDuration') {
                setDurationError(validateDuration(value));
            }
        } else if (keys.length === 1) {
            setSummary(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayChange = (fieldName: keyof VideoConceptSummary, index: number, value: string) => {
        setSummary(prev => {
            const field = prev[fieldName];
            if (!Array.isArray(field)) return prev;
            const currentArray = field as string[];
            const newArray = [...currentArray];
            newArray[index] = value;
            return { ...prev, [fieldName]: newArray };
        });
    };

    const handleNestedArrayChange = (outerKey: keyof VideoConceptSummary, innerKey: string, index: number, value: string) => {
        setSummary(prev => {
            const outerObject = prev[outerKey] as any;
            const currentArray = outerObject[innerKey] as string[];
            const newArray = [...currentArray];
            newArray[index] = value;
            return {
                ...prev,
                [outerKey]: {
                    ...outerObject,
                    [innerKey]: newArray,
                },
            } as VideoConceptSummary;
        });
    };

    const addArrayItem = (fieldName: keyof VideoConceptSummary) => {
        setSummary(prev => {
            const field = prev[fieldName];
            if (!Array.isArray(field)) return prev;
            const currentArray = field as string[];
            return { ...prev, [fieldName]: [...currentArray, ''] };
        });
    };

    const removeArrayItem = (fieldName: keyof VideoConceptSummary, index: number) => {
        setSummary(prev => {
            const currentArray = prev[fieldName] as string[];
            const newArray = currentArray.filter((_, i) => i !== index);
            return { ...prev, [fieldName]: newArray };
        });
    };

    const addNestedArrayItem = (outerKey: keyof VideoConceptSummary, innerKey: string) => {
        setSummary(prev => {
            const outerObject = prev[outerKey] as any;
            const currentArray = outerObject[innerKey] as string[];
            return {
                ...prev,
                [outerKey]: {
                    ...outerObject,
                    [innerKey]: [...currentArray, ''],
                },
            } as VideoConceptSummary;
        });
    };

    const removeNestedArrayItem = (outerKey: keyof VideoConceptSummary, innerKey: string, index: number) => {
        setSummary(prev => {
            const outerObject = prev[outerKey] as any;
            const currentArray = outerObject[innerKey] as string[];
            const newArray = currentArray.filter((_, i) => i !== index);
            return {
                ...prev,
                [outerKey]: {
                    ...outerObject,
                    [innerKey]: newArray,
                },
            } as VideoConceptSummary;
        });
    };

    const handleContentStructureChange = (index: number, field: 'section' | 'description', value: string) => {
        setSummary(prev => {
            const newOutline = [...prev.contentStructureOutline];
            newOutline[index] = { ...newOutline[index], [field]: value };
            return { ...prev, contentStructureOutline: newOutline };
        });
    };

    const addContentStructureItem = () => {
        setSummary(prev => ({
            ...prev,
            contentStructureOutline: [...prev.contentStructureOutline, { section: '', description: '' }],
        }));
    };

    const handleDownloadDraftPdf = async () => {
        if (isDownloadingDraft) return;
        setIsDownloadingDraft(true);
        try {
            const response = await fetch('/api/generate-summary-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summary),
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const filename = (summary.videoTitleSuggestion || 'concept_draft').replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
                a.download = `${filename}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const errorData = await response.json().catch(() => ({ message: "Failed to generate PDF." }));
                alert(`Error generating draft PDF: ${errorData.message || response.statusText}`);
            }
        } catch (e) {
            console.error("Error calling PDF generation API:", e);
            alert("An unexpected error occurred while trying to generate the draft PDF.");
        } finally {
            setIsDownloadingDraft(false);
        }
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        const currentDuration = summary.technicalSpecifications?.targetDuration;
        const error = validateDuration(currentDuration);

        if (error) {
            toast.error(error);
            setDurationError(error);
            setIsSaving(false);
            return;
        }
        setDurationError(null);

        try {
            await onSave(summary);
        } catch (error) {
            console.error("Error during save click:", error);
        }
        setIsSaving(false);
    };

    return {
        summary,
        isSaving,
        isDownloadingDraft,
        durationError,
        handleInputChange,
        handleArrayChange,
        handleNestedArrayChange,
        addArrayItem,
        removeArrayItem,
        addNestedArrayItem,
        removeNestedArrayItem,
        handleContentStructureChange,
        addContentStructureItem,
        handleSaveClick,
        handleDownloadDraftPdf
    };
}; 