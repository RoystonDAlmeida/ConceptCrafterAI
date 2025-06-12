import { ChangeEvent } from 'react';
import { VideoConceptSummary } from '../../types';

interface VisualElementsSectionProps {
    visualElements: VideoConceptSummary['visualElements'];
    onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onArrayChange: (outerKey: keyof VideoConceptSummary, innerKey: string, index: number, value: string) => void;
    onAddItem: (outerKey: keyof VideoConceptSummary, innerKey: string) => void;
    onRemoveItem: (outerKey: keyof VideoConceptSummary, innerKey: string, index: number) => void;
}

export function VisualElementsSection({
    visualElements,
    onInputChange,
    onArrayChange,
    onAddItem,
    onRemoveItem
}: VisualElementsSectionProps) {
    return (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Visual Elements</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="visualElements.style" className="block text-sm font-medium text-gray-700 mb-1">
                        Style
                    </label>
                    <input
                        type="text"
                        id="visualElements.style"
                        name="visualElements.style"
                        value={visualElements.style}
                        onChange={onInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="visualElements.moodTone" className="block text-sm font-medium text-gray-700 mb-1">
                        Mood & Tone
                    </label>
                    <input
                        type="text"
                        id="visualElements.moodTone"
                        name="visualElements.moodTone"
                        value={visualElements.moodTone}
                        onChange={onInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="visualElements.colorPalette" className="block text-sm font-medium text-gray-700 mb-1">
                        Color Palette
                    </label>
                    <input
                        type="text"
                        id="visualElements.colorPalette"
                        name="visualElements.colorPalette"
                        value={visualElements.colorPalette}
                        onChange={onInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>
            <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagery Suggestions</label>
                {visualElements?.imagerySuggestions?.map((suggestion, index) => (
                    <div key={index} className="flex items-center mb-1">
                        <input
                            type="text"
                            id={`visualElements.imagerySuggestions.${index}`}
                            value={suggestion}
                            onChange={(e) => onArrayChange('visualElements', 'imagerySuggestions', index, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mr-2"
                        />
                        <button
                            onClick={() => onRemoveItem('visualElements', 'imagerySuggestions', index)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => onAddItem('visualElements', 'imagerySuggestions')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                >
                    + Add Imagery Suggestion
                </button>
            </div>
        </fieldset>
    );
} 