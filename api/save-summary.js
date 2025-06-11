// /api/save-summary.js

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Admin SDK Initialization ---
// Ensure this part is configured correctly for your environment.
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.error("Firebase Admin SDK environment variables not fully set for save-summary.");
      throw new Error("Firebase Admin SDK environment variables are not properly configured.");
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully for save-summary.");
  } catch (error) {
    console.error('Firebase Admin SDK initialization error in save-summary:', error);
  }
}

const db = admin.apps.length ? admin.firestore() : null;
// --- End Firebase Admin SDK Initialization ---

app.post('/api/save-summary', async (req, res) => {
    if (!db) {
        console.error('Firebase Admin SDK not initialized for save-summary. Cannot process request.');
        return res.status(500).json({ success: false, error: 'Server configuration error: Firebase not initialized.' });
    }

    const { sessionId, summary } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid payload: "sessionId" string is required.' });
    }
    if (!summary || typeof summary !== 'object' || summary === null) {
        return res.status(400).json({ success: false, error: 'Invalid payload: "summary" object is required.' });
    }

    try {
        const summaryRef = db.collection('summarized_conversations').doc(sessionId);
        const dataToSave = {
            ...summary, // Spread the summary object received from the client
            sessionId: sessionId,

            // If summary object from client might already have savedAt, preserve it on first save, otherwise set new.
            savedAt: summary.savedAt || admin.firestore.FieldValue.serverTimestamp(), 
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await summaryRef.set(dataToSave);
        const updatedDoc = await summaryRef.get(); // Fetch the updated document

        console.log(`Summary for session ${sessionId} saved successfully to 'summarized_conversations'.`);
        // Return the updated document data, which will include server-generated timestamps
        return res.status(200).json({ success: true, message: 'Summary saved successfully.', data: updatedDoc.data() });
    } catch (error) {
        console.error('Error saving summary to Firebase:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
        return res.status(500).json({ success: false, error: 'Failed to save summary.', details: errorMessage });
    }
});

// Export the app for Vercel or similar serverless environments.
module.exports = app;