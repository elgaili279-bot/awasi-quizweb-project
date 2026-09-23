import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  BookOpen,
  Sparkles,
  Layers,
  FileCheck,
  Check,
  X
} from 'lucide-react';
import { Quiz, Question, Subject, QuestionType, QuizDifficulty } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface QuizBuilderProps {
  quizId?: string | null;
  onExit: () => void;
  onSuccess: (quizId: string) => void;
}

interface ChoiceDraft {
  id: string;
  choice_text: string;
  is_correct: boolean;
  explanation: string;
}

interface QuestionDraft {
  id: string;
  type: QuestionType;
  prompt: string;
  clinical_vignette: {
    patient_age?: number;
    patient_sex?: 'Male' | 'Female' | 'Other';
    chief_complaint?: string;
    history?: string;
    examination?: string;
    laboratory?: string;
    imaging?: string;
  };
  choices: ChoiceDraft[];
  explanation: string;
  learning_point: string;
  reference: string;
  difficulty: QuizDifficulty;
  topic_id?: string;
  points: number;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ quizId, onExit, onSuccess }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'preview' | 'publish'>('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Basic Information
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(quizId || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Intermediate');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [instructions, setInstructions] = useState('Select the single best answer for each clinical scenario.');
  const [status, setStatus] = useState<string>('draft');

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Preview state
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string[]>>({});

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const subs = await api.getSubjects();
        setSubjects(subs.subjects);

        if (subs.subjects.length > 0 && !subjectId) {
          setSubjectId(subs.subjects[0].id);
        }

        if (quizId) {
          const res = await api.getQuizById(quizId);
          const q = res.quiz;
          setCurrentQuizId(q.id);
          setTitle(q.title);
          setDescription(q.description || '');
          setSubjectId(q.subject_id);
          setTopicId(q.topic_id || '');
          setDifficulty(q.difficulty);
          setTimeLimitMinutes(q.time_limit_minutes || 0);
          setInstructions(q.instructions || '');
          setStatus(q.status);

          // Convert backend questions to draft format
          const mappedQuestions: QuestionDraft[] = res.questions.map((ques) => ({
            id: ques.id,
            type: ques.type,
            prompt: ques.prompt,
            clinical_vignette: ques.clinical_vignette || {},
            explanation: ques.explanation || '',
            learning_point: ques.learning_point || '',
            reference: ques.reference || '',
            difficulty: ques.difficulty || 'Intermediate',
            topic_id: ques.topic_id || '',
            points: ques.points || 1,
            choices: ques.choices.map((c) => ({
              id: c.id,
              choice_text: c.choice_text,
              is_correct: !!c.is_correct,
              explanation: c.explanation || '',
            })),
          }));

          setQuestions(mappedQuestions);
        } else {
          // Initialize with 1 default question
          setQuestions([createBlankQuestion()]);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load quiz details.', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [quizId]);

  function createBlankQuestion(): QuestionDraft {
    return {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'sba',
      prompt: '',
      clinical_vignette: {},
      explanation: '',
      learning_point: '',
      reference: '',
      difficulty: 'Intermediate',
      points: 1,
      choices: [
        { id: 'c1_' + Math.random().toString(36).substring(2, 7), choice_text: '', is_correct: true, explanation: '' },
        { id: 'c2_' + Math.random().toString(36).substring(2, 7), choice_text: '', is_correct: false, explanation: '' },
        { id: 'c3_' + Math.random().toString(36).substring(2, 7), choice_text: '', is_correct: false, explanation: '' },
        { id: 'c4_' + Math.random().toString(36).substring(2, 7), choice_text: '', is_correct: false, explanation: '' },
      ],
    };
  }

  // Question manipulation
  const handleAddQuestion = () => {
    const newQ = createBlankQuestion();
    setQuestions((prev) => [...prev, newQ]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleDuplicateQuestion = (index: number) => {
    const qToCopy = questions[index];
    const duplicated: QuestionDraft = {
      ...qToCopy,
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      choices: qToCopy.choices.map((c) => ({
        ...c,
        id: 'c_' + Math.random().toString(36).substring(2, 7),
      })),
    };
    setQuestions((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
    setSelectedQuestionIndex(index + 1);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      showToast('A quiz must have at least one question.', 'info');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setSelectedQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setSelectedQuestionIndex(targetIndex);
  };

  const updateCurrentQuestion = (field: keyof QuestionDraft, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[selectedQuestionIndex] = { ...copy[selectedQuestionIndex], [field]: value };
      return copy;
    });
  };

  const updateVignetteField = (field: string, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const current = copy[selectedQuestionIndex];
      copy[selectedQuestionIndex] = {
        ...current,
        clinical_vignette: { ...current.clinical_vignette, [field]: value },
      };
      return copy;
    });
  };

  const handleAddChoice = () => {
    setQuestions((prev) => {
      const copy = [...prev];
      const current = copy[selectedQuestionIndex];
      const newChoice: ChoiceDraft = {
        id: 'c_' + Math.random().toString(36).substring(2, 7),
        choice_text: '',
        is_correct: false,
        explanation: '',
      };
      copy[selectedQuestionIndex] = { ...current, choices: [...current.choices, newChoice] };
      return copy;
    });
  };

  const handleDeleteChoice = (choiceIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const current = copy[selectedQuestionIndex];
      if (current.choices.length <= 2) {
        showToast('Each question must have at least 2 answer choices.', 'info');
        return prev;
      }
      const updatedChoices = current.choices.filter((_, i) => i !== choiceIndex);
      copy[selectedQuestionIndex] = { ...current, choices: updatedChoices };
      return copy;
    });
  };

  const updateChoice = (choiceIndex: number, field: keyof ChoiceDraft, value: any) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const current = copy[selectedQuestionIndex];
      const choicesCopy = [...current.choices];

      if (field === 'is_correct' && (current.type === 'sba' || current.type === 'true_false')) {
        // Only one can be correct
        choicesCopy.forEach((c, i) => {
          c.is_correct = i === choiceIndex ? !!value : false;
        });
      } else {
        choicesCopy[choiceIndex] = { ...choicesCopy[choiceIndex], [field]: value };
      }

      copy[selectedQuestionIndex] = { ...current, choices: choicesCopy };
      return copy;
    });
  };

  // Run full validation
  const validateQuiz = (): string[] => {
    const errors: string[] = [];

    if (!title.trim()) errors.push('Quiz Title is required.');
    if (!subjectId) errors.push('Subject must be selected.');
    if (questions.length === 0) errors.push('Quiz must contain at least 1 question.');

    questions.forEach((q, idx) => {
      const num = idx + 1;
      if (!q.prompt.trim()) {
        errors.push(`Item #${num}: Question prompt is empty.`);
      }
      if (q.choices.length < 2) {
        errors.push(`Item #${num}: Must have at least 2 answer choices.`);
      }
      const emptyChoices = q.choices.some((c) => !c.choice_text.trim());
      if (emptyChoices) {
        errors.push(`Item #${num}: All answer choices must have text.`);
      }
      const hasCorrect = q.choices.some((c) => c.is_correct);
      if (!hasCorrect) {
        errors.push(`Item #${num}: Must designate at least one correct answer.`);
      }
      if (!q.explanation.trim()) {
        errors.push(`Item #${num}: Clinical explanation is recommended for students.`);
      }
    });

    return errors;
  };

  // Save Quiz as Draft or Published
  const handleSaveQuiz = async (publishAfterSave = false) => {
    setSaving(true);
    try {
      const quizPayload = {
        title: title.trim(),
        description: description.trim(),
        subject_id: subjectId,
        topic_id: topicId || null,
        difficulty,
        time_limit_minutes: Number(timeLimitMinutes) || 0,
        instructions: instructions.trim(),
      };

      let savedQuizId = currentQuizId;

      if (!savedQuizId) {
        // Create new quiz
        const res = await api.createQuiz(quizPayload);
        savedQuizId = res.quiz.id;
        setCurrentQuizId(savedQuizId);
      } else {
        // Update existing quiz
        await api.updateQuiz(savedQuizId, quizPayload);
      }

      // Sync questions: Add or update each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qPayload = {
          type: q.type,
          prompt: q.prompt.trim(),
          clinical_vignette: Object.keys(q.clinical_vignette).length > 0 ? q.clinical_vignette : null,
          explanation: q.explanation.trim(),
          learning_point: q.learning_point.trim(),
          reference: q.reference.trim(),
          difficulty: q.difficulty,
          topic_id: q.topic_id || null,
          points: q.points || 1,
          display_order: i + 1,
          choices: q.choices.map((c, cIdx) => ({
            id: c.id,
            choice_text: c.choice_text.trim(),
            is_correct: c.is_correct,
            explanation: c.explanation.trim(),
            display_order: cIdx + 1,
          })),
        };

        if (q.id.startsWith('q_')) {
          // Brand new question: call addQuestion
          const added = await api.addQuestion(savedQuizId, qPayload);
          q.id = added.question.id;
        } else {
          // Existing question: call updateQuestion
          await api.updateQuestion(savedQuizId, q.id, qPayload);
        }
      }

      if (publishAfterSave) {
        const publishRes = await api.publishQuiz(savedQuizId);
        setStatus('published');
        showToast('Medical quiz has been published successfully and is now active for students!', 'success');
        onSuccess(savedQuizId);
      } else {
        showToast('Draft saved successfully to the database.', 'success');
      }
    } catch (err: any) {
      showToast(`Error saving quiz: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClick = async () => {
    const errors = validateQuiz();
    setValidationErrors(errors);
    if (errors.length > 0) {
      setActiveTab('publish');
      return;
    }
    await handleSaveQuiz(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading Authoring Studio...</p>
      </div>
    );
  }

  const currentQ = questions[selectedQuestionIndex] || questions[0];
  const selectedSubjectObj = subjects.find((s) => s.id === subjectId);
  const currentTopics = selectedSubjectObj?.topics || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {status.toUpperCase()}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                {title || 'Untitled Medical Assessment'}
              </h1>
            </div>
            <p className="text-xs text-slate-500">{questions.length} Items • Subject: {selectedSubjectObj?.name || 'Unassigned'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleSaveQuiz(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handlePublishClick}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            Publish Quiz
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          1. Basic Information
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'questions'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          2. Questions Authoring ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'preview'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          3. Student Preview
        </button>
        <button
          onClick={() => {
            setValidationErrors(validateQuiz());
            setActiveTab('publish');
          }}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'publish'
              ? 'border-blue-600 text-blue-600 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          4. Validation & Publish
        </button>
      </div>

      {/* TAB 1: BASIC INFORMATION */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm max-w-4xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum & Exam Details</h2>
            <p className="text-xs text-slate-500">Provide medical course categorization, target level, and student instructions.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assessment Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acute Coronary Syndromes & Myocardial Infarction Review"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Overview & Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key learning objectives, target audience, or high-yield review goals..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setTopicId('');
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Topic (Optional)
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                >
                  <option value="">-- General Topic --</option>
                  {currentTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                >
                  <option value="Beginner">Beginner / Pre-Clinical</option>
                  <option value="Intermediate">Intermediate Clerkship</option>
                  <option value="Advanced">Advanced Sub-Internship</option>
                  <option value="USMLE Step 1">USMLE Step 1</option>
                  <option value="USMLE Step 2 CK">USMLE Step 2 CK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time Limit (Minutes, 0 = Untimed)
                </label>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Exam Instructions
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions displayed to students before starting..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveTab('questions')}
              className="px-5 py-2 bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Continue to Questions Authoring →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS AUTHORING */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Questions List / Outline */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Exam Items ({questions.length})
              </span>
              <button
                onClick={handleAddQuestion}
                className="p-1 rounded-lg bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white"
                title="Add New Question"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isSelected = idx === selectedQuestionIndex;
                const hasPrompt = !!q.prompt.trim();
                const hasCorrect = q.choices.some((c) => c.is_correct);
                const isValid = hasPrompt && hasCorrect;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {q.prompt.trim() ? q.prompt : 'Empty Question Item'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isValid && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Missing prompt or answer" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, 'down');
                        }}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddQuestion}
              className="w-full py-2.5 rounded-xl border border-dashed border-blue-500/60 text-blue-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Another Question
            </button>
          </div>

          {/* Right 3 Cols: Active Question Editor */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Question Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm px-3 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-amber-300">
                    Item #{selectedQuestionIndex + 1}
                  </span>
                  <select
                    value={currentQ.type}
                    onChange={(e) => updateCurrentQuestion('type', e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="sba">Single Best Answer (MCQ)</option>
                    <option value="multi_select">Multiple Select</option>
                    <option value="true_false">True / False</option>
                    <option value="clinical_vignette">Clinical Vignette Scenario</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicateQuestion(selectedQuestionIndex)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1 transition"
                    title="Duplicate Question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duplicate</span>
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestionIndex)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs flex items-center gap-1 transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Clinical Vignette Fields if Question Type is clinical_vignette */}
              {currentQ.type === 'clinical_vignette' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 space-y-3">
                  <span className="text-xs font-bold text-blue-800 dark:text-amber-300 uppercase tracking-wider block">
                    Clinical Vignette Parameters
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Patient Age</label>
                      <input
                        type="number"
                        placeholder="e.g. 58"
                        value={currentQ.clinical_vignette.patient_age || ''}
                        onChange={(e) => updateVignetteField('patient_age', Number(e.target.value) || undefined)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Patient Sex</label>
                      <select
                        value={currentQ.clinical_vignette.patient_sex || 'Male'}
                        onChange={(e) => updateVignetteField('patient_sex', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Chief Complaint</label>
                      <input
                        type="text"
                        placeholder="e.g. Substernal crushing chest pain"
                        value={currentQ.clinical_vignette.chief_complaint || ''}
                        onChange={(e) => updateVignetteField('chief_complaint', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      History of Present Illness (HPI)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detailed patient timeline, aggravating/relieving factors, medical history..."
                      value={currentQ.clinical_vignette.history || ''}
                      onChange={(e) => updateVignetteField('history', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Physical Examination & Vitals
                      </label>
                      <textarea
                        rows={2}
                        placeholder="BP 142/88 mmHg, HR 104 bpm, diaphoresis, S4 gallop..."
                        value={currentQ.clinical_vignette.examination || ''}
                        onChange={(e) => updateVignetteField('examination', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Laboratory & Diagnostic Findings
                      </label>
                      <textarea
                        rows={2}
                        placeholder="ECG shows 3mm ST elevation in leads II, III, aVF. Troponin I: 2.4 ng/mL..."
                        value={currentQ.clinical_vignette.laboratory || ''}
                        onChange={(e) => updateVignetteField('laboratory', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Question Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Prompt / Lead-In *
                </label>
                <textarea
                  rows={3}
                  required
                  value={currentQ.prompt}
                  onChange={(e) => updateCurrentQuestion('prompt', e.target.value)}
                  placeholder="Which of the following is the most appropriate next step in management?"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Answer Choices Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Answer Choices ({currentQ.choices.length})
                  </span>
                  <button
                    onClick={handleAddChoice}
                    className="text-xs text-blue-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-2.5">
                  {currentQ.choices.map((choice, cIdx) => {
                    const letter = String.fromCharCode(65 + cIdx);
                    return (
                      <div
                        key={choice.id}
                        className={`p-3 rounded-2xl border transition space-y-2 ${
                          choice.is_correct
                            ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Correct marker */}
                          <label className="flex items-center gap-1.5 cursor-pointer shrink-0" title="Mark as correct answer">
                            <input
                              type={currentQ.type === 'multi_select' ? 'checkbox' : 'radio'}
                              name={`correct_${currentQ.id}`}
                              checked={choice.is_correct}
                              onChange={(e) => updateChoice(cIdx, 'is_correct', e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-xs flex items-center justify-center text-slate-800 dark:text-slate-200">
                              {letter}
                            </span>
                          </label>

                          {/* Choice text */}
                          <input
                            type="text"
                            required
                            value={choice.choice_text}
                            onChange={(e) => updateChoice(cIdx, 'choice_text', e.target.value)}
                            placeholder={`Choice ${letter} text...`}
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 dark:text-white"
                          />

                          {/* Delete choice */}
                          <button
                            onClick={() => handleDeleteChoice(cIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove Choice"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Optional distractor rationale */}
                        <div className="pl-12">
                          <input
                            type="text"
                            value={choice.explanation}
                            onChange={(e) => updateChoice(cIdx, 'explanation', e.target.value)}
                            placeholder="Distractor rationale (optional): Why is this option right or wrong?"
                            className="w-full px-2.5 py-1 text-[11px] bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-slate-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comprehensive Faculty Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  High-Yield Clinical Explanation & Pathophysiology *
                </label>
                <textarea
                  rows={4}
                  required
                  value={currentQ.explanation}
                  onChange={(e) => updateCurrentQuestion('explanation', e.target.value)}
                  placeholder="Explain the correct clinical mechanism and why distractor options are incorrect..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Clinical Pearl (Learning Point) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  High-Yield Learning Point / Clinical Pearl
                </label>
                <input
                  type="text"
                  value={currentQ.learning_point}
                  onChange={(e) => updateCurrentQuestion('learning_point', e.target.value)}
                  placeholder="e.g. Aspirin and prompt cardiac catheterization within 90 minutes are mandatory for STEMI."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Textbook Citation / Clinical Guideline Reference
                </label>
                <input
                  type="text"
                  value={currentQ.reference}
                  onChange={(e) => updateCurrentQuestion('reference', e.target.value)}
                  placeholder="e.g. ACC/AHA STEMI Guidelines 2023; Harrison's Internal Medicine 21st Ed., Ch. 275"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT PREVIEW MODE */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                Student Simulation Mode
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Item #{previewQuestionIndex + 1} of {questions.length}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={previewQuestionIndex === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPreviewQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={previewQuestionIndex === questions.length - 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>

          {/* Render Preview Question */}
          {questions[previewQuestionIndex] && (
            <div className="space-y-4">
              {questions[previewQuestionIndex].clinical_vignette &&
                (questions[previewQuestionIndex].clinical_vignette.patient_age ||
                  questions[previewQuestionIndex].clinical_vignette.chief_complaint) && (
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/60 space-y-2 text-xs">
                    <p className="font-bold text-blue-800 dark:text-amber-300">Clinical Case Scenario:</p>
                    {questions[previewQuestionIndex].clinical_vignette.chief_complaint && (
                      <p>Chief Complaint: "{questions[previewQuestionIndex].clinical_vignette.chief_complaint}"</p>
                    )}
                    {questions[previewQuestionIndex].clinical_vignette.history && (
                      <p>HPI: {questions[previewQuestionIndex].clinical_vignette.history}</p>
                    )}
                    {questions[previewQuestionIndex].clinical_vignette.examination && (
                      <p>Exam: {questions[previewQuestionIndex].clinical_vignette.examination}</p>
                    )}
                    {questions[previewQuestionIndex].clinical_vignette.laboratory && (
                      <p className="font-mono">Labs: {questions[previewQuestionIndex].clinical_vignette.laboratory}</p>
                    )}
                  </div>
                )}

              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {questions[previewQuestionIndex].prompt || '(No prompt entered yet)'}
              </p>

              <div className="space-y-2.5">
                {questions[previewQuestionIndex].choices.map((c, cIdx) => {
                  const letter = String.fromCharCode(65 + cIdx);
                  const isSelected = (previewAnswers[questions[previewQuestionIndex].id] || []).includes(c.id);

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        const qId = questions[previewQuestionIndex].id;
                        setPreviewAnswers((prev) => ({
                          ...prev,
                          [qId]: [c.id],
                        }));
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-amber-200 font-medium'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {letter}
                      </span>
                      <span className="text-xs">{c.choice_text || '(Empty option)'}</span>
                      {c.is_correct && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          Author Key (Correct)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VALIDATION & PUBLISH */}
      {activeTab === 'publish' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pre-Publication Audit</h2>
            <p className="text-xs text-slate-500">
              The automated curriculum engine validates every item before publishing to students.
            </p>
          </div>

          {validationErrors.length > 0 ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Validation Checklist Incomplete ({validationErrors.length} issues)</span>
              </div>
              <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-400 space-y-1 pl-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>All Quality & Clinical Standards Met!</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                This assessment meets board-style question criteria with complete answer choices, designated correct keys, and faculty clinical rationales.
              </p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Authoring Items:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{questions.length} Questions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Difficulty Setting:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timed Exam Duration:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {timeLimitMinutes > 0 ? `${timeLimitMinutes} Minutes` : 'Untimed Practice'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleSaveQuiz(false)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {saving ? 'Saving...' : 'Keep as Draft'}
            </button>

            <button
              onClick={() => handleSaveQuiz(true)}
              disabled={saving || validationErrors.length > 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              {saving ? 'Publishing...' : 'Publish Assessment to Students'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
