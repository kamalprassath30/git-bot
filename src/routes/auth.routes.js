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

// router.get("/github/callback", async (req, res) => {
//   const code = req.query.code;

//   try {
//     const response = await axios.post(
//       "https://github.com/login/oauth/access_token",
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code,
//       },
//       {
//         headers: {
//           Accept: "application/json",
//         },
//       },
//     );

//     const accessToken = response.data.access_token;

//     res.json({
//       success: true,
//       accessToken,
//     });
//   } catch (err) {
//     console.error(err.response?.data || err.message);

//     res.status(500).json({
//       success: false,
//       message: "GitHub OAuth failed",
//     });
//   }
// });

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

    // Fetch logged-in user
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Fetch user's repositories
    const repoResponse = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json({
      success: true,
      user: {
        login: userResponse.data.login,
        name: userResponse.data.name,
      },
      repositories: repoResponse.data.map((repo) => ({
        name: repo.name,
        full_name: repo.full_name,
      })),
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
