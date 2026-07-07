const { Octokit } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function addLabel(issueNumber, label) {
  console.log(`Adding label "${label}" to issue #${issueNumber}`);

  console.log({
    owner: "kamalprassath30",
    repo: "git-bot",
    issueNumber,
    tokenExists: !!process.env.GITHUB_TOKEN,
  });

  try {
    await octokit.rest.issues.addLabels({
      owner: "kamalprassath30",
      repo: "git-bot",
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
