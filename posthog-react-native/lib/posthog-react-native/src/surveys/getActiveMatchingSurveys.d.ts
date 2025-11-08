import { Survey } from '../../../posthog-core/src/surveys-types';
export declare function getActiveMatchingSurveys(surveys: Survey[], flags: Record<string, string | boolean>, seenSurveys: string[], activatedSurveys: ReadonlySet<string>): Survey[];
