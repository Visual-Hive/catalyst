const { createEmptyManifest, createWorkflow } = require('./src/core/workflow/types.ts');
const { validateManifest } = require('./src/core/workflow/validation.ts');

const manifest = createEmptyManifest();
manifest.workflows['test'] = createWorkflow('test', 'Test Workflow');

console.log('Manifest:', JSON.stringify(manifest, null, 2));

const result = validateManifest(manifest);

console.log('\n\nValidation result:', {
  success: result.success,
  errors: result.errors
});
