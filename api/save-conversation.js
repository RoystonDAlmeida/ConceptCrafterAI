const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// --- Firebase Admin SDK Initialization ---
// Ensure this part is configured correctly for your environment.
// It's common to initialize it once.
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.error("Firebase Admin SDK environment variables not fully set.");
      throw new Error("Firebase Admin SDK environment variables are not properly configured.");
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // This error will prevent Firestore operations.
  }
}

const db = admin.apps.length ? admin.firestore() : null;
// --- End Firebase Admin SDK Initialization ---

app.post('/api/save-conversation', async (req, res) => {
  if (!db) {
    console.error('Firebase Admin SDK not initialized. Cannot process request.');
    return res.status(500).json({ success: false, error: 'Server configuration error: Firebase not initialized.' });
  }

  try {
    const { sessionId, messages, conceptData } = req.body;

    // Basic validation
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Invalid payload: "sessionId" string is required.' });
    }
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid payload: "messages" array is required.' });
    }
    if (!conceptData || typeof conceptData !== 'object') {
      // Allow conceptData to be empty object, but must be an object
      return res.status(400).json({ error: 'Invalid payload: "conceptData" object is required.' });
    }

    // Reference the document using the sessionId
    const conversationRef = db.collection('completed_conversations').doc(sessionId);

    // Prepare data for Firestore
    const dataToSave = {
      sessionId: sessionId, // Store sessionId as a field as well for easier querying
      messages: messages, // Array of message objects
      conceptData: conceptData, // Object containing concept data
      completedAt: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
    };

    // Save the data
    await conversationRef.set(dataToSave);

    console.log(`Conversation ${sessionId} saved successfully.`);
    return res.status(200).json({ success: true, message: 'Conversation saved successfully.' });

  } catch (error) {
    console.error('Error saving conversation to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return res.status(500).json({ success: false, error: 'Failed to save conversation.', details: errorMessage });
  }
});

// Export the app for Vercel or similar serverless environments.
// For local direct execution (e.g., node api/save-conversation.js), we'll add a listen call.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
    const PORT = process.env.SAVE_CONVERSATION_PORT || 3002; // Use a different port than gemini-chat if running separately
    app.listen(PORT, () => {
        console.log(`[Local Dev] Save Conversation backend listening on port ${PORT}.`);
    });
}

module.exports = app;