
/**
 * Adds a section title to the PDF document.
 * @param {PDFKit.PDFDocument} doc - The PDFDocument instance.
 * @param {string} title - The title text.
 */
const addSectionTitle = (doc, title) => {
    doc.fontSize(16).font('Helvetica-Bold').text(title, { underline: false, paragraphGap: 5 });
    doc.moveDown(0.5); // Add some space after the title
};

/**
 * Adds a labeled content text or a list to the PDF document.
 * Handles cases where values might be undefined, null, or empty.
 * @param {PDFKit.PDFDocument} doc - The PDFDocument instance.
 * @param {string} label - The label for the content (e.g., "Core Concept").
 * @param {string | string[] | undefined | null} value - The content value.
 * @param {boolean} [isList=false] - Whether to format the value as a bulleted list.
 */
const addContentText = (doc, label, value, isList = false) => {
    let displayValue = value;
    if (displayValue === undefined || displayValue === null || (Array.isArray(displayValue) && displayValue.length === 0) || (typeof displayValue === 'string' && displayValue.trim() === '')) {
        displayValue = "Not specified";
    }

    if (label) {
        doc.fontSize(11).font('Helvetica-Bold').text(label + ':', { continued: true, paragraphGap: 2 });
        doc.font('Helvetica').text(' ');
    } else {
        doc.fontSize(11).font('Helvetica');
    }

    if (isList && Array.isArray(displayValue)) {
        const listItems = displayValue.map(item => String(item || "N/A"));
        if (listItems.length > 0 && !(listItems.length === 1 && listItems[0] === "Not specified")) {
            doc.list(listItems, { bulletRadius: 1.5, textIndent: 10, paragraphGap: 1 });
        } else {
            doc.font('Helvetica').text(label ? "Not specified" : "Not specified", { paragraphGap: 5, continued: false });
        }
    } else if (Array.isArray(displayValue)) {
        doc.font('Helvetica').text(displayValue.map(item => String(item || "N/A")).join(', ') || "Not specified", { paragraphGap: 5, continued: false });
    } else {
        doc.font('Helvetica').text(String(displayValue), { paragraphGap: 5, continued: false });
    }
    doc.moveDown(0.5);
};

module.exports = {
    addSectionTitle,
    addContentText,
};