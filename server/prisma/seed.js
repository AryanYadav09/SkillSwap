const bcrypt = require("bcryptjs");
const { PrismaClient, Role, SkillLevel, MatchRequestStatus, SessionStatus, NotificationType, ReportStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const password = "Password@123";

const skillCatalog = [
  { name: "React", category: "Frontend", description: "Build interactive frontends with React and modern component patterns." },
  { name: "UI/UX Design", category: "Design", description: "Design intuitive interfaces, flows, and polished user experiences." },
  { name: "Node.js", category: "Backend", description: "Create robust APIs and real-time backend services with Node.js." },
  { name: "Figma", category: "Design", description: "Prototype and handoff user interfaces with Figma." },
  { name: "SQL", category: "Database", description: "Model, query, and optimize relational data." },
  { name: "Public Speaking", category: "Communication", description: "Present ideas clearly in classrooms and events." },
  { name: "Python", category: "Programming", description: "Write scripts, solve problems, and build backend utilities with Python." },
  { name: "Java", category: "Programming", description: "Understand object-oriented programming, collections, and Java project structure." },
  { name: "Data Structures", category: "Computer Science", description: "Practice arrays, stacks, queues, trees, graphs, and interview-style problem solving." },
  { name: "Machine Learning", category: "AI/ML", description: "Learn core ML concepts, model training, evaluation, and practical workflows." },
  { name: "Graphic Design", category: "Design", description: "Create posters, social media creatives, and visual identity systems." },
  { name: "Video Editing", category: "Media", description: "Edit short-form and long-form video with clean pacing and transitions." },
  { name: "Excel", category: "Productivity", description: "Use formulas, pivots, charts, and structured sheets for analysis." },
  { name: "Digital Marketing", category: "Marketing", description: "Plan campaigns, write copy, and understand social growth basics." },
  { name: "Photography", category: "Media", description: "Learn composition, lighting, camera basics, and editing workflows." },
  { name: "Git & GitHub", category: "Developer Tools", description: "Use version control, branches, pull requests, and collaboration workflows." },
];

const ensureSkill = async (skill) =>
  prisma.skill.upsert({
    where: {
      name_category: {
        name: skill.name,
        category: skill.category,
      },
    },
    create: skill,
    update: skill,
  });

const createUser = async ({ email, username, name, college, department, semester, role = Role.USER }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      username,
      name,
      password: hashedPassword,
      college,
      department,
      semester,
      bio: `${name} is active on SkillSwap and open to peer learning sessions.`,
      role,
      isVerified: true,
    },
    update: {
      name,
      username,
      college,
      department,
      semester,
      role,
      isVerified: true,
    },
  });
};

