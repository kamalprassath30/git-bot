const { Octokit } = require("octokit");
const githubSession = require("../config/session");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function addLabel(owner, repo, issueNumber, label) {
  console.log("GitHub Session:", githubSession);
  console.log(`Adding label "${label}" to issue #${issueNumber}`);

  console.log({
    owner: owner,
    repo: repo,
    issueNumber,
    tokenExists: !!process.env.GITHUB_TOKEN,
  });

  try {
    await octokit.rest.issues.addLabels({
      owner: githubSession.selectedRepo.owner,
      repo: githubSession.selectedRepo.repo,
      issue_number: issueNumber,
      labels: [label],
    });

    return {
      success: true,
      action: "ADD_LABEL",
      label,
      issueNumber,
    };
  } catch (err) {
    console.error("========== GitHub API Error ==========");
    console.error("Status:", err.status);
    console.error("Message:", err.message);
    console.error("Response:", err.response?.data);

    throw err;
  }
}

module.exports = {
  addLabel,
};
