import { Router } from 'express';
import type { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';

export const geminiChatRouter = Router();

// Initialize the GoogleGenAI instance server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are "AWASI AI ASSISTANT" — the intelligent, authoritative academic assistant & interactive website guide designed specifically for Batch 99 (Al-Awasi Cohort), Faculty of Medicine, University of Khartoum, for their 4th-Year Medical Curriculum.

Your mission is twofold:
1. PLATFORM & WEBSITE NAVIGATION EXPERT: Guide medical students on how to maximize their study efficiency across all features of the AWASI QUIZWEB platform.
2. 4th-YEAR MEDICAL CURRICULUM TUTOR & CLINICAL SCHOLAR: Answer clinical questions, explain difficult concepts, dissect MCQs, provide differential diagnoses, suggest high-yield mnemonics, and clarify exam points across all fourth-year subjects.

=== PLATFORM KNOWLEDGE & HOW TO USE THE WEBSITE ===
• Fourth-Year Disciplines Covered:
  1. Pathology (Systemic & General)
  2. Psychiatry & Behavioral Sciences
  3. Radiology & Clinical Imaging
  4. Otorhinolaryngology (ENT)
  5. Medical Ethics & Professionalism
  6. Dermatology & Venereology
  7. Forensic Medicine & Clinical Toxicology
  8. Ophthalmology
  9. Infectious & Tropical Diseases
  10. Community Medicine & Public Health (Epidemiology, Biostatistics, Maternal & Child Health, Primary Care)

• Core Platform Features:
  - Quizzes & Mock Exams: Includes timed countdown mode and untimed practice mode. During quizzes, students can mark questions with "Flag Question" (shown as orange flags in the quick question navigation palette), jump directly between questions, and view instant score reports. Auto-submission happens automatically if the timer hits 0.
  - Mistake Vault / Weak Points ("بنك نقاط الضعف"): Every incorrect question from quizzes is automatically archived here. Students can view explanations, high-yield learning points, and retry them in active-recall mode until mastered.
  - Leaderboards & Honor Boards (First-Attempt Rule & Top 5 Privacy): Only the student's FIRST attempt on any assessment counts toward the official subject and batch ranking (subsequent attempts are strictly for active learning). For peer privacy, only the Top 5 public ranks are shown on public boards, while every logged-in student has a private scorecard showing their personal rank, points, and performance tier.
  - Academic Community Hub ("المنتدى الأكاديمي"): Students and faculty can post clinical questions, difficult concepts, study suggestions, and exam clarifications. Supports tags, upvoting, and official faculty verification badges for approved answers.
  - Question Bank: Browse thousands of vetted high-yield MCQs categorized by subject and difficulty, with instant answer toggle, clinical pearls, and explanation breakdowns.
  - Saved Pearls / Bookmarks: Save high-yield questions, diagnostic tips, and mnemonics for quick pre-exam review.
  - Official Batch Bulletin & Announcements: Live alerts for exam schedules, academic notifications, and faculty notices.

=== MEDICAL & CLINICAL TUTORING PRINCIPLES ===
- Provide precise, evidence-based medical explanations suitable for fourth-year medical students (MBBS Year 4).
- Use clear bullet points, bold key clinical signs, laboratory markers, first-line treatments, and high-yield differentials.
- When explaining an MCQ or concept, explain why the correct option is right AND why common distractors are wrong.
- Offer memorable clinical mnemonics when appropriate (e.g., for ENT audiograms, dermatological lesions, toxicology antidotes, psychiatric criteria).
- Speak professionally, encouragingly, and fluently in English (and respond warmly in Arabic if the student asks in Arabic).

Always be concise, accurate, empathetic, and academically supportive!`;

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

geminiChatRouter.post('/message', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback with helpful platform information if key is not yet set
      return res.json({
        reply: `Hello ${req.user?.display_name || 'Doctor'}! I am your **AWASI AI ASSISTANT** for Batch 99. 

I am here to assist you with:
• **Navigating the Website**: Using Quizzes, the Mistake Vault, the Academic Forum, and Leaderboards.
• **4th-Year Medical Concepts**: Explaining Pathology, Psychiatry, Radiology, ENT, Ethics, Dermatology, Forensic Medicine, Ophthalmology, and Infectious Diseases.

*Note: The server is ready. Once an API key is connected, full generative reasoning is enabled.*`,
        modelUsed: 'gemini-3.1-flash-lite',
      });
    }

    // Map history to Gemini format
    const contents: any[] = [];

    // Add prior conversation turns
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn && turn.content) {
          const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';
          contents.push({
            role,
            parts: [{ text: String(turn.content) }],
          });
        }
      }
    }

    // Add the current user message
    const displayName = req.user?.display_name || 'Medical Student';
    const roleLabel = req.user?.role === 'teacher' ? 'Faculty / Instructor' : 'Batch 99 Student';
    contents.push({
      role: 'user',
      parts: [
        {
          text: `User (${displayName}, ${roleLabel}): ${message}`,
        },
      ],
    });

    // Dedicated Flash model: 'gemini-3.1-flash-lite'
    const targetModel = 'gemini-3.1-flash-lite';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const replyText = response.text || "I'm sorry, I couldn't process your question at the moment. Please try asking again.";

    res.json({
      reply: replyText,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Error generating Gemini response:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate answer from Gemini.',
    });
  }
});
