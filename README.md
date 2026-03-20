# TRACE Vocabularies

Build and deployment hub for [TRACE](https://transparency-certified.github.io/) vocabulary documentation. Each vocabulary is maintained in its own repository and included here as a git submodule. This repo provides the shared build infrastructure: a GitHub Action runs [Widoco](https://github.com/dgarijo/Widoco) to generate HTML documentation and serialization files, then deploys everything to GitHub Pages.

- **Published docs:** https://transparency-certified.github.io/trace-vocabularies/
- **Specification:** https://transparency-certified.github.io/trace-specification/docs/specifications.html
- **Build and deploy details:** [Documentation Infrastructure](https://transparency-certified.github.io/trace-specification/docs/documentation-infrastructure.html)

## Vocabularies

| Vocabulary | Repo | Versions |
|------------|------|----------|
| TROV (Transparent Research Object Vocabulary) | [trov](https://github.com/transparency-certified/trov) | [0.1](https://w3id.org/trace/trov/0.1), [pre-release](https://w3id.org/trace/2023/05/trov) |

## Repository Structure

```
trace-vocabularies/
├── trov/          → submodule → transparency-certified/trov
├── w3id/
│   ├── .htaccess     w3id.org redirect rules (source of truth)
│   ├── README.md     w3id.org directory README
│   └── tests/        Mocha test suite for redirect rules
├── index.html        Vocabulary index page (deployed to Pages root)
└── .github/
    └── workflows/
        └── deploy.yml
```

## Updating Vocabulary Documentation

Pushing changes to a vocabulary repo (e.g. trov) does not automatically rebuild the docs site. To pick up new vocabulary content:

### Advance the submodule to the latest commit

```bash
cd trace-vocabularies

# Fetch and check out the latest commit from the vocabulary repo
# (For a specific tag or commit, see "Pin a submodule" below)
git submodule update --remote trov

# Stage, commit, and push the updated pointer
git add trov
git commit -m "Update trov submodule"
git push
```

This triggers the build workflow. The submodule pointer records which vocabulary commit was used for each deploy.

### Pin a submodule to a tagged release

```bash
# The submodule directory is a full git repo pointing at the vocabulary's remote.
# Checking out a tag there selects that version.
cd trace-vocabularies/trov
git checkout trov/0.1

# Back in the parent repo, stage the new pointer and push
cd ..
git add trov
git commit -m "Pin trov to trov/0.1 release"
git push
```

### Check submodule status

```bash
# Show each submodule's recorded commit vs its remote HEAD
git submodule status
```

## Running the w3id.org Redirect Tests

TROV vocabulary URIs (e.g. `https://w3id.org/trace/trov/0.1`) resolve via redirect rules in a `.htaccess` file registered at [w3id.org](https://w3id.org/). This repo holds the source of truth for those rules and a test suite that verifies them.

To run the tests in a clone of the trace-vocabularies repo (requires Node.js):

```bash
cd w3id/tests
npm install

# Test against a local Apache Docker container
npm run docker:start
npm run test:local
npm run docker:stop

# Test against live w3id.org
npm run test:remote
```
