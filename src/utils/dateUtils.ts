export const formatTimestamp = (timestamp: any): string => {
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