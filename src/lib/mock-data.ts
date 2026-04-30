import type { Client, DailyLog, Task, FileItem, Milestone } from "./types";

export const clients: Client[] = [
  {
    id: "lish",
    name: "Coach Lish Aquino",
    company: "Coach Circle PH",
    industry: "Coaching",
    status: "Active",
    engagement: "Full-time",
    schedule: "M-F (7AM-5PM)",
    rate: 40000,
    rateLabel: "₱40,000/mo",
    joinedDate: "2026-04-12",
    avatar: "LA",
    image: "/clients/coach-lish.jpg",
    logo: "/clients/coach-circle-logo.png",
    brandColor: "#D4AF37",
  },
  {
    id: "josha",
    name: "Josha Broach",
    company: "—",
    industry: "—",
    status: "Onboarding",
    engagement: "Part-time",
    schedule: "Flexible",
    rate: 8,
    rateLabel: "$8/hr",
    joinedDate: "2026-04-30",
    avatar: "JB",
  },
];

export const defaultDailyLog: DailyLog = {
  id: "d1",
  date: "2026-04-16",
  timeIn: "08:30 AM",
  timeOut: "",
  tasksCompleted: [
    "Client onboarding call",
    "Updated CRM pipeline stages",
  ],
  pendingTasks: [
    "Build landing page v2",
    "Fix broken webhook",
  ],
  priorities: [
    "Fix webhook (blocking lead flow)",
    "Landing page - client expecting preview tomorrow",
  ],
  blockers: [
    "Waiting on brand assets from client",
  ],
  nextDayPlan: [
    "Finish landing page",
    "Start Facebook ad creatives",
    "Review funnel A/B results",
  ],
};

export const dailyLogByClient: Record<string, DailyLog> = {
  lish: {
    id: "d-lish",
    date: "2026-04-30",
    timeIn: "",
    timeOut: "",
    tasksCompleted: [
      "Brand foundation finalized (Milestone 1)",
      "Coach Circle PH one-liner approved",
      "Founding coach invitation list drafted",
    ],
    pendingTasks: [
      "Finish website structure (M2)",
      "Reach out to priority founding coaches (M3)",
      "Draft launch countdown copy (M4)",
    ],
    priorities: [
      "Confirm 5-7 founding coaches by April 30",
      "Lock landing page copy with Lish",
      "Prepare visual branding pack for launch",
    ],
    blockers: [
      "Waiting on 2 coach bios + headshots",
      "Final approval on launch theme/vision",
    ],
    nextDayPlan: [
      "Set up inquiry/join form",
      "Publish coach profiles section",
      "Schedule pre-launch teaser content",
    ],
  },
};

