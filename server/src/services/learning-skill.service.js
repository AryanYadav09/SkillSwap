const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, buildSearchFilter, parsePagination } = require("../utils/query");
const { getAverageRating } = require("../utils/user");
const skillRepository = require("../repositories/skill.repository");
const learningSkillRepository = require("../repositories/learning-skill.repository");

const serializeLearningSkill = (entry) => ({
  ...entry,
  user: {
    ...entry.user,
    averageRating: getAverageRating(entry.user.reviewsReceived || []),
  },
});

const listLearningSkills = async (query) => {
  const pagination = parsePagination(query, ["createdAt", "updatedAt"], "createdAt");
  const where = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.currentLevel ? { currentLevel: query.currentLevel } : {}),
    ...(query.search || query.category
      ? {
          skill: {
            ...(query.search ? { name: buildSearchFilter(query.search) } : {}),
            ...(query.category ? { category: buildSearchFilter(query.category) } : {}),
          },
        }
      : {}),
    user: {
      status: "ACTIVE",
      ...(query.college ? { college: buildSearchFilter(query.college) } : {}),
    },
  };

  const [items, total] = await Promise.all([
    learningSkillRepository.listLearningSkills({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    learningSkillRepository.countLearningSkills(where),
  ]);

  return buildPaginatedResponse(items.map(serializeLearningSkill), total, pagination);
};

const getLearningSkillById = async (learningSkillId) => {
  const skill = await learningSkillRepository.findLearningSkillById(learningSkillId);

  if (!skill) {
    throw new ApiError(404, "Learning skill not found");
  }

  return serializeLearningSkill(skill);
};

const createLearningSkill = async (userId, payload) => {
  const catalogSkill = await skillRepository.findOrCreateCatalogSkill(payload);
  const existingSkill = await learningSkillRepository.findUserLearningSkill(userId, catalogSkill.id);

  if (existingSkill) {
    throw new ApiError(409, "You already added this learning skill");
  }

  const createdSkill = await learningSkillRepository.createLearningSkill({
    userId,
    skillId: catalogSkill.id,
    goal: payload.goal,
    currentLevel: payload.currentLevel,
  });

  return serializeLearningSkill(createdSkill);
};

const updateLearningSkill = async (userId, learningSkillId, payload) => {
  const skill = await learningSkillRepository.findLearningSkillById(learningSkillId);

  if (!skill || skill.userId !== userId) {
    throw new ApiError(404, "Learning skill not found");
  }

  const catalogSkill =
    payload.name || payload.category || payload.description
      ? await skillRepository.findOrCreateCatalogSkill({
          name: payload.name || skill.skill.name,
          category: payload.category || skill.skill.category,
          description: payload.description || skill.skill.description,
        })
      : skill.skill;

  const updatedSkill = await learningSkillRepository.updateLearningSkill(learningSkillId, {
    skillId: catalogSkill.id,
    ...(payload.goal ? { goal: payload.goal } : {}),
    ...(payload.currentLevel ? { currentLevel: payload.currentLevel } : {}),
  });

  return serializeLearningSkill(updatedSkill);
};

const deleteLearningSkill = async (userId, learningSkillId) => {
  const skill = await learningSkillRepository.findLearningSkillById(learningSkillId);

  if (!skill || skill.userId !== userId) {
    throw new ApiError(404, "Learning skill not found");
  }

  await learningSkillRepository.deleteLearningSkill(learningSkillId);

  return {
    success: true,
  };
};

module.exports = {
  listLearningSkills,
  getLearningSkillById,
  createLearningSkill,
  updateLearningSkill,
  deleteLearningSkill,
};
