const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const githubSession = require("../config/session");
const pool = require("../database/db");
const authenticate = require("../middleware/authMiddleware");
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

    // Fetch GitHub user
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = userResponse.data;

    // Save user and get database id
    const userResult = await pool.query(
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

      RETURNING id
      `,
      [
        githubUser.id,
        githubUser.login,
        githubUser.name,
        githubUser.email,
        accessToken,
      ],
    );

    const userId = userResult.rows[0].id;

    // Generate JWT
    const token = jwt.sign(
      {
        id: userId,
        username: githubUser.login,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Temporary session (remove later)
    githubSession.accessToken = accessToken;
    githubSession.username = githubUser.login;

    // Fetch repositories
    const repoResponse = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    githubSession.repositories = repoResponse.data.map((repo) => ({
      name: repo.name,
      full_name: repo.full_name,
    }));

    // res.json({
    //   success: true,
    //   token,

    //   user: {
    //     login: githubUser.login,
    //     name: githubUser.name,
    //   },

    //   repositories: githubSession.repositories,
    // });
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "GitHub OAuth failed",
    });
  }
});

router.post("/select-repo", async (req, res) => {
  const { full_name } = req.body;

  if (!full_name) {
    return res.status(400).json({
      success: false,
      message: "Repository name is required",
    });
  }

  const [owner, repo] = full_name.split("/");

  await pool.query(
    `
    UPDATE users
    SET repo_owner = $1,
        repo_name = $2
    WHERE username = $3
    `,
    [owner, repo, githubSession.username],
  );

  githubSession.selectedRepo = {
    owner,
    repo,
  };

  res.json({
    success: true,
    selectedRepo: githubSession.selectedRepo,
  });
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        username,
        name,
        repo_owner,
        repo_name
      FROM users
      WHERE id = $1
      `,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

module.exports = router;
