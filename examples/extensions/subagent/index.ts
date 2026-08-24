/**
 * Sub-agent Extension
 * 
 * Spawns sub-agents for parallel work.
 * 
 * Usage:
 * 1. Copy this folder to your project's .pi/extensions/ directory
 * 2. Restart Pi
 * 3. Use the spawn_agent tool
 */

import { Agent } from "@earendil-works/pi-agent-core";

export default {
  name: "subagent",
  
  tools: [
    {
      name: "spawn_agent",
      description: "Spawn a sub-agent for parallel work",
      parameters: {
        task: { type: "string", description: "Task description" },
        model: { type: "string", description: "Model to use (optional)" }
      },
      execute: async (args, signal) => {
        try {
          // Create a new agent instance
          const agent = new Agent({
            model: { 
              provider: "anthropic", 
              id: args.model || "claude-sonnet-4-20250514" 
            }
          });
          
          // Execute the task
          await agent.prompt(args.task);
          
          // Get the result
          const lastMessage = agent.state.messages.pop();
          return {
            content: lastMessage.content
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Sub-agent error: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  ],
  
  commands: [
    {
      name: "/parallel",
      description: "Execute task in parallel with sub-agent",
      handler: async (args) => {
        return `Task delegated to sub-agent: ${args}`;
      }
    }
  ]
};
