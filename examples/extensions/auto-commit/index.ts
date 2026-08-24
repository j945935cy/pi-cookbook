/**
 * Auto Commit Extension
 * 
 * Automatically commits file changes after write/edit operations.
 * 
 * Usage:
 * 1. Copy this folder to your project's .pi/extensions/ directory
 * 2. Restart Pi
 * 3. All file modifications will be auto-committed
 */

export default {
  name: "auto-commit",
  
  hooks: {
    afterToolCall: async (ctx) => {
      // Only trigger on write or edit operations
      if (ctx.toolCall.name === "write" || ctx.toolCall.name === "edit") {
        const filePath = ctx.args.path;
        
        try {
          // Git add
          await ctx.bash(`git add ${filePath}`);
          
          // Git commit
          const message = `ai: update ${filePath}`;
          await ctx.bash(`git commit -m "${message}"`);
          
          return { 
            content: [{ type: "text", text: `Committed: ${message}` }] 
          };
        } catch (error) {
          return { 
            content: [{ type: "text", text: `Commit failed: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  }
};
