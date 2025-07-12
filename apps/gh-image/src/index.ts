import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../package.json";
import { commitAndUploadImage } from "./register";

// Create an MCP server
const server = new McpServer({
  name: packageJson.name,
  version: packageJson.version,
  title: "GitHub Image Upload Tool for obtain image preview url",
});

// Register tools
commitAndUploadImage(server);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
