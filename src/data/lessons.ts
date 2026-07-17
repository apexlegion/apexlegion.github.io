/**
 * Learn Academy lessons — the 3-track, task-first curriculum.
 *
 * Deliberately a standalone typed module rather than a seed-JSON entity:
 * lessons don't participate in the graph, relations, or the scrape/validate
 * pipeline, so keeping them out of the zod entity system avoids touching any
 * of that machinery. Consumed only by `src/pages/learn/`.
 *
 * Tool policy (per product decision): every lesson leads with the easiest
 * 100%-free tool, and always shows an open-source alternative, badged.
 */

export type TrackId = 'beginner' | 'intermediate' | 'advanced';

export interface LessonTool {
  name: string;
  url: string;
  note: string;
}

export interface LessonPrompt {
  label: string;
  text: string;
}

export interface LessonVocab {
  term: string;
  /** Internal path (withBase applied at render time), e.g. /concepts/prompt-engineering */
  href: string;
  plain: string;
}

export interface LessonLink {
  label: string;
  href: string;
}

export interface Lesson {
  slug: string;
  track: TrackId;
  order: number;
  title: string;
  tagline: string;
  minutes: number;
  goal: string;
  tool: LessonTool | null;
  oss: LessonTool | null;
  steps: string[];
  prompts: LessonPrompt[];
  result: string;
  tweaks: string[];
  vocab: LessonVocab[];
  deeper: LessonLink[];
}

export interface Track {
  id: TrackId;
  emoji: string;
  label: string;
  audience: string;
  blurb: string;
}

export const TRACKS: Track[] = [
  {
    id: 'beginner',
    emoji: '🌱',
    label: 'Beginner',
    audience: "I've never used AI",
    blurb:
      'Start from absolute zero. Open a free AI, type your first message, and walk away with real work done — emails, summaries, images, study help. No coding, no jargon.',
  },
  {
    id: 'intermediate',
    emoji: '⚡',
    label: 'Intermediate',
    audience: 'I use AI sometimes',
    blurb:
      'You have chatted with an AI before. Now learn the habits that separate "meh" answers from great ones — context, examples, roles, formats, files, and fact-checking.',
  },
  {
    id: 'advanced',
    emoji: '🚀',
    label: 'Advanced',
    audience: 'Make me a power user',
    blurb:
      'Own your AI. Run open models on your own computer, build a private ChatGPT, chat with your documents, and automate repetitive work — all free and open source.',
  },
];

/* ------------------------------------------------------------------ */
/* Beginner track — first 5 minutes + everyday task recipes            */
/* ------------------------------------------------------------------ */

