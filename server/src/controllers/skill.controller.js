const skillService = require("../services/skill.service");
const ApiResponse = require("../utils/apiResponse");

const listSkills = async (req, res) => {
  const result = await skillService.listSkills(req.query);
  res.status(200).json(new ApiResponse(200, result, "Skills fetched successfully"));
};

const getSkillById = async (req, res) => {
  const result = await skillService.getSkillById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Skill fetched successfully"));
};

const createSkill = async (req, res) => {
  const result = await skillService.createSkill(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, result, "Skill created successfully"));
};

const updateSkill = async (req, res) => {
  const result = await skillService.updateSkill(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, "Skill updated successfully"));
};

const deleteSkill = async (req, res) => {
  const result = await skillService.deleteSkill(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, "Skill deleted successfully"));
};

module.exports = {
  listSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
};
