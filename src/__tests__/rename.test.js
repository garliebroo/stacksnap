const fs = require('fs');
const path = require('path');
const { renameSnapshot, updateTagsAfterRename } = require('../rename');
const snapshot = require('../snapshot');
const tag = require('../tag');

jest.mock('../snapshot');
jest.mock('../tag');

describe('renameSnapshot', () => {
  const snapshotDir = '/tmp/stacksnap';

  beforeEach(() => {
    jest.clearAllMocks();
    snapshot.ensureSnapshotDir.mockResolvedValue(snapshotDir);
    snapshot.loadSnapshot.mockResolvedValue({ name: 'old-snap', configs: {} });
    snapshot.saveSnapshot.mockResolvedValue();
    tag.loadTags.mockResolvedValue({});
    tag.saveTags.mockResolvedValue();
  });

  it('renames a snapshot successfully', async () => {
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)   // oldPath exists
      .mockReturnValueOnce(false); // newPath does not exist
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    const result = await renameSnapshot('old-snap', 'new-snap');

    expect(result).toEqual({ oldName: 'old-snap', newName: 'new-snap' });
    expect(snapshot.saveSnapshot).toHaveBeenCalledWith('new-snap', expect.objectContaining({
      name: 'new-snap',
      renamedFrom: 'old-snap'
    }));
    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(snapshotDir, 'old-snap.json'));
  });

  it('throws if old snapshot does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

    await expect(renameSnapshot('ghost', 'new-snap')).rejects.toThrow('not found');
  });

  it('throws if new snapshot name already exists', async () => {
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    await expect(renameSnapshot('old-snap', 'existing')).rejects.toThrow('already exists');
  });

  it('throws if names are the same', async () => {
    await expect(renameSnapshot('snap', 'snap')).rejects.toThrow('different');
  });

  it('throws if either name is missing', async () => {
    await expect(renameSnapshot('', 'new')).rejects.toThrow('required');
    await expect(renameSnapshot('old', '')).rejects.toThrow('required');
  });

  it('updates tags when renaming', async () => {
    tag.loadTags.mockResolvedValue({ mytag: ['old-snap', 'other-snap'] });

    await updateTagsAfterRename('old-snap', 'new-snap');

    expect(tag.saveTags).toHaveBeenCalledWith({ mytag: ['new-snap', 'other-snap'] });
  });

  it('does not save tags if no tags reference the snapshot', async () => {
    tag.loadTags.mockResolvedValue({ mytag: ['unrelated'] });

    await updateTagsAfterRename('old-snap', 'new-snap');

    expect(tag.saveTags).not.toHaveBeenCalled();
  });
});
