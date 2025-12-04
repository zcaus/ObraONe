import { GoogleGenAI } from "@google/genai";
import { Order, DashboardMetrics } from "../types";

// In a real app, this should be an environment variable.
// Since we can't rely on env vars in this generated sandbox, we gracefully handle its absence.
const API_KEY = process.env.API_KEY || '';

export const generateSalesInsights = async (metrics: DashboardMetrics, recentOrders: Order[]): Promise<string> => {
  if (!API_KEY) {
    return "API Key do Google Gemini não encontrada. Por favor configure a variável de ambiente.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      Atue como um gerente comercial sênior especialista em análise de dados.
      Analise os seguintes dados da empresa (mês atual) e forneça um resumo executivo curto (máximo 3 parágrafos)
      com insights sobre desempenho e sugestões de ação.
      
      Métricas:
      - Total Vendido: R$ ${metrics.totalSales.toFixed(2)}
      - Pedidos: ${metrics.orderCount}
      - Clientes Ativos: ${metrics.activeClients}
      - Ticket Médio: R$ ${metrics.averageTicket.toFixed(2)}
      
      Últimos 3 pedidos para contexto:
      ${recentOrders.slice(0, 3).map(o => `- Cliente: ${o.clientName}, Valor: R$${o.total}, Status: ${o.status}`).join('\n')}
      
      Foque em:
      1. Avaliação do desempenho.
      2. Oportunidades de melhoria baseada no ticket médio.
      3. Uma ação motivacional para a equipe.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro ao conectar com a inteligência artificial. Verifique sua conexão.";
  }
};