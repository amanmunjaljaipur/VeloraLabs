/**
 * Demo app categories: education
 * Deploy unit: src/lib/demo-apps/groups/education/
 */

import { ent, type DemoCategoryDef, DEMO_GROUP_LABELS } from "../../types";

const G = DEMO_GROUP_LABELS;

export const CATEGORIES: DemoCategoryDef[] = [
{
    slug: "language-learning",
    name: "Language Learning",
    group: "education",
    groupLabel: G.education,
    tagline: "Gamified language drills",
    description: "Duolingo-style lessons, streaks, skills tree, teacher view.",
    examples: ["Duolingo", "Babbel", "Memrise"],
    productKind: "generic",
    brandName: "Verlin Lingua",
    roles: [
      { id: "learner", label: "Learner", description: "Daily lessons", canCreate: true, isDefault: true },
      { id: "teacher", label: "Teacher", description: "Class progress", canManage: true },
      { id: "admin", label: "Curriculum admin", description: "Skills content", canManage: true, canCreate: true },
    ],
    entities: [
      ent("lesson", "Lesson", ["Available", "In progress", "Mastered", "Locked"], ["title", "description", "status"], [
        { title: "Spanish Greetings", description: "Unit 1", status: "Mastered" },
        { title: "Food vocab", description: "Unit 2", status: "In progress" },
        { title: "Past tense", description: "Unit 3", status: "Available" },
        { title: "Subjunctive", description: "Locked", status: "Locked" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Streak" },
      { id: "path", title: "Path", type: "board", entityId: "lesson", description: "Skills" },
      { id: "practice", title: "Practice", type: "form", entityId: "lesson", description: "Drill" },
      { id: "class", title: "Class", type: "list", entityId: "lesson", roleIds: ["teacher"], description: "Students" },
      { id: "curriculum", title: "Curriculum", type: "board", entityId: "lesson", roleIds: ["admin"], description: "Content" },
      { id: "settings", title: "Settings", type: "settings", description: "Goals" },
    ],
    workflows: [
      { id: "wf-learn", name: "Complete lesson", description: "Learner practices", roleId: "learner", steps: ["Path", "Practice", "Mastered"], moduleId: "practice", entityId: "lesson" },
      { id: "wf-teach", name: "Review class", description: "Teacher checks", roleId: "teacher", steps: ["Class"], moduleId: "class" },
      { id: "wf-cur", name: "Publish skill", description: "Admin unlocks", roleId: "admin", steps: ["Curriculum"], moduleId: "curriculum", entityId: "lesson" },
    ],
  },
  {
    slug: "online-learning-moocs",
    name: "Online Learning & MOOCs",
    group: "education",
    groupLabel: G.education,
    tagline: "Courses & certificates",
    description: "Coursera-style courses, enrollments, instructor studio.",
    examples: ["Coursera", "Udemy", "Khan Academy", "MasterClass"],
    productKind: "generic",
    brandName: "Verlin Learn",
    roles: [
      { id: "student", label: "Student", description: "Enroll & learn", canCreate: true, isDefault: true },
      { id: "instructor", label: "Instructor", description: "Publish courses", canCreate: true, canManage: true },
      { id: "admin", label: "Platform admin", description: "Catalog QA", canManage: true },
    ],
    entities: [
      ent("course", "Course", ["Open", "In progress", "Completed", "Archived"], ["title", "memberName", "description", "status"], [
        { title: "AI for PMs", memberName: "Verlin", description: "12 lessons", status: "In progress" },
        { title: "SQL fundamentals", memberName: "Asha", description: "Beginner", status: "Open" },
        { title: "Leadership", memberName: "Guest", description: "Done", status: "Completed" },
        { title: "Legacy course", memberName: "Ops", description: "Archived", status: "Archived" },
      ]),
    ],
    modules: [
      { id: "home", title: "Home", type: "dashboard", description: "My learning" },
      { id: "catalog", title: "Catalog", type: "list", entityId: "course", description: "Browse" },
      { id: "enroll", title: "Enroll", type: "form", entityId: "course", description: "Join course" },
      { id: "studio", title: "Instructor studio", type: "board", entityId: "course", roleIds: ["instructor"], description: "Publish" },
      { id: "create", title: "New course", type: "form", entityId: "course", roleIds: ["instructor"], description: "Create" },
      { id: "admin", title: "Admin", type: "board", entityId: "course", roleIds: ["admin"], description: "QA" },
      { id: "settings", title: "Settings", type: "settings", description: "Certificates" },
    ],
    workflows: [
      { id: "wf-enroll", name: "Enroll & complete", description: "Student learns", roleId: "student", steps: ["Catalog", "Enroll", "Completed"], moduleId: "enroll", entityId: "course" },
      { id: "wf-teach", name: "Publish course", description: "Instructor ships", roleId: "instructor", steps: ["Create", "Open"], moduleId: "create", entityId: "course" },
      { id: "wf-adm", name: "QA catalog", description: "Admin archives", roleId: "admin", steps: ["Admin"], moduleId: "admin", entityId: "course" },
    ],
  },
  {
    slug: "lms-classroom",
    name: "Learning Management Systems",
    group: "education",
    groupLabel: G.education,
    tagline: "School assignments & grades",
    description: "Google Classroom-style classes, assignments, submissions, grades.",
    examples: ["Google Classroom", "Canvas", "Blackboard"],
    productKind: "generic",
    brandName: "Verlin Classroom",
    roles: [
      { id: "student", label: "Student", description: "Submit work", canCreate: true, isDefault: true },
      { id: "teacher", label: "Teacher", description: "Assign & grade", canCreate: true, canManage: true },
      { id: "admin", label: "School admin", description: "Rosters", canManage: true },
    ],
    entities: [
      ent("assignment", "Assignment", ["Assigned", "Submitted", "Graded", "Late"], ["title", "description", "status"], [
        { title: "Essay 1", description: "Due Fri", status: "Assigned" },
        { title: "Lab report", description: "Submitted", status: "Submitted" },
        { title: "Quiz 3", description: "A-", status: "Graded" },
        { title: "Project", description: "Late", status: "Late" },
      ]),
    ],
    modules: [
      { id: "home", title: "Classwork", type: "dashboard", description: "Due soon" },
      { id: "work", title: "Assignments", type: "board", entityId: "assignment", description: "All work" },
      { id: "submit", title: "Submit", type: "form", entityId: "assignment", description: "Turn in" },
      { id: "grade", title: "Gradebook", type: "board", entityId: "assignment", roleIds: ["teacher"], description: "Grade" },
      { id: "create", title: "New assignment", type: "form", entityId: "assignment", roleIds: ["teacher"], description: "Create" },
      { id: "admin", title: "Admin", type: "settings", roleIds: ["admin"], description: "Rosters" },
      { id: "settings", title: "Settings", type: "settings", description: "Notifications" },
    ],
    workflows: [
      { id: "wf-sub", name: "Submit work", description: "Student submits", roleId: "student", steps: ["Submit", "Submitted"], moduleId: "submit", entityId: "assignment" },
      { id: "wf-grade", name: "Grade work", description: "Teacher grades", roleId: "teacher", steps: ["Gradebook", "Graded"], moduleId: "grade", entityId: "assignment" },
      { id: "wf-adm", name: "Manage roster", description: "Admin settings", roleId: "admin", steps: ["Admin"], moduleId: "admin" },
    ],
  },
  {
    slug: "flashcards",
    name: "Flashcard & Active Recall Tools",
    group: "education",
    groupLabel: G.education,
    tagline: "Spaced repetition",
    description: "Anki/Quizlet decks, cards, review queue, mastery.",
    examples: ["Quizlet", "Anki"],
    productKind: "generic",
    brandName: "Verlin Cards",
    roles: [
      { id: "learner", label: "Learner", description: "Review cards", canCreate: true, isDefault: true },
      { id: "author", label: "Deck author", description: "Create decks", canCreate: true, canManage: true },
      { id: "teacher", label: "Teacher", description: "Assign decks", canManage: true },
    ],
    entities: [
      ent("card", "Card", ["New", "Learning", "Review", "Mastered"], ["title", "description", "status"], [
        { title: "What is a mental model?", description: "Front/back", status: "Review" },
        { title: "SQL JOIN types", description: "Drill", status: "Learning" },
        { title: "Capitals", description: "Geo", status: "Mastered" },
        { title: "New term", description: "Added today", status: "New" },
      ]),
    ],
    modules: [
      { id: "home", title: "Review", type: "dashboard", description: "Due today" },
      { id: "deck", title: "Deck", type: "board", entityId: "card", description: "All cards" },
      { id: "add", title: "Add card", type: "form", entityId: "card", description: "New card" },
      { id: "teach", title: "Class decks", type: "list", entityId: "card", roleIds: ["teacher"], description: "Assign" },
      { id: "settings", title: "Settings", type: "settings", description: "SRS intervals" },
    ],
    workflows: [
      { id: "wf-rev", name: "Review due cards", description: "Learner reviews", roleId: "learner", steps: ["Review", "Mastered"], moduleId: "home", entityId: "card" },
      { id: "wf-add", name: "Author cards", description: "Author adds", roleId: "author", steps: ["Add", "New"], moduleId: "add", entityId: "card" },
      { id: "wf-teach", name: "Assign deck", description: "Teacher assigns", roleId: "teacher", steps: ["Class decks"], moduleId: "teach" },
    ],
  },
  {
    slug: "brain-training",
    name: "Brain Training & Mental Gyms",
    group: "education",
    groupLabel: G.education,
    tagline: "Cognitive games",
    description: "Lumosity-style games, scores, daily workouts, coach plans.",
    examples: ["Lumosity", "Peak", "Elevate"],
    productKind: "generic",
    brandName: "Verlin Mind Gym",
    roles: [
      { id: "player", label: "Player", description: "Play games", canCreate: true, isDefault: true },
      { id: "coach", label: "Coach", description: "Assign workouts", canManage: true, canCreate: true },
      { id: "admin", label: "Content admin", description: "Games catalog", canManage: true },
    ],
    entities: [
      ent("session", "Workout", ["Available", "In progress", "Completed", "Skipped"], ["title", "score", "description", "status"], [
        { title: "Memory match", score: 820, description: "Daily", status: "Completed" },
        { title: "Focus flow", score: 0, description: "Today", status: "Available" },
        { title: "Speed math", score: 640, description: "In progress", status: "In progress" },
        { title: "Rest day", score: 0, description: "Skipped", status: "Skipped" },
      ]),
    ],
    modules: [
      { id: "home", title: "Today", type: "dashboard", description: "Workout" },
      { id: "games", title: "Games", type: "board", entityId: "session", description: "Sessions" },
      { id: "play", title: "Start game", type: "form", entityId: "session", description: "Play" },
      { id: "coach", title: "Coach plans", type: "list", entityId: "session", roleIds: ["coach"], description: "Assign" },
      { id: "admin", title: "Catalog", type: "list", entityId: "session", roleIds: ["admin"], description: "Games" },
      { id: "settings", title: "Settings", type: "settings", description: "Difficulty" },
    ],
    workflows: [
      { id: "wf-play", name: "Complete workout", description: "Player finishes", roleId: "player", steps: ["Start", "Completed"], moduleId: "play", entityId: "session" },
      { id: "wf-coach", name: "Assign workout", description: "Coach plans", roleId: "coach", steps: ["Coach plans"], moduleId: "coach" },
      { id: "wf-adm", name: "Manage games", description: "Admin catalog", roleId: "admin", steps: ["Catalog"], moduleId: "admin" },
    ],
  }
];

export default CATEGORIES;
