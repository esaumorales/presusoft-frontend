import { axiosClient } from '../../../core/api/axiosClient';

export const aiService = {
  /**
   * Genera módulos y tareas para un presupuesto usando el modelo local del backend.
   * @param {string} prompt - Descripción del proyecto en texto libre
   * @param {string} budgetId - ID del presupuesto donde insertar los módulos
   */
  generateBudget: (prompt, budgetId) =>
    axiosClient.post('/ai/generate', { prompt, budgetId }),
};
