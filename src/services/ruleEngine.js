const rules = require("../config/rules");
const { addLabel } = require("./githubService");
const { sendNotification } = require("./slackService");

async function processEvent(eventType, payload) {
  console.log("Rule Engine Processing...");
  console.log("Event:", eventType);

  let title;
  let number;

  // Extract common data from different GitHub events
  if (eventType === "issues") {
    title = payload.issue.title;
    number = payload.issue.number;
  } else if (eventType === "pull_request") {
    title = payload.pull_request.title;
    number = payload.pull_request.number;
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

  for (const rule of rules) {
    if (title.toLowerCase().includes(rule.keyword.toLowerCase())) {
      let actionResults = [];

      for (const action of rule.actions) {
        if (action === "ADD_LABEL") {
          const result = await addLabel(number, rule.keyword);

          actionResults.push(result);
        }

        if (action === "SLACK_NOTIFICATION") {
          const result = await sendNotification(
            `Rule matched: ${rule.keyword} found in "${title}"`,
          );

          actionResults.push(result);
        }
      }

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
