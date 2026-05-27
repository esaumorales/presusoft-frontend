import { axiosClient } from "../../../core/api/axiosClient";

export const collaboratorsService = {
  getAll: () => axiosClient.get("/collaborators"),
  create: (data) => axiosClient.post("/collaborators", data),
  update: (id, data) => axiosClient.put(`/collaborators/${id}`, data),
  remove: (id) => axiosClient.delete(`/collaborators/${id}`),
};