const beginner: Lesson[] = [
  {
    slug: 'your-first-five-minutes',
    track: 'beginner',
    order: 0,
    title: 'Your first 5 minutes with AI',
    tagline: 'Open a free AI chat and get your first useful answer.',
    minutes: 5,
    goal: 'Have your very first conversation with an AI and see it do something genuinely useful for you — no account needed to start, no credit card, ever.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'The easiest starting point. Works in any browser, free plan is plenty.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Fully open-source models, free, no install. Same chat experience.',
    },
    steps: [
      'Open the tool link above in a new browser tab.',
      'You will see a text box at the bottom — that box is the whole interface. Anything you type there is called a "prompt".',
      'Copy the prompt below, paste it into the box, and press Enter.',
      'Read the answer. Then type a follow-up question in your own words — the AI remembers the conversation.',
      'That is genuinely all there is to it. You now know how to use AI.',
    ],
    prompts: [
      {
        label: 'Your first prompt',
        text: "I've never used AI before. In simple words, tell me 5 everyday things you can help me with — things a normal person actually needs, not tech stuff. Keep it short.",
      },
    ],
    result:
      'A friendly, numbered list of real things it can do for you (write messages, explain documents, plan meals, help you study…). Notice it answered in your language, instantly, for free.',
    tweaks: [
      'Ask it the same question in your own language — it speaks almost all of them.',
      'Ask "explain one of those in more detail" — you never need to start over, just keep talking.',
      'Nothing you type here trains you to be technical — talking normally IS the skill.',
    ],
    vocab: [
      {
        term: 'Prompt',
        href: '/concepts/prompt-engineering',
        plain: 'The message you type to an AI. Better prompts → better answers.',
      },
      {
        term: 'AI (Artificial Intelligence)',
        href: '/concepts/artificial-intelligence',
        plain: 'Software that can understand and produce human-like text, images, and more.',
      },
      {
        term: 'LLM (Large Language Model)',
        href: '/concepts/large-language-model',
        plain: 'The engine behind chat AIs — a model trained on huge amounts of text.',
      },
    ],
    deeper: [{ label: 'What is AI? — plain-words concept page', href: '/concepts/artificial-intelligence' }],
  },
  {
    slug: 'write-any-email',
    track: 'beginner',
    order: 1,
    title: 'Write any email in 30 seconds',
    tagline: 'Awkward email? Let AI draft it, you just approve.',
    minutes: 5,
    goal: 'Turn a messy thought ("I need to ask my landlord to fix the tap… politely") into a ready-to-send email.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Any chat AI works for this — use whichever you opened in lesson 1.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source alternative, same recipe.',
    },
    steps: [
      'Open your chat AI.',
      'Copy the prompt below and fill in the two [BRACKETS] with your situation.',
      'Press Enter, read the draft, and ask for changes in plain words ("make it shorter", "more friendly").',
      'Copy the final version into your email app and send.',
    ],
    prompts: [
      {
        label: 'The email recipe',
        text: 'Write an email for me.\n\nSituation: [DESCRIBE IT IN YOUR OWN WORDS, e.g. "my landlord hasn\'t fixed the kitchen tap I reported two weeks ago"]\nTo: [WHO, e.g. "my landlord, Mr. Sharma"]\nTone: polite but firm\nLength: short — under 120 words\n\nGive me a subject line too.',
      },
    ],
    result:
      'A complete email with subject line, greeting, clear ask, and sign-off — usually better-structured than what most of us write ourselves.',
    tweaks: [
      '"Make it warmer" / "make it more formal" / "make it half the length" — say it like that, it just works.',
      'Ask for 2 versions and pick the one you like.',
      'Works for WhatsApp messages, complaint letters, thank-you notes — anything written.',
    ],
    vocab: [
      {
        term: 'Iterating',
        href: '/concepts/prompt-engineering',
        plain: 'Asking follow-ups to refine the answer instead of starting over. The #1 beginner habit.',
      },
    ],
    deeper: [{ label: 'Prompt engineering — the concept', href: '/concepts/prompt-engineering' }],
  },
  {
    slug: 'summarize-anything',
    track: 'beginner',
    order: 2,
    title: 'Summarize anything long',
    tagline: 'Articles, reports, emails — get the point in 30 seconds.',
    minutes: 5,
    goal: 'Never read a 10-page document to find the 3 sentences that matter to you.',
    tool: {
      name: 'Google Gemini (free)',
      url: 'https://gemini.google.com',
      note: 'Free with a Google account and handles pasted text and uploaded PDFs well.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open source — paste the text in (copy it from your PDF first).',
    },
    steps: [
      'Copy the long text (select all → copy), or in Gemini click the + to upload a PDF.',
      'Paste the prompt below, then paste the document under it.',
      'Press Enter.',
    ],
    prompts: [
      {
        label: 'The summary recipe',
        text: 'Summarize the text below for a busy person.\n\nGive me:\n1. The main point in one sentence\n2. The 3–5 key details as bullets\n3. Anything I need to act on or reply to, clearly marked\n\nHere is the text:\n[PASTE THE LONG TEXT HERE]',
      },
    ],
    result:
      'A one-sentence gist, the key facts, and your action items — pulled out of pages of text instantly.',
    tweaks: [
      '"Explain it like I\'m 12" for anything confusing.',
      '"Summarize in Hindi" (or any language) — translation is built in.',
      'For a huge document, ask: "What questions should I ask about this?" — great before a meeting.',
    ],
    vocab: [
      {
        term: 'Context window',
        href: '/concepts/context-window',
        plain: 'How much text an AI can "hold in its head" at once. Very long documents may need splitting.',
      },
    ],
    deeper: [{ label: 'Context window — the concept', href: '/concepts/context-window' }],
  },
  {
    slug: 'explain-this-simply',
    track: 'beginner',
    order: 3,
    title: 'Explain a confusing document simply',
    tagline: 'Contracts, notices, medical letters — decoded in plain words.',
    minutes: 5,
    goal: 'Understand any official or jargon-filled document before you sign or act on it.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'You can also photograph a paper document and upload the photo — it reads images.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open source — paste the text of the document.',
    },
    steps: [
      'Copy the document text, or take a clear photo and upload it.',
      'Paste the prompt below with the document.',
      'Read the plain-words version, then ask about any part that still feels unclear.',
    ],
    prompts: [
      {
        label: 'The decoder recipe',
        text: 'Explain this document to me in simple, everyday words. I am not a lawyer or expert.\n\nTell me:\n1. What is this document, in one sentence?\n2. What is it asking me to do or agree to?\n3. Are there any deadlines, costs, or penalties?\n4. What should I double-check or be careful about before acting?\n\nHere is the document:\n[PASTE TEXT OR UPLOAD A PHOTO]',
      },
    ],
    result:
      'A plain-language walkthrough: what it is, what it wants from you, what it costs, and where the traps might be.',
    tweaks: [
      'Ask "what questions should I ask before signing?" — instant checklist.',
      'For anything with real money or legal consequences, use the AI to understand — but confirm with a professional before signing. AI can be confidently wrong.',
    ],
    vocab: [
      {
        term: 'Hallucination',
        href: '/concepts/hallucination',
        plain: 'When AI states something false with full confidence. Why you double-check important things.',
      },
      {
        term: 'Multimodal',
        href: '/concepts/multimodal',
        plain: 'An AI that understands more than text — like photos of your documents.',
      },
    ],
    deeper: [{ label: 'Why AI makes things up', href: '/concepts/hallucination' }],
  },
  {
    slug: 'translate-anything',
    track: 'beginner',
    order: 4,
    title: 'Translate anything, naturally',
    tagline: 'Not word-by-word — actual natural translation with tone.',
    minutes: 4,
    goal: 'Translate messages, documents, or your own writing into any language — sounding like a native, not a dictionary.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Chat AIs translate with context and tone, which classic translators miss.',
    },
    oss: {
      name: 'LibreTranslate',
      url: 'https://libretranslate.com',
      note: 'Fully open-source translation site — quick for short, simple text.',
    },
    steps: [
      'Paste the prompt below with your text.',
      'Tell it who the translation is for — that changes the words it picks.',
    ],
    prompts: [
      {
        label: 'The translation recipe',
        text: 'Translate this into [LANGUAGE].\nMake it sound natural, the way a native speaker would actually say it.\nIt is for: [e.g. "a formal email to a customer" / "a WhatsApp message to a friend"]\n\nText:\n[PASTE TEXT HERE]',
      },
    ],
    result:
      'A natural translation matched to the situation — formal for officials, casual for friends — plus you can ask "why did you translate it that way?"',
    tweaks: [
      'Ask for the reply too: "and write my answer back in French".',
      '"Teach me how to pronounce this" works surprisingly well.',
      'Learning a language? Ask it to correct your sentences and explain the mistakes.',
    ],
    vocab: [],
    deeper: [{ label: 'How AI learned languages — training', href: '/concepts/training' }],
  },
  {
    slug: 'make-your-first-image',
    track: 'beginner',
    order: 5,
    title: 'Make your first AI image',
    tagline: 'Type words, get a picture. Free.',
    minutes: 6,
    goal: 'Create an image from a text description — for a post, an invitation, a presentation, or just for fun.',
    tool: {
      name: 'Bing Image Creator',
      url: 'https://www.bing.com/create',
      note: 'Free with a Microsoft account. Type, wait ~20 seconds, download.',
    },
    oss: {
      name: 'FLUX.1 [schnell] demo',
      url: 'https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell',
      note: 'A famous open-source image model, running free in your browser.',
    },
    steps: [
      'Open either tool.',
      'Paste the prompt below (edit the bracketed parts).',
      'Wait for the images, click the one you like, download it.',
    ],
    prompts: [
      {
        label: 'The image recipe',
        text: 'A [WHAT, e.g. "birthday invitation background"], [STYLE, e.g. "colorful watercolor, soft and warm"], [DETAILS, e.g. "balloons and confetti, space in the middle for text"], high quality',
      },
    ],
    result:
      'Usually 1–4 generated images. Not always perfect on the first try — regenerating with slightly different words is normal and part of the fun.',
    tweaks: [
      'Name a style: "photo-realistic", "cartoon", "oil painting", "3D render".',
      'Say what you DON\'T want: "no text, no people".',
      'Faces and hands can look odd — regenerate or crop; it\'s a known AI quirk.',
    ],
    vocab: [
      {
        term: 'Diffusion model',
        href: '/concepts/diffusion-model',
        plain: 'The kind of AI that "sculpts" images out of noise, guided by your words.',
      },
    ],
    deeper: [
      { label: 'How image AI works', href: '/concepts/diffusion-model' },
      { label: 'Try the diffusion playground', href: '/playgrounds' },
    ],
  },
  {
    slug: 'plan-a-trip',
    track: 'beginner',
    order: 6,
    title: 'Plan a trip on your budget',
    tagline: 'A day-by-day itinerary tailored to you, in one minute.',
    minutes: 6,
    goal: 'Get a realistic, personalized travel plan — where to go, what to skip, what it costs.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Great at itineraries. For live prices, verify with booking sites.',
    },
    oss: {
      name: 'HuggingChat (web search on)',
      url: 'https://huggingface.co/chat',
      note: 'Toggle web search for fresher info, open-source models.',
    },
    steps: [
      'Fill in the brackets in the prompt below — the more honest the details, the better the plan.',
      'Ask follow-ups: "swap day 2 for something relaxing", "make it cheaper".',
    ],
    prompts: [
      {
        label: 'The trip recipe',
        text: 'Plan a [N]-day trip to [PLACE] for [WHO, e.g. "2 adults and a 6-year-old"].\nBudget: [AMOUNT] total, excluding flights.\nWe like: [e.g. "food, history, nature — not too much walking"].\nGive me: a day-by-day plan, rough daily costs, one local dish to try each day, and 3 mistakes tourists usually make there.',
      },
    ],
    result:
      'A structured day-by-day itinerary with costs and local tips — a solid draft to refine, not a final booking.',
    tweaks: [
      'Prices and opening hours change — double-check anything you\'ll pay for.',
      '"Make a packing list for this trip" is a great follow-up.',
      'Works for weekend plans and staycations too.',
    ],
    vocab: [],
    deeper: [],
  },
  {
    slug: 'study-buddy',
    track: 'beginner',
    order: 7,
    title: 'Turn AI into your personal tutor',
    tagline: 'Explanations, flashcards, and quizzes for any subject.',
    minutes: 8,
    goal: 'Use AI to actually learn — it explains at your level, quizzes you, and never gets tired of your questions.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Any chat AI works. Gemini is equally good for this.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source tutor, same recipe.',
    },
    steps: [
      'Pick the thing you\'re studying (a chapter, a topic, even a photo of your textbook page).',
      'Paste the tutor prompt below.',
      'Answer its quiz questions — it corrects you gently and explains what you missed.',
    ],
    prompts: [
      {
        label: 'The tutor recipe',
        text: 'Be my patient tutor for: [TOPIC, e.g. "photosynthesis, class 10 level"].\n\n1. Explain it simply with one everyday analogy.\n2. Then quiz me with 5 questions, ONE AT A TIME — wait for my answer before the next.\n3. After each answer, tell me if I was right and explain briefly.\n4. At the end, tell me my weak spots and make 5 flashcards for them (question on one side, answer on the other).',
      },
    ],
    result:
      'A mini tutoring session: explanation → interactive quiz → personalized flashcards. Repeat daily with new topics.',
    tweaks: [
      '"Explain it like I\'m 12" → then "now at exam level" — climb the ladder.',
      'Upload a photo of a textbook page or past paper and say "quiz me on this".',
      'Ask for a 7-day revision plan for your exam date.',
    ],
    vocab: [
      {
        term: 'Zero-shot',
        href: '/concepts/zero-shot-learning',
        plain: 'AI doing a task it was never specifically trained for — like tutoring your exact syllabus.',
      },
    ],
    deeper: [{ label: 'Concepts library — every AI term explained at your level', href: '/concepts' }],
  },
  {
    slug: 'fix-my-writing',
    track: 'beginner',
    order: 8,
    title: 'Fix and polish your writing',
    tagline: 'Grammar, tone, clarity — without changing your voice.',
    minutes: 4,
    goal: 'Make anything you wrote sound clear and professional — especially useful if English isn\'t your first language.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Paste any text — messages, essays, bios, application answers.',
    },
    oss: {
      name: 'LanguageTool',
      url: 'https://languagetool.org',
      note: 'Open-source grammar checker — great for quick checks as you type.',
    },
    steps: [
      'Paste the prompt with your text.',
      'Compare the polished version with yours — ask "what did you change and why?" to learn from it.',
    ],
    prompts: [
      {
        label: 'The polish recipe',
        text: 'Improve my writing below. Fix grammar and spelling, make it clearer and more natural, but KEEP my voice and meaning — don\'t make it sound robotic or fancy.\nThen list the 3 most important changes you made, so I learn.\n\nMy text:\n[PASTE YOUR TEXT]',
      },
    ],
    result:
      'A cleaned-up version of your text plus a short lesson on what to fix next time — a proofreader and writing coach in one.',
    tweaks: [
      '"Make it sound more confident" — great for applications.',
      '"Shorten it to 100 words" — great for forms with limits.',
      'Never feel bad using this — professionals use editors; now you have one.',
    ],
    vocab: [],
    deeper: [],
  },
  {
    slug: 'cook-with-what-you-have',
    track: 'beginner',
    order: 9,
    title: 'Cook with what\'s in your kitchen',
    tagline: 'Tell it your ingredients, get tonight\'s dinner.',
    minutes: 4,
    goal: 'Stop staring at the fridge — get real recipes from the ingredients you already have.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'You can even upload a photo of your fridge or pantry shelf.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, same recipe (pun intended).',
    },
    steps: [
      'List what you have (or photograph it and upload).',
      'Paste the prompt, mention diet needs and time available.',
    ],
    prompts: [
      {
        label: 'The dinner recipe',
        text: 'I have: [LIST INGREDIENTS, e.g. "rice, eggs, tomatoes, onions, paneer, basic spices"].\nGive me 3 dinner ideas I can cook in under [30] minutes.\nRequirements: [e.g. "vegetarian, not too spicy, one should be kid-friendly"].\nFor the best one, give me the full step-by-step recipe with quantities.',
      },
    ],
    result:
      'Three realistic ideas from your actual ingredients, plus one full recipe with steps and quantities.',
    tweaks: [
      '"Make a shopping list to upgrade these meals for the week."',
      '"I\'m diabetic — adjust the recipes" (verify medical advice with your doctor).',
      'Weekly meal-prep plans work the same way — just ask.',
    ],
    vocab: [],
    deeper: [],
  },
  {
    slug: 'prep-for-an-interview',
    track: 'beginner',
    order: 10,
    title: 'Practice for a job interview',
    tagline: 'A mock interviewer that asks, listens, and coaches.',
    minutes: 10,
    goal: 'Walk into your next interview having already answered the hard questions — out loud, with feedback.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Use the microphone button on your phone to practice speaking answers.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source mock interviewer, text-based.',
    },
    steps: [
      'Paste the job description (or just the job title) into the prompt below.',
      'Answer each question as if it\'s real — speaking aloud is best.',
      'Get scored, get model answers, repeat the weak ones.',
    ],
    prompts: [
      {
        label: 'The mock-interview recipe',
        text: 'You are interviewing me for this job: [PASTE JOB TITLE OR FULL JOB DESCRIPTION].\n\nAsk me the 6 most likely interview questions ONE AT A TIME — wait for my answer each time.\nAfter each answer: score it out of 10, say what was good, and show a stronger example answer.\nAt the end: summarize my overall performance and the 3 things to improve before the real interview.',
      },
    ],
    result:
      'A realistic practice round with scores, feedback, and stronger sample answers — the single highest-value 15 minutes of interview prep.',
    tweaks: [
      '"Ask harder follow-ups like a tough interviewer."',
      '"Now ask about the gap in my resume" — practice the scary question on purpose.',
      'Do this 3 days in a row; the difference is dramatic.',
    ],
    vocab: [],
    deeper: [{ label: 'Next: write the CV that gets the interview', href: '/learn/write-a-cv-that-works' }],
  },
  {
    slug: 'write-a-cv-that-works',
    track: 'beginner',
    order: 11,
    title: 'Write a CV that gets calls',
    tagline: 'From plain history to polished resume + cover letter.',
    minutes: 10,
    goal: 'Turn "what I\'ve done" told in your own words into a professional CV and a tailored cover letter.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Draft here, then paste into any free CV template (Canva, Google Docs).',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source drafting, same recipe.',
    },
    steps: [
      'In plain words, type out your work history, education, and skills — messy is fine.',
      'Paste the prompt below, with the job you\'re applying for.',
      'Paste the result into a clean template and adjust honestly — never let it invent experience.',
    ],
    prompts: [
      {
        label: 'The CV recipe',
        text: 'Turn my background into a professional CV for this job: [JOB TITLE / PASTE JOB AD].\n\nMy background (messy notes are fine):\n[TYPE YOUR HISTORY — jobs, years, what you actually did, education, skills]\n\nRules: use strong action verbs, quantify results where I gave numbers, keep it to one page, DO NOT invent anything I didn\'t say. Then write a short tailored cover letter (under 150 words) for the same job.',
      },
    ],
    result:
      'A structured one-page CV that mirrors the job ad\'s language, plus a matching cover letter — the pair recruiters actually respond to.',
    tweaks: [
      '"Rewrite my CV for THIS other job" — tailoring per job takes 30 seconds now.',
      'Ask "what\'s missing from my CV for this job?" — honest gap analysis.',
      'Everything must stay true — AI polishes, you stay honest.',
    ],
    vocab: [],
    deeper: [{ label: 'Practice the interview next', href: '/learn/prep-for-an-interview' }],
  },
  {
    slug: 'social-posts-in-seconds',
    track: 'beginner',
    order: 12,
    title: 'Social posts in seconds',
    tagline: 'Captions, birthday wishes, business posts — on brand, on time.',
    minutes: 5,
    goal: 'Write scroll-stopping captions and posts for family moments or your small business — with hashtags.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Pair with lesson 6 (images) for a complete post.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source captions, same recipe.',
    },
    steps: [
      'Tell it the platform, the moment, and the vibe using the prompt below.',
      'Pick your favorite of the options it gives, or mix two.',
    ],
    prompts: [
      {
        label: 'The caption recipe',
        text: 'Write 3 options for a [PLATFORM, e.g. Instagram] post.\nOccasion: [e.g. "my bakery\'s 1-year anniversary" / "my daughter\'s graduation"].\nVibe: [e.g. "warm and grateful, a little funny"].\nInclude: a hook first line, 1–2 emoji max, and 5 relevant hashtags.\nKeep each under 60 words.',
      },
    ],
    result:
      'Three ready-to-post options with hooks and hashtags — pick, personalize one detail, post.',
    tweaks: [
      'For a business: "make a week of posts about [product]" — content calendar in one go.',
      'Add one real personal detail to whichever you pick — that\'s what makes it feel human.',
      'Generate a matching image with the lesson-6 recipe.',
    ],
    vocab: [],
    deeper: [{ label: 'Make the matching image', href: '/learn/make-your-first-image' }],
  },
  {
    slug: 'understand-your-money',
    track: 'beginner',
    order: 13,
    title: 'Understand bills and budgets',
    tagline: 'Decode charges, build a simple budget, ask "is this normal?"',
    minutes: 7,
    goal: 'Use AI to explain confusing charges, compare costs, and set up a monthly budget you\'ll actually follow.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Upload a photo of a bill — it reads and itemizes it.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, paste the numbers in.',
    },
    steps: [
      'Photograph or paste the bill / your monthly numbers.',
      'Use the budget prompt below.',
      'Ask follow-ups about anything that looks wrong or high.',
    ],
    prompts: [
      {
        label: 'The budget recipe',
        text: 'Help me build a simple monthly budget.\nMy income: [AMOUNT]\nFixed costs: [RENT, LOANS, BILLS…]\nRough spending: [FOOD, TRANSPORT, OTHER…]\nGoal: [e.g. "save for a laptop in 6 months"].\nGive me: a category-by-category plan, 3 realistic cuts (nothing miserable), and how much I can save per month.',
      },
      {
        label: 'The bill-decoder',
        text: 'Explain this bill line by line in simple words. Flag anything that looks unusual, duplicated, or worth questioning, and draft a short message I can send to customer service about it.\n\n[UPLOAD PHOTO OR PASTE THE BILL]',
      },
    ],
    result:
      'A budget that fits your real numbers, and bills translated into plain language with a ready-made "please explain this charge" message.',
    tweaks: [
      'AI is great for understanding money — but it\'s not a licensed financial advisor. Big decisions (loans, investments) deserve a professional.',
      '"Track this with me: here\'s what I spent this week" — it remembers within the conversation.',
    ],
    vocab: [],
    deeper: [],
  },
  {
    slug: 'compare-before-you-buy',
    track: 'beginner',
    order: 14,
    title: 'Compare anything before you buy',
    tagline: 'Phones, plans, appliances — a clear table, not 40 tabs.',
    minutes: 5,
    goal: 'Turn a confusing purchase decision into a simple comparison table matched to YOUR needs.',
    tool: {
      name: 'Perplexity (free)',
      url: 'https://www.perplexity.ai',
      note: 'Searches the live web and shows its sources — ideal for products and prices.',
    },
    oss: {
      name: 'HuggingChat (web search on)',
      url: 'https://huggingface.co/chat',
      note: 'Open-source models with a web-search toggle.',
    },
    steps: [
      'Name the 2–3 options you\'re considering (or ask it to suggest options at your budget).',
      'Paste the compare prompt below.',
      'Click the sources it cites to verify prices before paying.',
    ],
    prompts: [
      {
        label: 'The compare recipe',
        text: 'Compare [OPTION A] vs [OPTION B] for me.\nMy needs: [e.g. "mainly camera and battery, budget ₹25,000, will use it 4+ years"].\nGive me: a comparison table of the specs that matter FOR MY NEEDS, a one-line verdict, and what I\'d be giving up with each choice. If both are bad for my needs, say so and suggest one alternative.',
      },
    ],
    result:
      'A needs-based comparison table with a straight verdict and sources — decision made in minutes.',
    tweaks: [
      'Prices change fast — always verify the final price on the store page.',
      'Works for insurance plans, courses, gyms — any "which one?" decision.',
    ],
    vocab: [],
    deeper: [{ label: 'The site\'s own tool-comparison engine', href: '/compare' }],
  },
  {
    slug: 'get-a-refund-politely',
    track: 'beginner',
    order: 15,
    title: 'Complain effectively (and get refunds)',
    tagline: 'Firm, polite, and quoting the right things.',
    minutes: 5,
    goal: 'Write complaints that actually get results — calm, specific, and escalation-ready.',
    tool: {
      name: 'ChatGPT (free)',
      url: 'https://chatgpt.com',
      note: 'Works for emails, chat-support messages, and review drafts.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, same recipe.',
    },
    steps: [
      'Describe what happened, what you\'ve tried, and what you want.',
      'Paste the complaint recipe below.',
      'Send version 1; if ignored, ask for the escalation version.',
    ],
    prompts: [
      {
        label: 'The complaint recipe',
        text: 'Write a complaint message for me.\nWhat happened: [e.g. "ordered a mixer on the 3rd, arrived broken, support chat promised a replacement twice, nothing in 2 weeks"].\nWhat I want: [refund / replacement / apology].\nTone: calm, firm, factual — no insults.\nInclude: a clear timeline, my order number placeholder [ORDER #], a specific deadline for their response, and a polite mention of the next step (consumer forum / chargeback) if unresolved.',
      },
    ],
    result:
      'A complaint that support teams take seriously: factual timeline, clear ask, deadline, and calm escalation pressure.',
    tweaks: [
      '"Now write the escalation email to their grievance officer" — level 2, ready.',
      'Keep all receipts/screenshots; AI can help you list what evidence to attach.',
    ],
    vocab: [],
    deeper: [],
  },
];

