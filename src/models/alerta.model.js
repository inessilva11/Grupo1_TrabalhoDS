const ALERT_STATES = ["NOVO", "VISTO", "EM_SEGUIMENTO", "FECHADO"];
const ALERT_PRIORITIES = ["Baixa", "Média", "Alta"];

function validateAlertState(state) {
  if (!ALERT_STATES.includes(state)) {
    const error = new Error(`Estado de alerta inválido. Use: ${ALERT_STATES.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  ALERT_STATES,
  ALERT_PRIORITIES,
  validateAlertState
};
