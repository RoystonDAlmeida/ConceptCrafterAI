import { VideoConceptSummary } from '../../types';

interface KeyMessagesSectionProps {
    keyMessages: string[];
    onArrayChange: (fieldName: keyof VideoConceptSummary, index: number, value: string) => void;
    onAddItem: (fieldName: keyof VideoConceptSummary) => void;
    onRemoveItem: (fieldName: keyof VideoConceptSummary, index: number) => void;
}

export function KeyMessagesSection({
    keyMessages,
    onArrayChange,
    onAddItem,
    onRemoveItem
}: KeyMessagesSectionProps) {
    return (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Key Messages</legend>
            {keyMessages.map((msg, index) => (
                <div key={index} className="flex items-center mb-1">
                    <input
                        type="text"
                        id={`keyMessages.${index}`}
                        value={msg}
                        onChange={(e) => onArrayChange('keyMessages', index, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mr-2"
                        placeholder={`Key Message ${index + 1}`}
                    />
                    <button
                        onClick={() => onRemoveItem('keyMessages', index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                    >
                        Remove
                    </button>
                </div>
            ))}
            <button
                onClick={() => onAddItem('keyMessages')}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
            >
                + Add Key Message
            </button>
        </fieldset>
    );
} 