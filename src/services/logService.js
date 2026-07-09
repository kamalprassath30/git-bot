const pool = require("../database/db");

async function saveLog({
  userId,
  eventType,
  eventTitle,
  action,
  status,
  message,
  deliveryId,
}) {
  await pool.query(
    `
    INSERT INTO bot_logs
    (
      user_id,
      event_type,
      event_title,
      action,
      status,
      message,
      delivery_id
    )
    VALUES ($1,$2,$3,$4,$5,$6, $7)
    `,
    [userId, eventType, eventTitle, action, status, message, deliveryId],
  );
}

module.exports = {
  saveLog,
};
