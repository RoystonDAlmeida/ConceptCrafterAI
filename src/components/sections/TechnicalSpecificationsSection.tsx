import { ChangeEvent } from 'react';
import { VideoConceptSummary } from '../../types';

interface TechnicalSpecificationsSectionProps {
    technicalSpecifications: VideoConceptSummary['technicalSpecifications'];
    durationError: string | null;
    onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function TechnicalSpecificationsSection({
    technicalSpecifications,
    durationError,
    onInputChange
}: TechnicalSpecificationsSectionProps) {
    return (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Technical Specifications</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label
                        htmlFor="technicalSpecifications.resolution"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Resolution
                    </label>
                    <input
                        type="text"
                        id="technicalSpecifications.resolution"
                        name="technicalSpecifications.resolution"
                        value={technicalSpecifications?.resolution || ''}
                        onChange={onInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 1920x1080"
                    />
                </div>
                <div>
                    <label
                        htmlFor="technicalSpecifications.aspectRatio"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Aspect Ratio
                    </label>
                    <input
                        type="text"
                        id="technicalSpecifications.aspectRatio"
                        name="technicalSpecifications.aspectRatio"
                        value={technicalSpecifications?.aspectRatio || ''}
                        onChange={onInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., 16:9"
                    />
                </div>
                <div className="md:col-span-2">
                    <label
                        htmlFor="technicalSpecifications.targetDuration"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Target Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="technicalSpecifications.targetDuration"
                        name="technicalSpecifications.targetDuration"
                        value={technicalSpecifications?.targetDuration || ''}
                        onChange={onInputChange}
                        className={`w-full p-2 border ${durationError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="e.g., 0.5 (for 30s), max 1"
                    />
                    {durationError && (
                        <p className="text-red-600 text-xs mt-1">{durationError}</p>
                    )}
                </div>
            </div>
        </fieldset>
    );
} 