# UI Data Attributes Dictionary (Canonical)

This document is the single source of truth for **canonical** `data-*` attributes used by the NauCim UI.

Core rule: **UI/controllers must not infer context by traversing exported trees**. Every click handler must receive the required context via DOM `data-*` attributes. If something is missing, treat it as a **UI contract bug** and fix the renderer/payload.

## Naming rules

- Use **kebab-case** only: `data-model-id`, not `data-modelId`.
- Use **one canonical name per meaning**. No aliases.
- IDs are always strings.

## Router attributes (used by event delegation)

### `data-action`
The action dispatcher key. Any clickable element that should be handled by delegated listeners must expose `data-action`.

Examples: `select-class`, `select-attribute`, `toggle-tree-item`, `delete-link`.

### `data-type`
Semantic type of a rendered node (mostly for tree nodes).

Canonical values currently used:
- `model`, `profile`, `package`, `class`, `diagram`, `attribute`, `link`, `literal`

## Context IDs (model/profile routing)

These are used to route CRUD to correct backend endpoints and to scope searches.

- `data-project-id` — Project id.
- `data-model-id` — Model context id (when operating inside a model).
- `data-profile-id` — Profile context id (when operating inside a profile).

Rule: UI code should treat `(modelId XOR profileId)` as the context selector.

## Project tree (sidebar) node contract

All sidebar nodes must provide enough context for selection **without** project-tree traversal.

### Package node (`data-type="package"`)
Required:
- `data-package-id` — current package id
- `data-parent-package-id` — parent package id (empty string if root)
- `data-model-id` / `data-profile-id` — owning context
- `data-action="select-package"`

### Class node (`data-type="class"`)
Required:
- `data-class-id`
- `data-package-id` — **parent package id** of the class
- `data-model-id` / `data-profile-id`
- `data-action="select-class"` or `data-action="select-enumeration"`

Optional:
- `data-ref-model-id`, `data-ref-model-item-id` — reference mapping for profile classes
- `data-is-enumeration`, `data-is-abstract` — UI flags

### Diagram node (`data-type="diagram"`)
Required:
- `data-diagram-id`
- `data-package-id` — **parent package id** of the diagram
- `data-model-id` / `data-profile-id`
- `data-action="select-diagram"`

### Attribute node (`data-type="attribute"`)
Required:
- `data-attr-id`
- `data-class-id` — **parent class id** (canonical)
- `data-model-id` / `data-profile-id`
- `data-action="select-attribute"`

### Literal node (`data-type="literal"`)
Required:
- `data-literal-id`
- `data-class-id` — **parent class id** (canonical)
- `data-model-id` / `data-profile-id`
- `data-action="select-literal"`

### Link node (`data-type="link"`)
Required:
- `data-link-id`
- `data-class-id` — **parent class id** (canonical)
- `data-model-id` / `data-profile-id`
- `data-relation-kind` — `Generalization` | `Association`
- `data-target-class-id`
- `data-action="select-link"`

## Details panel / forms contract

### Package form (`#package-form`)
- `data-package-id`
- `data-model-id` / `data-profile-id`
- `data-parent-package-id`

### Class form (`#class-form`)
- `data-class-id`
- `data-model-id` / `data-profile-id`

### Tab system
- `data-section-tab` — tab header id
- `data-tab-content` — tab body id (must match)
- `data-tab` — action buttons bound to a tab

## Tree expansion state

- `data-item-id` — logical item id used by the sidebar expand/collapse button (`data-action="toggle-tree-item"`).

## Generic editor/compare trees (other pages)

Some UI modules use their own tree contract (not the project sidebar):

- `data-item-key` — stable node key (string)
- `data-item-type` — node semantic type
- `data-parent` — used to locate child containers

Compare/profile-editor specific:
- `data-key`, `data-side`, `data-role`
- `data-children-for`

If introducing new attributes here, document them in this section.

## Diagnostics / contract markers

- `data-contract-missing-package-id="1"` — renderer marker for nodes that violate the strict contract (missing required `packageId` in payload). Should not be relied upon by logic, only for visibility/debug.

## Deprecated / forbidden aliases

Do **not** use these (either removed or never valid in the canonical contract):

- `data-link-kind` → use `data-relation-kind`
- `data-parent-class-id` → use `data-class-id`
- `data-parent-id` → use `data-parent-package-id`
- Any camelCase attribute names: `dataModelId`, `data-modelId`, etc.
