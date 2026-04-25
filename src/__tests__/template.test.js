const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../snapshot');
const { loadSnapshot, saveSnapshot } = require('../snapshot');

const MOCK_TEMPLATES_PATH = path.join(os.tmpdir(), 'stacksnap-test-templates.json');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: (...args) => {
    if (args.includes('templates.json')) return require('os').tmpdir() + '/stacksnap-test-templates.json';
    return jest.requireActual('path').join(...args);
  }
}));

const {
  loadTemplates,
  saveTemplates,
  saveAsTemplate,
  applyTemplate,
  deleteTemplate,
  listTemplates
} = require('../template');

beforeEach(() => {
  if (fs.existsSync(MOCK_TEMPLATES_PATH)) fs.unlinkSync(MOCK_TEMPLATES_PATH);
  jest.clearAllMocks();
});

afterEach(() => {
  if (fs.existsSync(MOCK_TEMPLATES_PATH)) fs.unlinkSync(MOCK_TEMPLATES_PATH);
});

test('loadTemplates returns empty object when file missing', () => {
  expect(loadTemplates()).toEqual({});
});

test('saveTemplates and loadTemplates roundtrip', () => {
  const data = { myTemplate: { name: 'myTemplate', configs: {} } };
  saveTemplates(data);
  expect(loadTemplates()).toEqual(data);
});

test('saveAsTemplate stores snapshot configs as template', () => {
  loadSnapshot.mockReturnValue({ configs: { '.nvmrc': '18' } });
  const result = saveAsTemplate('snap1', 'node18', 'node 18 base');
  expect(result.name).toBe('node18');
  expect(result.description).toBe('node 18 base');
  expect(result.configs).toEqual({ '.nvmrc': '18' });
  expect(result.sourceSnapshot).toBe('snap1');
});

test('saveAsTemplate throws if snapshot not found', () => {
  loadSnapshot.mockReturnValue(null);
  expect(() => saveAsTemplate('missing', 'tmpl')).toThrow('not found');
});

test('saveAsTemplate throws if template name already exists', () => {
  loadSnapshot.mockReturnValue({ configs: {} });
  saveAsTemplate('snap1', 'existing');
  loadSnapshot.mockReturnValue({ configs: {} });
  expect(() => saveAsTemplate('snap2', 'existing')).toThrow('already exists');
});

test('applyTemplate creates snapshot from template', () => {
  loadSnapshot.mockReturnValue({ configs: { '.nvmrc': '20' } });
  saveAsTemplate('snap1', 'tmplA');
  applyTemplate('tmplA', 'newSnap');
  expect(saveSnapshot).toHaveBeenCalledWith('newSnap', expect.objectContaining({
    name: 'newSnap',
    fromTemplate: 'tmplA',
    configs: { '.nvmrc': '20' }
  }));
});

test('applyTemplate throws if template not found', () => {
  expect(() => applyTemplate('ghost', 'snap')).toThrow('not found');
});

test('deleteTemplate removes template', () => {
  loadSnapshot.mockReturnValue({ configs: {} });
  saveAsTemplate('snap1', 'toDelete');
  deleteTemplate('toDelete');
  expect(listTemplates()).toHaveLength(0);
});

test('deleteTemplate throws if template missing', () => {
  expect(() => deleteTemplate('nope')).toThrow('not found');
});

test('listTemplates returns array of templates', () => {
  loadSnapshot.mockReturnValue({ configs: {} });
  saveAsTemplate('s1', 't1');
  saveAsTemplate('s2', 't2');
  expect(listTemplates()).toHaveLength(2);
});
