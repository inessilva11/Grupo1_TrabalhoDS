const ALERT_STATES = ["NOVO", "VISTO", "EM_SEGUIMENTO", "FECHADO"];
const ALERT_PRIORITIES = ["Baixa", "Media", "Alta"];

function validateAlertState(state) {
  if (!ALERT_STATES.includes(state)) {
    const error = new Error(`Estado de alerta invalido. Use: ${ALERT_STATES.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  ALERT_STATES,
  ALERT_PRIORITIES,
  validateAlertState
};
