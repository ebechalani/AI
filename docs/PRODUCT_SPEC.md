# RoboHolic AI — Product Specification (owner's brief)

This is the product owner's original brief, kept as the source of truth for scope.
The engineering response to it lives in [ARCHITECTURE.md](ARCHITECTURE.md).

## Amendments

- **Backend is Firebase, not Supabase** (owner decision, 2026-10-02). Wherever the brief
  says Supabase/PostgreSQL/Row Level Security/migrations, read: Firebase Authentication,
  Cloud Firestore, Cloud Storage, Firebase Security Rules, and versioned seed/migration
  scripts. The entity list in section 20 is a conceptual model to be mapped onto Firestore.

---

## 1. Product vision

RoboHolic AI is an AI education ecosystem for students, teachers, and schools. It teaches
artificial intelligence through practical, project-based learning. It must be designed as
a scalable SaaS product, not a static website.

Supported users: students, teachers, school administrators, platform administrators.

Main learning areas: Artificial Intelligence, Generative AI, Coding, AI + Robotics,
Creativity, Innovation, Responsible AI.

Target age: 8–18. Also includes a Teacher Academy for professional development.

Primary languages: English and French. Arabic must be supported later without redesigning
the database.

The platform will eventually serve both schools and individual students/parents.

Business models: school annual licenses, individual subscription, paid courses/modules,
teacher training, and combinations of these.

## 2. Technology stack

Frontend: Next.js, TypeScript, React, Tailwind CSS.

UI: clean modern SaaS; responsive; accessible; professional but friendly; suitable for
children, teenagers and teachers; avoid childish design for older students.

Backend: Firebase (see Amendments) for database, authentication, storage, and
security rules.

Deployment-ready for Vercel. Use good software architecture.

Do NOT hard-code content into pages. Courses, modules, lessons, quizzes and projects must
come from the database.

## 3. User roles

**Student** can: view enrolled courses; continue lessons; see progress; take quizzes;
submit projects; access AI Tutor; access AI Lab; earn XP; earn badges; receive
certificates; access challenges.

**Teacher** can: create classes; invite/add students; assign courses; see student
progress; review quiz results; review projects; see AI-generated grading suggestions;
approve or modify grades; give feedback; issue certificates; create their own courses.

**School admin** can: manage teachers, students, classes; see school analytics, licenses,
completion rates, certificates, course usage.

**Platform admin** can: manage all schools, users, subscriptions, official RoboHolic
courses, learning pathways, badges, certificates, challenges; see platform analytics.

## 4. Account hierarchy

Platform → School → Teacher → Class → Student.

Individual users may also exist without belonging to a school.

## 5. Student navigation

Home, Learn, AI Lab, Robotics, Challenges, Projects, AI Tutor.
Profile area: Achievements, Certificates, Settings.

## 6. Teacher navigation

Dashboard, Classes, Courses, Create, Assessments, Projects, Reports.

## 7. School admin navigation

Dashboard, Teachers, Students, Classes, Courses, Analytics, Certificates, Licenses,
Settings.

## 8. Learning pathways

**AI Explorer** (approx. ages 8–10): What is AI?; humans vs machines; prompts; AI stories;
AI images; AI voice; responsible AI; simple projects.

**AI Creator** (approx. ages 10–12): better prompting; image generation; video generation;
audio generation; AI assistants; AI games; data introduction; responsible AI; creator
project.

**AI Builder** (approx. ages 12–14): how machines learn; datasets; image classification;
computer vision; chatbot design; block coding; AI + robotics; bias; capstone project.

**AI Engineer** (approx. ages 14–16): Python; data; machine learning basics;
classification; computer vision; NLP; APIs; automation; robotics + computer vision;
engineering challenge.

**AI Innovator** (approx. ages 16–18): advanced generative AI; AI products; AI agents;
automation; responsible AI; entrepreneurship; business; society; startup creation;
capstone project.

**AI Robotics** — a MAIN pathway, not an optional feature. Possible levels: Smart Robot
Explorer; Intelligent Robot Creator; AI Vision Robot; Autonomous Robot; AI Robotics
Challenge.

