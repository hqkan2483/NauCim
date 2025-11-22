# JSON Structure - Quick Reference Guide

## Root Structure

```
ROOT (Object)
├── totalPackages: 14
├── totalElements: 123
├── totalAttributes: 342
├── totalLinks: 218
└── rootPackages: [Package, ...]
```

## Package Object

```
Package {
  id: "EAPK_..."
  name: "IEC61968"
  type: "Package"
  description: "..." | null
  elementCount: 14
  elements: [UMLElement, ...]
  children: [Package, ...]
}
```

## UML Element Object

```
UMLElement {
  id: "EAID_..."
  name: "ConfigurationEvent"
  type: "Class" | "Interface" | "DataType" | "Enumeration" | "PrimitiveType"
  description: "..." | null
  visibility: "public" | "private" | "protected" | "package"
  isAbstract: true | false
  attributeCount: 5
  linkCount: 6
  attributes: [Attribute, ...]
  links: [Link, ...]
}
```

## Attribute Object

```
Attribute {
  name: "eventTime"
  type: "Date" | null
  description: "..." | null
  multiplicity: "1" | "0..1" | "0..*" | "1..*"
  visibility: "public" | "private" | "protected" | "package"
}
```

## Link Object

```
Link {
  assoc_id: "EAID_..." | null
  relation_kind: "Generalization" | "Association"
  role: "child" | "unspecified"
  target_class_id: "EAID_..." | null
  target_class_name: "UsagePoint" | null
  target_class_role_name: "ChangedUsagePoint" | null
  src_class_role_name: "ConfigurationEvents" | null
  target_description: "..." | null
  multiplicity: "1" | "0..1" | "0..*" | "1..*"
}
```

## Data Type Values

### Element Type
- `"Class"` - Ordinary UML class
- `"Interface"` - Interface definition
- `"DataType"` - Composite data type
- `"Enumeration"` - Enumerated type
- `"PrimitiveType"` - Built-in type

### Visibility
- `"public"` - Accessible from anywhere
- `"private"` - Only within the same class
- `"protected"` - Within class and subclasses
- `"package"` - Only within the same package

### Multiplicity
- `"1"` - Exactly 1 (required)
- `"0..1"` - 0 or 1 (optional)
- `"0..*"` - 0 or more (optional collection)
- `"1..*"` - 1 or more (required collection)

### Relationship Kind
- `"Generalization"` - Inheritance (extends)
- `"Association"` - Connection (has-a)

## JSON Hierarchy Visualization

```
{
  "totalPackages": 14
  "totalElements": 123
  "totalAttributes": 342
  "totalLinks": 218
  "rootPackages": [
    {
      "id": "EAPK_..."
      "name": "IEC61968"
      "type": "Package"
      "description": "..."
      "elementCount": 123
      "elements": [
        {
          "id": "EAID_..."
          "name": "ConfigurationEvent"
          "type": "Class"
          "description": "..."
          "visibility": "public"
          "isAbstract": false
          "attributeCount": 5
          "linkCount": 6
          "attributes": [
            {
              "name": "eventTime"
              "type": "Date"
              "description": "..."
              "multiplicity": "1"
              "visibility": "public"
            },
            ...
          ]
          "links": [
            {
              "assoc_id": "EAID_..."
              "relation_kind": "Association"
              "role": "unspecified"
              "target_class_id": "EAID_..."
              "target_class_name": "UsagePoint"
              "target_class_role_name": "ChangedUsagePoint"
              "src_class_role_name": "ConfigurationEvents"
              "target_description": "..."
              "multiplicity": "0..1"
            },
            ...
          ]
        },
        ...
      ]
      "children": [
        {
          "id": "EAPK_..."
          "name": "LoadControl"
          "type": "Package"
          "description": "..."
          "elementCount": 0
          "elements": []
          "children": []
        },
        ...
      ]
    }
  ]
}
```

## Statistics from export-61968.xml

| Metric | Value |
|--------|-------|
| Root Packages | 1 |
| Total Packages | 14 |
| Total Elements | 123 |
| Total Attributes | 342 |
| Total Links | 218 |
| Generalization | 73 |
| Association | 145 |

## Python Access Examples

```python
import json

# Load
with open('model.json') as f:
    data = json.load(f)

# Root level
total_packages = data['totalPackages']
packages = data['rootPackages']

# First package
pkg = packages[0]
pkg_name = pkg['name']
pkg_elements = pkg['elements']

# First element
elem = pkg_elements[0]
elem_name = elem['name']
elem_attributes = elem['attributes']
elem_links = elem['links']

# First attribute
attr = elem_attributes[0]
attr_name = attr['name']
attr_type = attr['type']

# First link
link = elem_links[0]
link_target = link['target_class_name']
link_type = link['relation_kind']
```

## Filtering Examples

```python
# Get all associations
associations = [
    link for elem in all_elements
    for link in elem['links']
    if link['relation_kind'] == 'Association'
]

# Get all abstract classes
abstract_classes = [
    elem for elem in all_elements
    if elem['isAbstract']
]

# Get elements with attributes
elem_with_attrs = [
    elem for elem in all_elements
    if elem['attributeCount'] > 0
]

# Get private attributes
private_attrs = [
    attr for elem in all_elements
    for attr in elem['attributes']
    if attr['visibility'] == 'private'
]
```

## Version Information

- **Parser Version**: 3.7
- **XMI Format**: Enterprise Architect UML 2.1
- **Encoding**: UTF-8
- **Generated**: 2025-11-22

## Key Features in v3.7

✅ Package hierarchy with type field
✅ Complete element metadata (visibility, abstract)
✅ Attribute types and multiplicity
✅ Generalization relationships (inheritance)
✅ Association relationships with roles
✅ **Target descriptions for associations** (NEW)
✅ Enterprise Architect documentation
✅ Russian language support
