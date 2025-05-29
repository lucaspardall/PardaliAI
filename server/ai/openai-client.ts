
import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;
  
  // IDs dos assistentes pré-criados na sua conta OpenAI
  private readonly ASSISTANTS = {
    'product_optimization': process.env.OPENAI_ASSISTANT_PRODUCT_OPTIMIZER!,
    'ad_creation': process.env.OPENAI_ASSISTANT_AD_CREATOR!,
    'store_analysis': process.env.OPENAI_ASSISTANT_STORE_ANALYZER!,
    'campaign_analysis': process.env.OPENAI_ASSISTANT_CAMPAIGN_ANALYZER!
  };

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  /**
   * Executa assistant com dados brutos
   */
  async runAssistant(
    assistantType: keyof typeof this.ASSISTANTS,
    inputData: any,
    userId: string
  ): Promise<any> {
    try {
      const assistantId = this.ASSISTANTS[assistantType];
      
      if (!assistantId) {
        throw new Error(`Assistant type ${assistantType} not configured`);
      }

      // 1. Criar thread
      const thread = await this.client.beta.threads.create();

      // 2. Adicionar mensagem com dados brutos
      await this.client.beta.threads.messages.create(thread.id, {
        role: "user",
        content: JSON.stringify(inputData, null, 2)
      });

      // 3. Executar assistant
      const run = await this.client.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
        metadata: {
          userId,
          assistantType,
          timestamp: new Date().toISOString()
        }
      });

      // 4. Aguardar conclusão com polling
      const result = await this.waitForCompletion(thread.id, run.id);

      // 5. Recuperar resposta
      const messages = await this.client.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(
        msg => msg.role === 'assistant' && msg.run_id === run.id
      );

      if (!assistantMessage || !assistantMessage.content[0]) {
        throw new Error('No response from assistant');
      }

      const responseContent = assistantMessage.content[0];
      if (responseContent.type !== 'text') {
        throw new Error('Invalid response type from assistant');
      }

      // Parse da resposta JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent.text.value);
      } catch (error) {
        // Se não for JSON válido, retornar como texto
        parsedResponse = { response: responseContent.text.value };
      }

      return {
        success: true,
        data: parsedResponse,
        threadId: thread.id,
        runId: run.id,
        usage: result.usage
      };

    } catch (error) {
      console.error(`Error running assistant ${assistantType}:`, error);
      throw error;
    }
  }

  /**
   * Aguarda conclusão do run com polling
   */
  private async waitForCompletion(threadId: string, runId: string, maxWaitTime = 300000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed') {
        return run;
      }
      
      if (['failed', 'cancelled', 'expired'].includes(run.status)) {
        throw new Error(`Assistant run failed with status: ${run.status}`);
      }
      
      // Aguardar 1 segundo antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Assistant run timeout');
  }

  /**
   * Listar assistentes disponíveis (para debug)
   */
  async listAssistants(): Promise<any> {
    try {
      const assistants = await this.client.beta.assistants.list();
      return assistants.data;
    } catch (error) {
      console.error('Error listing assistants:', error);
      throw error;
    }
  }
}

export const openaiClient = new OpenAIClient();
