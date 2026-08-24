/**
 * Permission Gate Extension
 * 
 * Controls access to sensitive files and directories.
 * 
 * Usage:
 * 1. Copy this folder to your project's .pi/extensions/ directory
 * 2. Restart Pi
 * 3. Protected paths will be blocked
 */

export default {
  name: "permission-gate",
  
  hooks: {
    beforeToolCall: async (ctx) => {
      const protectedPaths = [
        "/etc",
        "/usr",
        "/bin",
        "/sbin",
        "~/.ssh",
        "~/.aws",
        "~/.kube",
        "~/.env",
        ".env",
        ".env.local",
        ".env.production"
      ];
      
      const protectedPatterns = [
        /\.pem$/,
        /\.key$/,
        /id_rsa/,
        /credentials/,
        /secret/
      ];
      
      // Get the file path from args
      const filePath = ctx.args.path || ctx.args.command || "";
      
      // Check protected paths
      for (const protected of protectedPaths) {
        if (filePath.includes(protected)) {
          return { 
            block: true, 
            reason: `Access to ${protected} is protected` 
          };
        }
      }
      
      // Check protected patterns
      for (const pattern of protectedPatterns) {
        if (pattern.test(filePath)) {
          return { 
            block: true, 
            reason: `Access to ${filePath} matches protected pattern` 
          };
        }
      }
    }
  }
};
