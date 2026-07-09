const learningSkillService = require("../services/learning-skill.service");
const ApiResponse = require("../utils/apiResponse");

const listLearningSkills = async (req, res) => {
  const result = await learningSkillService.listLearningSkills(req.query);
  res.status(200).json(new ApiResponse(200, result, "Learning skills fetched successfully"));
};

const getLearningSkillById = async (req, res) => {
  const result = await learningSkillService.getLearningSkillById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Learning skill fetched successfully"));
};

const createLearningSkill = async (req, res) => {
  const result = await learningSkillService.createLearningSkill(req.user.id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Learning skill created successfully"));
};

const updateLearningSkill = async (req, res) => {
  const result = await learningSkillService.updateLearningSkill(
    req.user.id,
    req.params.id,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Learning skill updated successfully"));
};

const deleteLearningSkill = async (req, res) => {
  const result = await learningSkillService.deleteLearningSkill(req.user.id, req.params.id);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Learning skill deleted successfully"));
};

module.exports = {
  listLearningSkills,
  getLearningSkillById,
  createLearningSkill,
  updateLearningSkill,
  deleteLearningSkill,
};
