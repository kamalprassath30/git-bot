const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/github", (req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&scope=repo,user`;

  res.redirect(githubAuthUrl);
});

router.get("/github/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const accessToken = response.data.access_token;

    res.json({
      success: true,
      accessToken,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "GitHub OAuth failed",
    });
  }
});

module.exports = router;
