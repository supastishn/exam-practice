// js/utils.js - Helper functions

const Utils = (() => {
    const formatDate = (date) => {
        // Simple date formatter
        return new Date(date).toLocaleDateString('en-US');
    };

    // List of common contraction pairs. Each pair consists of an "expanded" form and a "contracted" form.
    // This list helps in recognizing different forms of the same expression.
    const contractionPairs = [
        { expanded: "is not", contracted: "isn't" },
        { expanded: "are not", contracted: "aren't" },
        { expanded: "was not", contracted: "wasn't" },
        { expanded: "were not", contracted: "weren't" },
        { expanded: "have not", contracted: "haven't" },
        { expanded: "has not", contracted: "hasn't" },
        { expanded: "had not", contracted: "hadn't" },
        { expanded: "do not", contracted: "don't" },
        { expanded: "does not", contracted: "doesn't" },
        { expanded: "did not", contracted: "didn't" },
        { expanded: "will not", contracted: "won't" },
        { expanded: "would not", contracted: "wouldn't" },
        { expanded: "should not", contracted: "shouldn't" },
        { expanded: "can not", contracted: "can't" }, // "can not" (two words)
        { expanded: "cannot", contracted: "can't" },   // "cannot" (one word)
        { expanded: "could not", contracted: "couldn't" },
        { expanded: "must not", contracted: "mustn't" },
        
        { expanded: "i am", contracted: "i'm" },
        { expanded: "you are", contracted: "you're" },
        { expanded: "he is", contracted: "he's" },
        { expanded: "she is", contracted: "she's" },
        { expanded: "it is", contracted: "it's" },
        { expanded: "we are", contracted: "we're" },
        { expanded: "they are", contracted: "they're" },

        { expanded: "i will", contracted: "i'll" },
        { expanded: "you will", contracted: "you'll" },
        { expanded: "he will", contracted: "he'll" },
        { expanded: "she will", contracted: "she'll" },
        { expanded: "it will", contracted: "it'll" },
        { expanded: "we will", contracted: "we'll" },
        { expanded: "they will", contracted: "they'll" },

        { expanded: "i would", contracted: "i'd" }, // Also "i had"
        { expanded: "you would", contracted: "you'd" }, // Also "you had"
        { expanded: "he would", contracted: "he'd" },   // Also "he had"
        { expanded: "she would", contracted: "she'd" }, // Also "she had"
        { expanded: "we would", contracted: "we'd" },   // Also "we had"
        { expanded: "they would", contracted: "they'd" }, // Also "they had"
        // Note: For "he'd", "she'd" etc. meaning "he had", the AI should ideally provide "he had" if that specific meaning is required.
        // This list primarily helps make answer checking more lenient for common verb forms.

        { expanded: "i have", contracted: "i've" },
        { expanded: "you have", contracted: "you've" },
        { expanded: "we have", contracted: "we've" },
        { expanded: "they have", contracted: "they've" },
        
        { expanded: "who is", contracted: "who's" }, // Also "who has"
        { expanded: "what is", contracted: "what's" }, // Also "what has"
        { expanded: "where is", contracted: "where's" }, // Also "where has"
        { expanded: "when is", contracted: "when's" }, // Also "when has"
        { expanded: "why is", contracted: "why's" }, // Also "why has"
        { expanded: "how is", contracted: "how's" }, // Also "how has"
        
        { expanded: "that is", contracted: "that's" }, // Also "that has"
        { expanded: "there is", contracted: "there's" } // Also "there has"
        // Consider "it has" -> "it's" but this is less common in simple exercises compared to "it is" -> "it's".
        // Possessive "its" is different and not handled here.
    ];

    /**
     * Returns an array of equivalent forms for a given text, including common contractions.
     * E.g., "is not" -> ["is not", "isn't"], and "isn't" -> ["isn't", "is not"].
     * If no contraction is found, returns an array with the original text.
     * The comparison is case-insensitive.
     * @param {string} text The input text.
     * @returns {string[]} An array of equivalent string forms.
     */
    const getEquivalentForms = (text) => {
        if (typeof text !== 'string') return [];
        const lowerText = text.toLowerCase();
        const forms = [lowerText]; // Start with the original (lowercased) text

        for (const pair of contractionPairs) {
            if (pair.expanded === lowerText && !forms.includes(pair.contracted)) {
                forms.push(pair.contracted);
            }
            if (pair.contracted === lowerText && !forms.includes(pair.expanded)) {
                forms.push(pair.expanded);
            }
        }
        return forms;
    };

    /**
     * Extracts the last word from a given text string.
     * Strips common trailing punctuation before extracting.
     * @param {string} text The input text.
     * @returns {string} The last word, or an empty string if no word is found.
     */
    const getLastWord = (text) => {
        if (typeof text !== 'string' || !text.trim()) {
            return '';
        }
        // Remove common trailing punctuation, then trim
        const cleanedText = text.replace(/[.,!?;:]+$/, '').trim();
        if (!cleanedText) return '';
        
        const words = cleanedText.split(/\s+/);
        return words[words.length - 1];
    };

    /**
     * Returns a copy of the internal contraction pairs.
     * @returns {Array<Object>} A list of contraction pair objects.
     */
    const getContractionPairs = () => {
        // Return a copy to prevent external modification of the original array
        return JSON.parse(JSON.stringify(contractionPairs));
    };

    const customMarkdownParse = (text) => {
        if (typeof text !== 'string') return '';

        // 1. Escape HTML characters for security
        let html = text.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&#039;');

        // Markdown parsing for bold and italic
        // Process in order: bold+italic, then bold, then italic to handle overlaps correctly.
        // This approach avoids negative lookbehinds for better browser compatibility.

        // 1. Bold + Italic: ***text*** or ___text___
        html = html.replace(/\*{3}(.*?)\*{3}/g, '<strong><em>$1</em></strong>')
                   .replace(/_{3}(.*?)_{3}/g, '<strong><em>$1</em></strong>');
        
        // 2. Bold: **text** or __text__ (after bold+italic has been processed)
        html = html.replace(/\*{2}(.*?)\*{2}/g, '<strong>$1</strong>')
                   .replace(/_{2}(.*?)_{2}/g, '<strong>$1</strong>');

        // 3. Italic: *text* or _text_ (after bold+italic and bold have been processed)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
                   .replace(/_(.*?)_/g, '<em>$1</em>');
        
        // 4. Inline code: `text`
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // 5. Strikethrough: ~~text~~
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Process line-based elements like headings, HRs, and lists
        const lines = html.split('\n');
        let inUl = false;
        let inOl = false;
        const processedLines = [];

        for (let i = 0; i < lines.length; i++) {
            let currentLine = lines[i];

            // 6. Headings: # H1, ## H2, ..., ###### H6
            // Must be at the start of the line.
            let headingMatch = currentLine.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                if (inUl) { processedLines.push('</ul>'); inUl = false; }
                if (inOl) { processedLines.push('</ol>'); inOl = false; }
                const level = headingMatch[1].length;
                processedLines.push(`<h${level}>${headingMatch[2]}</h${level}>`);
                continue; // Move to next line
            }

            // 7. Horizontal Rule: --- or *** or ___ (three or more)
            // Must be the only thing on the line (optionally surrounded by spaces)
            if (currentLine.match(/^\s*([-*_]){3,}\s*$/)) {
                if (inUl) { processedLines.push('</ul>'); inUl = false; }
                if (inOl) { processedLines.push('</ol>'); inOl = false; }
                processedLines.push('<hr>');
                continue; // Move to next line
            }
            
            // 8. Lists (simple line-based processing)
            const ulMatch = currentLine.match(/^(\s*[-*+]\s+)(.*)/);
            const olMatch = currentLine.match(/^(\s*\d+\.\s+)(.*)/);

            if (ulMatch) {
                if (inOl) {
                    processedLines.push('</ol>');
                    inOl = false;
                }
                if (!inUl) {
                    processedLines.push('<ul>');
                    inUl = true;
                }
                processedLines.push('<li>' + ulMatch[2] + '</li>');
            } else if (olMatch) {
                if (inUl) {
                    processedLines.push('</ul>');
                    inUl = false;
                }
                if (!inOl) {
                    processedLines.push('<ol>');
                    inOl = true;
                }
                processedLines.push('<li>' + olMatch[2] + '</li>');
            } else {
                // If not a list item, close any open lists
                if (inUl) {
                    processedLines.push('</ul>');
                    inUl = false;
                }
                if (inOl) {
                    processedLines.push('</ol>');
                    inOl = false;
                }
                // Only push non-empty lines or lines that are not just whitespace
                // to avoid creating <br> tags for empty lines between block elements.
                // However, newlines within a paragraph should still be converted.
                // This logic might need refinement if we want to treat consecutive non-list, non-heading lines as paragraphs.
                // For now, every remaining line becomes a line with a <br> if it's not empty.
                if (currentLine.trim() !== '') {
                    processedLines.push(currentLine);
                } else {
                    // Preserve empty lines between blocks as a single <br> if desired,
                    // or filter them out. Current logic will make them <br> due to final join and replace.
                    // Let's push them so they become <br> tags.
                    processedLines.push(currentLine); 
                }
            }
        }
        // Close any open lists at the end of the text
        if (inUl) processedLines.push('</ul>');
        if (inOl) processedLines.push('</ol>');
        
        html = processedLines.join('\n');

        // 9. Newlines to <br>
        // This should ideally be smarter, e.g., not adding <br> inside <pre> or after <h1> etc.
        // For now, it's a global replacement.
        // We also want to avoid multiple <br> tags for already separated blocks.
        // Let's refine this: only replace \n if it's not already part of a block structure ending.
        // A simpler approach for now: replace all newlines.
        // This might add extra <br> after </ul>, </ol>, </hN>, <hr>.
        // Consider wrapping non-block lines in <p> tags instead.
        // For now, keeping the simple newline to <br> conversion.
        html = html.replace(/\n/g, '<br>\n');

        return html;
    };


    // Could add functions for:
    // - Debouncing/throttling
    // - Generating unique IDs
    // - etc.

    const copyToClipboard = (text, successMessage = 'Copied to clipboard!') => {
        if (!navigator.clipboard) {
            alert('Clipboard API not available in this browser.');
            return Promise.reject('Clipboard API not available');
        }
        return navigator.clipboard.writeText(text)
            .then(() => {
                if (successMessage) alert(successMessage);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text. See console for details.');
                throw err; // Re-throw for further handling if needed
            });
    };

    const printElement = (element) => {
        if (!element) {
            console.error("Element to print is not provided.");
            return;
        }
        // This is a very basic print. A more robust solution might involve
        // creating a print-specific stylesheet or opening a new window.
        const printContents = element.innerHTML;
        const originalContents = document.body.innerHTML;
        
        // Create a temporary iframe to print from to avoid disrupting the main page too much
        const iframe = document.createElement('iframe');
        iframe.style.height = '0';
        iframe.style.width = '0';
        iframe.style.position = 'absolute';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        // Attempt to carry over stylesheets
        Array.from(document.styleSheets).forEach(styleSheet => {
            try {
                const cssText = Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
                const styleElement = iframeDoc.createElement('style');
                styleElement.appendChild(iframeDoc.createTextNode(cssText));
                iframeDoc.head.appendChild(styleElement);
            } catch (e) {
                // Catch potential CORS issues with external stylesheets
                if (styleSheet.href) {
                    const linkElement = iframeDoc.createElement('link');
                    linkElement.rel = 'stylesheet';
                    linkElement.type = styleSheet.type;
                    linkElement.href = styleSheet.href;
                    iframeDoc.head.appendChild(linkElement);
                }
                console.warn("Could not copy stylesheet rules directly:", e);
            }
        });
        
        iframeDoc.write('<html><head><title>Print</title></head><body>' + printContents + '</body></html>');
        iframeDoc.close();
        
        iframe.contentWindow.focus(); // Required for some browsers
        iframe.contentWindow.print();
        
        // Clean up
        document.body.removeChild(iframe);
        
        // The reload was disruptive; removing it.
        // If event listeners or state are lost, specific re-initialization might be needed,
        // but printing from an iframe should minimize disruption.
        // window.location.reload(); 
    };

    const escapeHtml = (unsafe) => {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };

    return {
        formatDate,
        getEquivalentForms,
        getLastWord,
        getContractionPairs,
        customMarkdownParse,
        copyToClipboard,
        printElement,
        escapeHtml
    };
})();
