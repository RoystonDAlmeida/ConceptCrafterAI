import { ChangeEvent } from 'react';
import { VideoConceptSummary } from '../../types';

interface TargetAudienceSectionProps {
    targetAudience: VideoConceptSummary['targetAudience'];
    onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onArrayChange: (outerKey: keyof VideoConceptSummary, innerKey: string, index: number, value: string) => void;
    onAddItem: (outerKey: keyof VideoConceptSummary, innerKey: string) => void;
    onRemoveItem: (outerKey: keyof VideoConceptSummary, innerKey: string, index: number) => void;
}

export function TargetAudienceSection({
    targetAudience,
    onInputChange,
    onArrayChange,
    onAddItem,
    onRemoveItem
}: TargetAudienceSectionProps) {
    return (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Target Audience</legend>
            <div className="space-y-3 mt-2">
                <div className="mb-2">
                    <label htmlFor="targetAudience.description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        name="targetAudience.description"
                        value={targetAudience.description}
                        onChange={onInputChange}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Takeaways</label>
                    {targetAudience?.keyTakeaways?.map((takeaway, index) => (
                        <div key={index} className="flex items-center mb-1">
                            <input
                                type="text"
                                id={`targetAudience.keyTakeaways.${index}`}
                                value={takeaway}
                                onChange={(e) => onArrayChange('targetAudience', 'keyTakeaways', index, e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md mr-2"
                            />
                            <button
                                onClick={() => onRemoveItem('targetAudience', 'keyTakeaways', index)}
                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onAddItem('targetAudience', 'keyTakeaways')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                    >
                        + Add Takeaway
                    </button>
                </div>
            </div>
        </fieldset>
    );
} 