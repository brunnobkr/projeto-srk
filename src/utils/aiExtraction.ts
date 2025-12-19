// Utilitário para extração de dados de pedidos usando IA
// Suporta Excel e PDF

import * as XLSX from 'xlsx';
import type { DadosExtraidosIA } from '../types';

// Interface para diferentes backends de IA
interface AIBackend {
  extractFromText(text: string): Promise<DadosExtraidosIA[]>;
  extractFromImage(imageBase64: string): Promise<DadosExtraidosIA[]>;
}

// Backend usando OpenAI (requer API key)
class OpenAIBackend implements AIBackend {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractFromText(text: string): Promise<DadosExtraidosIA[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    const prompt = `Extraia informações de pedidos do seguinte texto. Retorne um JSON array com objetos contendo:
- codigoProduto: código do produto
- quantidade: quantidade numérica
- setor: setor de produção
- linha: linha de produção
- estadoPedido: "critico", "alerta" ou "normal" baseado na urgência
- observacoes: observações relevantes

Texto:
${text}

Retorne APENAS o JSON array, sem markdown ou explicações.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em extrair dados estruturados de documentos de pedidos de produção. Sempre retorne JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '[]';
      
      // Remover markdown code blocks se existirem
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extracted = JSON.parse(jsonText);
      
      return Array.isArray(extracted) ? extracted.map(item => ({
        ...item,
        confianca: 85, // Confiança padrão para OpenAI
      })) : [extracted];
    } catch (error) {
      console.error('Erro ao extrair com OpenAI:', error);
      throw error;
    }
  }

  async extractFromImage(imageBase64: string): Promise<DadosExtraidosIA[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em extrair dados estruturados de documentos de pedidos de produção. Analise a imagem e extraia informações de pedidos. Sempre retorne JSON válido.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extraia informações de pedidos desta imagem. Retorne um JSON array com objetos contendo: codigoProduto, quantidade, setor, linha, estadoPedido ("critico", "alerta" ou "normal"), observacoes. Retorne APENAS o JSON array.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '[]';
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const extracted = JSON.parse(jsonText);
      
      return Array.isArray(extracted) ? extracted.map(item => ({
        ...item,
        confianca: 80, // Confiança um pouco menor para OCR
      })) : [extracted];
    } catch (error) {
      console.error('Erro ao extrair com OpenAI Vision:', error);
      throw error;
    }
  }
}

// Backend local usando processamento de texto simples (fallback)
class LocalBackend implements AIBackend {
  async extractFromText(text: string): Promise<DadosExtraidosIA[]> {
    // Processamento básico usando regex e padrões
    const pedidos: DadosExtraidosIA[] = [];
    
    // Padrões para encontrar informações
    const codigoPattern = /(?:código|cod|produto)[\s:]*([A-Z0-9-]+)/gi;
    const quantidadePattern = /(?:quantidade|qtd|qtde)[\s:]*(\d+)/gi;
    const setorPattern = /(?:setor)[\s:]*([A-Z0-9\s]+)/gi;
    const linhaPattern = /(?:linha)[\s:]*([A-Z0-9\s]+)/gi;
    
    // Extrair códigos
    const codigos = [...text.matchAll(codigoPattern)].map(m => m[1]);
    const quantidades = [...text.matchAll(quantidadePattern)].map(m => parseInt(m[1]));
    const setores = [...text.matchAll(setorPattern)].map(m => m[1].trim());
    const linhas = [...text.matchAll(linhaPattern)].map(m => m[1].trim());
    
    // Detectar estado do pedido
    const isCritico = /(?:crítico|urgente|emergência|prioridade)/gi.test(text);
    const isAlerta = /(?:alerta|atenção|importante)/gi.test(text);
    
    // Criar pedidos baseados nos dados encontrados
    const maxItems = Math.max(codigos.length, quantidades.length, setores.length, linhas.length);
    
    for (let i = 0; i < maxItems; i++) {
      pedidos.push({
        codigoProduto: codigos[i] || '',
        quantidade: quantidades[i] || 0,
        setor: setores[i] || '',
        linha: linhas[i] || '',
        estadoPedido: isCritico ? 'critico' : isAlerta ? 'alerta' : 'normal',
        confianca: 60, // Confiança baixa para processamento local
        observacoes: text.substring(0, 200), // Primeiras 200 caracteres como observação
      });
    }
    
    return pedidos.length > 0 ? pedidos : [{
      codigoProduto: '',
      quantidade: 0,
      setor: '',
      linha: '',
      estadoPedido: 'normal' as const,
      confianca: 30,
      observacoes: 'Não foi possível extrair dados automaticamente. Por favor, preencha manualmente.',
    }];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async extractFromImage(_imageBase64: string): Promise<DadosExtraidosIA[]> {
    // Para processamento local de imagens, precisaríamos de OCR
    // Por enquanto, retornamos erro sugerindo usar texto
    throw new Error('Processamento de imagem requer API de IA (OpenAI, Google Cloud Vision, etc.)');
  }
}

// Processar arquivo Excel
export async function processarExcel(file: File, aiBackend?: AIBackend): Promise<DadosExtraidosIA[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar primeira planilha
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        
        // Converter para texto para processamento
        const text = jsonData.map(row => Array.isArray(row) ? row.join('\t') : String(row)).join('\n');
        
        // Usar IA para extrair dados
        const backend = aiBackend || new LocalBackend();
        const extracted = await backend.extractFromText(text);
        
        resolve(extracted);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Processar arquivo PDF
export async function processarPDF(file: File, aiBackend?: AIBackend): Promise<DadosExtraidosIA[]> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      // Para PDFs, vamos usar uma abordagem diferente
      // Se tiver OpenAI, podemos usar a API de visão diretamente
      if (aiBackend instanceof OpenAIBackend) {
        // Converter PDF para imagem (primeira página) usando FileReader
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // Para PDFs, vamos usar processamento de imagem via IA
            // Se tiver OpenAI, usar processamento de imagem
            const base64 = e.target?.result as string;
            if (base64 && aiBackend instanceof OpenAIBackend) {
              try {
                const extracted = await aiBackend.extractFromImage(base64);
                resolve(extracted);
                return;
              } catch (imgError) {
                console.warn('Erro ao processar PDF como imagem:', imgError);
              }
            }
            
            // Fallback: informar que precisa de IA para PDF
            reject(new Error('Processamento de PDF requer API de IA (OpenAI). Configure a API key nas configurações.'));
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        // Processamento local - informar que precisa de IA
        reject(new Error('Processamento de PDF requer API de IA (OpenAI). Configure a API key nas configurações.'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Criar backend de IA
export function criarAIBackend(tipo: 'openai' | 'local', apiKey?: string): AIBackend {
  if (tipo === 'openai' && apiKey) {
    return new OpenAIBackend(apiKey);
  }
  return new LocalBackend();
}

// Obter API key do localStorage
export function obterOpenAIKey(): string | null {
  return localStorage.getItem('openai_api_key');
}

// Salvar API key
export function salvarOpenAIKey(key: string): void {
  localStorage.setItem('openai_api_key', key);
}

