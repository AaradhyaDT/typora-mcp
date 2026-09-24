export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
    };
}
export declare const TOOLS: ToolDefinition[];
//# sourceMappingURL=tools.d.ts.map