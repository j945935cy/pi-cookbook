/**
 * Code Analyzer Extension
 * 
 * Analyzes code complexity metrics.
 * 
 * Usage:
 * 1. Copy this folder to your project's .pi/extensions/ directory
 * 2. Restart Pi
 * 3. Use the analyze_complexity tool
 */

import { readFile } from "node:fs/promises";

export default {
  name: "code-analyzer",
  
  tools: [
    {
      name: "analyze_complexity",
      description: "Analyze code complexity metrics",
      parameters: {
        file: { type: "string", description: "File to analyze" }
      },
      execute: async (args) => {
        try {
          const code = await readFile(args.file, "utf-8");
          
          const metrics = {
            file: args.file,
            lines: code.split("\n").length,
            functions: (code.match(/function\s+\w+/g) || []).length,
            classes: (code.match(/class\s+\w+/g) || []).length,
            imports: (code.match(/import\s+/g) || []).length,
            exports: (code.match(/export\s+/g) || []).length,
            comments: (code.match(/\/\/|\/\*/g) || []).length,
          };
          
          // Calculate cyclomatic complexity (simplified)
          const complexity = (
            (code.match(/if\s*\(/g) || []).length +
            (code.match(/else\s+if/g) || []).length +
            (code.match(/for\s*\(/g) || []).length +
            (code.match(/while\s*\(/g) || []).length +
            (code.match(/case\s+/g) || []).length +
            (code.match(/\?\s*:/g) || []).length
          );
          
          // Calculate maintainability index (simplified)
          const maintainability = Math.max(0, 100 - complexity * 2 - metrics.functions * 0.5);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                ...metrics,
                cyclomaticComplexity: complexity,
                maintainabilityIndex: Math.round(maintainability)
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  ],
  
  hooks: {
    turnEnd: async (ctx) => {
      // Auto-analyze modified files
      for (const result of ctx.toolResults) {
        if (result.toolName === "write" || result.toolName === "edit") {
          const filePath = result.args.path;
          if (filePath && filePath.endsWith(".ts")) {
            // Could auto-analyze here
          }
        }
      }
    }
  }
};
