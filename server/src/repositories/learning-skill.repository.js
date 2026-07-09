const prisma = require("../config/db");

const learningSkillInclude = {
  skill: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      college: true,
      department: true,
      semester: true,
      profileImage: true,
      reviewsReceived: {
        select: {
          rating: true,
        },
      },
    },
  },
};

const findLearningSkillById = (id) =>
  prisma.userLearningSkill.findUnique({
    where: { id },
    include: learningSkillInclude,
  });

const findUserLearningSkill = (userId, skillId) =>
  prisma.userLearningSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

const createLearningSkill = (data) =>
  prisma.userLearningSkill.create({
    data,
    include: learningSkillInclude,
  });

const updateLearningSkill = (id, data) =>
  prisma.userLearningSkill.update({
    where: { id },
    data,
    include: learningSkillInclude,
  });

const deleteLearningSkill = (id) =>
  prisma.userLearningSkill.delete({
    where: { id },
  });

const listLearningSkills = ({ where, skip, take, orderBy }) =>
  prisma.userLearningSkill.findMany({
    where,
    skip,
    take,
    orderBy,
    include: learningSkillInclude,
  });

const countLearningSkills = (where) => prisma.userLearningSkill.count({ where });

module.exports = {
  findLearningSkillById,
  findUserLearningSkill,
  createLearningSkill,
  updateLearningSkill,
  deleteLearningSkill,
  listLearningSkills,
  countLearningSkills,
};
