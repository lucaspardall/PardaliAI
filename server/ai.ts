import { storage } from "./storage";
import { Product, InsertProductOptimization, AiRequest, InsertAiRequest } from "@shared/schema";

// Simulated AI service for product optimization
export class AiService {
  /**
   * Simulate AI processing for product optimization
   */
  async optimizeProduct(
    userId: string,
    product: Product,
  ): Promise<{ optimization: InsertProductOptimization; request: AiRequest }> {
    // Create AI request record
    const requestInput = {
      productId: product.id,
      productName: product.name,
      productDescription: product.description,
      category: product.category,
      metrics: {
        ctr: product.ctr,
        views: product.views,
        sales: product.sales,
      },
    };

    const request = await storage.createAiRequest({
      userId,
      type: "product_optimization",
      input: requestInput,
      status: "processing",
    });

    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate optimization suggestions
      const [suggestedTitle, suggestedDesc, suggestedKeywords, reasoningNotes] = this.generateOptimization(product);

      // Update AI request with results
      const processingTime = 2000; // milliseconds
      const outputData = {
        suggestedTitle,
        suggestedDesc,
        suggestedKeywords,
        reasoningNotes,
        impact: {
          ctrImprovement: this.getRandomNumber(15, 40),
          conversionImprovement: this.getRandomNumber(5, 25),
        },
      };

      const updatedRequest = await storage.updateAiRequest(request.id, {
        status: "completed",
        output: outputData,
        processingTime,
        completedAt: new Date(),
      });

      // Create optimization record
      const optimization: InsertProductOptimization = {
        productId: product.id,
        originalTitle: product.name,
        originalDesc: product.description || "",
        originalKeywords: this.extractKeywords(product.name, product.description || "").join(", "),
        suggestedTitle,
        suggestedDesc,
        suggestedKeywords: suggestedKeywords.join(", "),
        reasoningNotes,
        status: "pending",
        aiRequestId: request.id,
      };

      return { optimization, request: updatedRequest! };
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await storage.updateAiRequest(request.id, {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Generate optimization suggestions based on product data
   */
  private generateOptimization(
    product: Product
  ): [string, string, string[], string] {
    const title = product.name;
    const description = product.description || "";
    
    // Simplified simulation for MVP
    // In a real app, this would use actual AI models or API calls
    
    // Generate optimized title with better keywords
    const suggestedTitle = this.improveTitle(title);
    
    // Generate optimized description with better structure
    const suggestedDesc = this.improveDescription(description);
    
    // Generate keywords
    const existingKeywords = this.extractKeywords(title, description);
    const suggestedKeywords = [...existingKeywords, ...this.generateAdditionalKeywords(title, description)];
    
    // Generate reasoning
    const reasoningNotes = this.generateReasoning(title, description, suggestedTitle, suggestedDesc);
    
    return [suggestedTitle, suggestedDesc, suggestedKeywords, reasoningNotes];
  }

  /**
   * Improve product title with better keywords and structure
   */
  private improveTitle(title: string): string {
    // Simple simulation of title optimization
    const words = title.split(" ");
    
    // Ensure main category is at the beginning for better search visibility
    if (words.length > 3) {
      const mainCategory = words[words.length - 1];
      if (!["para", "com", "de", "e"].includes(mainCategory.toLowerCase())) {
        words.pop();
        words.unshift(mainCategory);
      }
    }
    
    // Add beneficial qualifiers if they don't exist
    const qualifiers = ["Premium", "Profissional", "Alta Qualidade", "Original"];
    const randomQualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
    
    if (!title.includes("Premium") && !title.includes("Profissional")) {
      words.splice(Math.min(2, words.length), 0, randomQualifier);
    }
    
    return words.join(" ");
  }

  /**
   * Improve product description with better structure and keywords
   */
  private improveDescription(description: string): string {
    if (!description) return "Descrição não disponível";
    
    // Break into paragraphs if not already formatted
    const paragraphs = description.split(/\n+/);
    
    if (paragraphs.length < 3) {
      // Create structured description with emojis and formatting
      return `🌟 CARACTERÍSTICAS PRINCIPAIS: ${description.substring(0, Math.min(80, description.length))}
      
✅ BENEFÍCIOS: ${description.substring(Math.min(80, description.length), Math.min(160, description.length))}${description.length > 160 ? "" : " Produto de alta qualidade e durabilidade."}

🔍 DIFERENCIAIS: ${description.length > 160 ? description.substring(160) : "Garantia de satisfação. Envio rápido para todo o Brasil."} 

⭐ SATISFAÇÃO GARANTIDA: Seu produto tem garantia e suporte completo da nossa equipe.`;
    }
    
    // Already has structure, just enhance slightly
    return paragraphs.map((p, i) => {
      const emojis = ["🌟", "✅", "🔍", "⭐", "🚚"];
      return `${emojis[i % emojis.length]} ${p.trim().toUpperCase().endsWith(":") ? p.trim() : p.trim().toUpperCase() + ":"}`;
    }).join("\n\n");
  }

  /**
   * Extract keywords from product title and description
   */
  private extractKeywords(title: string, description: string): string[] {
    // Simple extraction from title and description
    const combinedText = `${title} ${description}`.toLowerCase();
    const words = combinedText.split(/\s+/);
    
    // Filter out common words and keep only meaningful keywords
    const stopWords = ["e", "de", "para", "com", "o", "a", "os", "as", "em", "na", "no", "um", "uma"];
    const filteredWords = words.filter(
      word => word.length > 3 && !stopWords.includes(word) && !/^\d+$/.test(word)
    );
    
    // Return unique keywords
    return [...new Set(filteredWords)].slice(0, 8);
  }

  /**
   * Generate additional relevant keywords
   */
  private generateAdditionalKeywords(title: string, description: string): string[] {
    // Categories that could be relevant based on product context
    const additionalKeywordSets = {
      "óculos": ["proteção", "uv", "estilo", "moda", "acessório", "visual", "lente", "sol"],
      "camisa": ["roupa", "vestuário", "moda", "casual", "algodão", "conforto", "estilo"],
      "tênis": ["calçado", "conforto", "esporte", "corrida", "casual", "amortecimento"],
      "relógio": ["acessório", "tempo", "pulso", "digital", "analógico", "estilo", "moda"],
      "celular": ["smartphone", "tecnologia", "tela", "bateria", "câmera", "memória", "processador"],
      "notebook": ["computador", "portátil", "tecnologia", "processador", "memória", "tela"],
      "fone": ["áudio", "som", "música", "bluetooth", "wireless", "cancelamento", "ruído"],
      "mochila": ["bolsa", "alça", "compartimento", "resistente", "viagem", "escola", "trabalho"],
      "cadeira": ["móvel", "escritório", "ergonômica", "conforto", "ajustável", "suporte"],
      "panela": ["cozinha", "antiaderente", "indução", "conjunto", "refeição", "tampa"],
    };
    
    // Find matching category or use default keywords
    const lowercaseTitle = title.toLowerCase();
    const matchingCategory = Object.keys(additionalKeywordSets).find(
      category => lowercaseTitle.includes(category)
    );
    
    if (matchingCategory) {
      return additionalKeywordSets[matchingCategory as keyof typeof additionalKeywordSets].slice(0, 5);
    }
    
    // Default additional keywords
    return ["qualidade", "original", "garantia", "entrega", "satisfação"].slice(0, 5);
  }

  /**
   * Generate reasoning for the optimization
   */
  private generateReasoning(
    originalTitle: string,
    originalDesc: string,
    suggestedTitle: string,
    suggestedDesc: string
  ): string {
    return `Análise comparativa:

1. Título: O título original "${originalTitle}" foi otimizado para "${suggestedTitle}" colocando as palavras-chave principais no início para melhorar o CTR em buscas. Adicionamos qualificadores que destacam o valor do produto.

2. Descrição: A descrição foi reestruturada com formatação visual clara usando emojis e tópicos, facilitando a leitura e compreensão do cliente. Destacamos benefícios e diferenciais.

3. Palavras-chave: Expandimos o conjunto de palavras-chave relevantes para melhorar a descoberta do produto nas buscas da Shopee.

Expectativa de melhoria:
- Aumento estimado de CTR: entre 20% e 35%
- Aumento estimado de conversão: entre 10% e 25%

Esta otimização foi baseada em análise de dados de produtos similares com alta performance na plataforma Shopee.`;
  }

  /**
   * Get random number in range
   */
  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const aiService = new AiService();
