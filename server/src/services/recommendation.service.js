/*
  This service exists as an extension point for future AI-assisted features.
  Do not implement AI logic here yet.

  Planned interfaces:
  - recommendSkillsForUser(userId)
  - recommendMatchesForUser(userId)
  - suggestLearningPaths(userId)

  Each method should eventually delegate to an isolated recommendation engine
  so the rest of the application can stay unchanged when intelligence is added.
*/

const recommendSkillsForUser = async () => [];
const recommendMatchesForUser = async () => [];
const suggestLearningPaths = async () => [];

module.exports = {
  recommendSkillsForUser,
  recommendMatchesForUser,
  suggestLearningPaths,
};
