import { VideoConceptSummary } from '../../types';

interface ContentStructureSectionProps {
    contentStructure: VideoConceptSummary['contentStructureOutline'];
    onChange: (index: number, field: 'section' | 'description', value: string) => void;
    onAddItem: () => void;
}

export function ContentStructureSection({
    contentStructure,
    onChange,
    onAddItem
}: ContentStructureSectionProps) {
    return (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Content Structure Outline</legend>
            {contentStructure.map((item, index) => (
                <div key={index} className="mb-3 p-2 border-b">
                    <label
                        htmlFor={`contentStructureOutline.${index}.section`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Section Title {index + 1}
                    </label>
                    <input
                        type="text"
                        id={`contentStructureOutline.${index}.section`}
                        placeholder="Section Title"
                        value={item.section}
                        onChange={(e) => onChange(index, 'section', e.target.value)}
                        className="w-full p-2 mb-1 border border-gray-300 rounded-md"
                    />
                    <label
                        htmlFor={`contentStructureOutline.${index}.description`}
                        className="block text-sm font-medium text-gray-700 mb-1 mt-1"
                    >
                        Description
                    </label>
                    <textarea
                        id={`contentStructureOutline.${index}.description`}
                        placeholder="Section Description"
                        value={item.description}
                        onChange={(e) => onChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
            ))}
            <button
                onClick={onAddItem}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
            >
                + Add Section
            </button>
        </fieldset>
    );
} 