import { DataParser, TestParameters, TestResults } from '../models';
export declare class DefaultDataParser implements DataParser {
    parseParameters(filePath: string): Promise<TestParameters>;
    parseResults(filePath: string): Promise<TestResults>;
}
export { DataParser };
//# sourceMappingURL=DataParser.d.ts.map