/**
 * @file SchemaValidator.test.ts
 * @description Comprehensive tests for Level 1 schema validation
 * 
 * @architecture Phase 0, Task 0.3 - Schema Level 1 Validator
 * @created 2025-11-19
 * @confidence 9/10 - Comprehensive coverage of validation rules
 */

import { SchemaValidator } from '../../../src/core/validation/SchemaValidator';
import { ERROR_CODES } from '../../../src/core/validation/ValidationRules';
import * as fs from 'fs';
import * as path from 'path';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  // Helper to load fixture
  const loadFixture = (filename: string) => {
    const fixturePath = path.join(__dirname, '../../fixtures/manifests', filename);
    return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  };
  
  describe('Valid Level 1 Manifests', () => {
    it('should validate simple button component', () => {
      const manifest = loadFixture('valid/simple-button.json');
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.level).toBe(1);
      expect(result.componentCount).toBe(1);
    });
    
    it('should validate nested component hierarchy', () => {
      const manifest = loadFixture('valid/nested-components.json');
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.componentCount).toBe(7);
    });
    
    it('should validate component with props', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          projectName: 'Test',
          framework: 'react',
          createdAt: '2025-11-19T12:00:00Z',
        },
        components: {
          comp_card_001: {
            id: 'comp_card_001',
            displayName: 'Card',
            type: 'CompositeComponent',
            properties: {
              title: {
                type: 'prop',
                dataType: 'string',
                required: true,
              },
              description: {
                type: 'prop',
                dataType: 'string',
                required: false,
                default: '',
              },
            },
            children: [],
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should allow empty components object', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          projectName: 'Test',
          framework: 'react',
          createdAt: '2025-11-19T12:00:00Z',
        },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.componentCount).toBe(0);
    });
    
    it('should generate warnings for non-PascalCase names', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          projectName: 'Test',
          framework: 'react',
          createdAt: '2025-11-19T12:00:00Z',
        },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'button',  // lowercase - should warn
            type: 'PrimitiveComponent',
            properties: {},
            children: [],
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].code).toBe(ERROR_CODES.INVALID_DISPLAY_NAME);
      expect(result.warnings[0].severity).toBe('WARNING');
    });
  });
  
  describe('Invalid Schema Structure', () => {
    it('should reject missing schemaVersion', () => {
      const manifest = {
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'schemaVersion',
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        })
      );
    });
    
    it('should reject invalid schemaVersion', () => {
      const manifest = {
        schemaVersion: '2.0.0',  // Wrong version
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'schemaVersion',
          code: ERROR_CODES.INVALID_SCHEMA_VERSION,
        })
      );
    });
    
    it('should reject invalid level', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 2,  // Wrong level for this validator
        metadata: { projectName: 'Test', framework: 'react' },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'level',
          code: ERROR_CODES.INVALID_SCHEMA_LEVEL,
        })
      );
    });
    
    it('should reject missing metadata', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'metadata',
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
        })
      );
    });
    
    it('should reject non-object manifest', () => {
      const result = validator.validate(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should reject string manifest', () => {
      const result = validator.validate('not an object');
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('Invalid Metadata', () => {
    it('should reject missing projectName', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          framework: 'react',
        },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'projectName',
          path: 'metadata.projectName',
        })
      );
    });
    
    it('should reject missing framework', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          projectName: 'Test',
        },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'framework',
          path: 'metadata.framework',
        })
      );
    });
    
    it('should reject non-react framework in Level 1', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: {
          projectName: 'Test',
          framework: 'vue',  // Not supported in Level 1
        },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'framework',
          code: ERROR_CODES.UNSUPPORTED_FEATURE,
        })
      );
    });
  });
  
  describe('Invalid Components', () => {
    it('should reject component missing required fields', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            // Missing displayName, type, properties
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should reject invalid component ID format', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          button_001: {  // Missing 'comp_' prefix
            id: 'button_001',
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {},
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_COMPONENT_ID,
        })
      );
    });
    
    it('should reject ID mismatch between key and property', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_002',  // Doesn't match key
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {},
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_COMPONENT_ID,
        })
      );
    });
    
    it('should reject invalid component type', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'Button',
            type: 'InvalidType',
            properties: {},
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_COMPONENT_TYPE,
        })
      );
    });
    
    it('should reject too many children', () => {
      const children = Array.from({ length: 21 }, (_, i) => `comp_child_${i}`);
      
      const components: any = {
        comp_parent_001: {
          id: 'comp_parent_001',
          displayName: 'Parent',
          type: 'CompositeComponent',
          properties: {},
          children,
        },
      };
      
      // Add all children (so references exist)
      children.forEach(childId => {
        components[childId] = {
          id: childId,
          displayName: 'Child',
          type: 'PrimitiveComponent',
          properties: {},
          children: [],
        };
      });
      
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components,
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.TOO_MANY_CHILDREN,
        })
      );
    });
  });
  
  describe('Invalid Properties', () => {
    it('should reject expression properties (Level 2 feature)', () => {
      const manifest = loadFixture('invalid/with-expressions.json');
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.UNSUPPORTED_PROPERTY_TYPE,
          message: expect.stringContaining('expression'),
        })
      );
    });
    
    it('should reject missing static value', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {
              label: {
                type: 'static',
                // Missing value field
              },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PROPERTY_VALUE,
        })
      );
    });
    
    it('should reject prop missing dataType', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_card_001: {
            id: 'comp_card_001',
            displayName: 'Card',
            type: 'CompositeComponent',
            properties: {
              title: {
                type: 'prop',
                // Missing dataType
              },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_PROPERTY_DATATYPE,
        })
      );
    });
    
    it('should reject invalid dataType', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_card_001: {
            id: 'comp_card_001',
            displayName: 'Card',
            type: 'CompositeComponent',
            properties: {
              data: {
                type: 'prop',
                dataType: 'function',  // Invalid
              },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.INVALID_PROPERTY_DATATYPE,
        })
      );
    });
  });
  
  describe('Circular References', () => {
    it('should detect circular references', () => {
      const manifest = loadFixture('invalid/circular-reference.json');
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.CIRCULAR_REFERENCE,
          message: expect.stringContaining('Circular reference'),
        })
      );
    });
    
    it('should detect self-reference', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_a_001: {
            id: 'comp_a_001',
            displayName: 'ComponentA',
            type: 'CompositeComponent',
            properties: {},
            children: ['comp_a_001'],  // References itself
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.CIRCULAR_REFERENCE,
        })
      );
    });
    
    it('should detect missing component reference', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_parent_001: {
            id: 'comp_parent_001',
            displayName: 'Parent',
            type: 'CompositeComponent',
            properties: {},
            children: ['comp_nonexistent_001'],  // Doesn't exist
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.MISSING_COMPONENT_REFERENCE,
        })
      );
    });
  });
  
  describe('Blocked Level 2/3 Features', () => {
    it('should reject localState (Level 2)', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {},
            localState: {
              isClicked: { type: 'boolean', default: false },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.LEVEL_2_FEATURE,
          field: 'localState',
        })
      );
    });
    
    it('should reject eventHandlers (Level 2)', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'Button',
            type: 'PrimitiveComponent',
            properties: {},
            eventHandlers: {
              onClick: { action: 'log', message: 'clicked' },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.LEVEL_2_FEATURE,
          field: 'eventHandlers',
        })
      );
    });
    
    it('should reject globalState at root (Level 2)', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        globalState: {
          user: { type: 'object', default: null },
        },
        components: {},
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.LEVEL_2_FEATURE,
          field: 'globalState',
        })
      );
    });
    
    it('should reject dataConnections (Level 3)', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_list_001: {
            id: 'comp_list_001',
            displayName: 'List',
            type: 'CompositeComponent',
            properties: {},
            dataConnections: {
              users: { type: 'liveQuery', source: 'db.users' },
            },
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: ERROR_CODES.LEVEL_3_FEATURE,
          field: 'dataConnections',
        })
      );
    });
  });
  
  describe('Performance', () => {
    it('should validate 100 components in <100ms', () => {
      // Generate manifest with 100 components
      const components: any = {};
      for (let i = 0; i < 100; i++) {
        components[`comp_item_${i}`] = {
          id: `comp_item_${i}`,
          displayName: `Item${i}`,
          type: 'PrimitiveComponent',
          properties: {
            text: {
              type: 'static',
              value: `Item ${i}`,
              dataType: 'string',
            },
          },
          children: [],
        };
      }
      
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components,
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
      expect(result.componentCount).toBe(100);
      expect(result.validationTime).toBeLessThan(100);
    });
  });
  
  describe('Validation Result', () => {
    it('should include validation time', () => {
      const manifest = loadFixture('valid/simple-button.json');
      
      const result = validator.validate(manifest);
      
      expect(result.validationTime).toBeDefined();
      expect(typeof result.validationTime).toBe('number');
      expect(result.validationTime).toBeGreaterThan(0);
    });
    
    it('should include component count', () => {
      const manifest = loadFixture('valid/nested-components.json');
      
      const result = validator.validate(manifest);
      
      expect(result.componentCount).toBe(7);
    });
    
    it('should separate errors from warnings', () => {
      const manifest = {
        schemaVersion: '1.0.0',
        level: 1,
        metadata: { projectName: 'Test', framework: 'react' },
        components: {
          comp_button_001: {
            id: 'comp_button_001',
            displayName: 'button',  // Warning: not PascalCase
            type: 'InvalidType',    // Error: invalid type
            properties: {},
          },
        },
      };
      
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      expect(result.errors.every(e => e.severity === 'ERROR')).toBe(true);
      expect(result.warnings.every(w => w.severity === 'WARNING')).toBe(true);
    });
  });
});
