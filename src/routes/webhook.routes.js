const { processEvent } = require("../services/ruleEngine");
const express = require("express");

const router = express.Router();

router.post("/github", async (req, res) => {
  const eventType = req.headers["x-github-event"];
  const payload = req.body;

  //   console.log("EVENT TYPE:", eventType);
  //   console.log("PAYLOAD:", payload);
  const result = await processEvent(eventType, payload);

  res.status(200).json(result);
});

module.exports = router;
