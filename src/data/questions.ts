export const questions = [
  {
    id: "concept-main",
    text: "What's the main concept or idea you'd like to develop into a video?",
    category: "conceptDetails",
    followUpQuestions: [
      "Could you elaborate a bit more on that concept?",
      "What specific aspects would you like to highlight in this video?"
    ]
  },
  {
    id: "visual-style",
    text: "How would you describe the visual style you're looking for? (e.g., minimalist, vibrant, corporate, artistic)",
    category: "visualStyle",
    followUpQuestions: [
      "Are there any specific visual references or examples that inspire you?",
      "Would you prefer 2D animation, 3D, live action, or a mix?"
    ]
  },
  {
    id: "target-audience",
    text: "Who is the target audience for this video?",
    category: "targetAudience",
    followUpQuestions: [
      "What age range are you primarily targeting?",
      "Any specific demographics or interests that are important?"
    ]
  },
  {
    id: "key-messages",
    text: "What are the key messages or points you want to communicate?",
    category: "keyMessages",
    followUpQuestions: [
      "Is there a specific call-to-action you want to include?",
      "What's the most important takeaway for viewers?"
    ]
  },
  {
    id: "mood-tone",
    text: "What mood or emotional tone should the video have?",
    category: "moodTone",
    followUpQuestions: [
      "Should the tone be formal, casual, inspirational, or something else?",
      "Are there any emotions you specifically want to evoke in viewers?"
    ]
  },
]

export const initialMessage = {
  id: "welcome",
  text: "Hi there! I'm your concept generation assistant. I'll help you develop your video idea by asking a few questions. Let's get started!"
}