// const { processEvent } = require("../services/ruleEngine");
// const express = require("express");

// const router = express.Router();

// router.post("/github", async (req, res) => {
//   const eventType = req.headers["x-github-event"];
//   const payload = req.body;

//   //   console.log("EVENT TYPE:", eventType);
//   //   console.log("PAYLOAD:", payload);
//   const result = await processEvent(eventType, payload);

//   res.status(200).json(result);
// });

// module.exports = router;

const { processEvent } = require("../services/ruleEngine");
const express = require("express");

const router = express.Router();

router.post("/github", async (req, res) => {
  try {
    const eventType = req.headers["x-github-event"];
    const payload = req.body;

    console.log("GitHub Event:", eventType);

    const result = await processEvent(eventType, payload);

    res.status(200).json(result);
  } catch (error) {
    console.error("Webhook processing failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});

module.exports = router;
