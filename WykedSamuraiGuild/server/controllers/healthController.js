import { getHealthStatus } from "../services/healthService.js";

export const healthCheck = (req, res) => {
  const status = getHealthStatus();
  res.json(status);
};
