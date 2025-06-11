// generate-summary-pdf.js

// Import the pdfkit library for PDF generation
const PDFDocument = require('pdfkit');
const { addSectionTitle, addContentText } = require('./utils/pdfHelpers');

// --- Vercel Serverless Function Handler ---
// This function will be executed when a request hits the /api/generate-summary-pdf endpoint.
module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const summary = req.body;

        // Basic validation for the summary data
        if (!summary || !summary.videoTitleSuggestion) {
            return res.status(400).json({ error: 'Invalid summary data provided. "videoTitleSuggestion" is missing.' });
        }

        // Create a new PDF document instance
        const doc = new PDFDocument({
            size: 'A4', // Standard A4 paper size
            margins: { top: 50, bottom: 50, left: 72, right: 72 }, // Standard 1-inch margins
            bufferPages: true, // Recommended for streaming and complex documents
        });

        // Sanitize the video title for use as a filename
        const filename = (summary.videoTitleSuggestion || 'concept_summary')
            .replace(/[^a-z0-9_.-]/gi, '_') // Allow alphanumeric, underscore, dot, hyphen
            .toLowerCase();

        // Set HTTP headers for PDF download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF document stream directly to the HTTP response.
        doc.pipe(res);

        // --- Populate PDF Content ---

        // Document Title (centered)
        doc.fontSize(24).font('Helvetica-Bold').text(summary.videoTitleSuggestion, { align: 'center' });
        doc.moveDown(2); // Add more space after the main title

        // Section: Concept Overview
        addSectionTitle(doc, 'Concept Overview');
        addContentText(doc, 'Core Concept', summary.coreConcept);
        if (summary.targetAudience) {
            addContentText(doc, 'Target Audience', summary.targetAudience.description);
            addContentText(doc, 'Key Takeaways for Audience', summary.targetAudience.keyTakeaways, true);
        } else {
            addContentText(doc, 'Target Audience', 'Not specified');
        }
        doc.moveDown(1);

        // Section: Visual Direction
        addSectionTitle(doc, 'Visual Direction');
        if (summary.visualElements) {
            addContentText(doc, 'Style', summary.visualElements.style);
            addContentText(doc, 'Mood & Tone', summary.visualElements.moodTone);
            addContentText(doc, 'Color Palette', summary.visualElements.colorPalette);
            addContentText(doc, 'Imagery Suggestions', summary.visualElements.imagerySuggestions, true);
        } else {
            addContentText(doc, 'Visual Elements', 'Not specified');
        }
        doc.moveDown(1);

        // Section: Key Narrative Points
        addSectionTitle(doc, 'Key Narrative Points');
        addContentText(doc, 'Key Messages', summary.keyMessages, true);

        // Subsection: Content Structure Outline
        doc.fontSize(12).font('Helvetica-Bold').text('Content Structure Outline:', { paragraphGap: 3 });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);
        if (summary.contentStructureOutline && summary.contentStructureOutline.length > 0) {
            summary.contentStructureOutline.forEach(item => {
                doc.font('Helvetica-Bold').text(`Section: ${item.section || 'N/A'}`, { paragraphGap: 1 });
                doc.font('Helvetica').text(`Description: ${item.description || 'N/A'}`, { paragraphGap: 3, indent: 15 });
                doc.moveDown(0.3);
            });
        } else {
            doc.text('Not specified', { indent: 15 });
        }
        doc.moveDown(1);

        // Section: Technical Specifications (Placeholders - to be defined and captured)
        addSectionTitle(doc, 'Technical Specifications for Video Generation');
        addContentText(doc, 'Resolution', summary.technicalSpecifications?.resolution || 'e.g., 1920x1080');
        addContentText(doc, 'Aspect Ratio', summary.technicalSpecifications?.aspectRatio || 'e.g., 16:9');
        addContentText(doc, 'Target Duration(in minutes)', summary.technicalSpecifications?.targetDuration || 'e.g., 1-2 minutes');
        // Add more technical specifications as needed from summary.technicalSpecifications
        doc.moveDown(1);

        // Section: Additional Notes
        if (summary.additionalNotes && 
            typeof summary.additionalNotes === 'string' && // Ensure it's a string
            summary.additionalNotes.toLowerCase() !== 'not specified' && 
            summary.additionalNotes.trim() !== '') {
            addSectionTitle(doc, 'Additional Notes');
            addContentText(doc, '', summary.additionalNotes); // No label for a general notes section
        }
        doc.moveDown(1);

        // --- PDF Metadata ---
        doc.info.Title = summary.videoTitleSuggestion;
        doc.info.Author = 'ConceptCrafterAI'; // Or your application's name
        doc.info.Subject = `Video Concept Summary: ${summary.coreConcept ? summary.coreConcept.substring(0, 50) : 'N/A'}...`;
        doc.info.Keywords = `video concept, ${summary.targetAudience?.description || ''}, ${summary.keyMessages?.join(', ') || ''}`;

        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF summary.', details: error.message });
        } else {
            console.error('PDF generation failed after headers were sent. The client may receive a corrupted file.');
            if (!res.writableEnded) {
                res.end(); // Attempt to close the stream if an error occurs mid-stream
            }
        }
    }
};
