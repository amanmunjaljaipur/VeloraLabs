/**
 * Verlin Labs educational content packs for all 50 demo apps.
 * Voice: clarity-first, Class-8 English, concrete outcomes, India-aware, no marketing fluff.
 */

import type { DemoCategoryDef, DemoLearningContent } from "./types";

type Pack = DemoLearningContent;

function pack(
  partial: Pack
): Pack {
  return {
    ...partial,
    outcomes: partial.outcomes.slice(0, 5),
    howItWorks: partial.howItWorks.slice(0, 5),
    faqs: partial.faqs.slice(0, 5),
    trustLines: partial.trustLines.slice(0, 4),
  };
}

/** Full packs by slug — every demo must feel like a Verlin lesson, not a stub. */
export const DEMO_LEARNING_PACKS: Record<string, Pack> = {
  // ── Education ──────────────────────────────────────────────────────────
  "language-learning": pack({
    tagline: "Build a daily language habit you can keep",
    description:
      "Practice short lessons the way Verlin Labs structures skills: clear path, visible progress, and a teacher view for class accountability. Master greetings through grammar without guessing what to do next.",
    heroHeadline: "Learn a language in short, trackable drills",
    heroSub:
      "Path → practice → mastery. Switch to Teacher or Curriculum admin to see how real products run multi-role learning.",
    whoItsFor: "Learners building a streak, teachers watching class progress, curriculum owners unlocking skills.",
    outcomes: [
      "Complete a lesson and move it to Mastered",
      "See why locked skills stay closed until prior units finish",
      "Review class progress as a teacher",
      "Publish or unlock a skill as curriculum admin",
    ],
    howItWorks: [
      { step: "Open Today", detail: "Check your streak and what is due for practice." },
      { step: "Walk the Path", detail: "Skills sit on a board: Available → In progress → Mastered → Locked." },
      { step: "Practice once", detail: "Start a drill, then mark the lesson status when you finish." },
      { step: "Switch roles", detail: "Teacher sees class; admin owns the curriculum board." },
    ],
    trustLines: [
      "Demo data only — no real student records",
      "Mock API: titles containing “fail” reject creates",
      "Same Verlin Labs theme as our courses site",
    ],
    faqs: [
      {
        question: "Is this a full Duolingo clone?",
        answer:
          "No. It is a multi-role product shell so you can feel learner, teacher, and curriculum jobs — the same way we design learning products at Verlin Labs.",
      },
      {
        question: "How do I prove a lesson is done?",
        answer: "Open Practice, work a lesson, then move its status to Mastered on the Path board.",
      },
      {
        question: "What should teachers try first?",
        answer: "Switch role to Teacher → Class. Review which lessons are In progress vs Mastered.",
      },
    ],
    roleCopy: {
      learner: "You practice daily lessons, keep a streak, and mark skills Mastered when you can use them.",
      teacher: "You watch class progress, spot stuck learners, and nudge unfinished units.",
      admin: "You own the skills tree: unlock content, retire weak units, and keep the path coherent.",
    },
    moduleCopy: {
      home: "Your learning home — streak cue, due practice, and the next outcome to ship today.",
      path: "Skills tree as a board. Status tells you what is open, active, mastered, or still locked.",
      practice: "Run one focused drill. Treat every submit as a small proof of skill.",
      class: "Teacher roster view of lesson progress across the class.",
      curriculum: "Publish and unlock skills so the path stays fair for learners.",
      settings: "Goals, reminders, and practice preferences for this demo profile.",
    },
    seedEnrichment: {
      lesson: [
        {
          title: "Spanish greetings · Unit 1",
          description:
            "Say hola, buenos días, and introduce yourself in 60 seconds. Mastery = three clean reps without hints.",
        },
        {
          title: "Food vocabulary · Unit 2",
          description:
            "Order simple items and read a café menu. In progress: finish the listening set before writing.",
        },
        {
          title: "Past tense stories · Unit 3",
          description:
            "Tell what you did yesterday in five sentences. Available after Unit 2 is Mastered.",
        },
        {
          title: "Subjunctive · Unit 4",
          description: "Locked until Units 1–3 are Mastered. Used for wishes, doubt, and polite requests.",
        },
      ],
    },
  }),

  "online-learning-moocs": pack({
    tagline: "Enroll, finish modules, earn a clear certificate path",
    description:
      "Browse a catalog like Coursera, enroll with intent, and track Open → In progress → Completed. Instructors publish; platform admins keep quality high — the same role split we use when designing learning products.",
    heroHeadline: "Online courses with a finish line you can see",
    heroSub: "Student, instructor, and platform admin each get a real job — not a brochure page.",
    whoItsFor: "Students choosing a track, instructors shipping a course, admins reviewing catalog quality.",
    outcomes: [
      "Enroll in a course and move it to In progress",
      "Publish a new course as an instructor",
      "Archive weak catalog items as platform admin",
      "Explain who owns certificates vs content",
    ],
    howItWorks: [
      { step: "Home", detail: "See learning in flight and pick one next action." },
      { step: "Catalog", detail: "Browse open courses with clear levels and owners." },
      { step: "Enroll", detail: "Join a course; status becomes In progress." },
      { step: "Studio / Admin", detail: "Instructors publish; admins QA and archive." },
    ],
    trustLines: [
      "Certificate settings are demo-only",
      "Sample courses mirror Verlin-style skill topics (AI, SQL, leadership)",
      "Happy and fail paths via mock API toggle",
    ],
    faqs: [
      {
        question: "Do certificates issue for real?",
        answer: "No — this demo shows the product flow. Certificate settings explain the finish criteria only.",
      },
      {
        question: "How is this different from the LMS demo?",
        answer: "MOOCs focus on catalog + self-paced enroll. LMS focuses on class assignments and grades.",
      },
    ],
    roleCopy: {
      student: "Choose courses, enroll, complete modules, and leave with a clear completion status.",
      instructor: "Design the syllabus, publish when ready, and retire content that no longer helps learners.",
      admin: "Protect catalog quality: open strong courses, archive noise.",
    },
    moduleCopy: {
      home: "Your learning dashboard — what is open, in progress, or completed.",
      catalog: "Browse the public catalog with levels and owners you can trust.",
      enroll: "Join a course with one form. Status updates on the board.",
      studio: "Instructor board for drafts, open, completed, and archived courses.",
      create: "Ship a new course with title, audience, and outcome-led description.",
      admin: "Platform QA board — archive or reopen based on quality.",
      settings: "Certificate rules and notification preferences for this demo.",
    },
    seedEnrichment: {
      course: [
        {
          title: "AI for product managers",
          memberName: "Verlin Labs",
          description:
            "12 lessons: prompt patterns, evals, and shipping AI features without hype. In progress for cohort A.",
        },
        {
          title: "SQL fundamentals",
          memberName: "Asha Mehta",
          description: "Beginner path: SELECT, JOIN, GROUP BY with India retail examples. Open for enroll.",
        },
        {
          title: "Leadership for new managers",
          memberName: "Guest faculty",
          description: "Completed by last cohort. Focus: 1:1s, feedback, and decision logs.",
        },
        {
          title: "Legacy mobile course",
          memberName: "Ops",
          description: "Archived — content outdated. Kept only for admin QA practice.",
        },
      ],
    },
  }),

  "lms-classroom": pack({
    tagline: "Assignments, submissions, and grades in one class flow",
    description:
      "Run a classroom the way teachers actually work: assign work, collect submissions, grade with a clear book, and let school admins own rosters. Built for clarity over feature dump.",
    heroHeadline: "Classroom work with a visible due → grade path",
    heroSub: "Students submit. Teachers grade. Admins keep rosters clean.",
    whoItsFor: "Students turning in work, teachers running gradebook, school admins managing class setup.",
    outcomes: [
      "Submit an assignment and see status change to Submitted",
      "Grade a submission and mark it Graded",
      "Spot Late work before it surprises the student",
      "Open admin settings for roster-style controls",
    ],
    howItWorks: [
      { step: "Classwork", detail: "See what is due soon and what is already graded." },
      { step: "Assignments board", detail: "Assigned → Submitted → Graded → Late at a glance." },
      { step: "Submit or grade", detail: "Students use Submit; teachers use Gradebook." },
      { step: "Admin", detail: "School admin opens roster and notification settings." },
    ],
    trustLines: [
      "No real student PII — sample names only",
      "Grades are demo status moves, not a full rubric engine",
      "Matches Verlin Labs teaching clarity: one job per screen",
    ],
    faqs: [
      {
        question: "Can parents log in?",
        answer: "Not in this demo. Roles are student, teacher, and school admin — the core classroom loop.",
      },
      {
        question: "How do late submissions work?",
        answer: "Move status to Late on the board when work arrives after the due cue in the description.",
      },
    ],
    roleCopy: {
      student: "See assigned work, submit on time, and check when grades land.",
      teacher: "Create assignments, grade submissions, and keep Late work visible.",
      admin: "Own school-level setup: rosters, notifications, and class hygiene.",
    },
    moduleCopy: {
      home: "Classwork home — due soon and recent grades.",
      work: "Full assignment board with status lanes.",
      submit: "Turn in work with a short note and status update.",
      grade: "Gradebook board for teacher review.",
      create: "Create a new assignment with outcome and due cue.",
      admin: "School admin controls for rosters and policies.",
      settings: "Notification preferences for class updates.",
    },
    seedEnrichment: {
      assignment: [
        {
          title: "Essay 1 · Mental models in daily decisions",
          description: "Due Friday. 500 words, Class-8 clear English. Status: Assigned.",
        },
        {
          title: "Lab report · SQL join practice",
          description: "Submitted — waiting for teacher feedback on JOIN examples.",
        },
        {
          title: "Quiz 3 · Prompt patterns",
          description: "Graded A-. Student can review comments in a real product; here status is Graded.",
        },
        {
          title: "Capstone project · Product brief",
          description: "Late — submitted after due date. Teacher decides partial credit.",
        },
      ],
    },
  }),

  flashcards: pack({
    tagline: "Active recall with decks you can actually finish",
    description:
      "Build and review cards the Verlin way: short fronts, precise backs, and status that shows New → Learning → Review → Mastered. Authors create decks; teachers assign them to a class.",
    heroHeadline: "Remember more with honest review status",
    heroSub: "Not infinite decks — a due queue and a path to Mastered.",
    whoItsFor: "Learners reviewing today, authors writing clean cards, teachers assigning decks.",
    outcomes: [
      "Review due cards and promote one to Mastered",
      "Add a card with a clear front/back description",
      "See how teachers would assign a class deck",
      "Adjust SRS-style settings language (demo)",
    ],
    howItWorks: [
      { step: "Review", detail: "Start with cards due today — not the whole library." },
      { step: "Deck board", detail: "Watch cards move New → Learning → Review → Mastered." },
      { step: "Add card", detail: "Write one atomic fact; avoid multi-idea cards." },
      { step: "Class decks", detail: "Teachers assign; learners only review." },
    ],
    trustLines: [
      "Spaced-repetition intervals are illustrative settings copy",
      "Sample cards include Verlin-style topics (mental models, SQL)",
      "Local demo state only",
    ],
    faqs: [
      {
        question: "Does Anki sync work here?",
        answer: "No. This is a product demo of roles and review workflow, not a full SRS engine.",
      },
      {
        question: "What makes a good card?",
        answer: "One question, one answer, plain English. Put the detail in the description field.",
      },
    ],
    roleCopy: {
      learner: "Review due cards first. Mark Mastered only when recall is easy twice in a row.",
      author: "Write atomic cards. Prefer precise backs over long essays.",
      teacher: "Assign decks to a class and check that learners are not stuck on New forever.",
    },
    moduleCopy: {
      home: "Due-today review — the highest leverage screen for memory.",
      deck: "All cards by status so you can spot neglected New items.",
      add: "Create a card: title = front cue; description = full answer.",
      teach: "Class decks list for teacher assignment.",
      settings: "Demo SRS intervals and daily review caps.",
    },
    seedEnrichment: {
      card: [
        {
          title: "What is a mental model?",
          description:
            "A simple map of how something works that helps you decide faster. Example: second-order effects.",
          status: "Review",
        },
        {
          title: "SQL JOIN types — INNER vs LEFT",
          description:
            "INNER keeps matches only; LEFT keeps all left rows and fills missing right with NULL.",
          status: "Learning",
        },
        {
          title: "Capital of Rajasthan",
          description: "Jaipur. Use geography cards for quick wins between hard technical decks.",
          status: "Mastered",
        },
        {
          title: "New term · “Premiumization”",
          description:
            "Make copy more specific and trustworthy without luxury jargon. Status: New — first review pending.",
          status: "New",
        },
      ],
    },
  }),

  "brain-training": pack({
    tagline: "Short cognitive workouts with scores you can compare",
    description:
      "Daily mind-gym sessions: memory, focus, and speed. Players complete workouts; coaches assign plans; content admins keep the game catalog honest.",
    heroHeadline: "Train attention like a daily practice, not a gimmick",
    heroSub: "Finish one workout, log a score, and see coach-assigned plans.",
    whoItsFor: "Players doing today’s session, coaches building plans, admins curating games.",
    outcomes: [
      "Start a workout and mark it Completed with a score",
      "Skip a rest day without breaking the habit story",
      "Assign a plan as coach",
      "Review the game catalog as content admin",
    ],
    howItWorks: [
      { step: "Today", detail: "See the assigned workout and difficulty cue." },
      { step: "Games board", detail: "Available, In progress, Completed, Skipped lanes." },
      { step: "Start game", detail: "Run a session form and save score + status." },
      { step: "Coach / Catalog", detail: "Coaches assign; admins manage games." },
    ],
    trustLines: [
      "Scores are demo numbers — not clinical assessments",
      "Use for product-flow demos, not medical claims",
      "Verlin voice: short practice, clear done state",
    ],
    faqs: [
      {
        question: "Will this improve IQ?",
        answer: "We never claim that. This demo shows product roles and workout tracking only.",
      },
      {
        question: "What if I miss a day?",
        answer: "Mark Skipped for rest or miss — honesty beats fake streaks.",
      },
    ],
    roleCopy: {
      player: "Complete today’s workout, log a score, and keep status honest.",
      coach: "Assign workouts and watch who is stuck In progress.",
      admin: "Curate which games appear in the catalog.",
    },
    moduleCopy: {
      home: "Today’s mind-gym plan and last score.",
      games: "All workouts by status.",
      play: "Start a game and record score when done.",
      coach: "Coach assignment list.",
      admin: "Games catalog maintenance.",
      settings: "Difficulty and daily cap preferences.",
    },
    seedEnrichment: {
      session: [
        {
          title: "Memory match · daily",
          score: 820,
          description: "Completed — solid recall under a 90-second timer.",
          status: "Completed",
        },
        {
          title: "Focus flow · today",
          score: 0,
          description: "Available — ignore phone notifications for one timed block.",
          status: "Available",
        },
        {
          title: "Speed math · in progress",
          score: 640,
          description: "Half set done. Finish before switching apps.",
          status: "In progress",
        },
        {
          title: "Rest day",
          score: 0,
          description: "Skipped on purpose — recovery is part of a sustainable plan.",
          status: "Skipped",
        },
      ],
    },
  }),

  // ── Social ─────────────────────────────────────────────────────────────
  "instant-messaging": pack({
    tagline: "Real chats with safety and group admin jobs",
    description:
      "Message 1:1 and groups with clear delivery states. Group admins manage mute/archive; safety support closes reports. Built to show multi-role messaging — not a toy inbox.",
    heroHeadline: "Chat product with member, admin, and safety paths",
    heroSub: "Send, deliver, read — and practice the fail path when a message cannot send.",
    whoItsFor: "Everyday members, group admins, and safety support staff.",
    outcomes: [
      "Compose a message and watch Sent → Delivered → Read",
      "Mute or archive a group as admin",
      "Close a safety report as support",
      "Force a fail path with the mock API toggle",
    ],
    howItWorks: [
      { step: "Chats home", detail: "See active, muted, and archived threads." },
      { step: "Compose", detail: "Send a message; status shows delivery truth." },
      { step: "Safety board", detail: "Support reviews Open → Reviewing → Closed." },
      { step: "Settings", detail: "Privacy and notification preferences." },
    ],
    trustLines: [
      "Demo conversations only — no real phone numbers",
      "India-ready product pattern (groups, mute, safety)",
      "Mock API for happy/fail demos",
    ],
    faqs: [
      {
        question: "Is encryption real here?",
        answer: "No. Copy describes privacy settings; crypto is not implemented in this demo shell.",
      },
      {
        question: "How do I demo a failed send?",
        answer: "Set API path to Always fail, or use a title containing “fail”, then compose.",
      },
    ],
    roleCopy: {
      user: "Start chats, send media-style messages, and keep your inbox tidy.",
      moderator: "As group admin, mute noise, archive old groups, and support safety.",
      support: "Triage spam and harassment reports to Closed with a clear outcome.",
    },
    moduleCopy: {
      home: "Inbox overview — what needs a reply vs what is muted.",
      inbox: "Full chat list with member counts and last activity cues.",
      "new-chat": "Start a 1:1 or group with a clear title.",
      messages: "Thread-level message list and delivery status.",
      compose: "Write and send; watch status for success or fail.",
      reports: "Safety queue for open and reviewing cases.",
      settings: "Privacy, block lists language, and notification prefs.",
    },
    seedEnrichment: {
      chat: [
        {
          title: "Priya Sharma",
          memberName: "You",
          description: "Last: “See you at 6 near the metro.” Active DM.",
          status: "Active",
        },
        {
          title: "Product team",
          memberName: "8 members",
          description: "Last: ship notes for Friday release. Keep unmuted.",
          status: "Active",
        },
        {
          title: "Family",
          memberName: "5 members",
          description: "Muted — festival chat noise; check weekly.",
          status: "Muted",
        },
        {
          title: "Old college group",
          memberName: "12 members",
          description: "Archived reunion thread from last year.",
          status: "Archived",
        },
      ],
      message: [
        {
          title: "Hey — still on for today?",
          description: "Plain text check-in. Status: Read.",
          status: "Read",
        },
        {
          title: "Photo · menu board",
          description: "Shared image of café specials. Delivered.",
          status: "Delivered",
        },
        {
          title: "Voice note · 0:12",
          description: "Short voice update on ETA. Sent.",
          status: "Sent",
        },
        {
          title: "Link · docs.verlinlabs.com",
          description: "Failed send — network or safety filter demo.",
          status: "Failed",
        },
      ],
      report: [
        {
          title: "Spam group invite",
          description: "Unknown number pushed crypto spam into a family group. Open.",
          status: "Open",
        },
        {
          title: "Harassment in DMs",
          description: "Repeated unwanted messages after block. Under review.",
          status: "Reviewing",
        },
      ],
    },
  }),

  "social-networking": pack({
    tagline: "Posts, creators, and moderation that stay honest",
    description:
      "Share updates, grow as a creator, and moderate spam without drama. Draft → Published → Hidden → Removed shows the real lifecycle of social content.",
    heroHeadline: "A social feed with creator and moderator jobs",
    heroSub: "Publish thoughtfully. Hide spam. Remove harm. Members just post and engage.",
    whoItsFor: "Members posting, creators series-planning, moderators keeping the feed safe.",
    outcomes: [
      "Publish a post from Draft",
      "Hide a spam post as moderator",
      "See creator vs member module differences",
      "Explain why Removed is different from Hidden",
    ],
    howItWorks: [
      { step: "Home", detail: "Feed snapshot and your open drafts." },
      { step: "Posts board", detail: "Move posts through publish and moderation states." },
      { step: "Create", detail: "Write a post with a concrete caption — not empty hype." },
      { step: "Moderation", detail: "Hide or remove content that breaks trust." },
    ],
    trustLines: [
      "Sample posts use ordinary India weekend and product-launch moments",
      "No real follower graphs — focus is content lifecycle",
      "Moderation is a first-class role, not an afterthought",
    ],
    faqs: [
      {
        question: "Are comments full threads?",
        answer: "This demo centers posts and moderation states. Comments are represented in descriptions.",
      },
    ],
    roleCopy: {
      member: "Post updates, engage kindly, and draft before you publish.",
      creator: "Plan series content and keep quality high for your audience.",
      moderator: "Hide spam, remove harm, and leave good posts Published.",
    },
    moduleCopy: {
      home: "Social home — drafts, live posts, and moderation cues.",
      settings: "Privacy and notification preferences for your profile.",
    },
    seedEnrichment: {
      post: [
        {
          title: "Weekend hike · Nilgiris",
          description: "Early start, tea at the top. Simple joy post — no hard sell.",
          memberName: "Asha",
          status: "Published",
        },
        {
          title: "Product launch · v2 is live",
          description: "Draft — waiting on final screenshot before publish.",
          memberName: "You",
          status: "Draft",
        },
        {
          title: "Spam offer",
          description: "“Click here for free crypto.” Hidden by moderation.",
          memberName: "Unknown",
          status: "Hidden",
        },
        {
          title: "Team photo · offsite",
          description: "Published recap of team day — faces consented.",
          memberName: "Rohan",
          status: "Published",
        },
      ],
    },
  }),

  "professional-networking": pack({
    tagline: "Careers, intros, and recruiter workflows without noise",
    description:
      "Connect with purpose: profile strength, intros, and recruiter pipelines. Built like LinkedIn-class products but with Verlin clarity — every module has a job.",
    heroHeadline: "Professional network with member, mentor, and recruiter views",
    heroSub: "Grow your profile, request intros, and run a simple hiring pipeline.",
    whoItsFor: "Professionals growing network, mentors giving intros, recruiters screening.",
    outcomes: [
      "Update a profile or connection status",
      "Request an intro with a clear ask",
      "Move a candidate through recruiter stages",
      "Keep spammy outreach out of the happy path",
    ],
    howItWorks: [
      { step: "Home", detail: "Profile strength and open intros." },
      { step: "Network list", detail: "Connections and pending asks." },
      { step: "Recruiter board", detail: "Pipeline statuses for candidates." },
      { step: "Settings", detail: "Visibility and outreach preferences." },
    ],
    trustLines: [
      "No real LinkedIn import — sample career stories only",
      "Recruiter data is demo seed",
      "Copy follows Class-8 professional English",
    ],
    faqs: [
      {
        question: "Can I import my résumé?",
        answer: "Use the ResumeLift / resume product kind demos for builder flows. This app is networking + pipeline.",
      },
    ],
    roleCopy: {
      member: "Keep your profile honest and send intros with a specific ask.",
      mentor: "Accept or decline intro requests with clear reasons.",
      recruiter: "Screen candidates on a board without losing context.",
    },
    moduleCopy: {
      home: "Career home — profile cues and open actions.",
      settings: "Who can message you and what recruiters see.",
    },
  }),

  "short-form-video": pack({
    tagline: "Create, publish, and moderate short video",
    description:
      "TikTok-style creation with creator analytics language and moderator safety. Draft clips, publish, and pull harmful content before it spreads.",
    heroHeadline: "Short video product with creator and safety roles",
    heroSub: "Ship a clip, review performance cues, and moderate risk.",
    whoItsFor: "Creators publishing clips, viewers browsing, safety moderators.",
    outcomes: [
      "Move a clip from Draft to Published",
      "Flag or remove unsafe content",
      "Read creator-facing module copy without vanity metrics lies",
    ],
    howItWorks: [
      { step: "Home", detail: "For You style overview of statuses." },
      { step: "Library board", detail: "Draft, live, flagged, removed." },
      { step: "Upload form", detail: "Title + description that set viewer expectations." },
      { step: "Safety", detail: "Moderator queue." },
    ],
    trustLines: [
      "No real video upload bytes — metadata workflow only",
      "Moderation is required for any serious short-video product",
      "Demo analytics language stays honest",
    ],
    faqs: [
      {
        question: "Where do videos store?",
        answer: "This shell tracks titles, descriptions, and status — not binary video files.",
      },
    ],
    roleCopy: {
      viewer: "Watch and surface what you enjoy; report harm when needed.",
      creator: "Draft, caption clearly, publish when ready.",
      moderator: "Remove or flag content that breaks community rules.",
    },
    moduleCopy: {
      home: "Viewer/creator home with next publish action.",
      settings: "Privacy, duet-style prefs language, and notifications.",
    },
  }),

  "dating-matchmaking": pack({
    tagline: "Profiles, matches, and safety-first messaging",
    description:
      "Matchmaking with respect: complete profiles, like with intent, and keep safety reports first-class. No creepy dark patterns in the copy.",
    heroHeadline: "Dating product that treats safety as a feature",
    heroSub: "Member discovery, match chats, and support for reports.",
    whoItsFor: "Members seeking matches, premium members (demo tier language), safety support.",
    outcomes: [
      "Complete a profile field set and save status",
      "Move a match through conversation states",
      "Open a safety report and close it as support",
    ],
    howItWorks: [
      { step: "Discover", detail: "Browse profiles with clear intent tags." },
      { step: "Matches", detail: "Chat only when both sides match (demo board)." },
      { step: "Safety", detail: "Report and review harmful behaviour." },
      { step: "Settings", detail: "Visibility, distance language, pause account." },
    ],
    trustLines: [
      "Fictional profiles only",
      "Safety support role is mandatory in this blueprint",
      "Copy avoids pressure tactics",
    ],
    faqs: [
      {
        question: "Is location real-time?",
        answer: "No. Distance is descriptive demo text only.",
      },
    ],
    roleCopy: {
      member: "Show up honestly; pause anytime from settings.",
      support: "Triage reports quickly and document outcomes.",
    },
    moduleCopy: {
      home: "Discovery home with next profile actions.",
      settings: "Pause, visibility, and notification controls.",
    },
  }),

  "community-forums": pack({
    tagline: "Topics, answers, and moderator quality control",
    description:
      "Forum product for real learning communities: ask clearly, answer with sources, and moderate with fairness. Aligns with how Verlin runs discussion quality.",
    heroHeadline: "Community Q&A with member, expert, and mod roles",
    heroSub: "Post a topic, mark best answers, close spam.",
    whoItsFor: "Members asking, experts answering, moderators keeping signal high.",
    outcomes: [
      "Create a topic with a specific question",
      "Move answers to Accepted or Hidden",
      "Moderate low-quality threads",
    ],
    howItWorks: [
      { step: "Home", detail: "Trending and unanswered cues." },
      { step: "Topics board", detail: "Open, answered, closed, removed." },
      { step: "Post", detail: "Write a Class-8 clear question." },
      { step: "Moderation", detail: "Remove noise, protect people." },
    ],
    trustLines: [
      "Sample topics can include AI learning and product questions",
      "No real user reputation scores computed",
      "Experts are a role, not a paywall gimmick",
    ],
    faqs: [
      {
        question: "Is this Reddit?",
        answer: "It is a multi-role forum blueprint. Voting depth is simplified to status workflow.",
      },
    ],
    roleCopy: {
      member: "Ask precise questions; accept answers that truly help.",
      expert: "Answer with steps and examples; avoid jargon piles.",
      moderator: "Close duplicates, remove abuse, keep FAQs linked.",
    },
    moduleCopy: {
      home: "Community home — unanswered and hot topics.",
      settings: "Notification and digest preferences.",
    },
  }),

  // ── Entertainment ──────────────────────────────────────────────────────
  "svod-streaming": pack({
    tagline: "Watchlist, continue watching, and content ops",
    description:
      "Subscription video with member watchlists and content-ops publishing. Titles move through catalog states so you see how streaming products really run.",
    heroHeadline: "Streaming home with watchlist and catalog roles",
    heroSub: "Continue watching, manage list, publish as content ops.",
    whoItsFor: "Viewers, household profiles (demo), content operators.",
    outcomes: [
      "Add a title to the watchlist",
      "Mark something In progress vs Completed",
      "Publish or archive a title as ops",
    ],
    howItWorks: [
      { step: "Home", detail: "Continue watching and recommendations language." },
      { step: "Library", detail: "Board of title statuses." },
      { step: "Ops", detail: "Publish new catalog items." },
      { step: "Settings", detail: "Profiles and maturity prefs (demo)." },
    ],
    trustLines: [
      "No real video streams — metadata product demo",
      "Catalog ops role shows behind-the-scenes work",
      "Copy stays family-safe by default",
    ],
    faqs: [
      {
        question: "Can I cast to TV?",
        answer: "Not in this demo. Focus is multi-role catalog and watchlist workflow.",
      },
    ],
    roleCopy: {
      viewer: "Pick what to watch next and keep the list honest.",
      ops: "Publish, unpublish, and archive titles cleanly.",
    },
    moduleCopy: {
      home: "Your streaming home — continue and discover.",
      settings: "Profiles, downloads language, and notifications.",
    },
  }),

  "ugc-video": pack({
    tagline: "Upload, monetize cues, and moderate UGC",
    description:
      "User-generated video platforms need creators and trust & safety together. Upload drafts, publish, and review claims or reports.",
    heroHeadline: "UGC video with creator studio and safety",
    heroSub: "Ship videos, track status, close reports.",
    whoItsFor: "Creators, viewers, trust & safety.",
    outcomes: [
      "Upload metadata for a new video",
      "Publish from Draft",
      "Resolve a safety or copyright-style report status",
    ],
    howItWorks: [
      { step: "Studio home", detail: "Your uploads and drafts." },
      { step: "Library board", detail: "Statuses across lifecycle." },
      { step: "Upload", detail: "Title and description that set expectations." },
      { step: "Safety", detail: "Reports queue." },
    ],
    trustLines: [
      "Monetization is language-only in this demo",
      "Safety queue is required product surface",
      "No real CDN uploads",
    ],
    faqs: [
      {
        question: "Do ads run?",
        answer: "No live ads. You can still practice creator publish and safety roles.",
      },
    ],
    roleCopy: {
      creator: "Own quality and clear titles before publish.",
      viewer: "Watch and report harm.",
      safety: "Close reports with a documented status.",
    },
    moduleCopy: {
      home: "Creator/viewer home with next upload action.",
      settings: "Channel and notification preferences.",
    },
  }),

  "music-podcasts": pack({
    tagline: "Playlists, shows, and publisher catalogs",
    description:
      "Music and podcast listening with library management and publisher roles. Build a playlist, continue a show, and keep catalog status clear.",
    heroHeadline: "Audio library with listener and publisher jobs",
    heroSub: "Save, play, publish episodes — without cluttered UI copy.",
    whoItsFor: "Listeners, creators/publishers, catalog admins.",
    outcomes: [
      "Add an item to a playlist-style list",
      "Mark a show In progress",
      "Publish an episode as publisher",
    ],
    howItWorks: [
      { step: "Home", detail: "Continue listening." },
      { step: "Library", detail: "Saved music and podcasts by status." },
      { step: "Publish", detail: "Creators add episode metadata." },
      { step: "Settings", detail: "Download and explicit-content language." },
    ],
    trustLines: [
      "No audio files streamed — product workflow demo",
      "Publisher role shows catalog ownership",
      "Clear English labels only",
    ],
    faqs: [
      {
        question: "Spotify Connect?",
        answer: "Not included. Demo covers library + publish roles.",
      },
    ],
    roleCopy: {
      listener: "Build a library you will actually finish.",
      publisher: "Ship episode titles and descriptions people can trust.",
      admin: "Archive broken or rights-limited items.",
    },
    moduleCopy: {
      home: "Audio home — continue and discover.",
      settings: "Offline and privacy preferences (demo copy).",
    },
  }),

  audiobooks: pack({
    tagline: "Finish books with progress you can see",
    description:
      "Audiobook library with listening progress and publisher catalog. Designed for long-form finish rates — not endless browse guilt.",
    heroHeadline: "Audiobooks with progress and catalog ops",
    heroSub: "Continue a book, complete it, publish catalog entries.",
    whoItsFor: "Listeners, narrators/publishers, library admins.",
    outcomes: [
      "Mark a book In progress vs Completed",
      "Add a library item",
      "Archive a rights-expired title as admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Continue listening position language." },
      { step: "Shelf board", detail: "Statuses for every title." },
      { step: "Catalog form", detail: "Publish metadata." },
      { step: "Settings", detail: "Speed and sleep-timer language." },
    ],
    trustLines: [
      "Progress percentages are sample fields",
      "No DRM engine in demo",
      "Finish-line copy matches Verlin learning habits",
    ],
    faqs: [
      {
        question: "Can I sync progress devices?",
        answer: "Not implemented — statuses model progress only.",
      },
    ],
    roleCopy: {
      listener: "Pick one book and finish it before starting three more.",
      publisher: "Keep metadata accurate (title, narrator, length cues).",
      admin: "Retire expired titles cleanly.",
    },
    moduleCopy: {
      home: "Your shelf and continue card.",
      settings: "Playback preferences (demo).",
    },
  }),

  "creative-editors": pack({
    tagline: "Projects from draft to export-ready",
    description:
      "Creative editor workflow: open a project, iterate statuses, export when ready. Mirrors CapCut/Canva-class product jobs without fake “AI magic” claims.",
    heroHeadline: "Creative projects with clear draft → export path",
    heroSub: "Editors create; reviewers approve; admins manage templates.",
    whoItsFor: "Creators, brand reviewers, template admins.",
    outcomes: [
      "Create a project and move it toward Export ready",
      "Send something for review",
      "Publish a template as admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Recent projects." },
      { step: "Projects board", detail: "Draft, In review, Ready, Archived." },
      { step: "New project", detail: "Name the outcome in the title." },
      { step: "Templates", detail: "Admin catalog." },
    ],
    trustLines: [
      "No real timeline editor pixels — workflow demo",
      "Review step teaches multi-role creative ops",
      "Honest about demo limits in settings",
    ],
    faqs: [
      {
        question: "Does AI auto-edit?",
        answer: "No generative edit engine here. You practice project statuses and roles.",
      },
    ],
    roleCopy: {
      creator: "Ship drafts fast; ask for review before export.",
      reviewer: "Approve clarity and brand fit.",
      admin: "Curate templates the team reuses.",
    },
    moduleCopy: {
      home: "Creative home — projects needing export.",
      settings: "Export defaults and brand kit language.",
    },
  }),

  "digital-reading": pack({
    tagline: "Reading lists with progress and library ops",
    description:
      "Digital reading for articles and books: save, finish, archive. Library ops keep the catalog useful — same finish-rate philosophy as Verlin learning content.",
    heroHeadline: "Read with a finish line, not endless tabs",
    heroSub: "Members read; editors publish; librarians curate.",
    whoItsFor: "Readers, editors, library admins.",
    outcomes: [
      "Move a piece from Saved to Finished",
      "Publish a new reading item as editor",
      "Archive low-quality items",
    ],
    howItWorks: [
      { step: "Home", detail: "Continue reading." },
      { step: "Library board", detail: "Saved, Reading, Finished, Archived." },
      { step: "Publish", detail: "Editors add clean titles and summaries." },
      { step: "Settings", detail: "Font and offline language." },
    ],
    trustLines: [
      "Sample titles can include Verlin mental-model style essays",
      "No ebook binary files",
      "Finish rate is the product goal in copy",
    ],
    faqs: [
      {
        question: "Kindle sync?",
        answer: "Not in this demo. Status workflow models reading progress.",
      },
    ],
    roleCopy: {
      reader: "Finish one piece before saving ten more.",
      editor: "Write summaries that set true expectations.",
      admin: "Archive clutter so the library stays useful.",
    },
    moduleCopy: {
      home: "Reading home — continue and due list.",
      settings: "Display and notification preferences.",
    },
  }),

  // ── Fintech ────────────────────────────────────────────────────────────
  "digital-banking": pack({
    tagline: "Accounts, transfers, and support with real validation",
    description:
      "Digital bank demo with multi-module flows: balances, send money, bills, support cases. Customer, ops, and admin roles. Prefer the specialized banking runtime when productKind is banking.",
    heroHeadline: "Digital banking you can click through end-to-end",
    heroSub: "Transfer, track, raise support — with happy and fail paths.",
    whoItsFor: "Retail customers, bank ops, and risk/admin staff.",
    outcomes: [
      "Complete a transfer happy path",
      "Force a fail path and read the error",
      "Open a support case with a clear subject",
      "Switch roles to see ops queues",
    ],
    howItWorks: [
      { step: "Home", detail: "Balances and next money jobs." },
      { step: "Transfer modules", detail: "Validated forms and mock API." },
      { step: "Support", detail: "Case statuses Open → Resolved." },
      { step: "Ops / Admin", detail: "Queues only visible to staff roles." },
    ],
    trustLines: [
      "100% mock money — zero real bank rails",
      "OTP and validation patterns are product demos",
      "India cues: UPI-style language where relevant",
    ],
    faqs: [
      {
        question: "Is my money real?",
        answer: "No. All balances and transfers are local mock state for demos.",
      },
      {
        question: "Why does transfer fail?",
        answer: "Use Always fail API path, or invalid fields — to practice error UX.",
      },
    ],
    roleCopy: {
      customer: "Check balances, send money carefully, and raise support when stuck.",
      ops: "Work queues for transfers and cases.",
      admin: "Policy and overview controls for the demo bank.",
    },
    moduleCopy: {
      home: "Bank home — money jobs for today.",
      settings: "Alerts, limits language, and security prefs.",
    },
  }),

  "mobile-wallets": pack({
    tagline: "Pay, collect, and refund with wallet clarity",
    description:
      "UPI-style wallet jobs: pay merchants, request money, refunds, and merchant settlement views. Clear statuses beat jargon.",
    heroHeadline: "Mobile wallet for payers and merchants",
    heroSub: "Send, request, refund — see status truth every time.",
    whoItsFor: "Consumers, merchants, wallet ops.",
    outcomes: [
      "Create a payment and reach Success or Failed",
      "Issue a refund as merchant/ops",
      "Read settlement-ready language",
    ],
    howItWorks: [
      { step: "Home", detail: "Wallet balance cues." },
      { step: "Payments board", detail: "Pending, success, failed, refunded." },
      { step: "Pay form", detail: "Amount + note with validation." },
      { step: "Merchant / Ops", detail: "Settlement and disputes language." },
    ],
    trustLines: [
      "No real UPI rails — mock API only",
      "India payment patterns in copy (VPA-style notes)",
      "Fail path is intentional for demos",
    ],
    faqs: [
      {
        question: "Can I scan QR?",
        answer: "QR is not live hardware here. Use the pay form and statuses.",
      },
    ],
    roleCopy: {
      user: "Pay with a note you would recognize later on a statement.",
      merchant: "Accept, refund, and track settlement states.",
      ops: "Resolve failed payments and disputes.",
    },
    moduleCopy: {
      home: "Wallet home — pay and request shortcuts.",
      settings: "PIN/biometrics language and limits.",
    },
  }),

  "retail-banking": pack({
    tagline: "Branch + digital retail banking journeys",
    description:
      "Accounts, loans applications, service requests. Customer, relationship manager, and branch ops roles — clarity over product sprawl.",
    heroHeadline: "Retail bank with RM and branch ops views",
    heroSub: "Open requests, track loans, serve customers.",
    whoItsFor: "Customers, RMs, branch operations.",
    outcomes: [
      "Open a service request",
      "Move a loan application through statuses",
      "Work a queue as RM or ops",
    ],
    howItWorks: [
      { step: "Home", detail: "Accounts and open requests." },
      { step: "Requests board", detail: "Lifecycle of service cases." },
      { step: "Apply", detail: "Loan or account form with validation." },
      { step: "Ops", detail: "Staff-only queues." },
    ],
    trustLines: [
      "No real KYC documents stored",
      "Loan decisions are demo statuses",
      "RM language stays professional and plain",
    ],
    faqs: [
      {
        question: "Will I get a real loan?",
        answer: "No. This is a product demo of application and ops workflow.",
      },
    ],
    roleCopy: {
      customer: "Track products and raise service needs clearly.",
      rm: "Prioritize clients and advance applications with notes.",
      ops: "Clear queues without losing context.",
    },
    moduleCopy: {
      home: "Retail banking home.",
      settings: "Statement and alert preferences.",
    },
  }),

  insurtech: pack({
    tagline: "Policies, claims, and adjuster workflows",
    description:
      "Buy coverage language, file claims, and process as adjuster/ops. Status honesty matters more than animated mascots.",
    heroHeadline: "Insurance product with claim truth tables",
    heroSub: "File, review, settle or reject — every state is visible.",
    whoItsFor: "Policyholders, agents, claims adjusters.",
    outcomes: [
      "File a claim with a clear incident description",
      "Move claim Reviewing → Approved or Rejected",
      "See agent vs adjuster modules",
    ],
    howItWorks: [
      { step: "Home", detail: "Policies and open claims." },
      { step: "Claims board", detail: "All statuses in one place." },
      { step: "File claim", detail: "What happened, when, how much language." },
      { step: "Adjuster", detail: "Decision queue." },
    ],
    trustLines: [
      "No real underwriting",
      "Rejection paths teach honest UX",
      "Copy avoids fear-based marketing",
    ],
    faqs: [
      {
        question: "Is this IRDAI-compliant software?",
        answer: "No. Educational product shell for demos only.",
      },
    ],
    roleCopy: {
      customer: "Know your policy and file claims with facts.",
      agent: "Help customers start claims and track them.",
      adjuster: "Decide with documented status changes.",
    },
    moduleCopy: {
      home: "Coverage home and claim shortcuts.",
      settings: "Nominee and alert preferences (demo).",
    },
  }),

  "retail-investing": pack({
    tagline: "Watchlists, orders, and advisor guardrails",
    description:
      "Retail investing demo: watchlists, order statuses, advisor review. Educational tone — no get-rich promises, same integrity as Verlin Labs teaching.",
    heroHeadline: "Investing product that teaches process, not hype",
    heroSub: "Place an order path, track fills, review as advisor.",
    whoItsFor: "Investors, advisors, compliance/ops.",
    outcomes: [
      "Add a watchlist idea with a thesis note",
      "Move an order Pending → Filled or Rejected",
      "Review a client action as advisor",
    ],
    howItWorks: [
      { step: "Home", detail: "Portfolio summary language." },
      { step: "Orders board", detail: "Lifecycle of trades." },
      { step: "New order", detail: "Symbol + intent note + status." },
      { step: "Advisor", detail: "Guardrail reviews." },
    ],
    trustLines: [
      "Not investment advice — demo only",
      "Prices are fictional seeds",
      "Fail/reject paths are intentional teaching tools",
    ],
    faqs: [
      {
        question: "Are markets live?",
        answer: "No live market data. Use sample symbols and statuses.",
      },
    ],
    roleCopy: {
      investor: "Write why you buy before you click — thesis in description.",
      advisor: "Review risky patterns and coach process.",
      ops: "Handle rejects and settlement-like statuses.",
    },
    moduleCopy: {
      home: "Investing home — watchlist and open orders.",
      settings: "Risk disclosure language and alerts.",
    },
  }),

  "crypto-exchange": pack({
    tagline: "Trade flow with compliance and risk roles",
    description:
      "Exchange-style order book language, deposits, and compliance review. Clear risk copy — never promises of returns.",
    heroHeadline: "Crypto product shell with compliance in the room",
    heroSub: "Place orders, track deposits, clear compliance holds.",
    whoItsFor: "Traders, compliance officers, exchange ops.",
    outcomes: [
      "Create an order with side and status",
      "Move a deposit through review",
      "Practice a compliance hold release or reject",
    ],
    howItWorks: [
      { step: "Home", detail: "Balances language (demo)." },
      { step: "Orders", detail: "Open, filled, cancelled, rejected." },
      { step: "Compliance", detail: "Holds and reviews." },
      { step: "Settings", detail: "2FA language and API keys demo note." },
    ],
    trustLines: [
      "High-risk asset class — educational demo only",
      "No real chain transactions",
      "Compliance role is non-optional in blueprint",
    ],
    faqs: [
      {
        question: "Can I withdraw on-chain?",
        answer: "No. Statuses model ops; no blockchain connectivity.",
      },
    ],
    roleCopy: {
      trader: "Size carefully; use notes for strategy context.",
      compliance: "Hold unclear activity; document outcomes.",
      ops: "Keep deposits and books statuses accurate.",
    },
    moduleCopy: {
      home: "Exchange home — positions and alerts language.",
      settings: "Security and notification prefs.",
    },
  }),

  // ── Ecommerce ──────────────────────────────────────────────────────────
  "mass-marketplace": pack({
    tagline: "Browse, buy, sell, and resolve orders",
    description:
      "Marketplace with buyer, seller, and support roles. Cart language, order statuses, and dispute resolution — local India retail clarity.",
    heroHeadline: "Marketplace journeys for buyers and sellers",
    heroSub: "Place orders, fulfil, and close support cases.",
    whoItsFor: "Shoppers, sellers, marketplace support.",
    outcomes: [
      "Create an order and track status",
      "Fulfil or cancel as seller",
      "Resolve a support case",
    ],
    howItWorks: [
      { step: "Home", detail: "Deals and open orders." },
      { step: "Orders board", detail: "Placed → shipped → delivered → returned." },
      { step: "List item", detail: "Seller catalog form." },
      { step: "Support", detail: "Buyer/seller cases." },
    ],
    trustLines: [
      "Prices are sample INR-style amounts where present",
      "No real payment capture",
      "Support is a product surface, not a mailto",
    ],
    faqs: [
      {
        question: "COD available?",
        answer: "Described in copy where relevant; payments are mock only.",
      },
    ],
    roleCopy: {
      buyer: "Order with clear delivery notes.",
      seller: "Fulfil on time; update status honestly.",
      support: "Close disputes with a final status.",
    },
    moduleCopy: {
      home: "Marketplace home.",
      settings: "Addresses and notification prefs.",
    },
  }),

  "food-delivery": pack({
    tagline: "Order food with restaurant and rider roles",
    description:
      "Hungry customer, restaurant kitchen, delivery partner. Status from Placed to Delivered with cancel/fail practice.",
    heroHeadline: "Food delivery end-to-end in one demo",
    heroSub: "Order, cook, deliver — three jobs, one board language.",
    whoItsFor: "Customers, restaurant staff, riders.",
    outcomes: [
      "Place an order",
      "Mark Preparing → Out for delivery",
      "Complete delivery or cancel with reason",
    ],
    howItWorks: [
      { step: "Home", detail: "Nearby-style restaurant list language." },
      { step: "Orders", detail: "Kitchen and rider boards by role." },
      { step: "New order", detail: "Items + address note." },
      { step: "Settings", detail: "Diet prefs and addresses." },
    ],
    trustLines: [
      "No real GPS tracking",
      "Sample restaurants only",
      "ETA is descriptive text",
    ],
    faqs: [
      {
        question: "Live map?",
        answer: "Not in this shell — statuses carry the journey.",
      },
    ],
    roleCopy: {
      customer: "Order clearly; tip notes are optional demo fields.",
      restaurant: "Accept, prepare, hand to rider.",
      rider: "Pick up and mark Delivered.",
    },
    moduleCopy: {
      home: "Hungry-path home.",
      settings: "Saved addresses and alerts.",
    },
  }),

  "grocery-qcommerce": pack({
    tagline: "10-minute grocery patterns with picker ops",
    description:
      "Quick commerce: browse staples, place order, picker packs, rider delivers. Speed copy stays honest about demo limits.",
    heroHeadline: "Q-commerce order → pick → deliver",
    heroSub: "Customer, dark-store picker, rider.",
    whoItsFor: "Shoppers, pickers, delivery partners.",
    outcomes: [
      "Place a grocery order",
      "Mark picking complete",
      "Deliver or fail with stock note",
    ],
    howItWorks: [
      { step: "Home", detail: "Essentials and open orders." },
      { step: "Orders board", detail: "Packed, out, delivered." },
      { step: "Pick list", detail: "Picker role modules." },
      { step: "Settings", detail: "Default address." },
    ],
    trustLines: [
      "No promise of real 10-minute delivery",
      "Stock failures are teachable fail paths",
      "India grocery basket samples welcome in seeds",
    ],
    faqs: [
      {
        question: "Dark store inventory live?",
        answer: "No — statuses simulate pick and OOS outcomes.",
      },
    ],
    roleCopy: {
      customer: "Order staples with substitutions notes.",
      picker: "Pack accurately; flag missing items.",
      rider: "Complete the last mile status.",
    },
    moduleCopy: {
      home: "Grocery home.",
      settings: "Delivery prefs.",
    },
  }),

  "secondhand-marketplace": pack({
    tagline: "List, buy used, and trust & safety checks",
    description:
      "Secondhand marketplace with seller listings, buyer orders, and safety review for suspicious items. Circular commerce with clear status.",
    heroHeadline: "Buy and sell used with safety in the loop",
    heroSub: "List honestly, buy carefully, review risk.",
    whoItsFor: "Buyers, sellers, trust reviewers.",
    outcomes: [
      "List an item with condition notes",
      "Move a listing to Sold",
      "Flag a suspicious listing",
    ],
    howItWorks: [
      { step: "Home", detail: "Near you language and saved items." },
      { step: "Listings board", detail: "Active, reserved, sold, removed." },
      { step: "New listing", detail: "Condition + price honesty." },
      { step: "Safety", detail: "Review queue." },
    ],
    trustLines: [
      "Condition grades are seller-declared demo fields",
      "No escrow money movement",
      "Safety role reduces marketplace harm",
    ],
    faqs: [
      {
        question: "Payments in-app?",
        answer: "Mock statuses only — no real checkout rails.",
      },
    ],
    roleCopy: {
      buyer: "Ask condition questions via description notes.",
      seller: "Photo-quality language; never hide defects.",
      safety: "Remove scams and prohibited items.",
    },
    moduleCopy: {
      home: "Secondhand home.",
      settings: "Meetup and shipping prefs language.",
    },
  }),

  "brand-shopping": pack({
    tagline: "Brand storefront with merchandiser and support",
    description:
      "D2C/brand shop: browse collections, place orders, merchandisers manage catalog, support handles returns language.",
    heroHeadline: "Brand shopping with catalog and care roles",
    heroSub: "Shop, merchandise, support — premium but plain English.",
    whoItsFor: "Shoppers, merchandisers, CX support.",
    outcomes: [
      "Place a brand order",
      "Publish a product as merchandiser",
      "Open a return/support case",
    ],
    howItWorks: [
      { step: "Home", detail: "Collections and featured." },
      { step: "Orders", detail: "Buyer order board." },
      { step: "Catalog", detail: "Merch publish form." },
      { step: "Support", detail: "Returns and issues." },
    ],
    trustLines: [
      "Theme colours follow Verlin multi-colour discipline in host app",
      "No real inventory sync",
      "Premium = concrete product facts, not fluff",
    ],
    faqs: [
      {
        question: "Size guides?",
        answer: "Put size cues in product description seeds.",
      },
    ],
    roleCopy: {
      shopper: "Buy with size and delivery notes clear.",
      merchandiser: "Write product copy people can trust.",
      support: "Own return statuses end-to-end.",
    },
    moduleCopy: {
      home: "Brand home.",
      settings: "Profile and addresses.",
    },
  }),

  "loyalty-cashback": pack({
    tagline: "Earn, redeem, and run loyalty ops",
    description:
      "Points and cashback with member wallet, merchant offers, and program admin. Transparent earn rules beat confusing jargon.",
    heroHeadline: "Loyalty program with earn and redeem truth",
    heroSub: "Members earn; merchants fund offers; admins set rules.",
    whoItsFor: "Members, merchants, loyalty admins.",
    outcomes: [
      "Earn a sample points event",
      "Redeem and see status",
      "Publish an offer as merchant/admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Balance and expiring points language." },
      { step: "Activity board", detail: "Earn, redeem, expired." },
      { step: "Redeem form", detail: "Choose reward." },
      { step: "Admin", detail: "Program rules." },
    ],
    trustLines: [
      "Points have no cash value outside demo",
      "Expiry language is instructional",
      "Rules should stay Class-8 readable",
    ],
    faqs: [
      {
        question: "Partner brands live?",
        answer: "Sample merchants only.",
      },
    ],
    roleCopy: {
      member: "Know earn rate before you redeem.",
      merchant: "Fund offers you can honour.",
      admin: "Keep rules simple and public in settings copy.",
    },
    moduleCopy: {
      home: "Loyalty home.",
      settings: "Notifications for expiry.",
    },
  }),

  // ── Utilities ──────────────────────────────────────────────────────────
  "web-browsers": pack({
    tagline: "Tabs, bookmarks, and sync-style profiles",
    description:
      "Browser product shell: tabs and bookmarks with statuses, plus admin policy language for managed browsers.",
    heroHeadline: "Browser workspace with bookmarks you can manage",
    heroSub: "Open tabs, save bookmarks, apply simple policies.",
    whoItsFor: "Everyday users, power users, IT admins.",
    outcomes: [
      "Save a bookmark with a clear title",
      "Archive old tabs language",
      "See admin policy module",
    ],
    howItWorks: [
      { step: "Home", detail: "Open tabs overview." },
      { step: "Bookmarks", detail: "List and board by status." },
      { step: "Add", detail: "URL title + note." },
      { step: "Admin", detail: "Policy settings language." },
    ],
    trustLines: [
      "Does not control a real browser engine",
      "Sync is descriptive only",
      "Good for product-structure demos",
    ],
    faqs: [
      {
        question: "Extensions store?",
        answer: "Not included in this demo scope.",
      },
    ],
    roleCopy: {
      user: "Keep bookmarks named so future-you understands them.",
      admin: "Set simple allow/block policy language.",
    },
    moduleCopy: {
      home: "Browser home.",
      settings: "Privacy and default search language.",
    },
  }),

  "cloud-storage": pack({
    tagline: "Files, sharing, and admin retention",
    description:
      "Drive-style storage: upload metadata, share states, admin retention. Clear ownership beats nested mystery folders.",
    heroHeadline: "Cloud files with share and admin controls",
    heroSub: "Store, share, retain — roles for user and admin.",
    whoItsFor: "Individuals, team members, workspace admins.",
    outcomes: [
      "Add a file record",
      "Change share status",
      "Apply retention language as admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Recent files." },
      { step: "Files board", detail: "Private, shared, archived." },
      { step: "Upload form", detail: "Name + description." },
      { step: "Admin", detail: "Retention and access." },
    ],
    trustLines: [
      "No real blob bytes in demo shell (metadata workflow)",
      "Sharing statuses teach access control UX",
      "Admin role for workspace policies",
    ],
    faqs: [
      {
        question: "Version history?",
        answer: "Represented lightly via status and notes, not full VCS.",
      },
    ],
    roleCopy: {
      user: "Name files for search; share least privilege.",
      admin: "Set retention and offboarding rules language.",
    },
    moduleCopy: {
      home: "Storage home.",
      settings: "Default share and notifications.",
    },
  }),

  "password-managers": pack({
    tagline: "Vault items with sharing and admin recovery language",
    description:
      "Password manager product: vault entries, weak/reused cues in copy, emergency access language for admins. Security education without fake audits.",
    heroHeadline: "Password vault with member and admin recovery paths",
    heroSub: "Store credentials metadata, share safely, practice recovery.",
    whoItsFor: "Individuals, families/teams, IT admins.",
    outcomes: [
      "Add a vault item with site + notes",
      "Mark an item Shared vs Private",
      "Open admin recovery language module",
    ],
    howItWorks: [
      { step: "Home", detail: "Vault health language." },
      { step: "Vault board", detail: "Statuses for items." },
      { step: "Add login", detail: "Never put real production passwords in demos." },
      { step: "Admin", detail: "Recovery and policy." },
    ],
    trustLines: [
      "Use only fictional demo credentials",
      "No real encryption implementation in this shell",
      "Teach good hygiene in copy",
    ],
    faqs: [
      {
        question: "Is this secure storage?",
        answer: "No. Educational UI only — never store real secrets here.",
      },
    ],
    roleCopy: {
      user: "Unique passwords; notes for recovery hints only.",
      admin: "Emergency access policies written in plain English.",
    },
    moduleCopy: {
      home: "Vault home.",
      settings: "Autofill and 2FA companion language.",
    },
  }),

  "mfa-authenticators": pack({
    tagline: "Enroll devices and approve sign-ins",
    description:
      "Authenticator app pattern: enroll, approve, revoke. Security admin sees org enrollments. Clarity reduces lockouts.",
    heroHeadline: "MFA enroll → approve → revoke",
    heroSub: "Members protect accounts; admins monitor enrollment.",
    whoItsFor: "End users, security admins, support.",
    outcomes: [
      "Enroll a device record",
      "Approve or deny a sign-in challenge",
      "Revoke a lost device",
    ],
    howItWorks: [
      { step: "Home", detail: "Active devices." },
      { step: "Challenges", detail: "Pending approvals." },
      { step: "Enroll", detail: "Add device metadata." },
      { step: "Admin", detail: "Org coverage." },
    ],
    trustLines: [
      "No real TOTP secrets generated for production use",
      "Push approve is status simulation",
      "Support path for lockouts in copy",
    ],
    faqs: [
      {
        question: "Works with Google Authenticator?",
        answer: "Conceptual only — not a live authenticator backend.",
      },
    ],
    roleCopy: {
      user: "Enroll a backup device before you need it.",
      admin: "Track coverage; help revokes on lost phones.",
      support: "Guide recovery without shaming users.",
    },
    moduleCopy: {
      home: "Authenticator home.",
      settings: "Default approve timeout language.",
    },
  }),

  "weather-forecasting": pack({
    tagline: "Forecasts, alerts, and editor quality control",
    description:
      "Weather product: locations, forecast statuses, severe alerts. Editors keep copy accurate — no fearmongering.",
    heroHeadline: "Weather with alerts you can act on",
    heroSub: "Users save places; editors publish alert language.",
    whoItsFor: "Everyday users, field teams, content editors.",
    outcomes: [
      "Add a saved location",
      "Publish an alert as editor",
      "Archive outdated warnings",
    ],
    howItWorks: [
      { step: "Home", detail: "Today and next hours language." },
      { step: "Locations", detail: "Saved places board." },
      { step: "Alerts", detail: "Active vs expired." },
      { step: "Settings", detail: "Units and notifications." },
    ],
    trustLines: [
      "Forecast numbers are sample seeds",
      "Not a meteorological source of truth",
      "Alert copy should stay actionable and calm",
    ],
    faqs: [
      {
        question: "Radar maps?",
        answer: "Not rendered — focus is locations and alert workflow.",
      },
    ],
    roleCopy: {
      user: "Save places you actually need alerts for.",
      editor: "Write alerts people can act on in one sentence.",
    },
    moduleCopy: {
      home: "Weather home.",
      settings: "Celsius/Fahrenheit language and alert quiet hours.",
    },
  }),

  "vpn-privacy": pack({
    tagline: "Connect, locations, and abuse prevention",
    description:
      "VPN product shell: connection statuses, location picks, and admin abuse review. Privacy education without overclaiming anonymity.",
    heroHeadline: "VPN connect flow with honest privacy limits",
    heroSub: "Users connect; ops watch abuse; no magic invisibility claims.",
    whoItsFor: "Subscribers, support, network ops.",
    outcomes: [
      "Toggle connection status language",
      "Pick a location record",
      "Review an abuse case as ops",
    ],
    howItWorks: [
      { step: "Home", detail: "Connected/disconnected." },
      { step: "Locations", detail: "Server list statuses." },
      { step: "Connect form", detail: "Choose region note." },
      { step: "Ops", detail: "Abuse queue." },
    ],
    trustLines: [
      "No real tunnel — UI workflow only",
      "Privacy claims stay modest and accurate",
      "Abuse prevention is part of product",
    ],
    faqs: [
      {
        question: "Am I anonymous?",
        answer: "This demo does not provide a real VPN. Never trust overclaims.",
      },
    ],
    roleCopy: {
      user: "Connect when you need a private path on public Wi‑Fi (conceptually).",
      ops: "Stop abuse without treating all users as suspects.",
      support: "Debug connect fails with clear steps.",
    },
    moduleCopy: {
      home: "VPN home.",
      settings: "Kill switch language and protocols (demo).",
    },
  }),

  // ── Productivity ───────────────────────────────────────────────────────
  "team-communication": pack({
    tagline: "Channels, threads, and workspace admin",
    description:
      "Slack-style team chat: channels, mentions language, admin workspace settings. Keep work talk searchable and kind.",
    heroHeadline: "Team communication with channel discipline",
    heroSub: "Members post; leads moderate; admins own workspace.",
    whoItsFor: "Team members, channel leads, workspace admins.",
    outcomes: [
      "Create a channel or message",
      "Archive noisy channels",
      "Adjust workspace settings as admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Unread and mentions language." },
      { step: "Channels", detail: "Active vs archived." },
      { step: "Compose", detail: "Write for future search." },
      { step: "Admin", detail: "Workspace policies." },
    ],
    trustLines: [
      "No real SSO",
      "Sample channels include product and learning teams",
      "Admin is not optional for multi-team demos",
    ],
    faqs: [
      {
        question: "Huddles/video?",
        answer: "See video-conferencing demo for meeting flows.",
      },
    ],
    roleCopy: {
      member: "Prefer channels over DMs for work decisions.",
      lead: "Archive noise; pin outcomes.",
      admin: "Own retention and access language.",
    },
    moduleCopy: {
      home: "Team home.",
      settings: "Notification schedules.",
    },
  }),

  "video-conferencing": pack({
    tagline: "Meetings from schedule to summary status",
    description:
      "Schedule meetings, host, complete, cancel. Hosts and participants share one honest status board.",
    heroHeadline: "Meetings with a clear start and end state",
    heroSub: "Schedule, join language, complete with notes.",
    whoItsFor: "Hosts, participants, admins of meeting policies.",
    outcomes: [
      "Schedule a meeting",
      "Mark Completed with summary note",
      "Cancel with reason",
    ],
    howItWorks: [
      { step: "Home", detail: "Upcoming meetings." },
      { step: "Meetings board", detail: "Scheduled → live → done." },
      { step: "Schedule form", detail: "Title, agenda, time cue." },
      { step: "Settings", detail: "Defaults and recording language." },
    ],
    trustLines: [
      "No WebRTC media in this shell",
      "Agenda quality is the product lesson",
      "Cancellation honesty beats ghost meetings",
    ],
    faqs: [
      {
        question: "Zoom import?",
        answer: "Not included — multi-role meeting workflow only.",
      },
    ],
    roleCopy: {
      host: "Send agenda; end with decisions in notes.",
      participant: "Join prepared; capture actions.",
      admin: "Policy for recording and retention language.",
    },
    moduleCopy: {
      home: "Meetings home.",
      settings: "Default duration and reminders.",
    },
  }),

  "email-clients": pack({
    tagline: "Inbox zero with labels and admin routing",
    description:
      "Email client product: compose, label, archive. Support/admin sees routing. Write emails like Verlin — short and clear.",
    heroHeadline: "Email with statuses that match real triage",
    heroSub: "Inbox, sent, archived — plus admin templates.",
    whoItsFor: "Professionals, support mailboxes, IT admins.",
    outcomes: [
      "Compose and mark Sent",
      "Archive or label a thread",
      "Use admin template language",
    ],
    howItWorks: [
      { step: "Home", detail: "Unread focus." },
      { step: "Mailbox board", detail: "Statuses and labels." },
      { step: "Compose", detail: "Subject = outcome; body = ask." },
      { step: "Admin", detail: "Shared mailbox rules." },
    ],
    trustLines: [
      "No SMTP — local demo messages",
      "Teach subject-line clarity",
      "Spam folder language without real classifiers",
    ],
    faqs: [
      {
        question: "IMAP sync?",
        answer: "Not live. Practice triage workflow only.",
      },
    ],
    roleCopy: {
      user: "One ask per email when you can.",
      admin: "Shared inbox ownership and templates.",
    },
    moduleCopy: {
      home: "Inbox home.",
      settings: "Signatures and vacation language.",
    },
  }),

  "task-project-management": pack({
    tagline: "Tasks and projects with owner accountability",
    description:
      "PM tool: backlog to done, owners, and admin portfolios. Same finish discipline as Verlin course modules.",
    heroHeadline: "Projects where Done is a real status",
    heroSub: "Members execute; leads plan; admins portfolio-view.",
    whoItsFor: "ICs, project leads, PMO/admins.",
    outcomes: [
      "Create a task with owner and outcome",
      "Move Todo → In progress → Done",
      "Block and unblock with notes",
    ],
    howItWorks: [
      { step: "Home", detail: "My work due." },
      { step: "Board", detail: "Classic status lanes." },
      { step: "New task", detail: "Title = verb + outcome." },
      { step: "Admin", detail: "Portfolio hygiene." },
    ],
    trustLines: [
      "No Jira import",
      "Estimates are optional sample fields",
      "Blocked needs a reason in description",
    ],
    faqs: [
      {
        question: "Gantt charts?",
        answer: "Not in this demo — status board is the core lesson.",
      },
    ],
    roleCopy: {
      member: "Update status when reality changes.",
      lead: "Cut scope before you burn the team.",
      admin: "Keep portfolio lists truthful.",
    },
    moduleCopy: {
      home: "Work home.",
      settings: "Default views and notifications.",
    },
  }),

  "wikis-notes": pack({
    tagline: "Notes and wiki pages with publish states",
    description:
      "Knowledge base: draft notes, publish wiki pages, archive stale docs. Writing quality matches Verlin educational standards.",
    heroHeadline: "Knowledge that is easy to find and retire",
    heroSub: "Authors draft; editors publish; admins archive.",
    whoItsFor: "Writers, editors, knowledge admins.",
    outcomes: [
      "Draft a note",
      "Publish a wiki page",
      "Archive outdated guidance",
    ],
    howItWorks: [
      { step: "Home", detail: "Recent and drafts." },
      { step: "Pages board", detail: "Draft, published, archived." },
      { step: "Write", detail: "Short paragraphs, clear headings in title." },
      { step: "Admin", detail: "Space settings." },
    ],
    trustLines: [
      "No full block editor — form + status workflow",
      "Archive is a feature, not failure",
      "Sample pages can teach product and learning topics",
    ],
    faqs: [
      {
        question: "Markdown export?",
        answer: "Not required for this multi-role demo.",
      },
    ],
    roleCopy: {
      author: "Write for Class-8 readers first.",
      editor: "Publish only when accurate.",
      admin: "Retire stale pages quarterly (conceptually).",
    },
    moduleCopy: {
      home: "Notes home.",
      settings: "Space permissions language.",
    },
  }),

  "generative-ai-assistants": pack({
    tagline: "Prompts, drafts, and human review gates",
    description:
      "AI assistant product: prompt library, generations, human approve/reject. Verlin stance — AI helps; humans own quality.",
    heroHeadline: "AI drafts with a required human finish line",
    heroSub: "Create prompts, generate, approve — never auto-publish blindly.",
    whoItsFor: "Makers, reviewers, workspace admins.",
    outcomes: [
      "Save a prompt with a clear job",
      "Move a draft to Approved or Rejected",
      "See admin policy language for AI use",
    ],
    howItWorks: [
      { step: "Home", detail: "Recent generations." },
      { step: "Drafts board", detail: "Generated → in review → approved." },
      { step: "New prompt", detail: "Outcome + constraints in description." },
      { step: "Admin", detail: "Usage policy." },
    ],
    trustLines: [
      "Model calls may be mock depending on runtime",
      "Human review is mandatory in the blueprint",
      "No claim of perfect accuracy",
    ],
    faqs: [
      {
        question: "Which model runs?",
        answer: "Platform may use Groq/configured LLM; this demo still teaches review workflow even with mock data.",
      },
    ],
    roleCopy: {
      maker: "Prompt for one job; paste constraints.",
      reviewer: "Reject vague or risky outputs.",
      admin: "Set allowed use cases in plain English.",
    },
    moduleCopy: {
      home: "Assistant home.",
      settings: "Tone and retention language.",
    },
  }),

  // ── Health ─────────────────────────────────────────────────────────────
  "fitness-trackers": pack({
    tagline: "Workouts, streaks, and coach plans",
    description:
      "Fitness tracking with honest session logs. Players train; coaches plan; no fake medical claims.",
    heroHeadline: "Fitness logs with coach accountability",
    heroSub: "Log workouts, complete plans, coach assigns.",
    whoItsFor: "Athletes/users, coaches, program admins.",
    outcomes: [
      "Log a workout as Completed",
      "Skip with honesty",
      "Assign a plan as coach",
    ],
    howItWorks: [
      { step: "Home", detail: "Today’s plan." },
      { step: "Sessions board", detail: "Statuses and scores." },
      { step: "Log workout", detail: "What you did + effort note." },
      { step: "Coach", detail: "Plans list." },
    ],
    trustLines: [
      "Not a medical device",
      "Heart-rate numbers are sample seeds if present",
      "Recovery days are valid",
    ],
    faqs: [
      {
        question: "Wearable sync?",
        answer: "Not live — manual log workflow.",
      },
    ],
    roleCopy: {
      user: "Log reality, not ego.",
      coach: "Adjust plans when life happens.",
      admin: "Program catalog hygiene.",
    },
    moduleCopy: {
      home: "Fitness home.",
      settings: "Goals and reminder prefs.",
    },
  }),

  "meditation-mindfulness": pack({
    tagline: "Daily sits with teacher-led programs",
    description:
      "Mindfulness practice: short sessions, streaks language, teacher programs. Calm copy — no spiritual pressure.",
    heroHeadline: "Mindfulness with a gentle daily practice",
    heroSub: "Sit, complete, follow teacher programs.",
    whoItsFor: "Practitioners, teachers, content admins.",
    outcomes: [
      "Complete a session",
      "Follow a multi-day program status",
      "Publish a session as teacher/admin",
    ],
    howItWorks: [
      { step: "Home", detail: "Today’s sit." },
      { step: "Programs board", detail: "Available to completed." },
      { step: "Start session", detail: "Duration + note." },
      { step: "Teacher", detail: "Program design." },
    ],
    trustLines: [
      "Not therapy or clinical care",
      "Audio not streamed — status workflow",
      "Optional practice, zero shame language",
    ],
    faqs: [
      {
        question: "Live teacher chat?",
        answer: "Role modules only — no live audio room.",
      },
    ],
    roleCopy: {
      user: "Show up for short sits; consistency beats duration ego.",
      teacher: "Design progressive programs.",
      admin: "Keep catalog welcoming.",
    },
    moduleCopy: {
      home: "Practice home.",
      settings: "Reminders and quiet hours.",
    },
  }),

  "calorie-nutrition": pack({
    tagline: "Food logs with coach review",
    description:
      "Nutrition logging without toxic diet culture. Log meals, review macros language, coaches support — never shame.",
    heroHeadline: "Nutrition logs that stay kind and useful",
    heroSub: "Log meals, review days, coach supports.",
    whoItsFor: "Users, nutrition coaches, content admins.",
    outcomes: [
      "Log a meal with calories field",
      "Complete a day status",
      "Review as coach",
    ],
    howItWorks: [
      { step: "Home", detail: "Today’s intake language." },
      { step: "Meals board", detail: "Logged statuses." },
      { step: "Add meal", detail: "What + rough calories." },
      { step: "Coach", detail: "Client reviews." },
    ],
    trustLines: [
      "Not medical nutrition therapy",
      "Calorie numbers are estimates/samples",
      "No body-shaming copy allowed in seeds",
    ],
    faqs: [
      {
        question: "Barcode scan?",
        answer: "Not included — form logging only.",
      },
    ],
    roleCopy: {
      user: "Log to learn patterns, not to punish.",
      coach: "Coach habits with respect.",
      admin: "Food database catalog language.",
    },
    moduleCopy: {
      home: "Nutrition home.",
      settings: "Goals and units.",
    },
  }),

  "menstrual-tracking": pack({
    tagline: "Cycles, symptoms, and private care",
    description:
      "Cycle tracking with privacy-first copy. Log periods and symptoms; optional clinician view. Respect and clarity always.",
    heroHeadline: "Cycle tracking that treats privacy as default",
    heroSub: "Log, predict language, share only if you choose.",
    whoItsFor: "Users, optional clinicians, privacy admins.",
    outcomes: [
      "Log a cycle entry",
      "Mark symptom notes",
      "See privacy settings language",
    ],
    howItWorks: [
      { step: "Home", detail: "Cycle day language." },
      { step: "Logs board", detail: "Entries by status." },
      { step: "Add log", detail: "Date + symptoms note." },
      { step: "Settings", detail: "Lock and share prefs." },
    ],
    trustLines: [
      "Sensitive health demo — fictional data only",
      "Not a diagnostic device",
      "Privacy settings called out explicitly",
    ],
    faqs: [
      {
        question: "Is data shared with partners?",
        answer: "In this demo, nothing leaves your browser session state. Real products must be explicit — we model that in settings copy.",
      },
    ],
    roleCopy: {
      user: "Log what helps you; skip what does not.",
      clinician: "Support only with consent language.",
      admin: "Data retention policies in plain English.",
    },
    moduleCopy: {
      home: "Cycle home.",
      settings: "Privacy, lock, export language.",
    },
  }),

  telemedicine: pack({
    tagline: "Book, consult, and follow-up care paths",
    description:
      "Telehealth shell: book visit, complete consult, prescriptions language, clinician and ops queues. Medical claims stay careful.",
    heroHeadline: "Virtual care with patient and clinician jobs",
    heroSub: "Book → consult → follow-up statuses.",
    whoItsFor: "Patients, clinicians, care ops.",
    outcomes: [
      "Book an appointment",
      "Complete or cancel a visit",
      "Work clinician queue",
    ],
    howItWorks: [
      { step: "Home", detail: "Upcoming visits." },
      { step: "Visits board", detail: "Booked to completed." },
      { step: "Book form", detail: "Reason for visit in plain words." },
      { step: "Clinician", detail: "Today’s queue." },
    ],
    trustLines: [
      "Not a real medical service",
      "No prescriptions are legally valid",
      "Emergency: copy should say go to ER — never treat here",
    ],
    faqs: [
      {
        question: "Video visit works?",
        answer: "Status workflow only — no clinical video stack in demo.",
      },
    ],
    roleCopy: {
      patient: "Describe symptoms clearly; list medicines you take.",
      clinician: "Document and close visits with next steps.",
      ops: "Manage no-shows and follow-ups.",
    },
    moduleCopy: {
      home: "Care home.",
      settings: "Pharmacy and notification prefs language.",
    },
  }),

  // ── Travel ─────────────────────────────────────────────────────────────
  "ride-sharing": pack({
    tagline: "Request rides with driver and ops roles",
    description:
      "Ride-hail: request, match, complete, cancel. Drivers accept; ops handle issues. India city cues welcome.",
    heroHeadline: "Rides from request to drop-off status",
    heroSub: "Rider, driver, ops — one journey board.",
    whoItsFor: "Riders, drivers, city ops.",
    outcomes: [
      "Request a ride",
      "Accept as driver",
      "Complete or cancel with reason",
    ],
    howItWorks: [
      { step: "Home", detail: "Where to language." },
      { step: "Trips board", detail: "Requested → ongoing → done." },
      { step: "Request form", detail: "Pickup and drop notes." },
      { step: "Ops", detail: "Issue queue." },
    ],
    trustLines: [
      "No real maps routing",
      "Fares are sample numbers",
      "Safety share language in settings",
    ],
    faqs: [
      {
        question: "Live driver GPS?",
        answer: "Statuses only — no live map hardware.",
      },
    ],
    roleCopy: {
      rider: "Set pin notes that actually help drivers.",
      driver: "Accept only trips you can finish.",
      ops: "Resolve failed matches and safety flags.",
    },
    moduleCopy: {
      home: "Ride home.",
      settings: "Saved places and safety contacts language.",
    },
  }),

  "navigation-maps": pack({
    tagline: "Routes, places, and map data quality",
    description:
      "Maps product: save places, plan routes language, editors fix POIs. Accuracy culture over flashy 3D.",
    heroHeadline: "Navigation with places and data editors",
    heroSub: "Save places, plan, improve map data.",
    whoItsFor: "Drivers/users, map editors, admins.",
    outcomes: [
      "Save a place",
      "Mark a route plan status",
      "Edit a POI as editor",
    ],
    howItWorks: [
      { step: "Home", detail: "Recents and traffic language." },
      { step: "Places", detail: "Saved board." },
      { step: "Route form", detail: "From → to notes." },
      { step: "Editor", detail: "POI fixes." },
    ],
    trustLines: [
      "No turn-by-turn engine",
      "POI edits are demo records",
      "Offline maps language only",
    ],
    faqs: [
      {
        question: "Works offline?",
        answer: "Described in settings; not a real offline pack download.",
      },
    ],
    roleCopy: {
      user: "Save home/work with clear labels.",
      editor: "Fix names and categories carefully.",
      admin: "Region quality overview.",
    },
    moduleCopy: {
      home: "Maps home.",
      settings: "Voice and unit prefs language.",
    },
  }),

  "travel-booking": pack({
    tagline: "Trips, hotels, and agent ops",
    description:
      "Travel booking: search language, book, manage cancellations. Travellers, agents, ops share one status model.",
    heroHeadline: "Book trips with change and cancel honesty",
    heroSub: "Book → confirm → complete or cancel.",
    whoItsFor: "Travellers, travel agents, booking ops.",
    outcomes: [
      "Create a booking",
      "Confirm or cancel",
      "Work agent queue",
    ],
    howItWorks: [
      { step: "Home", detail: "Upcoming trips." },
      { step: "Bookings board", detail: "All statuses." },
      { step: "Book form", detail: "Destination + dates note." },
      { step: "Agent", detail: "Changes and special requests." },
    ],
    trustLines: [
      "No GDS connectivity",
      "Prices are samples",
      "Cancellation policy language must stay readable",
    ],
    faqs: [
      {
        question: "Ticket PDF?",
        answer: "Not generated — booking status is the demo artifact.",
      },
    ],
    roleCopy: {
      traveller: "Double-check dates before confirm.",
      agent: "Own changes with notes passengers can read.",
      ops: "Clear failed payments and inventory holds.",
    },
    moduleCopy: {
      home: "Trips home.",
      settings: "Traveller profiles and alerts.",
    },
  }),

  "local-discovery": pack({
    tagline: "Find places, save lists, claim businesses",
    description:
      "Local discovery like Maps/Yelp-class products: search places, save lists, business owners claim listings, moderators review.",
    heroHeadline: "Local places with owner and mod roles",
    heroSub: "Discover, save, claim, moderate.",
    whoItsFor: "Locals/tourists, business owners, moderators.",
    outcomes: [
      "Save a place to a list",
      "Claim a business listing as owner",
      "Moderate a bad review or listing",
    ],
    howItWorks: [
      { step: "Home", detail: "Near you language." },
      { step: "Places board", detail: "Open, closed, claimed." },
      { step: "Add/save", detail: "Notes for why it matters." },
      { step: "Owner / Mod", detail: "Claims and quality." },
    ],
    trustLines: [
      "Listings are fictional samples",
      "Ratings are demo fields",
      "India city neighborhoods welcome in seeds",
    ],
    faqs: [
      {
        question: "Live foot traffic?",
        answer: "No — discovery workflow and roles only.",
      },
    ],
    roleCopy: {
      user: "Save places with a one-line why.",
      owner: "Keep hours and phone honest.",
      moderator: "Remove spam listings and fake reviews.",
    },
    moduleCopy: {
      home: "Discover home.",
      settings: "City and notification prefs.",
    },
  }),
};

