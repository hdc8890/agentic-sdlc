# Codebase Index Capability

The codebase-index capability provides incremental, retrieval-grade indexing
of an onboarded repository. It is consumed by orchestrators (e.g., the
orchestration engine `oev2`) to fetch high-quality, language-aware context
for tasks during planning and execution.

This document specifies the **interface**: the entity contract lives in
[`contracts/v1/codebase-index.schema.json`](../../contracts/v1/codebase-index.schema.json).
Implementation choices (chunker, embedder, vector store) are intentionally
out of scope here — they belong to the capability provider.

## Layer placement

Per [`layers-overview.md`](./layers-overview.md), this is a
**capabilities-layer** service, sibling to memory and evaluation. It must:

- Be reusable by any orchestrator that conforms to this contract.
- Conform to v1 entity shapes; never redefine them.
- Surface evaluation/audit-relevant data (manifest root hash, embedder
  identity, hash algorithm) so downstream evidence is traceable.

## Tenancy

The unit of retrieval is `(repo_id, ref)`. A single capability instance
MAY host many indexes; consumers MUST scope every request by these two
fields. Cross-`repo_id` retrieval is out of scope for v1.

## Operations

Implementations MAY expose these as HTTP endpoints, gRPC, or in-process
calls. The shapes below are normative regardless of transport. JSON is the
canonical serialization.

### `index`

Create or replace an index for a `(repo_id, ref)` pair.

Request:
```json
{
  "repo_id": "owner/name",
  "ref": { "kind": "branch", "value": "main", "commit_sha": "<sha>" },
  "source": { "kind": "git", "url": "https://...", "auth": "..." }
}
```

Response: `CodebaseIndexManifest` (see schema). The `root_hash` is the
canonical fingerprint of the index at this point in time.

### `refresh`

Update an existing index incrementally. The capability MUST diff the
current state of the source against the stored manifest and re-embed only
chunks whose `hash` changed.

Request:
```json
{ "index_id": "...", "ref": { ... } }
```

Response:
```json
{
  "manifest": { ... },                 // updated CodebaseIndexManifest
  "diff": {
    "files_added":    ["..."],
    "files_removed":  ["..."],
    "files_modified": ["..."],
    "chunks_reembedded": 17
  }
}
```

Refresh MUST be idempotent: calling it twice with no source changes MUST
return the same `root_hash` and an empty diff.

### `query`

Retrieve top-K chunks relevant to a natural-language query.

Request:
```json
{
  "index_id": "...",
  "query":    "how is workspace cleanup wired into the runner?",
  "k":        8,
  "filters":  { "language": ["python"], "path_prefix": ["src/"] },
  "snippets": false
}
```

Response:
```json
{
  "manifest_root_hash": "...",
  "hits": [
    {
      "path":         "src/oev2/runner.py",
      "span":         { "start_byte": 1024, "end_byte": 2048,
                        "start_line": 42,  "end_line": 79 },
      "score":        0.83,
      "chunk_id":     "...",
      "content_hash": "...",
      "snippet":      null
    }
  ]
}
```

`snippet` MUST be `null` when the request set `snippets: false`. Privacy-
sensitive deployments MAY refuse `snippets: true` and always return null;
clients fall back to fetching the source bytes themselves using
`(path, span)`.

### `get`

Return the current manifest for an `index_id`. Cheap; consumers SHOULD use
this to compare `root_hash` before deciding whether to refresh.

### `delete`

Remove an index. After deletion, queries against the `index_id` MUST 404.

## Determinism requirements

- `root_hash` MUST be a deterministic function of the sorted `files` array.
- `file_hash` MUST be a deterministic function of the file's `chunks` (if
  present) or its raw bytes (if not).
- `chunk_id` MUST be stable across refreshes when the chunk content and
  span are unchanged.
- All timestamps MUST be RFC 3339 / ISO 8601 in UTC.

These properties are what let consumers cache, compare, and audit indexes
across runs and across capability providers.

## Compatibility checking

Consumers SHOULD treat two manifests as compatible for retrieval only when
both `embedder.name` and `embedder.dim` match. A capability MUST refuse to
serve `query` requests when no embedder is configured.

## Non-goals (v1)

- Cross-repo / multi-tenant joined queries.
- Re-ranking models (a future capability extension).
- Hybrid search combining BM25 + dense vectors (capability MAY add it
  internally, but the contract stays vector-first).
- Streaming refresh / progress events (clients poll `get` instead).