/* ------------------------------------------------------------------ */
/* Intermediate track — get better results                             */
/* ------------------------------------------------------------------ */

const intermediate: Lesson[] = [
  {
    slug: 'anatomy-of-a-great-prompt',
    track: 'intermediate',
    order: 0,
    title: 'The anatomy of a great prompt',
    tagline: 'Role + context + task + format — the 4 parts that change everything.',
    minutes: 8,
    goal: 'Learn the one structure that upgrades every prompt you\'ll ever write.',
    tool: {
      name: 'Any chat AI',
      url: 'https://chatgpt.com',
      note: 'This lesson is tool-independent — the structure works everywhere.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Try the same prompt on an open model and compare.',
    },
    steps: [
      'Run the WEAK prompt below. Note the generic answer.',
      'Run the STRONG prompt. Same request — watch the difference.',
      'From now on, before asking anything important, spend 20 seconds adding: who it should act as, your situation, exactly what you want, and in what format.',
    ],
    prompts: [
      {
        label: 'Weak (what most people type)',
        text: 'give me marketing ideas for my shop',
      },
      {
        label: 'Strong (role + context + task + format)',
        text: 'You are a marketing consultant for tiny local businesses with zero ad budget.\n\nMy situation: I run a home bakery in Pune. Customers come from Instagram and WhatsApp. Orders are steady on weekends, dead on weekdays.\n\nTask: give me 5 ideas to get weekday orders, using only free channels I already have.\n\nFormat: a table — idea, effort (low/med/high), what to post/send, expected result. Then tell me which ONE you\'d start with and why.',
      },
    ],
    result:
      'The same AI goes from horoscope-generic to consultant-specific. Nothing about the AI changed — your prompt did.',
    tweaks: [
      'Constraints are power: "under 100 words", "no jargon", "only free tools".',
      'Tell it what to do when unsure: "ask me clarifying questions before answering".',
    ],
    vocab: [
      {
        term: 'Prompt engineering',
        href: '/concepts/prompt-engineering',
        plain: 'The craft of structuring requests so AI gives you its best work.',
      },
    ],
    deeper: [
      { label: 'Prompt engineering — full concept', href: '/concepts/prompt-engineering' },
      { label: 'Practice in the prompt playground', href: '/playgrounds' },
    ],
  },
  {
    slug: 'show-dont-tell',
    track: 'intermediate',
    order: 1,
    title: 'Show, don\'t tell (examples beat descriptions)',
    tagline: 'One good example outperforms three paragraphs of instructions.',
    minutes: 6,
    goal: 'Get AI to match YOUR style by showing it a sample instead of describing what you want.',
    tool: {
      name: 'Any chat AI',
      url: 'https://chatgpt.com',
      note: 'Works everywhere — this is a technique, not a tool.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source models respond just as well to examples.',
    },
    steps: [
      'Find one example of the style you want (an email you wrote well, a caption you love).',
      'Use the prompt below — example first, then the new task.',
    ],
    prompts: [
      {
        label: 'The example-first recipe',
        text: 'Here is an example of my writing style:\n\n---\n[PASTE A SHORT SAMPLE YOU WROTE — an email, a post, anything]\n---\n\nStudy the tone, sentence length, and word choices. Now write [NEW THING, e.g. "a welcome email for new customers"] in EXACTLY that style. Keep my quirks.',
      },
    ],
    result:
      'Output that sounds like you on a good day — because it copied your actual voice, not a description of it.',
    tweaks: [
      'Two or three examples work even better than one (this is called few-shot prompting).',
      'Also works for formats: paste one perfectly-formatted row, get 50 more rows like it.',
    ],
    vocab: [
      {
        term: 'Few-shot learning',
        href: '/concepts/zero-shot-learning',
        plain: 'Teaching AI by showing a few examples inside your prompt — no training needed.',
      },
    ],
    deeper: [{ label: 'Zero-shot vs few-shot — the concept', href: '/concepts/zero-shot-learning' }],
  },
  {
    slug: 'iterate-like-a-pro',
    track: 'intermediate',
    order: 2,
    title: 'Iterate: draft → critique → rewrite',
    tagline: 'The 3-message loop professionals use for important work.',
    minutes: 7,
    goal: 'Stop accepting first drafts. Learn the loop that turns good output into great output.',
    tool: {
      name: 'Any chat AI',
      url: 'https://chatgpt.com',
      note: 'The loop works in every chat AI.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, same loop.',
    },
    steps: [
      'Message 1: ask for the draft (use lesson 1\'s structure).',
      'Message 2: paste the critique prompt below — make the AI attack its own work.',
      'Message 3: "Now rewrite it fixing all of that." The third version is the keeper.',
    ],
    prompts: [
      {
        label: 'The critique prompt (message 2)',
        text: 'Now critique your own draft harshly, as if you were [THE REAL AUDIENCE, e.g. "a busy hiring manager who reads 200 applications a day"].\nWhat\'s weak, generic, unclear, or unconvincing? What would make them stop reading? List every problem specifically.',
      },
      {
        label: 'The rewrite prompt (message 3)',
        text: 'Rewrite the draft fixing every problem you just listed. Keep the length similar.',
      },
    ],
    result:
      'Version 3 is consistently, dramatically better than version 1 — same AI, same effort from you, three messages instead of one.',
    tweaks: [
      'For crucial text, run the loop twice.',
      '"Give me 3 versions: safe, bold, weird" — then merge the best parts.',
    ],
    vocab: [
      {
        term: 'Chain-of-thought',
        href: '/concepts/chain-of-thought',
        plain: 'Making AI reason step-by-step before answering — critique loops force this.',
      },
    ],
    deeper: [{ label: 'Chain-of-thought — the concept', href: '/concepts/chain-of-thought' }],
  },
  {
    slug: 'give-ai-a-role',
    track: 'intermediate',
    order: 3,
    title: 'Give AI a role (personas that work)',
    tagline: '"You are a…" is the cheapest quality upgrade there is.',
    minutes: 6,
    goal: 'Use roles to control expertise, honesty, and perspective — including making AI disagree with you.',
    tool: {
      name: 'Any chat AI',
      url: 'https://chatgpt.com',
      note: 'Roles work in every chat AI.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, same technique.',
    },
    steps: [
      'Pick the expert your problem actually needs (negotiator, editor, physiotherapist, tax explainer…).',
      'Start your prompt with the role line, then add the honesty clause from the recipe below.',
    ],
    prompts: [
      {
        label: 'The role + honesty recipe',
        text: 'You are an experienced [ROLE, e.g. "salary negotiation coach"].\nBe direct and honest — if my plan has problems, say so clearly. Do not flatter me.\n\nMy situation: [DESCRIBE]\nWhat I\'m planning: [DESCRIBE]\n\nGive me your honest assessment, the biggest risk I\'m not seeing, and what you\'d do instead.',
      },
      {
        label: 'The devil\'s advocate',
        text: 'Now argue AGAINST your own advice as a skeptical [OTHER ROLE, e.g. "HR manager on the other side of the table"]. What will they push back on? How should I respond?',
      },
    ],
    result:
      'Sharper, more specialized answers — and with the honesty clause, an advisor instead of a cheerleader.',
    tweaks: [
      '"Do not flatter me" genuinely changes the output — AIs default to agreeable.',
      'Interview both sides: the coach AND the opponent. You\'ll be ready for the real conversation.',
    ],
    vocab: [],
    deeper: [],
  },
  {
    slug: 'formats-on-demand',
    track: 'intermediate',
    order: 4,
    title: 'Get answers in any format',
    tagline: 'Tables, checklists, templates, spreadsheet-ready data.',
    minutes: 6,
    goal: 'Stop reformatting AI answers by hand — ask for the exact structure you\'ll use.',
    tool: {
      name: 'Any chat AI',
      url: 'https://chatgpt.com',
      note: 'Tables paste cleanly into Google Sheets and Excel.',
    },
    oss: {
      name: 'HuggingChat',
      url: 'https://huggingface.co/chat',
      note: 'Open-source, same formats.',
    },
    steps: [
      'Decide where the answer will LIVE (a spreadsheet? a printed checklist? a message?).',
      'Ask for that format explicitly — the recipe shows the most useful ones.',
    ],
    prompts: [
      {
        label: 'Format gallery (pick one line)',
        text: 'Answer as: a table with columns [X, Y, Z].\nAnswer as: a printable checklist with checkboxes.\nAnswer as: a fill-in-the-blank template I can reuse.\nAnswer as: CSV I can paste into a spreadsheet.\nAnswer as: a week-by-week plan with one action per day.\nAnswer as: a decision tree (if this → then that).',
      },
      {
        label: 'Example — reusable template',
        text: 'Create a fill-in-the-blank template for [e.g. "weekly team status updates"]. Make the blanks obvious like [THIS]. I\'ll reuse it every week, so keep it under one page.',
      },
    ],
    result:
      'Answers that drop straight into your spreadsheet, planner, or workflow with zero manual reformatting.',
    tweaks: [
      '"Keep the table under 6 columns" — wide tables get messy.',
      'Templates are a superpower: build one great prompt-template per recurring task.',
    ],
    vocab: [
      {
        term: 'Tokenization',
        href: '/concepts/tokenization',
        plain: 'How AI splits text into pieces — why odd formats sometimes glitch.',
      },
    ],
    deeper: [{ label: 'See tokenization live in the playground', href: '/playgrounds' }],
  },
  {
    slug: 'work-with-your-files',
    track: 'intermediate',
    order: 5,
    title: 'Work with your files, photos & screenshots',
    tagline: 'PDFs, spreadsheets, handwriting, error screenshots — AI reads them all.',
    minutes: 8,
    goal: 'Move past typing — upload documents and images and let AI extract, explain, and transform them.',
    tool: {
      name: 'Google Gemini (free)',
      url: 'https://gemini.google.com',
      note: 'Generous free file uploads. ChatGPT free also handles images well.',
    },
    oss: {
      name: 'Open WebUI (local)',
      url: 'https://github.com/open-webui/open-webui',
      note: 'Open-source chat with document upload — yours forever, fully private (advanced track shows setup).',
    },
    steps: [
      'Click the + / attach icon in your chat AI.',
      'Upload the file (PDF, photo, screenshot, spreadsheet).',
      'Use one of the recipes below depending on what it is.',
    ],
    prompts: [
      {
        label: 'For any document',
        text: 'Read this document. Give me: 1) what it is, 2) the key points, 3) anything time-sensitive or unusual, 4) the questions I should ask about it.',
      },
      {
        label: 'For a photo of handwriting/notes',
        text: 'Transcribe this handwriting into clean text, preserving the structure. Mark anything you couldn\'t read as [unclear].',
      },
      {
        label: 'For an error screenshot',
        text: 'This is an error I\'m seeing. Explain what\'s wrong in simple words and give me the most likely fix, step by step.',
      },
    ],
    result:
      'Your camera becomes a scanner, your PDFs become conversations, and error messages become fixable.',
    tweaks: [
      'Photograph whiteboards after meetings → "turn this into action items".',
      'Privacy: don\'t upload documents with sensitive IDs/passwords to any cloud AI — the advanced track shows the fully-private local way.',
    ],
    vocab: [
      {
        term: 'Multimodal AI',
        href: '/concepts/multimodal',
        plain: 'Models that understand images, audio, and documents — not just text.',
      },
    ],
    deeper: [
      { label: 'Multimodal — the concept', href: '/concepts/multimodal' },
      { label: 'Go fully private with local AI (advanced)', href: '/learn/run-ai-on-your-computer' },
    ],
  },
  {
    slug: 'catch-ai-mistakes',
    track: 'intermediate',
    order: 6,
    title: 'Catch AI mistakes before they catch you',
    tagline: 'Hallucination-proof your workflow in 3 habits.',
    minutes: 7,
    goal: 'Learn when AI is likely to be wrong, and the 3 cheap habits that protect you.',
    tool: {
      name: 'Perplexity (free)',
      url: 'https://www.perplexity.ai',
      note: 'Cites sources by default — the habit-3 verifier.',
    },
    oss: {
      name: 'HuggingChat (web search on)',
      url: 'https://huggingface.co/chat',
      note: 'Open-source with source-linked search.',
    },
    steps: [
      'Habit 1 — ask for confidence: add the confidence line below to important questions.',
      'Habit 2 — cross-examine: ask "what part of your answer are you least sure about?"',
      'Habit 3 — verify facts that matter (names, numbers, dates, laws, medicines) in a source-citing tool before acting.',
    ],
    prompts: [
      {
        label: 'The confidence line (add to any prompt)',
        text: 'For each claim in your answer, mark it [CERTAIN] or [CHECK THIS]. If you\'re not sure about something, say "I\'m not sure" instead of guessing.',
      },
      {
        label: 'The cross-examination',
        text: 'What part of your last answer are you least confident about? What would I find if you were wrong about it? Where exactly should I verify it?',
      },
    ],
    result:
      'You\'ll know WHERE an answer is shaky before you rely on it — the difference between using AI and being used by it.',
    tweaks: [
      'Danger zones for hallucination: specific numbers, citations, laws, recent events, niche topics.',
      'Rule of thumb: the more a wrong answer would cost you, the more you verify.',
    ],
    vocab: [
      {
        term: 'Hallucination',
        href: '/concepts/hallucination',
        plain: 'Confident nonsense — the #1 AI failure mode.',
      },
      {
        term: 'Temperature',
        href: '/concepts/temperature',
        plain: 'The randomness dial — higher is more creative but less reliable.',
      },
    ],
    deeper: [
      { label: 'Hallucination — why it happens', href: '/concepts/hallucination' },
      { label: 'Temperature — the concept', href: '/concepts/temperature' },
    ],
  },
  {
    slug: 'make-ai-remember-you',
    track: 'intermediate',
    order: 7,
    title: 'Make AI remember you',
    tagline: 'Custom instructions: set your context once, benefit every chat.',
    minutes: 6,
    goal: 'Stop re-explaining yourself. Configure standing instructions so every conversation starts smart.',
    tool: {
      name: 'ChatGPT — Custom Instructions',
      url: 'https://chatgpt.com',
      note: 'Settings → Personalization → Custom Instructions (free plan has it).',
    },
    oss: {
      name: 'Open WebUI (local)',
      url: 'https://github.com/open-webui/open-webui',
      note: 'Open-source equivalent: system prompts you fully control.',
    },
    steps: [
      'Open your AI\'s settings and find Custom Instructions / Personalization.',
      'Fill the two boxes using the template below.',
      'Start a new chat and feel the difference — it already knows your world.',
    ],
    prompts: [
      {
        label: 'Box 1 — about you (template)',
        text: 'I\'m [NAME], [WHAT YOU DO, e.g. "a small business owner running a home bakery"] in [PLACE].\nMy context: [e.g. "self-taught, non-technical, budget-conscious — everything I use must be free"].\nMy recurring goals: [e.g. "marketing my bakery, learning AI, improving my English"].',
      },
      {
        label: 'Box 2 — how to answer (template)',
        text: 'Be direct and practical. Use simple words, short answers first with detail available if I ask. Give steps I can act on today with free tools. If I\'m about to make a mistake, tell me straight — don\'t flatter me. Use examples relevant to my context.',
      },
    ],
    result:
      'Every new chat starts pre-loaded with your situation and your standards — like a colleague who\'s worked with you for months.',
    tweaks: [
      'Revisit monthly — your instructions should evolve as you do.',
      'The honesty line ("don\'t flatter me") is the single highest-value sentence in there.',
    ],
    vocab: [
      {
        term: 'Fine-tuning',
        href: '/concepts/fine-tuning',
        plain: 'Actually retraining a model on your data — custom instructions are the no-training shortcut.',
      },
    ],
    deeper: [{ label: 'Fine-tuning vs prompting — the concept', href: '/concepts/fine-tuning' }],
  },
  {
    slug: 'right-tool-for-the-job',
    track: 'intermediate',
    order: 8,
    title: 'Pick the right AI for each job',
    tagline: 'Chat vs search vs image vs voice — a 30-second decision guide.',
    minutes: 6,
    goal: 'Know instantly which kind of AI tool fits the task in front of you.',
    tool: {
      name: 'Your growing toolbox',
      url: 'https://chatgpt.com',
      note: 'This lesson is the map, not one tool.',
    },
    oss: {
      name: 'The open-source toolbox',
      url: 'https://huggingface.co/chat',
      note: 'Every category below has an open-source option — see the site\'s Tools page.',
    },
    steps: [
      'Learn the map: WRITING/THINKING → chat AI (ChatGPT, HuggingChat). FACTS/CURRENT EVENTS → search AI with sources (Perplexity). IMAGES → image AI (Bing Create, FLUX). MEETINGS/AUDIO → transcription (Whisper). PRIVATE/SENSITIVE → local AI (advanced track).',
      'Bookmark one tool per category — five bookmarks cover 95% of life.',
      'When unsure, run the decision prompt below.',
    ],
    prompts: [
      {
        label: 'The which-tool prompt',
        text: 'Task: [DESCRIBE WHAT YOU\'RE TRYING TO DO].\nWhich KIND of AI tool is right for this — a chat AI, a source-citing search AI, an image generator, a transcription tool, or a local/private AI? Name one free option and one open-source option, and say why in one line each.',
      },
    ],
    result:
      'No more using a chat AI for live prices or a search AI for creative writing — right tool, first try.',
    tweaks: [
      'The site\'s Decision guides do this interactively for developer tools.',
      'Rule: anything involving sensitive personal data → local AI (next track).',
    ],
    vocab: [
      {
        term: 'Benchmark',
        href: '/concepts/benchmark',
        plain: 'Standardized tests that compare model abilities — how "which is best" gets measured.',
      },
    ],
    deeper: [
      { label: 'Interactive decision guides', href: '/decisions' },
      { label: 'The full open-source toolbox', href: '/tools' },
    ],
  },
  {
    slug: 'talk-instead-of-type',
    track: 'intermediate',
    order: 9,
    title: 'Talk instead of type',
    tagline: 'Voice mode: think out loud, get answers on the move.',
    minutes: 6,
    goal: 'Use voice conversations for brainstorming, language practice, and hands-free help.',
    tool: {
      name: 'ChatGPT mobile app (voice)',
      url: 'https://chatgpt.com',
      note: 'The headphone icon in the free mobile app starts a live voice chat.',
    },
    oss: {
      name: 'Whisper (open-source ears)',
      url: 'https://huggingface.co/spaces/openai/whisper',
      note: 'The open model that powers most AI speech-to-text — try it in the browser.',
    },
    steps: [
      'Install your chat AI\'s mobile app and tap the voice icon.',
      'Try the brainstorm starter below — out loud, while walking.',
      'For language practice: "Let\'s have a simple conversation in [language]. Correct my mistakes gently as we go."',
    ],
    prompts: [
      {
        label: 'The voice brainstorm starter (say it)',
        text: 'I want to think out loud about [TOPIC/PROBLEM]. Ask me one question at a time to help me untangle it. Push back when my logic is weak. At the end, summarize what we figured out.',
      },
    ],
    result:
      'Thinking becomes a conversation — many people find they think better talking than typing. Commutes become brainstorms.',
    tweaks: [
      'Voice + "one question at a time" is the killer combo — without it the AI monologues.',
      'Dictating messy thoughts then asking "turn that into a clear plan" = magic.',
    ],
    vocab: [],
    deeper: [{ label: 'Whisper — the open model behind AI ears', href: '/models' }],
  },
];

