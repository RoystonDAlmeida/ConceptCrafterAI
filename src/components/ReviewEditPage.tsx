import { useState, useEffect, ChangeEvent } from 'react';
import { VideoConceptSummary } from '../types';
import { toast } from 'react-toastify';

interface ReviewEditPageProps {
    initialSummary: VideoConceptSummary;
    onSave: (updatedSummary: VideoConceptSummary) => Promise<void>; // Optional: To save draft changes to Firestore & update App state
    onApprove?: (approvedSummary: VideoConceptSummary) => Promise<void>; // No longer primary, onSave handles approval flow
    onCancel: () => void; // To exit edit mode
}

export function ReviewEditPage({ initialSummary, onSave, onCancel }: ReviewEditPageProps) {
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
        return null; // No error
    };

    useEffect(() => {
        // If the initialSummary prop changes (e.g., fetched again), update the local state
        setSummary(initialSummary);
        // Validate initial duration
        const initialDuration = initialSummary.technicalSpecifications?.targetDuration;
        setDurationError(validateDuration(initialDuration));
    }, [initialSummary]); // validateDuration can be memoized with useCallback if needed

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        if (keys.length === 2) { // Handles nested properties like targetAudience.description or technicalSpecifications.targetDuration
            const outerKey = keys[0] as keyof VideoConceptSummary;
            const innerKey = keys[1];

            setSummary(prev => ({
                ...prev,
                [outerKey]: {
                    ...(prev[outerKey] as object), // Assumes outerKey refers to an object in summary
                    [innerKey]: value,
                },
            }));

            // Specifically validate targetDuration when its input value changes
            if (outerKey === 'technicalSpecifications' && innerKey === 'targetDuration') {
                setDurationError(validateDuration(value));
            }
        } else if (keys.length === 1) { // Handles top-level properties like videoTitleSuggestion
            setSummary(prev => ({ ...prev, [name]: value }));
        }
        // The previous 'else if (keys.length === 3 ...)' block was not correctly
        // handling the 'technicalSpecifications.targetDuration' input (which has keys.length === 2)
        // and has been removed for clarity as no current inputs match that 3-level structure.
    };

    const handleArrayChange = (fieldName: keyof VideoConceptSummary, index: number, value: string) => {
        setSummary(prev => {
            const field = prev[fieldName];
            if (!Array.isArray(field)) return prev; // Should not happen if types are correct
            const currentArray = field as string[]; // Type assertion
            const newArray = [...currentArray];
            newArray[index] = value;
            return { ...prev, [fieldName]: newArray };
        });
    };
    
    const handleNestedArrayChange = (outerKey: keyof VideoConceptSummary, innerKey: string, index: number, value: string) => {
        setSummary(prev => {
            const outerObject = prev[outerKey] as any; // Use 'any' for simplicity here, or create a more specific type
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
        // This function uses the current state of 'summary' from this component
        // to generate a draft PDF for the user to review their edits.
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
        setDurationError(null); // Clear error if validation passes

        try {
            await onSave(summary); // onSave is updateSummaryInFirestore from App.tsx
            // The parent (App.tsx) will handle closing the modal and showing a toast
        } catch (error) {
            console.error("Error during save click:", error);
            // Toast for save failure is handled in App.tsx's updateSummaryInFirestore
        }
        setIsSaving(false);
    };

    const formatTimestamp = (timestamp: any): string => {
        // Return 'Not available' if the timestamp is null, undefined, or an empty string
        if (!timestamp) return 'Not available';

        let date: Date | undefined;

        // 1. Firestore Timestamp object (if it's passed directly client-side)
        if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        }
        // 2. Object with 'seconds' and 'nanoseconds' (common API serialization)
        else if (typeof timestamp === 'object' && timestamp !== null && typeof timestamp.seconds === 'number') {
            const nanoseconds = typeof timestamp.nanoseconds === 'number' ? timestamp.nanoseconds : 0;
            date = new Date(timestamp.seconds * 1000 + nanoseconds / 1000000);
        }
        // 3. Object with '_seconds' and '_nanoseconds' (as seen in your console log)
        else if (typeof timestamp === 'object' && timestamp !== null && typeof (timestamp as any)._seconds === 'number') {
            const secs = (timestamp as any)._seconds;
            const nanos = typeof (timestamp as any)._nanoseconds === 'number' ? (timestamp as any)._nanoseconds : 0;
            date = new Date(secs * 1000 + nanos / 1000000);
        }
        // 4. String (ISO or other formats) or number (milliseconds since epoch)
        else if (typeof timestamp === 'string' || (typeof timestamp === 'number' && !isNaN(timestamp))) {
            try {
                const parsedDate = new Date(timestamp);
                // Check if parsing resulted in a valid date
                if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
                    date = parsedDate;
                } else if (typeof timestamp === 'string') {
                    console.warn("formatTimestamp: `new Date()` resulted in an invalid date for string input:", timestamp);
                }
            } catch (e) {
                console.warn("formatTimestamp: Error parsing date string/number:", timestamp, e);
            }
        } else {
            // Log unexpected formats for debugging
            console.warn("formatTimestamp: Received value in an unexpected format:", timestamp);
        }

        // Final check and return
        if (date instanceof Date && !isNaN(date.getTime())) {
            const day = date.getDate();
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${day} ${month} ${year}, ${hours}:${minutes}`;
        } else {
            return 'Invalid date format';
        }
    };

    // Basic form structure - you'll want to make this more comprehensive
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-lg my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 text-center">Review & Edit Concept</h2>
                {summary.lastUpdatedAt && <p className="text-xs text-gray-500">Last modified: {formatTimestamp(summary.lastUpdatedAt)}</p>}
            </div>
            
            <div className="space-y-6">
                <div>
                    <label htmlFor="videoTitleSuggestion" className="block text-sm font-medium text-gray-700 mb-1">Video Title Suggestion</label>
                    <input
                        type="text"
                        name="videoTitleSuggestion"
                        id="videoTitleSuggestion"
                        value={summary.videoTitleSuggestion}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label htmlFor="coreConcept" className="block text-sm font-medium text-gray-700 mb-1">Core Concept</label>
                    <textarea
                        name="coreConcept"
                        id="coreConcept"
                        rows={4}
                        value={summary.coreConcept}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Target Audience */}
                <fieldset className="border border-gray-300 p-4 rounded-md">
                    <legend className="text-lg font-medium text-gray-800 px-2">Target Audience</legend>
                    <div className="space-y-3 mt-2">
                        <div className="mb-2">
                            <label htmlFor="targetAudience.description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea name="targetAudience.description" value={summary.targetAudience.description} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Key Takeaways</label>
                            {summary.targetAudience?.keyTakeaways?.map((takeaway, index) => (
                                <div key={index} className="flex items-center mb-1">
                                    <input 
                                        type="text" 
                                        id={`targetAudience.keyTakeaways.${index}`}
                                        value={takeaway} 
                                        onChange={(e) => handleNestedArrayChange('targetAudience', 'keyTakeaways', index, e.target.value)} 
                                        className="w-full p-2 border border-gray-300 rounded-md mr-2"
                                    />
                                    <button 
                                        onClick={() => removeNestedArrayItem('targetAudience', 'keyTakeaways', index)} 
                                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => addNestedArrayItem('targetAudience', 'keyTakeaways')} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1">+ Add Takeaway</button>
                        </div>
                    </div>
                </fieldset>

                {/* Key Messages - Similar structure for editing arrays */}
                <fieldset className="border border-gray-300 p-4 rounded-md">
                     <legend className="text-lg font-medium text-gray-800 px-2">Key Messages</legend>
                     {summary.keyMessages.map((msg, index) => (
                        <div key={index} className="flex items-center mb-1">
                            <input type="text" id={`keyMessages.${index}`} value={msg} onChange={(e) => handleArrayChange('keyMessages', index, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mr-2" placeholder={`Key Message ${index + 1}`}/>
                            <button onClick={() => removeArrayItem('keyMessages', index)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        </div>
                     ))}
                     <button onClick={() => addArrayItem('keyMessages')} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1">+ Add Key Message</button>
                </fieldset>

                {/* Visual Elements - Example for nested object */}
                 <fieldset className="border border-gray-300 p-4 rounded-md">
                    <legend className="text-lg font-medium text-gray-800 px-2">Visual Elements</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div><label htmlFor="visualElements.style" className="block text-sm font-medium text-gray-700 mb-1">Style</label><input type="text" id="visualElements.style" name="visualElements.style" value={summary.visualElements.style} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                        <div><label htmlFor="visualElements.moodTone" className="block text-sm font-medium text-gray-700 mb-1">Mood & Tone</label><input type="text" id="visualElements.moodTone" name="visualElements.moodTone" value={summary.visualElements.moodTone} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                        <div className="md:col-span-2"><label htmlFor="visualElements.colorPalette" className="block text-sm font-medium text-gray-700 mb-1">Color Palette</label><input type="text" id="visualElements.colorPalette" name="visualElements.colorPalette" value={summary.visualElements.colorPalette} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/></div>
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagery Suggestions</label>
                        {summary.visualElements?.imagerySuggestions?.map((suggestion, index) => (
                             <div key={index} className="flex items-center mb-1">
                                <input 
                                    type="text" 
                                    id={`visualElements.imagerySuggestions.${index}`}
                                    value={suggestion} 
                                    onChange={(e) => handleNestedArrayChange('visualElements', 'imagerySuggestions', index, e.target.value)} 
                                    className="w-full p-2 border border-gray-300 rounded-md mr-2"
                                />
                                <button onClick={() => removeNestedArrayItem('visualElements', 'imagerySuggestions', index)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">Remove</button>
                            </div>
                        ))}
                        <button onClick={() => addNestedArrayItem('visualElements', 'imagerySuggestions')} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1">+ Add Imagery Suggestion</button>
                    </div>
                </fieldset>

                {/* Content Structure Outline */}
                <fieldset className="border border-gray-300 p-4 rounded-md">
                    <legend className="text-lg font-medium text-gray-800 px-2">Content Structure Outline</legend>
                    {summary.contentStructureOutline.map((item, index) => (
                        <div key={index} className="mb-3 p-2 border-b">
                            <label htmlFor={`contentStructureOutline.${index}.section`} className="block text-sm font-medium text-gray-700 mb-1">Section Title {index + 1}</label>
                            <input type="text" id={`contentStructureOutline.${index}.section`} placeholder="Section Title" value={item.section} onChange={(e) => handleContentStructureChange(index, 'section', e.target.value)} className="w-full p-2 mb-1 border border-gray-300 rounded-md"/>
                            <label htmlFor={`contentStructureOutline.${index}.description`} className="block text-sm font-medium text-gray-700 mb-1 mt-1">Description</label>
                            <textarea id={`contentStructureOutline.${index}.description`} placeholder="Section Description" value={item.description} onChange={(e) => handleContentStructureChange(index, 'description', e.target.value)} rows={2} className="w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                    ))}
                    <button onClick={addContentStructureItem} className="text-sm text-indigo-600 hover:text-indigo-800 mt-1">+ Add Section</button>
                </fieldset>

                {/* Technical Specifications */}
                <fieldset className="border border-gray-300 p-4 rounded-md">
                    <legend className="text-lg font-medium text-gray-800 px-2">Technical Specifications</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div><label htmlFor="technicalSpecifications.resolution" className="block text-sm font-medium text-gray-700 mb-1">Resolution</label><input type="text" id="technicalSpecifications.resolution" name="technicalSpecifications.resolution" value={summary.technicalSpecifications?.resolution || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., 1920x1080"/></div>
                        <div><label htmlFor="technicalSpecifications.aspectRatio" className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label><input type="text" id="technicalSpecifications.aspectRatio" name="technicalSpecifications.aspectRatio" value={summary.technicalSpecifications?.aspectRatio || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., 16:9"/></div>
                        <div className="md:col-span-2">
                            <label htmlFor="technicalSpecifications.targetDuration" className="block text-sm font-medium text-gray-700 mb-1">
                                Target Duration (minutes) <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="technicalSpecifications.targetDuration" 
                                name="technicalSpecifications.targetDuration" 
                                value={summary.technicalSpecifications?.targetDuration || ''} 
                                onChange={handleInputChange} 
                                className={`w-full p-2 border ${durationError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`} 
                                placeholder="e.g., 0.5 (for 30s), max 1"
                            />
                            {durationError && <p className="text-red-600 text-xs mt-1">{durationError}</p>}
                        </div>
                    </div>
                </fieldset>

                <div>
                    <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea name="additionalNotes" id="additionalNotes" rows={3} value={summary.additionalNotes} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md"/>
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button onClick={onCancel} disabled={isSaving || isDownloadingDraft} className="order-last sm:order-first flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-70">Cancel</button>
                <button onClick={handleDownloadDraftPdf} disabled={isSaving || isDownloadingDraft || !!durationError} className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {isDownloadingDraft ? 'Downloading...' : 'Download Draft PDF'}
                </button>
                <button onClick={handleSaveClick} disabled={isSaving || isDownloadingDraft || !!durationError} className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}