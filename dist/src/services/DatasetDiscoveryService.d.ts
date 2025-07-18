import { DatasetDiscoveryService, Dataset } from '../models';
export declare class DefaultDatasetDiscoveryService implements DatasetDiscoveryService {
    discoverDatasets(rootPath: string): Promise<Dataset[]>;
    validateDatasetCompleteness(dataset: Dataset): boolean;
}
export { DatasetDiscoveryService };
//# sourceMappingURL=DatasetDiscoveryService.d.ts.map