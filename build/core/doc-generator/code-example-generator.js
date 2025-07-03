/**
 * Code Example Generator for API Documentation
 *
 * Generates code examples in multiple programming languages for API operations
 */
import { Logger } from '../../utils/logger/index';
export class CodeExampleGenerator {
    logger;
    constructor() {
        this.logger = new Logger('CodeExampleGenerator');
    }
    /**
     * Generate code examples for an operation
     */
    async generateExamples(operation, config) {
        try {
            this.logger.debug('Generating code examples', {
                operationId: operation.operationId,
                languages: config.languages
            });
            const examples = [];
            for (const language of config.languages) {
                if (config.includeRequests) {
                    const requestExample = await this.generateRequestExample(operation, language, config);
                    if (requestExample) {
                        examples.push(requestExample);
                    }
                }
                if (config.includeResponses) {
                    const responseExamples = await this.generateResponseExamples(operation, language, config);
                    examples.push(...responseExamples);
                }
                if (config.includeErrors) {
                    const errorExamples = await this.generateErrorExamples(operation, language, config);
                    examples.push(...errorExamples);
                }
            }
            this.logger.info('Code examples generated', {
                operationId: operation.operationId,
                exampleCount: examples.length
            });
            return examples;
        }
        catch (error) {
            this.logger.error('Failed to generate code examples', error);
            throw this.createExampleError('EXAMPLE_GENERATION_FAILED', 'Failed to generate code examples', error);
        }
    }
    /**
     * Generate request example
     */
    async generateRequestExample(operation, language, config) {
        try {
            let code;
            switch (language) {
                case 'typescript':
                    code = this.generateTypeScriptRequest(operation, config);
                    break;
                case 'javascript':
                    code = this.generateJavaScriptRequest(operation, config);
                    break;
                case 'python':
                    code = this.generatePythonRequest(operation, config);
                    break;
                case 'java':
                    code = this.generateJavaRequest(operation, config);
                    break;
                case 'curl':
                    code = this.generateCurlRequest(operation, config);
                    break;
                default:
                    this.logger.warn(`Unsupported language for request example: ${language}`);
                    return null;
            }
            return {
                language,
                code,
                type: 'request',
                description: `${operation.method.toUpperCase()} ${operation.path} request example`
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate ${language} request example`, error);
            return null;
        }
    }
    /**
     * Generate TypeScript request example
     */
    generateTypeScriptRequest(operation, _config) {
        const { method, path, parameters, requestBody } = operation;
        // Build URL with path parameters
        let url = path;
        const pathParams = parameters.filter(p => p.in === 'path');
        pathParams.forEach(param => {
            url = url.replace(`{${param.name}}`, `\${${param.name}}`);
        });
        // Build query parameters
        const queryParams = parameters.filter(p => p.in === 'query');
        const queryString = queryParams.length > 0
            ? queryParams.map(p => `${p.name}=\${${p.name}}`).join('&')
            : '';
        // Build headers
        const headerParams = parameters.filter(p => p.in === 'header');
        const headers = ['Content-Type: application/json', ...headerParams.map(p => `${p.name}: \${${p.name}}`)];
        let code = `// ${operation.summary || `${method.toUpperCase()} ${path}`}\n`;
        // Add interface definitions if request body exists
        if (requestBody) {
            code += `interface RequestBody {\n`;
            code += `  // Define request body structure based on your API schema\n`;
            code += `  [key: string]: any;\n`;
            code += `}\n\n`;
        }
        code += `const response = await fetch(\`${url}${queryString ? '?' + queryString : ''}\`, {\n`;
        code += `  method: '${method.toUpperCase()}',\n`;
        code += `  headers: {\n`;
        headers.forEach(header => {
            const [name, value] = header.split(': ');
            code += `    '${name}': '${value}',\n`;
        });
        code += `  },\n`;
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            code += `  body: JSON.stringify(requestBody),\n`;
        }
        code += `});\n\n`;
        code += `if (!response.ok) {\n`;
        code += `  throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
        code += `}\n\n`;
        code += `const data = await response.json();\n`;
        code += `console.log(data);`;
        return code;
    }
    /**
     * Generate JavaScript request example
     */
    generateJavaScriptRequest(operation, config) {
        // Similar to TypeScript but without type annotations
        const tsCode = this.generateTypeScriptRequest(operation, config);
        return tsCode
            .replace(/interface RequestBody \{[\s\S]*?\}\n\n/, '')
            .replace(/: RequestBody/g, '')
            .replace(/: string/g, '')
            .replace(/: number/g, '')
            .replace(/: boolean/g, '');
    }
    /**
     * Generate Python request example
     */
    generatePythonRequest(operation, _config) {
        const { method, path, parameters, requestBody } = operation;
        let url = path;
        const pathParams = parameters.filter(p => p.in === 'path');
        pathParams.forEach(param => {
            url = url.replace(`{${param.name}}`, `{${param.name}}`);
        });
        let code = `import requests\nimport json\n\n`;
        code += `# ${operation.summary || `${method.toUpperCase()} ${path}`}\n`;
        // URL and parameters
        code += `url = f"${url}"\n`;
        // Query parameters
        const queryParams = parameters.filter(p => p.in === 'query');
        if (queryParams.length > 0) {
            code += `params = {\n`;
            queryParams.forEach(param => {
                code += `    "${param.name}": ${param.name},\n`;
            });
            code += `}\n`;
        }
        // Headers
        const headerParams = parameters.filter(p => p.in === 'header');
        code += `headers = {\n`;
        code += `    "Content-Type": "application/json",\n`;
        headerParams.forEach(param => {
            code += `    "${param.name}": ${param.name},\n`;
        });
        code += `}\n`;
        // Request body
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            code += `\ndata = {\n`;
            code += `    # Define request body structure\n`;
            code += `}\n`;
        }
        // Make request
        code += `\nresponse = requests.${method.toLowerCase()}(\n`;
        code += `    url,\n`;
        if (queryParams.length > 0) {
            code += `    params=params,\n`;
        }
        code += `    headers=headers,\n`;
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            code += `    json=data,\n`;
        }
        code += `)\n\n`;
        code += `response.raise_for_status()\n`;
        code += `result = response.json()\n`;
        code += `print(result)`;
        return code;
    }
    /**
     * Generate Java request example
     */
    generateJavaRequest(operation, _config) {
        const { method, path, requestBody } = operation;
        let code = `import java.net.http.HttpClient;\n`;
        code += `import java.net.http.HttpRequest;\n`;
        code += `import java.net.http.HttpResponse;\n`;
        code += `import java.net.URI;\n`;
        code += `import java.time.Duration;\n\n`;
        code += `// ${operation.summary || `${method.toUpperCase()} ${path}`}\n`;
        code += `HttpClient client = HttpClient.newBuilder()\n`;
        code += `    .connectTimeout(Duration.ofSeconds(10))\n`;
        code += `    .build();\n\n`;
        const requestBuilder = `HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()\n`;
        code += requestBuilder;
        code += `    .uri(URI.create("${path}"))\n`;
        code += `    .header("Content-Type", "application/json")`;
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            code += `\n    .${method.toUpperCase()}(HttpRequest.BodyPublishers.ofString("{\\"key\\": \\"value\\"}"));\n\n`;
        }
        else {
            code += `\n    .${method.toUpperCase()}(HttpRequest.BodyPublishers.noBody());\n\n`;
        }
        code += `HttpRequest request = requestBuilder.build();\n\n`;
        code += `HttpResponse<String> response = client.send(request,\n`;
        code += `    HttpResponse.BodyHandlers.ofString());\n\n`;
        code += `System.out.println("Status: " + response.statusCode());\n`;
        code += `System.out.println("Body: " + response.body());`;
        return code;
    }
    /**
     * Generate cURL request example
     */
    generateCurlRequest(operation, _config) {
        const { method, path, parameters, requestBody } = operation;
        let code = `# ${operation.summary || `${method.toUpperCase()} ${path}`}\n`;
        code += `curl -X ${method.toUpperCase()} \\\n`;
        code += `  "${path}" \\\n`;
        code += `  -H "Content-Type: application/json" \\\n`;
        // Add header parameters
        const headerParams = parameters.filter(p => p.in === 'header');
        headerParams.forEach(param => {
            code += `  -H "${param.name}: \${${param.name}}" \\\n`;
        });
        // Add request body for POST/PUT/PATCH
        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            code += `  -d '{\n`;
            code += `    "key": "value"\n`;
            code += `  }'`;
        }
        else {
            code = code.slice(0, -3); // Remove trailing " \"
        }
        return code;
    }
    /**
     * Generate response examples
     */
    async generateResponseExamples(operation, _language, _config) {
        const examples = [];
        // Generate examples for successful responses (2xx)
        const successResponses = operation.responses.filter(r => r.statusCode.startsWith('2'));
        for (const response of successResponses) {
            if (response.content) {
                const example = {
                    language: 'json',
                    code: this.generateResponseJson(response),
                    type: 'response',
                    description: `${response.statusCode} ${response.description}`
                };
                examples.push(example);
            }
        }
        return examples;
    }
    /**
     * Generate error examples
     */
    async generateErrorExamples(operation, _language, _config) {
        const examples = [];
        // Generate examples for error responses (4xx, 5xx)
        const errorResponses = operation.responses.filter(r => r.statusCode.startsWith('4') || r.statusCode.startsWith('5'));
        for (const response of errorResponses) {
            if (response.content) {
                const example = {
                    language: 'json',
                    code: this.generateResponseJson(response),
                    type: 'error',
                    description: `${response.statusCode} ${response.description}`
                };
                examples.push(example);
            }
        }
        return examples;
    }
    /**
     * Generate response JSON example
     */
    generateResponseJson(response) {
        // Generate example JSON based on schema
        const contentTypes = Object.keys(response.content || {});
        const jsonContentType = contentTypes.find(ct => ct.includes('json'));
        if (jsonContentType && response.content[jsonContentType].schema) {
            return JSON.stringify(this.generateExampleFromSchema(response.content[jsonContentType].schema), null, 2);
        }
        return JSON.stringify({
            message: response.description || 'Response example',
            status: response.statusCode
        }, null, 2);
    }
    /**
     * Generate example data from schema
     */
    generateExampleFromSchema(schema) {
        if (schema.example) {
            return schema.example;
        }
        switch (schema.type) {
            case 'object':
                const obj = {};
                if (schema.properties) {
                    Object.entries(schema.properties).forEach(([key, prop]) => {
                        obj[key] = this.generateExampleFromSchema(prop);
                    });
                }
                return obj;
            case 'array':
                return schema.items ? [this.generateExampleFromSchema(schema.items)] : [];
            case 'string':
                return schema.enum ? schema.enum[0] : 'string';
            case 'number':
            case 'integer':
                return 0;
            case 'boolean':
                return true;
            default:
                return null;
        }
    }
    /**
     * Create example generation error
     */
    createExampleError(code, message, cause) {
        const error = new Error(message);
        error.code = code;
        error.context = { cause };
        error.suggestions = [
            'Check operation definition is valid',
            'Verify schema definitions are correct',
            'Ensure supported language is specified'
        ];
        return error;
    }
}
//# sourceMappingURL=code-example-generator.js.map