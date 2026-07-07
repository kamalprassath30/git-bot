const { Octokit } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function addLabel(issueNumber, label) {
  console.log(`Adding label "${label}" to issue #${issueNumber}`);

  const response = await octokit.rest.issues.addLabels({
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
}

module.exports = {
  addLabel,
};
