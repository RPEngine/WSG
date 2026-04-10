export const getHealthStatus = () => {
  return {
    status: "ok",
    service: "wsg-backend",
    timestamp: new Date().toISOString(),
  };
};