**Teacher Academy** — courses such as: AI Foundations for Teachers; Prompt Engineering for
Educators; Creating Lessons with AI; AI Assessment; AI Differentiation; AI for Inclusive
Education; AI Image Creation; AI Video Creation; Responsible AI in Schools.

## 9. Course structure

Pathway → Course → Module → Lesson → (Activity, Assessment, Project).

Courses may be official RoboHolic courses or teacher-created courses. Use a flag like
`is_official = true / false`. Official courses display a "RoboHolic Certified" badge.

## 10. Lesson experience

Every lesson supports this learning flow:
DISCOVER → LEARN → WATCH → TRY → ASK AI → BUILD → CHECK → REFLECT → EARN.

Modern lesson player. Suggested layout: LEFT course/module navigation; CENTER lesson
content; RIGHT AI Tutor panel; TOP progress bar; BOTTOM Previous Lesson / Next Lesson.

Lesson components must support: rich text, image, video, downloadable file, quiz, coding
activity, AI activity, external embed, reflection, project submission.

## 11. AI Tutor

Name for now: **Robo AI**.

The tutor conceptually has access to: student age, language, current pathway, current
course, current lesson, previous quiz results.

Tutor modes: Explain, Hint, Quiz Me, Give Example, Challenge Me, Check My Work.

The tutor should guide learning rather than simply giving assignment answers.

The actual AI provider must be changeable later: create a provider abstraction layer; do
not tightly couple the application to one AI vendor.

    RoboHolic AI Layer → AI provider A / AI provider B / AI provider C

For MVP, AI calls may initially be mocked if no API credentials exist.

## 12. AI Lab

The architecture must support tools such as: Text AI, Image AI, Video AI, Voice AI,
Vision AI, Chatbot Builder. Future tools: Machine Learning Lab, AI Agent Builder.

For MVP: create the AI Lab dashboard and tool cards. The actual tools can initially use
placeholder/mock interfaces.

## 13. Robotics area

A dedicated Robotics section. Do not hide robotics inside general courses.

Sections can include: AI Robotics Courses, Robot Challenges, Vision Projects, Sensor
Projects, Autonomous Projects.

The architecture should later support different hardware platforms. Do not hard-code one
robot brand into the database design.

## 14. Project submission

Supported submission types: text, image, audio, video, PDF, uploaded file, link, code.

Workflow: student submits project → AI generates preliminary evaluation → teacher sees AI
suggestion → teacher may Approve, Modify, or Return for Improvement. Teacher has final
authority.

AI evaluation can contain: Creativity, Technical Quality, Understanding, Responsible AI,
Overall Suggested Score, Written Feedback.

## 15. Quizzes

Support: multiple choice, true/false, multiple answers, short answer. Quizzes contain
multiple questions and options. Track: attempt, score, date, answers.

## 16. Gamification

Support: XP, Levels, Badges, Achievements, Challenges.

Example XP: complete lesson 50; quiz 100; project 300; challenge 500.

Example badges: AI Explorer, Prompt Master, Data Detective, Vision Builder, Responsible AI
Champion, Robotics Engineer, AI Innovator.

Do not make the UI excessively childish.

## 17. Challenge Arena

Types: Weekly Challenge, School Challenge, RoboHolic Challenge, National Challenge,
Hackathon.

A challenge may contain: title, description, age range, start date, deadline, submission
requirements, prizes, status. Students submit projects to challenges.

## 18. Teacher course creator

Teachers must eventually be able to build courses without coding. Teacher creates a
Course, then Modules, then Lessons. Lesson blocks may include: Text, Image, Video, AI
Activity, Quiz, Assignment, Project, File, Embed.

For MVP: a basic course creator UI. No complex drag-and-drop editor yet unless necessary.

## 19. Multilingual architecture

Launch languages: English, French. Language switcher included. Use an
internationalization architecture; do NOT build separate pages manually per language.
Course content must support multiple translations with a scalable localization model.
Avoid database structures that would make Arabic difficult later.

## 20. Data model (conceptual)

