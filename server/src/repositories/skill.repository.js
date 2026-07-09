const prisma = require("../config/db");

const offeredSkillInclude = {
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

const findOrCreateCatalogSkill = async ({ name, category, description }) =>
  prisma.skill.upsert({
    where: {
      name_category: {
        name,
        category,
      },
    },
    create: {
      name,
      category,
      description,
    },
    update: {
      description,
    },
  });

const findOfferedSkillById = (id) =>
  prisma.userOfferedSkill.findUnique({
    where: { id },
    include: offeredSkillInclude,
  });

const findUserOfferedSkill = (userId, skillId) =>
  prisma.userOfferedSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

const createOfferedSkill = (data) =>
  prisma.userOfferedSkill.create({
    data,
    include: offeredSkillInclude,
  });

const updateOfferedSkill = (id, data) =>
  prisma.userOfferedSkill.update({
    where: { id },
    data,
    include: offeredSkillInclude,
  });

const deleteOfferedSkill = (id) =>
  prisma.userOfferedSkill.delete({
    where: { id },
  });

const listOfferedSkills = ({ where, skip, take, orderBy }) =>
  prisma.userOfferedSkill.findMany({
    where,
    skip,
    take,
    orderBy,
    include: offeredSkillInclude,
  });

const countOfferedSkills = (where) => prisma.userOfferedSkill.count({ where });

const listCatalogSkills = ({ where, skip, take, orderBy }) =>
  prisma.skill.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      _count: {
        select: {
          offeredBy: true,
          learners: true,
        },
      },
    },
  });

const countCatalogSkills = (where) => prisma.skill.count({ where });

const deleteCatalogSkill = (id) =>
  prisma.skill.delete({
    where: { id },
  });

module.exports = {
  findOrCreateCatalogSkill,
  findOfferedSkillById,
  findUserOfferedSkill,
  createOfferedSkill,
  updateOfferedSkill,
  deleteOfferedSkill,
  listOfferedSkills,
  countOfferedSkills,
  listCatalogSkills,
  countCatalogSkills,
  deleteCatalogSkill,
};
