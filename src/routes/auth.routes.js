const express = require("express");
const axios = require("axios");
const githubSession = require("../config/session");
const pool = require("../database/db");
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
    // Exchange code for access token
    const tokenResponse = await axios.post(
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

    const accessToken = tokenResponse.data.access_token;

    // Save access token temporarily
    githubSession.accessToken = accessToken;

    // Fetch logged-in user
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;

    await pool.query(
      `
    INSERT INTO users
    (
        github_id,
        username,
        name,
        email,
        access_token
    )
    VALUES ($1,$2,$3,$4,$5)

    ON CONFLICT (github_id)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        name = EXCLUDED.name,
        email = EXCLUDED.email
    `,
      [
        githubUser.id,
        githubUser.login,
        githubUser.name,
        githubUser.email,
        accessToken,
      ],
    );

    // Save user temporarily
    githubSession.username = userResponse.data.login;

    // Fetch user's repositories
    const repoResponse = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Save repositories temporarily
    githubSession.repositories = repoResponse.data.map((repo) => ({
      name: repo.name,
      full_name: repo.full_name,
    }));

    res.json({
      success: true,
      user: {
        login: userResponse.data.login,
        name: userResponse.data.name,
      },
      repositories: githubSession.repositories,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "GitHub OAuth failed",
    });
  }
});

router.post("/select-repo", (req, res) => {
  const { full_name } = req.body;

  if (!full_name) {
    return res.status(400).json({
      success: false,
      message: "Repository name is required",
    });
  }

  const [owner, repo] = full_name.split("/");

  githubSession.selectedRepo = {
    owner,
    repo,
  };

  res.json({
    success: true,
    selectedRepo: githubSession.selectedRepo,
  });
});

module.exports = router;