/** True when a string is too thin for Verlin educational quality. */
export function isThinCopy(text: string | undefined, minWords = 6): boolean {
  if (!text) return true;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length < minWords;
}

export function getLearningPack(slug: string): Pack | undefined {
  return DEMO_LEARNING_PACKS[slug];
}

/**
 * Synthesize a solid pack when a handcrafted one is missing (safety net).
 */
export function synthesizeLearningPack(def: DemoCategoryDef): Pack {
  const examples = def.examples.slice(0, 3).join(", ");
  const roleNames = def.roles.map((r) => r.label).join(", ");
  return pack({
    tagline: def.tagline && !isThinCopy(def.tagline, 4) ? def.tagline : `Practice the full ${def.name} product loop`,
    description:
      def.description && !isThinCopy(def.description, 12)
        ? def.description
        : `${def.brandName} is a multi-role ${def.name} demo. Work as ${roleNames}. Inspired by products like ${examples || "category leaders"}, with Verlin Labs clarity: one job per screen, honest statuses, and mock APIs for happy and fail paths.`,
    heroHeadline: `Learn ${def.name} by doing the real jobs`,
    heroSub: `Switch roles top-right. Complete a workflow. Read statuses. ${def.brandName} uses the same educational voice as Verlin Labs courses.`,
    whoItsFor: `Anyone exploring ${def.name}: ${roleNames}.`,
    outcomes: [
      `Complete a primary workflow as ${def.roles[0]?.label || "the default role"}`,
      "Create or update a record and watch status change",
      "Switch roles and notice which modules appear",
      "Force a fail path with the API toggle or a “fail” title",
    ],
    howItWorks: [
      { step: "Home", detail: "Read the outcome list and pick one workflow chip." },
      { step: "Module", detail: "Open list, board, or form for the main entity." },
      { step: "Act", detail: "Create or move status — that is the proof." },
      { step: "Switch role", detail: "See the product from another job’s eyes." },
    ],
    trustLines: [
      "Demo data only — not production systems",
      "Mock API for success and failure demos",
      "Verlin Labs UI theme and Class-8 English",
    ],
    faqs: [
      {
        question: `Is ${def.brandName} a full clone of ${def.examples[0] || "the market leader"}?`,
        answer:
          "No. It is an interactive multi-role product shell so you can feel the jobs, modules, and status paths — the way we teach product thinking at Verlin Labs.",
      },
      {
        question: "Why do some actions fail?",
        answer: "Use the API path control (Always fail) or put “fail” in a title to practice error UX.",
      },
      {
        question: "Where do I start?",
        answer: `Stay as ${def.roles[0]?.label || "the default role"}, open Home, then run the first workflow chip.`,
      },
    ],
  });
}
