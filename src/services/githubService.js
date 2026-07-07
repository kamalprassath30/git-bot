const { Octokit } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function addLabel(issueNumber, label) {
  console.log(`Adding label "${label}" to issue #${issueNumber}`);

  const response = await octokit.rest.issues.addLabels({
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
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