export const milestonesByClient: Record<string, Milestone[]> = {
  lish: [
    {
      id: "m1",
      number: 1,
      title: "Finalize the Foundation",
      targetDate: "2026-04-12",
      intent: "Clarify the core identity, offer, and message of Coach Circle PH.",
      output: "A complete brand foundation for Coach Circle PH",
      status: "Completed",
      steps: [
        { id: "m1-1", label: "Finalize the brand message and one-liner", done: true },
        { id: "m1-2", label: "Define what Coach Circle PH is", done: true },
        { id: "m1-3", label: "Clarify who it is for: coaches, leaders, experts", done: true },
        { id: "m1-4", label: "Define the main offer or structure of the platform", done: true },
        { id: "m1-5", label: "Identify the transformation or promise of the community", done: true },
        { id: "m1-6", label: "Finalize launch theme and vision for the grand launch", done: true },
      ],
    },
    {
      id: "m2",
      number: 2,
      title: "Build the Platform Essentials",
      targetDate: "2026-04-20",
      intent: "Prepare the website and basic launch assets.",
      output: "A working platform people can visit, understand, and join",
      status: "In Progress",
      steps: [
        { id: "m2-1", label: "Finalize website structure", done: true },
        { id: "m2-2", label: "Create landing page or homepage copy", done: true },
        { id: "m2-3", label: "Add sections for coach profiles, services, and community vision", done: false },
        { id: "m2-4", label: "Prepare inquiry/join forms", done: false },
        { id: "m2-5", label: "Set up social pages or official online presence", done: false },
        { id: "m2-6", label: "Prepare visual branding elements needed for launch", done: false },
      ],
    },
    {
      id: "m3",
      number: 3,
      title: "Secure Founding Coaches",
      targetDate: "2026-04-30",
      intent: "Invite and confirm the first wave of coaches who will become part of the movement.",
      output: "A strong founding circle of coaches ready to be featured at launch",
      status: "In Progress",
      steps: [
        { id: "m3-1", label: "List the coaches and leaders you want to invite", done: true },
        { id: "m3-2", label: "Create your invitation message", done: true },
        { id: "m3-3", label: "Reach out personally to your priority coaches", done: false },
        { id: "m3-4", label: "Confirm founding members or pioneer coaches", done: false },
        { id: "m3-5", label: "Collect their bios, offers, and profile details", done: false },
        { id: "m3-6", label: "Align them with the vision of Coach Circle PH", done: false },
      ],
    },
    {
      id: "m4",
      number: 4,
      title: "Prepare the Audience and Build Buzz",
      targetDate: "2026-05-08",
      intent: "Start warming up the market and making people curious.",
      output: "An interested audience waiting for the launch",
      status: "Not Started",
      steps: [
        { id: "m4-1", label: "Create teaser content about Coach Circle PH", done: false },
        { id: "m4-2", label: "Share the movement, vision, and why it matters", done: false },
        { id: "m4-3", label: "Introduce selected coaches or founding members", done: false },
        { id: "m4-4", label: "Publish launch countdown content", done: false },
        { id: "m4-5", label: "Build your email list or waiting list", done: false },
        { id: "m4-6", label: "Start collecting leads, sign-ups, or interested community members", done: false },
      ],
    },
    {
      id: "m5",
      number: 5,
      title: "Execute the Pre-Launch Campaign",
      targetDate: "2026-05-15",
      intent: "Move from awareness to anticipation.",
      output: "A complete pre-launch campaign ready to convert attention into action",
      status: "Not Started",
      steps: [
        { id: "m5-1", label: "Announce the official launch date", done: false },
        { id: "m5-2", label: "Release pre-launch content consistently", done: false },
        { id: "m5-3", label: "Share the benefits of joining Coach Circle PH", done: false },
        { id: "m5-4", label: "Highlight coach stories, expertise, or services", done: false },
        { id: "m5-5", label: "Prepare launch scripts, posts, emails, and presentations", done: false },
        { id: "m5-6", label: "Finalize event flow for the grand launch", done: false },
      ],
    },
    {
      id: "m6",
      number: 6,
      title: "Deliver the Grand Launch",
      targetDate: "2026-05-20",
      intent: "Officially launch the movement, platform, and coach circle.",
      output: "Coach Circle PH is officially launched",
      status: "Not Started",
      steps: [
        { id: "m6-1", label: "Host the grand launch event or online rollout", done: false },
        { id: "m6-2", label: "Reveal the platform and featured coaches", done: false },
        { id: "m6-3", label: "Present the vision, mission, and opportunities inside Coach Circle PH", done: false },
        { id: "m6-4", label: "Open registration, membership, or participation options", done: false },
        { id: "m6-5", label: "Capture leads, sign-ups, and next-step commitments", done: false },
        { id: "m6-6", label: "Celebrate and document the launch publicly", done: false },
      ],
    },
  ],
};

export const defaultTasks: Task[] = [
  { id: "t1", name: "Build landing page v2", assignedTo: "AJ", status: "In Progress", priority: "High", dueDate: "2026-04-18", tags: ["Funnel"] },
  { id: "t2", name: "Set up email nurture sequence", assignedTo: "AJ", status: "To Do", priority: "Medium", dueDate: "2026-04-20", tags: ["Automation"] },
  { id: "t3", name: "Fix broken webhook", assignedTo: "AJ", status: "In Progress", priority: "Urgent", dueDate: "2026-04-17", tags: ["Automation"] },
  { id: "t4", name: "Create opt-in funnel for ads", assignedTo: "AJ", status: "To Do", priority: "High", dueDate: "2026-04-19", tags: ["Funnel"] },
  { id: "t5", name: "Set up appointment booking workflow", assignedTo: "AJ", status: "Done", priority: "High", dueDate: "2026-04-16", tags: ["Automation"] },
  { id: "t6", name: "Build 2-step funnel for lead gen", assignedTo: "AJ", status: "Done", priority: "Medium", dueDate: "2026-04-15", tags: ["Funnel"] },
  { id: "t7", name: "Deploy funnel to Vercel preview", assignedTo: "AJ", status: "To Do", priority: "Medium", dueDate: "2026-04-21", tags: ["Funnel"] },
  { id: "t8", name: "Write re-engagement SMS automation", assignedTo: "AJ", status: "In Progress", priority: "Medium", dueDate: "2026-04-18", tags: ["Automation"] },
];