Likely entities: users/profiles, schools, school_memberships, classes, class_memberships,
pathways, courses, course_translations, modules, module_translations, lessons,
lesson_translations, lesson_blocks, enrollments, progress, quizzes, quiz_questions,
quiz_options, quiz_attempts, projects, project_submissions, project_reviews, ai_reviews,
badges, user_badges, xp_transactions, certificates, challenges, challenge_submissions,
subscriptions, licenses. The schema may be improved.

Stable unique IDs; `created_at` / `updated_at` where appropriate. Plan the access-control
rules (originally "Row Level Security").

## 21. MVP scope

1. Authentication
2. Role-based access
3. Student dashboard
4. Teacher dashboard
5. School admin dashboard
6. Pathways
7. Course listing
8. Course detail
9. Modules
10. Lesson player
11. Progress tracking
12. Quizzes
13. Project submission
14. Teacher project review
15. AI grading placeholder/system
16. AI Tutor interface
17. AI Lab interface
18. Robotics section
19. Certificates
20. English/French language switching

Do NOT try to build the entire future product before producing a usable MVP.

## 22. Sample content

Seed the database with demo content. At least these courses:

1. AI Explorer — "My First Artificial Intelligence Adventure" (ages 8–10)
2. AI Creator — "Build with Generative AI" (ages 11–14)
3. AI Builder — "From AI User to AI Developer" (ages 15–18)
4. Teacher Academy — "AI Essentials for Educators"
5. AI Robotics — "AI Robotics Foundations"

Each demo course: at least 2 modules; each module at least 2 lessons; include sample
quizzes.

## 23. UI design

Brand: RoboHolic AI. Visual style: futuristic but educational; clean; premium;
technology-oriented; lots of whitespace; rounded cards; subtle gradients; modern dashboard
style; attractive for children without looking childish; appropriate for teenagers and
adults.

Build reusable components, e.g.: CourseCard, PathwayCard, ProgressCard, XPBadge, StatCard,
LessonNavigation, AIChatPanel, ProjectCard, CertificateCard, ChallengeCard. Good spacing
and hierarchy.

## 24. Homepage

Public homepage. Hero: "Learn AI. Build with AI. Create the Future." Subtitle: "AI
education for students, teachers and schools."

Three entrances: STUDENTS — Learn AI through real projects. TEACHERS — Teach and create
with AI. SCHOOLS — Bring structured AI education to your school.

Sections: Learning Pathways; AI + Robotics; Teacher Academy; How It Works; Project-Based
Learning; For Schools; Call to Action.

## 25. Student dashboard

Welcome message; Continue Learning; My Pathways; Recent Projects; XP; Badges;
Certificates; Upcoming Challenges; AI Tutor shortcut.

## 26. Development rules

1. Clean architecture.
2. No giant single components.
3. Reusable components.
4. Proper TypeScript.
5. Versioned database changes (migrations/seed scripts).
6. Environment variables for secrets.
7. Never expose API secrets in client-side code.
8. Proper role-based authorization.
9. Loading states.
10. Empty states.
11. Error handling.
12. Mobile responsive.
13. Maintainable code.
14. Comments only where useful.
15. A README.

## 27. Security

Very important because many users are minors. Design with privacy in mind: secure
authentication; proper authorization; database-level access rules; restricted
school/student data access; no public exposure of student information; safe file upload
validation; AI usage boundaries; minimal collection of personal data. Do not create public
student profiles.

## 28. Order of work

1. Analyze requirements; return architecture, folder structure, database schema,
   roles/permissions model, main routes/pages, MVP implementation plan.
2. Set up Next.js, TypeScript, Tailwind, backend, internationalization.
3. Public homepage and authentication.
4. Role-based dashboards.
5. Course/module/lesson system.
6. Quiz and progress tracking.
7. Project submissions and teacher review.
8. AI Tutor and AI Lab interfaces.
9. Robotics and challenges sections.
10. Seed demo data.

## 29. Product principle

This is not simply a video-course LMS. The identity of RoboHolic AI is:

**LEARN → TRY → BUILD → GET FEEDBACK → IMPROVE → SHOW YOUR PROJECT**

Project-based AI learning is the core philosophy.

## 30. Working agreement

Make sensible architectural defaults instead of repeatedly asking questions. Only ask
when a decision would materially change the product or business model.
