const ApiError = require("../utils/apiError");
const { buildPaginatedResponse, buildSearchFilter, parsePagination } = require("../utils/query");
const { getAverageRating } = require("../utils/user");
const skillRepository = require("../repositories/skill.repository");

const serializeOfferedSkill = (entry) => ({
  ...entry,
  user: {
    ...entry.user,
    averageRating: getAverageRating(entry.user.reviewsReceived || []),
  },
});

const listSkills = async (query) => {
  const pagination = parsePagination(query, ["createdAt", "updatedAt", "level"], "createdAt");
  const where = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.level ? { level: query.level } : {}),
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
    skillRepository.listOfferedSkills({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: {
        [pagination.sortBy]: pagination.sortOrder,
      },
    }),
    skillRepository.countOfferedSkills(where),
  ]);

  return buildPaginatedResponse(items.map(serializeOfferedSkill), total, pagination);
};

const getSkillById = async (skillId) => {
  const skill = await skillRepository.findOfferedSkillById(skillId);

  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  return serializeOfferedSkill(skill);
};

const createSkill = async (userId, payload) => {
  const catalogSkill = await skillRepository.findOrCreateCatalogSkill(payload);
  const existingSkill = await skillRepository.findUserOfferedSkill(userId, catalogSkill.id);

  if (existingSkill) {
    throw new ApiError(409, "You already offer this skill");
  }

  const createdSkill = await skillRepository.createOfferedSkill({
    userId,
    skillId: catalogSkill.id,
    level: payload.level,
  });

  return serializeOfferedSkill(createdSkill);
};

const updateSkill = async (userId, offeredSkillId, payload) => {
  const skill = await skillRepository.findOfferedSkillById(offeredSkillId);

  if (!skill || skill.userId !== userId) {
    throw new ApiError(404, "Skill not found");
  }

  const catalogSkill =
    payload.name || payload.category || payload.description
      ? await skillRepository.findOrCreateCatalogSkill({
          name: payload.name || skill.skill.name,
          category: payload.category || skill.skill.category,
          description: payload.description || skill.skill.description,
        })
      : skill.skill;

  const updatedSkill = await skillRepository.updateOfferedSkill(offeredSkillId, {
    skillId: catalogSkill.id,
    ...(payload.level ? { level: payload.level } : {}),
  });

  return serializeOfferedSkill(updatedSkill);
};

const deleteSkill = async (userId, offeredSkillId) => {
  const skill = await skillRepository.findOfferedSkillById(offeredSkillId);

  if (!skill || skill.userId !== userId) {
    throw new ApiError(404, "Skill not found");
  }

  await skillRepository.deleteOfferedSkill(offeredSkillId);

  return {
    success: true,
  };
};

module.exports = {
  listSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
};
