import { axiosClient } from '../../../core/api/axiosClient';

export const aiService = {
  /**
   * Genera módulos y tareas para un presupuesto usando el modelo local del backend.
   * @param {string} prompt              - Descripción del proyecto en texto libre
   * @param {string} budgetId            - ID del presupuesto donde insertar los módulos
   * @param {string} market              - Mercado: peru | latam | espana | usa
   * @param {string} scope               - Alcance: full | frontend | backend
   * @param {object} team                - { ui, front, back, db, infra } niveles
   */
  generateBudget: (prompt, budgetId, market = 'peru', scope = 'full', team = {}) =>
    axiosClient.post('/ai/generate', { prompt, budgetId, market, scope, team }),
};
