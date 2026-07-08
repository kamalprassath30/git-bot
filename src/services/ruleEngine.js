const rules = require("../config/rules");
const { addLabel } = require("./githubService");
const { sendNotification } = require("./slackService");
const { saveLog } = require("./logService");
const pool = require("../database/db");

async function processEvent(eventType, payload) {
  console.log("Rule Engine Processing...");
  console.log("Event:", eventType);

  let title;
  let number;
  let owner;
  let repo;

  // Extract common data from different GitHub events
  if (eventType === "issues") {
    if (payload.action !== "opened") {
      return {
        success: true,
        matched: false,
        message: `Ignoring issue action: ${payload.action}`,
      };
    }
    title = payload.issue.title;
    number = payload.issue.number;
    owner = payload.repository.owner.login;
    repo = payload.repository.name;
  } else if (eventType === "pull_request") {
    if (payload.action !== "opened") {
      return {
        success: true,
        matched: false,
        message: `Ignoring PR action: ${payload.action}`,
      };
    }
    title = payload.pull_request.title;
    number = payload.pull_request.number;
    owner = payload.repository.owner.login;
    repo = payload.repository.name;
  } else {
    return {
      success: true,
      matched: false,
      message: "Unsupported event type",
      eventType,
    };
  }

  console.log("Title:", title);
  if (!title || !number) {
    return {
      success: false,
      matched: false,
      message: "Invalid GitHub payload",
    };
  }

  const userResult = await pool.query(
    `
    SELECT id
    FROM users
    WHERE repo_owner = $1
      AND repo_name = $2
    `,
    [owner, repo],
  );

  if (userResult.rows.length === 0) {
    return {
      success: false,
      message: "No user found for this repository",
    };
  }

  const userId = userResult.rows[0].id;

  for (const rule of rules) {
    if (title.toLowerCase().includes(rule.keyword.toLowerCase())) {
      let actionResults = [];

      for (const action of rule.actions) {
        if (action === "ADD_LABEL") {
          const result = await addLabel(owner, repo, number, rule.keyword);

          actionResults.push(result);
        }

        if (action === "SLACK_NOTIFICATION") {
          const result = await sendNotification(
            `Rule matched: ${rule.keyword} found in "${title}"`,
          );

          actionResults.push(result);
        }
      }
      await saveLog({
        userId,
        eventType,
        eventTitle: title,
        action: rule.actions.join(", "),
        status: "SUCCESS",
        message: `Rule '${rule.keyword}' matched`,
      });
      return {
        success: true,
        matched: true,
        eventType,
        rule,
        actionResults,
      };
    }
  }

  return {
    success: true,
    matched: false,
    eventType,
    message: "No rule matched",
  };
}

module.exports = {
  processEvent,
};
