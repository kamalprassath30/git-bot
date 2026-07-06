const express = require("express");
const router = express.Router();
router.post("/github", (req, res) => {
  res.send("GitHub webhook received");
});

module.exports = router;