export const tasksByClient: Record<string, Task[]> = {
  lish: [
    { id: "lt1", name: "Add coach profiles section to landing page", assignedTo: "AJ", status: "In Progress", priority: "High", dueDate: "2026-04-20", tags: ["Funnel", "Design"] },
    { id: "lt2", name: "Build inquiry / join form with GHL", assignedTo: "AJ", status: "To Do", priority: "High", dueDate: "2026-04-20", tags: ["Funnel", "Automation"] },
    { id: "lt3", name: "Set up Coach Circle PH social pages", assignedTo: "AJ", status: "To Do", priority: "Medium", dueDate: "2026-04-22", tags: ["Design"] },
    { id: "lt4", name: "Prepare visual branding pack for launch", assignedTo: "AJ", status: "In Progress", priority: "High", dueDate: "2026-04-25", tags: ["Design"] },
    { id: "lt5", name: "Reach out personally to 10 priority coaches", assignedTo: "Lish", status: "In Progress", priority: "Urgent", dueDate: "2026-04-26", tags: ["Support"] },
    { id: "lt6", name: "Collect bios + headshots from founding coaches", assignedTo: "Lish", status: "To Do", priority: "High", dueDate: "2026-04-29", tags: ["Support"] },
    { id: "lt7", name: "Draft teaser content + launch countdown", assignedTo: "AJ", status: "To Do", priority: "Medium", dueDate: "2026-05-02", tags: ["Ads", "Design"] },
    { id: "lt8", name: "Build email waitlist with welcome sequence", assignedTo: "AJ", status: "To Do", priority: "Medium", dueDate: "2026-05-05", tags: ["Automation"] },
    { id: "lt9", name: "Finalize launch event flow and run-of-show", assignedTo: "AJ", status: "To Do", priority: "High", dueDate: "2026-05-13", tags: ["Funnel", "Support"] },
    { id: "lt10", name: "Brand message & one-liner finalized", assignedTo: "Lish", status: "Done", priority: "High", dueDate: "2026-04-12", tags: ["Design"] },
    { id: "lt11", name: "Define Coach Circle PH offer + structure", assignedTo: "Lish", status: "Done", priority: "High", dueDate: "2026-04-12", tags: ["Support"] },
    { id: "lt12", name: "Lock landing page hero copy", assignedTo: "AJ", status: "Done", priority: "Medium", dueDate: "2026-04-18", tags: ["Funnel"] },
  ],
};

export const filesByClient: Record<string, FileItem[]> = {
  lish: [
    { id: "lf1", name: "Coach Circle PH - Logo (Gold)", category: "Brand Kit", type: "image", url: "/clients/coach-circle-logo.png", thumbnail: "/clients/coach-circle-logo.png", size: "—", uploadedAt: "2026-04-12", notes: "Primary logo on dark background" },
    { id: "lf2", name: "Coach Lish - Headshot", category: "Images", type: "image", url: "/clients/coach-lish.jpg", thumbnail: "/clients/coach-lish.jpg", size: "—", uploadedAt: "2026-04-12", notes: "Founder portrait, used on About / hero sections" },
    { id: "lf3", name: "6 Milestones for the Grand Launch", category: "Documents", type: "pdf", url: "", size: "—", uploadedAt: "2026-04-12", notes: "Master roadmap doc - April 12 to May 20 launch" },
    { id: "lf4", name: "Brand Foundation - One-liner & Vision", category: "Brand Kit", type: "pdf", url: "", size: "—", uploadedAt: "2026-04-12", notes: "Approved brand message, who it serves, the promise" },
    { id: "lf5", name: "Founding Coach Invitation Template", category: "Documents", type: "pdf", url: "", size: "—", uploadedAt: "2026-04-15", notes: "Personal outreach script + onboarding checklist" },
  ],
};

// Backwards-compatible export so older imports still work.
export const dailyLog = defaultDailyLog;
