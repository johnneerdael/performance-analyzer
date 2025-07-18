"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingJsonParser = void 0;
// Streaming JSON Parser Utility
const fs_1 = __importDefault(require("fs"));
const fs_2 = require("fs");
const ErrorHandler_1 = require("./ErrorHandler");
const promises_1 = require("stream/promises");
const stream_1 = require("stream");
const JSONStream = __importStar(require("JSONStream"));
/**
 * Streaming JSON parser for efficiently processing large JSON files
 * Uses JSONStream to parse JSON files without loading the entire file into memory
 */
class StreamingJsonParser {
    /**
     * Creates a new StreamingJsonParser instance
     * @param errorHandler Optional custom error handler
     */
    constructor(errorHandler) {
        this.errorHandler = errorHandler || new ErrorHandler_1.DefaultErrorHandler();
    }
    /**
     * Parse a JSON file using streaming and process objects in batches
     * @param options Parser options
     * @param processBatch Function to process each batch of objects
     * @returns Promise that resolves when parsing is complete
     */
    async parseJsonStream(options, processBatch) {
        const { filePath, selector, batchSize = 100 } = options;
        try {
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                const error = new Error(`File does not exist: ${filePath}`);
                error.code = 'ENOENT';
                error.path = filePath;
                this.errorHandler.handleFileSystemError(error);
                throw error;
            }
            // Create a buffer to collect objects
            let buffer = [];
            // Create a transform stream to batch objects
            const batchTransform = new stream_1.Transform({
                objectMode: true,
                transform: async (data, encoding, callback) => {
                    try {
                        // Add object to buffer
                        buffer.push(data);
                        // If buffer reaches batch size, process the batch
                        if (buffer.length >= batchSize) {
                            await processBatch([...buffer]);
                            buffer = [];
                        }
                        callback();
                    }
                    catch (error) {
                        callback(error);
                    }
                },
                flush: async (callback) => {
                    try {
                        // Process any remaining objects in the buffer
                        if (buffer.length > 0) {
                            await processBatch([...buffer]);
                            buffer = [];
                        }
                        callback();
                    }
                    catch (error) {
                        callback(error);
                    }
                }
            });
            // Create the pipeline
            await (0, promises_1.pipeline)((0, fs_2.createReadStream)(filePath), JSONStream.parse(selector), batchTransform);
        }
        catch (error) {
            // If it's already a FileSystemError or ParsingError, just rethrow it
            if (error.path || error.filePath) {
                throw error;
            }
            // Create a ParsingError with file information
            const parsingError = new Error(error instanceof Error ? error.message : String(error));
            parsingError.filePath = filePath;
            // Handle the error
            this.errorHandler.handleParsingError(parsingError);
            throw parsingError;
        }
    }
    /**
     * Count the number of objects matching a selector in a JSON file
     * @param options Parser options
     * @returns Promise that resolves to the count of matching objects
     */
    async countObjects(options) {
        let count = 0;
        await this.parseJsonStream(options, async (batch) => {
            count += batch.length;
        });
        return count;
    }
    /**
     * Check if a JSON file is larger than a specified size
     * @param filePath Path to the JSON file
     * @param sizeThresholdMB Size threshold in megabytes
     * @returns True if the file is larger than the threshold
     */
    isLargeFile(filePath, sizeThresholdMB = 10) {
        try {
            const stats = fs_1.default.statSync(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);
            return fileSizeMB > sizeThresholdMB;
        }
        catch (error) {
            const fsError = new Error(error instanceof Error ? error.message : String(error));
            fsError.code = error.code || 'UNKNOWN';
            fsError.path = filePath;
            this.errorHandler.handleFileSystemError(fsError);
            return false;
        }
    }
}
exports.StreamingJsonParser = StreamingJsonParser;
//# sourceMappingURL=StreamingJsonParser.js.map