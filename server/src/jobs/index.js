const initializeJobs = () => {
  return {
    started: false,
    message: "No background jobs are configured yet.",
  };
};

module.exports = {
  initializeJobs,
};