const main = async () => {
  const skills = await Promise.all(skillCatalog.map(ensureSkill));

  const admin = await createUser({
    email: "admin@skillswap.dev",
    username: "skillswap_admin",
    name: "SkillSwap Admin",
    college: "Campus Network",
    department: "Operations",
    semester: "N/A",
    role: Role.ADMIN,
  });

  const ayaan = await createUser({
    email: "aryan@skillswap.dev",
    username: "aryan",
    name: "Aryan",
    college: "Delhi Technical University",
    department: "Computer Science",
    semester: "6",
  });

  const meera = await createUser({
    email: "shrikant@skillswap.dev",
    username: "shrikant",
    name: "Shrikant",
    college: "Mumbai University",
    department: "Design",
    semester: "5",
  });

  const arjun = await createUser({
    email: "arjun@skillswap.dev",
    username: "arjun_data",
    name: "Arjun Patel",
    college: "Pune Institute of Technology",
    department: "Information Technology",
    semester: "7",
  });

  const reactSkill = skills.find((skill) => skill.name === "React");
  const designSkill = skills.find((skill) => skill.name === "UI/UX Design");
  const nodeSkill = skills.find((skill) => skill.name === "Node.js");
  const figmaSkill = skills.find((skill) => skill.name === "Figma");
  const sqlSkill = skills.find((skill) => skill.name === "SQL");
  const speakingSkill = skills.find((skill) => skill.name === "Public Speaking");
  const skillByName = (name) => skills.find((skill) => skill.name === name);

  await prisma.userOfferedSkill.createMany({
    data: [
      { userId: ayaan.id, skillId: reactSkill.id, level: SkillLevel.ADVANCED },
      { userId: ayaan.id, skillId: nodeSkill.id, level: SkillLevel.INTERMEDIATE },
      { userId: meera.id, skillId: designSkill.id, level: SkillLevel.EXPERT },
      { userId: meera.id, skillId: figmaSkill.id, level: SkillLevel.ADVANCED },
      { userId: arjun.id, skillId: sqlSkill.id, level: SkillLevel.ADVANCED },
      { userId: arjun.id, skillId: speakingSkill.id, level: SkillLevel.INTERMEDIATE },
    ],
    skipDuplicates: true,
  });

  await prisma.userLearningSkill.createMany({
    data: [
      { userId: ayaan.id, skillId: designSkill.id, goal: "Learn product thinking and wireframing.", currentLevel: SkillLevel.BEGINNER },
      { userId: meera.id, skillId: reactSkill.id, goal: "Build portfolio-ready interactive interfaces.", currentLevel: SkillLevel.BEGINNER },
      { userId: arjun.id, skillId: nodeSkill.id, goal: "Become comfortable with backend APIs.", currentLevel: SkillLevel.BEGINNER },
    ],
    skipDuplicates: true,
  });

  const sampleStudents = [
    ["Riya Sharma", "riya.react", "Marwadi University", "Computer Science", "5", "React", "UI/UX Design"],
    ["Kabir Mehta", "kabir.design", "Marwadi University", "Design", "4", "UI/UX Design", "React"],
    ["Ananya Rao", "ananya.node", "Delhi Technical University", "Information Technology", "6", "Node.js", "Figma"],
    ["Dev Patel", "dev.figma", "Mumbai University", "Design", "3", "Figma", "Node.js"],
    ["Isha Verma", "isha.sql", "Pune Institute of Technology", "Computer Science", "7", "SQL", "Python"],
    ["Om Singh", "om.python", "Marwadi University", "Computer Applications", "4", "Python", "SQL"],
    ["Naina Shah", "naina.speaks", "Gujarat University", "Management", "5", "Public Speaking", "Digital Marketing"],
    ["Yash Jain", "yash.markets", "Rajasthan Technical University", "Marketing", "6", "Digital Marketing", "Public Speaking"],
    ["Tara Nair", "tara.java", "Kerala Technical University", "Computer Science", "5", "Java", "Data Structures"],
    ["Vivaan Reddy", "vivaan.dsa", "Hyderabad Institute of Technology", "Computer Science", "6", "Data Structures", "Java"],
    ["Aditi Bose", "aditi.ml", "Kolkata Engineering College", "AI and Data Science", "7", "Machine Learning", "Excel"],
    ["Rehan Khan", "rehan.excel", "Aligarh Muslim University", "Commerce", "4", "Excel", "Machine Learning"],
    ["Mira Iyer", "mira.photo", "Mumbai University", "Mass Media", "3", "Photography", "Graphic Design"],
    ["Harsh Vora", "harsh.graphics", "CEPT University", "Design", "5", "Graphic Design", "Photography"],
    ["Sana Qureshi", "sana.video", "Jamia Millia Islamia", "Media Studies", "4", "Video Editing", "Git & GitHub"],
    ["Kunal Arora", "kunal.git", "Delhi Technical University", "Computer Science", "5", "Git & GitHub", "Video Editing"],
    ["Pooja Menon", "pooja.react", "VIT Vellore", "Computer Science", "3", "React", "Figma"],
    ["Raghav Bansal", "raghav.figma", "NID Ahmedabad", "Design", "6", "Figma", "React"],
    ["Neha Kulkarni", "neha.node", "Pune Institute of Technology", "Information Technology", "7", "Node.js", "SQL"],
    ["Samar Gill", "samar.sql", "Chandigarh University", "Computer Science", "4", "SQL", "Node.js"],
    ["Aarav Trivedi", "aarav.python", "Marwadi University", "Computer Science", "2", "Python", "React"],
    ["Kavya Desai", "kavya.react", "Marwadi University", "Information Technology", "5", "React", "Python"],
    ["Manav Sethi", "manav.ui", "Lovely Professional University", "Design", "6", "UI/UX Design", "Java"],
    ["Zoya Ansari", "zoya.java", "Jamia Millia Islamia", "Computer Science", "5", "Java", "UI/UX Design"],
    ["Dhruv Joshi", "dhruv.dsa", "Nirma University", "Computer Engineering", "4", "Data Structures", "Public Speaking"],
    ["Priya Kapoor", "priya.speaks", "Delhi University", "English", "3", "Public Speaking", "Data Structures"],
    ["Armaan Malik", "armaan.ml", "IIT Indore", "AI and Data Science", "8", "Machine Learning", "Digital Marketing"],
    ["Jhanvi Shah", "jhanvi.marketing", "Gujarat University", "Management", "5", "Digital Marketing", "Machine Learning"],
    ["Nikhil Suri", "nikhil.git", "Manipal University", "Computer Science", "4", "Git & GitHub", "SQL"],
    ["Fatima Sheikh", "fatima.sql", "Osmania University", "Information Technology", "6", "SQL", "Git & GitHub"],
    ["Parth Dave", "parth.video", "Marwadi University", "Mass Communication", "5", "Video Editing", "Photography"],
    ["Mehul Chauhan", "mehul.photo", "MS University Baroda", "Fine Arts", "4", "Photography", "Video Editing"],
    ["Tanvi Agarwal", "tanvi.excel", "Christ University", "Commerce", "3", "Excel", "UI/UX Design"],
    ["Rudra Pratap", "rudra.ui", "NID Ahmedabad", "Design", "7", "UI/UX Design", "Excel"],
    ["Sneha Pillai", "sneha.graphics", "Kerala University", "Design", "5", "Graphic Design", "Node.js"],
    ["Aditya Nambiar", "aditya.node", "SRM University", "Computer Science", "6", "Node.js", "Graphic Design"],
    ["Mahek Jain", "mahek.figma", "Marwadi University", "Design", "4", "Figma", "Data Structures"],
    ["Lakshya Gupta", "lakshya.dsa", "Delhi Technical University", "Computer Science", "5", "Data Structures", "Figma"],
    ["Hiral Solanki", "hiral.marketing", "Marwadi University", "Business Administration", "5", "Digital Marketing", "React"],
    ["Jay Vyas", "jay.react", "Marwadi University", "Computer Engineering", "6", "React", "Digital Marketing"],
    ["Siddhi Mishra", "siddhi.java", "Banaras Hindu University", "Computer Science", "4", "Java", "Photography"],
    ["Rohan Saxena", "rohan.photo", "Delhi University", "Mass Media", "3", "Photography", "Java"],
    ["Avni Gupta", "avni.python", "BITS Pilani", "Computer Science", "5", "Python", "Graphic Design"],
    ["Neil Contractor", "neil.graphics", "CEPT University", "Design", "6", "Graphic Design", "Python"],
    ["Krisha Gohil", "krisha.excel", "Marwadi University", "Commerce", "4", "Excel", "Public Speaking"],
    ["Aman Chhabra", "aman.speaks", "Panjab University", "English", "3", "Public Speaking", "Excel"],
    ["Diya Thomas", "diya.ml", "VIT Vellore", "AI and Data Science", "7", "Machine Learning", "Git & GitHub"],
    ["Varun Bhat", "varun.git", "Manipal University", "Computer Science", "6", "Git & GitHub", "Machine Learning"],
    ["Esha Roy", "esha.video", "Kolkata University", "Media Studies", "5", "Video Editing", "UI/UX Design"],
    ["Tanish Mehra", "tanish.ui", "NID Ahmedabad", "Design", "4", "UI/UX Design", "Video Editing"],
  ];

  for (const [name, username, college, department, semester, offeredName, learningName] of sampleStudents) {
    const student = await createUser({
      email: `${username}@skillswap.dev`,
      username,
      name,
      college,
      department,
      semester,
    });
    const offered = skillByName(offeredName);
    const learning = skillByName(learningName);

    await prisma.userOfferedSkill.createMany({
      data: [
        {
          userId: student.id,
          skillId: offered.id,
          level: SkillLevel.INTERMEDIATE,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.userLearningSkill.createMany({
      data: [
        {
          userId: student.id,
          skillId: learning.id,
          goal: `Learn ${learning.name} through practical peer sessions and portfolio work.`,
          currentLevel: SkillLevel.BEGINNER,
        },
      ],
      skipDuplicates: true,
    });
  }

  const matchRequest = await prisma.matchRequest.upsert({
    where: { id: "seed-match-request" },
    create: {
      id: "seed-match-request",
      senderId: ayaan.id,
      receiverId: meera.id,
      status: MatchRequestStatus.ACCEPTED,
      message: "I can help with React if you guide me on UI/UX systems.",
    },
    update: {
      status: MatchRequestStatus.ACCEPTED,
      message: "I can help with React if you guide me on UI/UX systems.",
    },
  });

  const [user1Id, user2Id] = [ayaan.id, meera.id].sort();

  const chat = await prisma.chat.upsert({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
    create: {
      user1Id,
      user2Id,
    },
    update: {},
  });

  await prisma.message.createMany({
    data: [
      {
        chatId: chat.id,
        senderId: ayaan.id,
        message: "Let's start with a component architecture session on Friday.",
      },
      {
        chatId: chat.id,
        senderId: meera.id,
        message: "Works for me. I will bring a Figma critique exercise.",
        isSeen: true,
      },
    ],
    skipDuplicates: true,
  });

  const session = await prisma.session.upsert({
    where: { id: "seed-session" },
    create: {
      id: "seed-session",
      matchRequestId: matchRequest.id,
      createdById: ayaan.id,
      title: "React and Design Exchange",
      description: "A focused session on component structure and design critique.",
      sessionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 90,
      status: SessionStatus.SCHEDULED,
    },
    update: {
      title: "React and Design Exchange",
      description: "A focused session on component structure and design critique.",
      duration: 90,
      status: SessionStatus.SCHEDULED,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: meera.id,
        title: "New match accepted",
        message: "Ayaan accepted your collaboration and chat is now open.",
        type: NotificationType.MATCH_ACCEPTED,
        entityId: matchRequest.id,
      },
      {
        userId: ayaan.id,
        title: "Session scheduled",
        message: "Your React and design exchange session is scheduled.",
        type: NotificationType.SESSION_SCHEDULED,
        entityId: session.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.bookmark.upsert({
    where: {
      userId_bookmarkedUserId: {
        userId: arjun.id,
        bookmarkedUserId: ayaan.id,
      },
    },
    create: {
      userId: arjun.id,
      bookmarkedUserId: ayaan.id,
    },
    update: {},
  });

  const completedSession = await prisma.session.upsert({
    where: { id: "seed-completed-session" },
    create: {
      id: "seed-completed-session",
      matchRequestId: matchRequest.id,
      createdById: meera.id,
      title: "Completed UI critique",
      description: "Review session completed with shared feedback.",
      sessionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      duration: 75,
      status: SessionStatus.COMPLETED,
    },
    update: {
      status: SessionStatus.COMPLETED,
      duration: 75,
    },
  });

  await prisma.review.upsert({
    where: {
      sessionId_reviewerId: {
        sessionId: completedSession.id,
        reviewerId: meera.id,
      },
    },
    create: {
      sessionId: completedSession.id,
      reviewerId: meera.id,
      reviewedUserId: ayaan.id,
      rating: 5,
      comment: "Explained React patterns clearly and adapted to my pace.",
    },
    update: {
      rating: 5,
      comment: "Explained React patterns clearly and adapted to my pace.",
    },
  });

  await prisma.report.upsert({
    where: { id: "seed-report" },
    create: {
      id: "seed-report",
      reporterId: arjun.id,
      reportedUserId: meera.id,
      reason: "Other",
      description: "Sample seeded report for admin workflow testing.",
      status: ReportStatus.PENDING,
    },
    update: {
      status: ReportStatus.PENDING,
      description: "Sample seeded report for admin workflow testing.",
    },
  });

  console.log("Seed completed");
  console.log({
    admin: admin.email,
    samplePassword: password,
  });
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
