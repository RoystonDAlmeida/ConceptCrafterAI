import { VideoConceptSummary } from '../types';
import { TargetAudienceSection } from './sections/TargetAudienceSection';
import { KeyMessagesSection } from './sections/KeyMessagesSection';
import { VisualElementsSection } from './sections/VisualElementsSection';
import { ContentStructureSection } from './sections/ContentStructureSection';
import { TechnicalSpecificationsSection } from './sections/TechnicalSpecificationsSection';
import { useSummaryForm } from '../hooks/useSummaryForm';
import { formatTimestamp } from '../utils/dateUtils';

interface ReviewEditPageProps {
    initialSummary: VideoConceptSummary;
    onSave: (updatedSummary: VideoConceptSummary) => Promise<void>;
    onCancel: () => void;
}

export function ReviewEditPage({ initialSummary, onSave, onCancel }: ReviewEditPageProps) {
    const {
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
    } = useSummaryForm(initialSummary, onSave);

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-lg my-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 text-center">Review & Edit Concept</h2>
                {summary.lastUpdatedAt && (
                    <p className="text-xs text-gray-500">
                        Last modified: {formatTimestamp(summary.lastUpdatedAt)}
                    </p>
                )}
            </div>
            
            <div className="space-y-6">
                {/* Basic Information */}
                <div>
                    <label htmlFor="videoTitleSuggestion" className="block text-sm font-medium text-gray-700 mb-1">
                        Video Title Suggestion
                    </label>
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
                    <label htmlFor="coreConcept" className="block text-sm font-medium text-gray-700 mb-1">
                        Core Concept
                    </label>
                    <textarea
                        name="coreConcept"
                        id="coreConcept"
                        rows={4}
                        value={summary.coreConcept}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Section Components */}
                <TargetAudienceSection
                    targetAudience={summary.targetAudience}
                    onInputChange={handleInputChange}
                    onArrayChange={handleNestedArrayChange}
                    onAddItem={addNestedArrayItem}
                    onRemoveItem={removeNestedArrayItem}
                />

                <KeyMessagesSection
                    keyMessages={summary.keyMessages}
                    onArrayChange={handleArrayChange}
                    onAddItem={addArrayItem}
                    onRemoveItem={removeArrayItem}
                />

                <VisualElementsSection
                    visualElements={summary.visualElements}
                    onInputChange={handleInputChange}
                    onArrayChange={handleNestedArrayChange}
                    onAddItem={addNestedArrayItem}
                    onRemoveItem={removeNestedArrayItem}
                />

                <ContentStructureSection
                    contentStructure={summary.contentStructureOutline}
                    onChange={handleContentStructureChange}
                    onAddItem={addContentStructureItem}
                />

                <TechnicalSpecificationsSection
                    technicalSpecifications={summary.technicalSpecifications}
                    durationError={durationError}
                    onInputChange={handleInputChange}
                />

                <div>
                    <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                    </label>
                    <textarea
                        name="additionalNotes"
                        id="additionalNotes"
                        rows={3}
                        value={summary.additionalNotes}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                    onClick={onCancel}
                    disabled={isSaving || isDownloadingDraft}
                    className="order-last sm:order-first flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-70"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDownloadDraftPdf}
                    disabled={isSaving || isDownloadingDraft || !!durationError}
                    className="flex-1 bg-blue-500 text-white py-2.5 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isDownloadingDraft ? 'Downloading...' : 'Download Draft PDF'}
                </button>
                <button
                    onClick={handleSaveClick}
                    disabled={isSaving || isDownloadingDraft || !!durationError}
                    className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}