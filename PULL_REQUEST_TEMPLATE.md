## Fix Failing E2E Tests

This pull request addresses issues with element visibility and timing in various test scripts documented in the GitHub Actions job ID 60721189985.

### Overview of Changes:
- Improvements to element locating strategies to reduce timeouts.
- Adjustments to timing in the test scripts to ensure better reliability.

### Specific Test Scripts Affected:
1. **e2e/dashboard-flow.spec.ts** - Resolved visibility issues that caused tests to fail intermittently.
2. **e2e/loading-states.spec.ts** - Enhanced loading state checks to prevent false negatives.
3. **e2e/places-autocomplete.spec.ts** - Improved element locators to ensure accuracy in selections.
4. **e2e/report-interactions.spec.ts** - Adjusted timing to synchronize actions correctly with UI updates.

### Expected Outcomes:
These changes should resolve timeouts and locator issues, improving test reliability consistently across retries. 
