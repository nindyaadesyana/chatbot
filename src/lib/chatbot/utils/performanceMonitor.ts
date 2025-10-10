// Performance monitoring for RAG system
export class PerformanceMonitor {
  private static metrics: Map<string, any[]> = new Map();

  static startTimer(operation: string): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, { duration, timestamp: new Date() });
      return duration;
    };
  }

  static recordMetric(operation: string, data: any) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(data);
    
    // Keep only last 100 records per operation
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
  }

  static getAverageResponseTime(operation: string): number {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return 0;
    
    const durations = metrics.map(m => m.duration).filter(d => d);
    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  static getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const durations = metrics.map(m => m.duration).filter(d => d);
      if (durations.length > 0) {
        summary[operation] = {
          count: durations.length,
          avgDuration: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          lastUsed: metrics[metrics.length - 1]?.timestamp
        };
      }
    }
    
    return summary;
  }

  static logPerformance(operation: string, details?: any) {
    const summary = this.getMetricsSummary();
    console.log(`[Performance] ${operation}:`, {
      ...summary[operation],
      ...details
    });
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

// Response quality analyzer
export class ResponseQualityAnalyzer {
  static analyzeResponse(question: string, response: string, context: any[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check response length
    if (response.length < 50) {
      issues.push('Response too short');
      score -= 20;
      suggestions.push('Provide more detailed information');
    }

    // Check if response contains greeting
    const greetings = ['selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam'];
    if (!greetings.some(g => response.toLowerCase().includes(g))) {
      issues.push('Missing greeting');
      score -= 10;
      suggestions.push('Include time-appropriate greeting');
    }

    // Check if response ends properly
    const properEndings = ['semoga informasi ini bermanfaat', 'terima kasih', 'silakan bertanya'];
    if (!properEndings.some(e => response.toLowerCase().includes(e))) {
      issues.push('Missing proper ending');
      score -= 10;
      suggestions.push('Add polite closing statement');
    }

    // Check context relevance
    if (context.length === 0) {
      issues.push('No context used');
      score -= 30;
      suggestions.push('Improve document retrieval');
    }

    // Check for error messages
    if (response.includes('maaf') && response.includes('tidak')) {
      issues.push('Contains error/apology message');
      score -= 25;
      suggestions.push('Improve knowledge base or fallback responses');
    }

    // Check for Indonesian language quality
    const indonesianWords = ['yang', 'dan', 'untuk', 'dengan', 'adalah', 'pada', 'dalam'];
    const wordCount = response.split(' ').length;
    const indonesianWordCount = indonesianWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length;
    
    if (wordCount > 10 && indonesianWordCount / wordCount < 0.1) {
      issues.push('May not be in proper Indonesian');
      score -= 15;
      suggestions.push('Ensure response is in Indonesian language');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}