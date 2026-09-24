import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Target,
  Brain,
  Users,
  ArrowRight,
  Sparkles,
  Layers,
  HeartPulse,
  Eye,
  Activity,
  Microscope,
  Scale,
  Scan,
  ShieldCheck,
  Bug,
  HelpCircle,
  FileCheck2,
  TrendingUp,
  LogIn,
  UserPlus
} from 'lucide-react';
import { AlawasiLogo } from './AlawasiLogo';

interface PublicLandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register-student' | 'register-teacher') => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onOpenAuth,
}) => {
  // The exact nine subjects requested for Batch 99 curriculum
  const curriculumSubjects = [
    {
      name: 'Pathology',
      icon: Microscope,
      badge: 'Subject 01',
      description: 'General and systemic pathology, cellular adaptation and injury, inflammation, neoplasia, hemodynamic disorders, and diagnostic histopathology.',
      topics: ['Cellular Pathology', 'Systemic Pathologies', 'Diagnostic Workup']
    },
    {
      name: 'Psychiatry',
      icon: Brain,
      badge: 'Subject 02',
      description: 'Clinical psychiatric evaluation, affective and psychotic disorders, anxiety conditions, substance abuse, cognitive impairments, and psychopharmacology.',
      topics: ['Affective & Psychotic Illness', 'Clinical Assessment', 'Psychopharmacology']
    },
    {
      name: 'Radiology',
      icon: Scan,
      badge: 'Subject 03',
      description: 'Diagnostic medical imaging, radiographic interpretation, computed tomography (CT), magnetic resonance imaging (MRI), and ultrasound correlation.',
      topics: ['Plain Radiographs', 'CT & MRI Modalities', 'Imaging Emergencies']
    },
    {
      name: 'ENT',
      icon: Activity,
      badge: 'Subject 04',
      description: 'Otorhinolaryngology, hearing disorders, otitis media and complications, rhinosinusitis, epistaxis, upper airway obstructions, and neck lesions.',
      topics: ['Otology & Vertigo', 'Airway Emergencies', 'Head & Neck Lesions']
    },
    {
      name: 'Ethics',
      icon: Scale,
      badge: 'Subject 05',
      description: 'Clinical bioethics, medical professionalism, patient autonomy and informed consent, confidentiality, beneficence, and medico-legal responsibilities.',
      topics: ['Informed Consent', 'Medical Autonomy', 'Confidentiality & Law']
    },
    {
      name: 'Dermatology',
      icon: ShieldCheck,
      badge: 'Subject 06',
      description: 'Cutaneous anatomy, morphology of skin lesions, papulosquamous diseases, dermatological emergencies, cutaneous infections, and systemic manifestations.',
      topics: ['Primary & Secondary Lesions', 'Systemic Cutaneous Signs', 'Dermatopathology']
    },
    {
      name: 'Forensic and Toxicology',
      icon: FileCheck2,
      badge: 'Subject 07',
      description: 'Forensic medicine and medical jurisprudence, postmortem changes, trauma analysis, acute clinical poisonings, toxidromes, and overdose management.',
      topics: ['Forensic Traumatology', 'Clinical Toxidromes', 'Medical Jurisprudence']
    },
    {
      name: 'Ophthalmology',
      icon: Eye,
      badge: 'Subject 08',
      description: 'Clinical optics and refractive errors, ocular emergencies, red eye differential diagnosis, glaucoma, cataract, retinal disorders, and ophthalmoscopy.',
      topics: ['Red Eye Differential', 'Glaucoma & Fundoscopy', 'Ocular Emergencies']
    },
    {
      name: 'Infectious Diseases',
      icon: Bug,
      badge: 'Subject 09',
      description: 'Clinical microbiology, endemic bacterial, viral, parasitic, and fungal infections, fever of unknown origin, infection control, and antimicrobial stewardship.',
      topics: ['Bacterial & Viral Pathogens', 'Antimicrobial Stewardship', 'Endemic Fevers']
    },
    {
      name: 'Community Medicine',
      icon: Users,
      badge: 'Subject 10',
      description: 'Epidemiology, public health, biostatistics, primary health care, maternal and child health, communicable and non-communicable disease control, and environmental health.',
      topics: ['Epidemiology & Biostats', 'Primary Health Care', 'Maternal & Child Health']
    }
  ];

  // Foundation pillars focusing on structured learning and Batch 99 collaboration
  const foundationPillars = [
    {
      title: 'Organized Academic Revision',
      desc: 'Systematically organized question sets and modules mapped directly to the academic curriculum of Batch 99.',
      icon: Layers,
      highlight: 'Curriculum-Mapped'
    },
    {
      title: 'Curriculum-Focused Questions',
      desc: 'High-quality questions reflecting core medical competencies, verified clinical concepts, and batch academic priorities.',
      icon: Target,
      highlight: 'Core Competencies'
    },
    {
      title: 'Evidence-Based Active Recall',
      desc: 'Question-driven retrieval practice engineered to strengthen cognitive retention and diagnostic intuition over passive reading.',
      icon: Brain,
      highlight: 'Active Retrieval'
    },
    {
      title: 'Structured Medical Learning',
      desc: 'Clear organization by subject, difficulty, and core topic to allow methodical mastery of complex medical subjects.',
      icon: BookOpen,
      highlight: 'Methodical Mastery'
    },
    {
      title: 'Detailed Rationales & Pearls',
      desc: 'Comprehensive clinical rationales and key takeaway points accompanying every option to maximize understanding.',
      icon: Sparkles,
      highlight: 'Clinical Rationales'
    },
    {
      title: 'Batch 99 Collaboration',
      desc: 'A unified academic environment fostering peer learning, shared academic progress, and faculty coordination for Batch 99.',
      icon: Users,
      highlight: 'Batch Solidarity'
    }
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      
      {/* ======================================================== */}
      {/* 1. HERO SECTION: RESTORED BLUE & YELLOW VISUAL IDENTITY */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-radial from-[#1e77c1] via-[#145d9e] to-[#0a3560] text-white py-16 sm:py-24 border-b border-blue-800/60 alawasi-blueprint-grid">
        {/* Ambient Warm Golden/Yellow and Cyan Glow Accents */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Batch 99 Golden Yellow Identity Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-400/90 hover:bg-amber-400 text-slate-950 shadow-md border border-amber-300 font-medium transition">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                <span className="text-xs font-black tracking-wider uppercase">BATCH 99</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs font-semibold">Faculty of Medicine, University of Khartoum</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Academic Medical Revision Platform
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-sky-100 max-w-2xl font-normal leading-relaxed">
                A dedicated academic platform designed to support students through organized question-based revision, evidence-based active recall, structured clinical rationales, and collaborative batch learning.
              </p>

              {/* Restored Blue & Yellow Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {/* Primary Student Sign In - Vibrant Yellow */}
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition duration-150 flex items-center gap-2 group cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-950" />
                  <span>Student Sign In</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Student Register */}
                <button
                  onClick={() => onOpenAuth('register-student')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 font-semibold text-sm backdrop-blur-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>Register Account</span>
                </button>
              </div>

              {/* Trust & Foundation Strip */}
              <div className="pt-4 border-t border-white/15 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block text-xl font-extrabold text-amber-400 font-mono">9</span>
                  <span className="text-sky-200">Curriculum Subjects</span>
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-amber-400 font-mono">Active</span>
                  <span className="text-sky-200">Recall Practice</span>
                </div>
                <div>
                  <span className="block text-xl font-extrabold text-amber-400 font-mono">Detailed</span>
                  <span className="text-sky-200">Clinical Pearls</span>
                </div>
              </div>

            </div>

            {/* Right Official Alawasi Identity Card */}
            <div className="lg:col-span-5 flex justify-center">
              <AlawasiLogo variant="full" className="mx-auto" />
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. PLATFORM FOUNDATION SECTION                           */}
      {/* ======================================================== */}
      <section id="platform-foundation" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
              <span>Foundation &amp; Academic Purpose</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Built on Structured Learning &amp; Active Recall
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              AWASI QUIZWEB is founded to provide students of Batch 99 with a focused, methodical environment for academic revision. Rather than passive note-reading, the platform centers on curriculum-oriented questions that stimulate active retrieval and clinical reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foundationPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-amber-400/50 shadow-xs hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-amber-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-900 text-blue-700 dark:text-amber-400 border border-blue-200 dark:border-slate-700">
                      {pillar.highlight}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CURRICULUM FOCUS SECTION (EXACT 9 SUBJECTS)           */}
      {/* ======================================================== */}
      <section id="curriculum-focus" className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
              <span>Curriculum Focus</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Core Academic Subjects
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              The platform curriculum is structured directly around the core academic subjects of Batch 99, providing focused questions, clinical scenarios, and learning pearls for each.
            </p>
          </div>

          {/* Grid for the curriculum subjects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculumSubjects.map((sub, idx) => {
              const Icon = sub.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-amber-400/60 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-amber-300 border border-blue-200 dark:border-blue-800">
                        {sub.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {sub.name}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      {sub.description}
                    </p>
                  </div>

                  {/* Core Topics Pills */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex flex-wrap gap-1.5">
                      {sub.topics.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prompt to Sign In / Register for Full Access */}
          <div className="mt-12 p-8 rounded-3xl bg-radial from-[#1e77c1] via-[#145d9e] to-[#0a3560] text-white shadow-xl text-center max-w-4xl mx-auto space-y-4">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Ready to Practice With Batch 99 Quizzes?
            </h3>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl mx-auto leading-relaxed">
              Sign in with your Batch 99 student account to explore the complete question bank, take timed practice tests, review rationales, and monitor your personal progress across all nine subjects.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Access All Subjects</span>
              </button>
              <button
                onClick={() => onOpenAuth('register-student')}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>Create Student Account</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CLEAN ACADEMIC FOOTER                                 */}
      {/* ======================================================== */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlawasiLogo variant="compact" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p className="font-medium text-slate-600 dark:text-slate-400">
              AWASI QUIZWEB PLATFORM &copy; 2026 · Academic Medical Revision Platform for Batch 99
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
