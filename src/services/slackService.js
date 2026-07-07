const axios = require("axios");

async function sendNotification(message) {
  console.log("Sending Slack notification:");
  console.log(message);

  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: message,
  });

  return {
    success: true,
    action: "SLACK_NOTIFICATION",
    message,
  };
}

module.exports = {
  sendNotification,
};
