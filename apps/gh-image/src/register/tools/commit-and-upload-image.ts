import { execSync } from "node:child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ErrorResponse, SuccessResponse } from "../../types.js";

export const MCP_TOOL_NAME__COMMIT_AND_UPLOAD_IMAGE = "commit-and-upload-image";

const inputSchema = {
  commitAndUploadImagePath: z
    .string()
    .describe(
      "Path to the directory containing images to commit and upload. (This should be a path relative to the root of the repository, e.g., 'images/pr/[PR_NUMBER]')",
    ),
};

const outputSchema = {
  isError: z.boolean(),
  message: z.string().describe("Message about the operation result"),
  previewUrl: z
    .string()
    .nullable()
    .describe("URL of the uploaded image for preview on GitHub PR"),
};

export const commitAndUploadImage = (server: McpServer) => {
  server.registerTool(
    MCP_TOOL_NAME__COMMIT_AND_UPLOAD_IMAGE,
    {
      title: "Commit and Upload Image for preparing Github comment with image",
      description: `
- Normally, you cannot create comments with image previews on GitHub PRs or Issues via AI
- This is because the gh command and GitHub's official MCP tools do not support comments with image previews
- Even if AI forcefully creates a PR with image preview, when a human opens the GitHub PR URL via browser, the image won't be displayed
- This MCP tool commits images to a specific folder and generates image URLs on GitHub, enabling normal image preview viewing when humans browse PR comments
- When AI specifies a screenshot for PR, please place the screenshot image in 'commitAndUploadImagePath'
- AI should confirm beforehand that the gh command-line tool required for this MCP tool execution is available
`,
      annotations: {
        openWorldHint: true,
        destructiveHint: true,
        readOnlyHint: false,
        idempotentHint: false,
      },
      inputSchema,
      outputSchema,
    },
    async ({ commitAndUploadImagePath }) => {
      try {
        const gitRootPath = execSync("git rev-parse --show-toplevel")
          .toString()
          .trim();

        // git add given file
        execSync(`git add ${commitAndUploadImagePath}`, {
          cwd: gitRootPath,
        });

        // git commit only given file with message
        execSync(
          `git commit -m "Add image for PR comment" ${commitAndUploadImagePath}`,
          {
            cwd: gitRootPath,
          },
        );

        const commitHash = execSync("git rev-parse HEAD").toString().trim();

        const repoOwner = execSync(
          "git config --get remote.origin.url | sed 's/.*github.com[:/\\(\\)]\\([^/]+\\)\\/\\([^/]+\\)\\.git$/\\1/'",
        )
          .toString()
          .trim();

        const repoName = execSync(
          "git config --get remote.origin.url | sed 's/.*github.com[:/\\(\\)]\\([^/]+\\)\\/\\([^/]+\\)\\.git$/\\2/'",
        )
          .toString()
          .trim();

        // obtain ![img](https://github.com/[OWNER]/[REPO]/blob/[COMMIT_HASH]/[IMAGE_FILE_PATH]?raw=true)
        const imageUrl = `https://github.com/${repoOwner}/${repoName}/blob/${commitHash}/${commitAndUploadImagePath}?raw=true`;
        const markdownPreview = `![img](${imageUrl})`;

        const successResponse: SuccessResponse = {
          isSuccess: true,
          message: "Image committed and uploaded successfully.",
          imageUrl: imageUrl,
          markdownPreview: markdownPreview,
        };

        // For backward compatibility with MCP output schema
        const structuredContent = {
          isError: false,
          message: successResponse.message,
          previewUrl: markdownPreview,
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        return {
          isError: false,
          structuredContent,
          content: [
            {
              type: "text",
              text: JSON.stringify(successResponse),
            },
          ],
        };
      } catch (error) {
        let errorMessage = "An unknown error occurred";
        let errorDetails: string | undefined;
        let stack: string | undefined;

        if (error instanceof Error) {
          errorMessage = error.message;
          stack = error.stack;

          // Determine error type based on error message
          if (error.message.includes("fatal: not a git repository")) {
            errorMessage = "Not a valid git repository";
            errorDetails =
              "Please ensure you are running this command from within a git repository";
          } else if (error.message.includes("Permission denied")) {
            errorMessage = "Permission denied while executing git command";
            errorDetails =
              "Please check file permissions and git configuration";
          } else if (error.message.includes("git")) {
            errorMessage = "Git command failed";
            errorDetails = error.message;
          }
        }

        const errorResponse: ErrorResponse = {
          isSuccess: false,
          error: errorMessage,
          ...(errorDetails && { details: errorDetails }),
          ...(stack && { stack: stack }),
        };

        // For backward compatibility with MCP output schema
        const structuredContent = {
          isError: true,
          message: errorMessage,
          previewUrl: null,
        } satisfies z.infer<z.ZodObject<typeof outputSchema>>;

        return {
          isError: true,
          structuredContent,
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse),
            },
          ],
        };
      }
    },
  );
};
