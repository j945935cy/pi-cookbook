/**
 * Test Guard Extension
 * 
 * Blocks dangerous operations like npm publish, rm -rf, etc.
 * 
 * Usage:
 * 1. Copy this folder to your project's .pi/extensions/ directory
 * 2. Restart Pi
 * 3. Dangerous commands will be blocked
 */

export default {
  name: "test-guard",
  
  hooks: {
    beforeToolCall: async (ctx) => {
      // Only check bash commands
      if (ctx.toolCall.name === "bash") {
        const command = ctx.args.command;
        
        // Block npm publish
        if (command.includes("npm publish")) {
          return { 
            block: true, 
            reason: "Cannot publish from AI session" 
          };
        }
        
        // Block rm -rf
        if (command.includes("rm -rf") || command.includes("rm -fr")) {
          return { 
            block: true, 
            reason: "Dangerous command blocked: rm -rf" 
          };
        }
        
        // Block production kubectl
        if (command.includes("kubectl") && command.includes("production")) {
          return { 
            block: true, 
            reason: "No production access allowed" 
          };
        }
        
        // Block database drop
        if (command.includes("DROP TABLE") || command.includes("DROP DATABASE")) {
          return { 
            block: true, 
            reason: "Database drop operations blocked" 
          };
        }
      }
    }
  }
};