/* ------------------------------------------------------------------ */
/* Advanced track — own your AI (bridges into existing site content)   */
/* ------------------------------------------------------------------ */

const advanced: Lesson[] = [
  {
    slug: 'run-ai-on-your-computer',
    track: 'advanced',
    order: 0,
    title: 'Run AI on your own computer',
    tagline: 'Free forever, fully private, works offline — meet local AI.',
    minutes: 15,
    goal: 'Install a real open-source AI on your machine — no subscription, no data leaving your computer, no internet needed after setup.',
    tool: {
      name: 'Ollama',
      url: 'https://ollama.com',
      note: 'One installer, one command. The most popular way in.',
    },
    oss: {
      name: 'GPT4All',
      url: 'https://gpt4all.io',
      note: 'Fully graphical alternative — zero terminal, point and click.',
    },
    steps: [
      'Download Ollama from the link above and install it (Windows/Mac/Linux).',
      'Open a terminal (don\'t worry — one command only) and type: ollama run llama3.2',
      'It downloads a ~2GB open model, then gives you a chat prompt right there. Talk to it.',
      'Prefer no terminal at all? Install GPT4All instead — it\'s all buttons and menus.',
      'Everything you learned in the earlier tracks — prompts, roles, examples — works identically here.',
    ],
    prompts: [
      {
        label: 'First local prompt (prove it\'s private)',
        text: 'You are running entirely on my computer with no internet. Explain in simple words what that means for my privacy compared to a cloud AI, and what you can and can\'t do offline.',
      },
    ],
    result:
      'A ChatGPT-style AI that is YOURS: free forever, private by physics (nothing is sent anywhere), and working on a plane.',
    tweaks: [
      '8GB RAM runs small models (llama3.2); 16GB+ runs stronger ones (llama3.1 8B, mistral).',
      'Slow? Try a smaller model: ollama run llama3.2:1b.',
      'This is THE lesson where "open source" stops being a phrase and becomes your software.',
    ],
    vocab: [
      {
        term: 'Open weights',
        href: '/concepts/open-weights',
        plain: 'Models whose "brains" you can download and own — why local AI is possible at all.',
      },
      {
        term: 'Inference',
        href: '/concepts/inference',
        plain: 'The act of a model generating answers — what your computer is now doing itself.',
      },
    ],
    deeper: [
      { label: 'Full tutorial: run your first LLM locally', href: '/tutorials/run-your-first-llm-locally' },
      { label: 'Which open model fits your hardware?', href: '/decisions' },
      { label: 'Ollama in the toolbox', href: '/tools' },
    ],
  },
  {
    slug: 'your-private-chatgpt',
    track: 'advanced',
    order: 1,
    title: 'Build your private ChatGPT',
    tagline: 'Open WebUI: a beautiful chat interface on top of your local models.',
    minutes: 20,
    goal: 'Wrap your local models in a full ChatGPT-style web interface — chat history, file uploads, multiple models — all offline.',
    tool: {
      name: 'Open WebUI',
      url: 'https://github.com/open-webui/open-webui',
      note: 'The most-loved open-source chat interface. Pairs with Ollama automatically.',
    },
    oss: {
      name: 'Jan',
      url: 'https://jan.ai',
      note: 'Simpler all-in-one desktop app alternative — models + interface in one install.',
    },
    steps: [
      'Have Ollama running (previous lesson).',
      'Easiest route: install Docker Desktop, then run the one-line command from the Open WebUI README.',
      'Open http://localhost:3000 in your browser — that\'s YOUR ChatGPT now.',
      'Upload documents in a chat to ask questions about them (private RAG — next-next lesson explains the magic).',
      'Want it simpler? Jan gives you 80% of this as a normal desktop app, no Docker.',
    ],
    prompts: [
      {
        label: 'Test-drive it',
        text: 'I\'m talking to you through my own private interface. Help me set up a "persona" system prompt for my daily work: I\'ll describe my job and you draft the standing instructions I should save for this workspace.',
      },
    ],
    result:
      'chat.yourcomputer — history, files, model switching, personas — with zero data leaving your machine and zero monthly bills.',
    tweaks: [
      'Create one workspace per project with its own system prompt (lesson: make-ai-remember-you, but self-hosted).',
      'On your home network, other devices can use it too — a family AI server.',
    ],
    vocab: [],
    deeper: [
      { label: 'Open WebUI in the toolbox', href: '/tools' },
      { label: 'Compare local LLM tools', href: '/compare' },
    ],
  },
  {
    slug: 'generate-images-locally',
    track: 'advanced',
    order: 2,
    title: 'Generate images on your own GPU',
    tagline: 'Stable Diffusion + ComfyUI: unlimited, uncensored-by-billing, yours.',
    minutes: 25,
    goal: 'Run image generation locally — unlimited images, full control, no credits system.',
    tool: {
      name: 'Stable Diffusion WebUI (AUTOMATIC1111)',
      url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
      note: 'The classic one-click-ish local image studio.',
    },
    oss: {
      name: 'ComfyUI',
      url: 'https://github.com/comfyanonymous/ComfyUI',
      note: 'Node-based power tool — steeper curve, ultimate control.',
    },
    steps: [
      'Check hardware: a GPU with 6GB+ VRAM is the comfortable floor (4GB works with small models, slowly).',
      'Follow the WebUI README installer for your OS — it downloads everything it needs.',
      'Download an open model file (e.g. SDXL) from Hugging Face into the models folder.',
      'Open the local web page it starts, type a prompt from beginner lesson 6, and generate — then explore samplers, sizes, and seeds.',
      'No GPU? Skip local: keep using the free FLUX Hugging Face Space from the beginner track.',
    ],
    prompts: [
      {
        label: 'A structured image prompt to start with',
        text: 'portrait of a wise old lighthouse keeper, dramatic side lighting, oil painting style, rich warm colors, highly detailed, sharp focus',
      },
    ],
    result:
      'An image studio on your desk: batch generations, style experiments, image-to-image — with the only limit being your patience.',
    tweaks: [
      'Learn "negative prompts" — telling it what to avoid fixes most ugly outputs.',
      'Fixed seed + one-word changes = understanding exactly what each word does.',
    ],
    vocab: [
      {
        term: 'GPU',
        href: '/concepts/gpu',
        plain: 'The graphics chip that makes local AI fast — the hardware that matters most.',
      },
      {
        term: 'Diffusion model',
        href: '/concepts/diffusion-model',
        plain: 'The image-from-noise technique you\'re now running yourself.',
      },
    ],
    deeper: [
      { label: 'SDXL and FLUX in the models library', href: '/models' },
      { label: 'Choose an image-generation pipeline', href: '/decisions' },
    ],
  },
  {
    slug: 'chat-with-your-documents',
    track: 'advanced',
    order: 3,
    title: 'Chat with your own documents (RAG)',
    tagline: 'Your notes, manuals, and archives — searchable by conversation.',
    minutes: 20,
    goal: 'Understand and use RAG — the technique that lets AI answer from YOUR files instead of its memory.',
    tool: {
      name: 'Open WebUI (documents feature)',
      url: 'https://github.com/open-webui/open-webui',
      note: 'Upload docs → it chunks, embeds, and retrieves them automatically.',
    },
    oss: {
      name: 'GPT4All (LocalDocs)',
      url: 'https://gpt4all.io',
      note: 'Point it at a folder; it makes the whole folder chat-able. Easiest RAG on earth.',
    },
    steps: [
      'In GPT4All: Settings → LocalDocs → add a folder of PDFs/notes. In Open WebUI: upload files into a chat or knowledge collection.',
      'Wait for indexing (it\'s building embeddings — see vocab).',
      'Ask questions using the grounded prompt below.',
      'Watch it cite which document each answer came from.',
    ],
    prompts: [
      {
        label: 'The grounded-answer prompt',
        text: 'Answer ONLY from the documents I\'ve provided. If the answer isn\'t in them, say "not in the documents" instead of guessing. Quote the relevant passage and name the file it came from.\n\nMy question: [YOUR QUESTION]',
      },
    ],
    result:
      'A private research assistant over your own archive — manuals, contracts, notes, papers — with page-level citations and no hallucinated sources.',
    tweaks: [
      'RAG quality = document quality. Clean, well-named files retrieve better.',
      'This exact technique is what companies pay fortunes for — you just built it free.',
    ],
    vocab: [
      {
        term: 'RAG',
        href: '/concepts/retrieval-augmented-generation',
        plain: 'Retrieve relevant chunks from your files, then generate an answer from them.',
      },
      {
        term: 'Embedding',
        href: '/concepts/embedding',
        plain: 'Text turned into numbers that capture meaning — how "similar" gets computed.',
      },
      {
        term: 'Vector database',
        href: '/concepts/vector-database',
        plain: 'Where embeddings live so retrieval is instant.',
      },
    ],
    deeper: [
      { label: 'Full tutorial: build a RAG app', href: '/tutorials/build-a-rag-app' },
      { label: 'RAG simulator playground', href: '/playgrounds' },
      { label: 'Choose a vector database', href: '/decisions' },
    ],
  },
  {
    slug: 'transcribe-everything',
    track: 'advanced',
    order: 4,
    title: 'Transcribe everything with Whisper',
    tagline: 'Meetings, lectures, voice notes → searchable text, locally.',
    minutes: 15,
    goal: 'Turn any audio into accurate text with the open-source model that started it all.',
    tool: {
      name: 'Whisper (browser demo)',
      url: 'https://huggingface.co/spaces/openai/whisper',
      note: 'Try it instantly — upload a clip, get text.',
    },
    oss: {
      name: 'whisper.cpp',
      url: 'https://github.com/ggerganov/whisper.cpp',
      note: 'Blazing-fast local version — transcribe hours of audio on a laptop CPU.',
    },
    steps: [
      'Quick win: upload a voice note to the browser demo and watch it transcribe.',
      'Local setup: follow whisper.cpp\'s README (clone → make → download a model → one command per file).',
      'Feed the transcript to your local LLM with the meeting-notes prompt below — a fully-offline meeting pipeline.',
    ],
    prompts: [
      {
        label: 'The meeting-notes prompt (for the transcript)',
        text: 'Below is a raw meeting transcript. Produce:\n1. A 5-line summary\n2. Every decision made\n3. Action items as a table: task, owner, deadline (mark unknowns)\n4. Open questions to resolve next time\n\nTranscript:\n[PASTE TRANSCRIPT]',
      },
    ],
    result:
      'Audio in → organized, actionable notes out — meetings, lectures, interviews, voice memos — without audio ever leaving your machine.',
    tweaks: [
      'Whisper handles ~100 languages and heavy accents shockingly well.',
      'Students: record lectures (with permission), transcribe, then use the study-buddy recipe on the transcript.',
    ],
    vocab: [],
    deeper: [
      { label: 'Whisper in the models library', href: '/models' },
      { label: 'Choose an audio/speech pipeline', href: '/decisions' },
      { label: 'Whisper transcription playground', href: '/playgrounds' },
    ],
  },
  {
    slug: 'ai-agents-first-steps',
    track: 'advanced',
    order: 5,
    title: 'AI agents: when AI takes actions',
    tagline: 'From answering questions to doing multi-step work.',
    minutes: 15,
    goal: 'Understand agents — AI that plans, uses tools, and executes multi-step tasks — and run your first safe experiment.',
    tool: {
      name: 'Any chat AI (agent simulation)',
      url: 'https://chatgpt.com',
      note: 'Simulate the agent loop manually first — the concepts transfer directly.',
    },
    oss: {
      name: 'LangChain',
      url: 'https://github.com/langchain-ai/langchain',
      note: 'The open framework most real agents are built with (code required).',
    },
    steps: [
      'Run the manual-agent prompt below — you\'ll play the "tools" while the AI plays the "brain". This teaches the loop: plan → act → observe → repeat.',
      'Notice how it breaks the goal into steps and asks for information before acting — that\'s the agent pattern.',
      'Explore the agent workflow simulator on this site to see the loop visualized.',
      'When ready for real ones: LangChain (code) — or watch this site\'s news; the agent space moves monthly.',
    ],
    prompts: [
      {
        label: 'The manual-agent experiment',
        text: 'Act as an agent working toward this goal: [e.g. "find the best free CRM for a 2-person business and produce a recommendation"].\n\nRules: You cannot browse. Instead, work in a loop: (1) state your current plan, (2) tell me ONE thing to look up or check, (3) wait for my answer, (4) update the plan. Repeat until you have enough to deliver the final recommendation with reasoning.',
      },
    ],
    result:
      'You experience exactly how agents think — planning, tool use, observation — before touching any framework. The mystique evaporates.',
    tweaks: [
      'This manual loop is genuinely useful for real research tasks, not just learning.',
      'Safety instinct: agents that can act (send, buy, delete) deserve the same caution as giving anyone else those permissions.',
    ],
    vocab: [
      {
        term: 'AI Agent',
        href: '/concepts/ai-agent',
        plain: 'AI that plans and takes actions with tools, not just answers.',
      },
      {
        term: 'Chain-of-thought',
        href: '/concepts/chain-of-thought',
        plain: 'The step-by-step reasoning that makes agent planning work.',
      },
    ],
    deeper: [
      { label: 'AI Agent — the concept', href: '/concepts/ai-agent' },
      { label: 'Agent workflow simulator', href: '/playgrounds' },
      { label: 'Choose an agent framework', href: '/decisions' },
    ],
  },
  {
    slug: 'choose-your-stack',
    track: 'advanced',
    order: 6,
    title: 'Choose your open-source stack',
    tagline: 'Models × hardware × tools — a decision framework, not a shopping list.',
    minutes: 12,
    goal: 'Stop collecting tools; assemble a deliberate personal stack matched to your hardware and needs.',
    tool: {
      name: 'This site\'s decision guides',
      url: 'https://chatgpt.com',
      note: 'The Decisions section below walks each choice interactively.',
    },
    oss: {
      name: 'Hugging Face (model hub)',
      url: 'https://huggingface.co',
      note: 'Where every open model lives — learn to read its model cards.',
    },
    steps: [
      'Inventory your hardware honestly: RAM, GPU, VRAM. This decides your model size ceiling.',
      'Understand the size ladder: 1–3B (any laptop) → 7–9B (16GB RAM sweet spot) → 70B+ (serious GPU or quantized).',
      'Learn the two words that stretch hardware: quantization (GGUF files) lets big models fit small machines with minor quality loss.',
      'Pick per category and commit for a month: one chat model, one interface, one image model, one transcriber.',
      'Use the stack-audit prompt below with your local AI.',
    ],
    prompts: [
      {
        label: 'The stack-audit prompt',
        text: 'My hardware: [CPU, RAM, GPU+VRAM if any].\nMy uses: [e.g. "writing, document Q&A, some coding, occasional images"].\nRecommend a complete free open-source stack: which model size in GGUF, which runner (Ollama vs alternatives), which interface, which image option if feasible. Explain each trade-off in one line, and tell me what to upgrade first if I want more.',
      },
    ],
    result:
      'A deliberate, hardware-matched stack — and the vocabulary (quantization, GGUF, VRAM) to upgrade it intelligently as models improve.',
    tweaks: [
      'Re-audit quarterly: open models improve fast; your ceiling rises with them.',
      'The site\'s Dashboard and News track exactly these shifts daily.',
    ],
    vocab: [
      {
        term: 'Quantization',
        href: '/concepts/quantization',
        plain: 'Shrinking models to fit smaller hardware with minimal quality loss.',
      },
      {
        term: 'GGUF',
        href: '/concepts/gguf',
        plain: 'The file format quantized local models ship in.',
      },
      {
        term: 'Mixture of Experts',
        href: '/concepts/mixture-of-experts',
        plain: 'Big-brain models that only "wake up" parts of themselves — big quality, less compute.',
      },
    ],
    deeper: [
      { label: 'Choose hardware for local AI', href: '/decisions' },
      { label: 'Choose a local LLM tool', href: '/decisions' },
      { label: 'Quantization calculator playground', href: '/playgrounds' },
    ],
  },
  {
    slug: 'stay-current-without-drowning',
    track: 'advanced',
    order: 7,
    title: 'Stay current without drowning',
    tagline: 'A 20-minute weekly routine on top of a self-updating atlas.',
    minutes: 10,
    goal: 'Build a sustainable routine for keeping up with AI — using this site\'s daily-refreshing data instead of doomscrolling.',
    tool: {
      name: 'AI Atlas (this site)',
      url: 'https://apexlegion.github.io/aiatlas/',
      note: 'The whole site rescrapes GitHub, Hugging Face, arXiv, and news every 24h.',
    },
    oss: {
      name: 'Hugging Face trending',
      url: 'https://huggingface.co/models?sort=trending',
      note: 'The raw feed of what the open-source community is excited about.',
    },
    steps: [
      'Weekly (20 min): open this site\'s Dashboard for the pulse, News for what happened, and Models for anything new that fits your hardware.',
      'Monthly: re-run the stack-audit from the previous lesson — swap ONE component if something clearly better exists.',
      'Use the filter prompt below on any breathless AI headline before you care about it.',
      'Explore the Knowledge Graph when something new appears — seeing what it connects to tells you if it matters.',
    ],
    prompts: [
      {
        label: 'The hype filter',
        text: 'Here\'s an AI announcement: [PASTE HEADLINE/SUMMARY].\nAnswer bluntly: 1) Is this available now, open-source, and runnable on consumer hardware — or a demo/promise? 2) Does it change anything for someone with my stack: [YOUR STACK]? 3) Check back in a month, or act now?',
      },
    ],
    result:
      'You stay genuinely current in 20 minutes a week while others drown in hype — because your atlas updates itself and your filter is ruthless.',
    tweaks: [
      'One in twenty announcements matters for your actual stack. The filter finds it.',
      'You\'ve completed the Academy. The rest of the site — graph, playgrounds, compare, jobs — is now your reference shelf. Go build something.',
    ],
    vocab: [
      {
        term: 'Benchmark',
        href: '/concepts/benchmark',
        plain: 'How new models prove they\'re actually better — read these, not headlines.',
      },
    ],
    deeper: [
      { label: 'Dashboard — the live pulse', href: '/dashboard' },
      { label: 'News — auto-refreshed daily', href: '/news' },
      { label: 'The knowledge graph', href: '/graph' },
    ],
  },
];

/* ------------------------------------------------------------------ */

export const LESSONS: Lesson[] = [...beginner, ...intermediate, ...advanced];

export function getLessonsByTrack(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track).sort((a, b) => a.order - b.order);
}

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** The lesson that follows `lesson` inside its own track, if any. */
export function getNextLesson(lesson: Lesson): Lesson | undefined {
  return getLessonsByTrack(lesson.track).find((l) => l.order === lesson.order + 1);
}

export function getTrack(id: TrackId): Track {
  const track = TRACKS.find((t) => t.id === id);
  if (!track) throw new Error(`Unknown track: ${id}`);
  return track;
}
