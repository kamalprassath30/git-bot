const express = require("express");
const cors = require("cors");
const webhookroutes = require("./routes/webhook.routes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/webhook", webhookroutes);

app.get("/", (req, res) => {
  res.send("Github Automation Bot API is running!");
});

module.exports = app;
