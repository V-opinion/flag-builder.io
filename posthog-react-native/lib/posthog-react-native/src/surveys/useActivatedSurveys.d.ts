import { Survey } from '../../../posthog-core/src/surveys-types';
import { PostHog } from '../posthog-rn';
export declare function useActivatedSurveys(posthog: PostHog, surveys: Survey[]): ReadonlySet<string>;
