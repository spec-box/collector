import {Feature} from '@spec-box/sync/dist/lib/domain';

export const featureHasUniqueAssertions = (feature: Feature) => {
    const assertionTitles = new Set<string>();

    for (const group of feature.groups) {
        for (const assertion of group.assertions) {
            if (assertionTitles.has(assertion.title)) {
                return {result: false, assertion: assertion.title};
            }
            assertionTitles.add(assertion.title);
        }
    }

    return {result: true};
};
