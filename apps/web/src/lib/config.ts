import { scaffoldConfig, appConfig } from '@/config/amplify';

export const SCAFFOLD_URL = scaffoldConfig.url;
export const SCAFFOLD_BACKEND_URL = scaffoldConfig.backendUrl;
export { scaffoldConfig as scaffold, appConfig as app };
