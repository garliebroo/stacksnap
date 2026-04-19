# stacksnap

> CLI tool to snapshot and restore local dev environment configs across machines

## Installation

```bash
npm install -g stacksnap
```

## Usage

Capture your current dev environment config:

```bash
stacksnap save my-setup
```

Restore a saved snapshot on another machine:

```bash
stacksnap restore my-setup
```

List all available snapshots:

```bash
stacksnap list
```

Snapshots can include dotfiles, shell configs, editor settings, and installed tool versions. Store them locally or sync via a remote source.

```bash
# Save with specific targets
stacksnap save my-setup --include dotfiles,vscode,nvm

# Restore selectively
stacksnap restore my-setup --only dotfiles
```

## Configuration

A `stacksnap.config.json` file can be placed in your home directory to define default targets and storage paths.

```json
{
  "storage": "~/.stacksnap",
  "targets": ["dotfiles", "vscode", "nvm"]
}
```

## License

MIT © stacksnap contributors