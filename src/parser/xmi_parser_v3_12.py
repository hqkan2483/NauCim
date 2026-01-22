#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XMI UML Package Hierarchy Parser v3.12
- Target Description Support (NEW)
- Association Support
- Package type field
- Generalization Links Support
- JSON and Markdown Export
- Enterprise Architect Extension Support
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field


@dataclass
class Attribute:
    """Represents a UML attribute"""
    name: str
    attr_id: Optional[str] = None  # NEW in v3.12: XMI ID
    attribute_type: Optional[str] = None
    data_type_id: Optional[str] = None
    description: Optional[str] = None
    stereotype: Optional[str] = None
    multiplicity: str = "1"
    visibility: str = "public"
    is_derived: bool = False
    default_value: Optional[str] = None
    initial_value: str = ""  # EA Extension: <initial body="..."/>


@dataclass
class Link:
    """Связь класса с другими элементами"""
    link_id: Optional[str] = None
    relation_kind: str = "Association"
    role: str = "unspecified"
    target_class_id: Optional[str] = None
    target_class_name: Optional[str] = None
    target_class_role_name: Optional[str] = None
    src_class_role_name: Optional[str] = None
    target_description: Optional[str] = None              # ✅ ИЗМЕНЕНО: description → target_description
    target_class_role_description: Optional[str] = None
    src_class_role_description: Optional[str] = None
    multiplicity: str = "1"
    stereotype: Optional[str] = None


@dataclass
class EnumLiteral:
    """Represents a UML Enumeration literal (ownedLiteral)"""
    name: str
    literal_id: Optional[str] = None
    description: str = ""
    initial_value: str = ""


@dataclass
class UMLElement:
    """Represents a UML element (Class, Interface, DataType, etc.)"""
    xmi_id: str
    name: str
    element_type: str
    description: Optional[str] = None
    visibility: str = "public"
    is_abstract: bool = False
    stereotype: Optional[str] = None
    attributes: List[Attribute] = field(default_factory=list)
    links: List[Link] = field(default_factory=list)
    literals: List[EnumLiteral] = field(default_factory=list)


@dataclass
class Package:
    """Represents a UML Package"""
    xmi_id: str
    name: str
    type: str = "Package"
    description: Optional[str] = None
    parent_id: Optional[str] = None
    children: List['Package'] = field(default_factory=list)
    elements: List[UMLElement] = field(default_factory=list)


class XMIPackageParser:
    """Parser for UML XMI files with Enterprise Architect Extension support"""

    def __init__(self, xmi_file: str):
        self.xmi_file = xmi_file
        self.packages: Dict[str, Package] = {}
        self.root_packages: List[Package] = []
        self.namespace = {
            'uml': 'http://schema.omg.org/spec/UML/2.1',
            'xmi': 'http://schema.omg.org/spec/XMI/2.1'
        }
        self.processed_ids: Set[str] = set()
        self.elements_by_id: Dict[str, UMLElement] = {}
        self.total_attributes = 0
        self.total_links = 0
        self.element_docs: Dict[str, str] = {}
        self.attribute_docs: Dict[str, str] = {}
        self.attribute_initial_values: Dict[str, str] = {}
        self.connector_docs: Dict[str, str] = {}
        # EA Extension connector role docs/stereotypes are keyed by ownedEnd xmi:id (source/target xmi:idref)
        self.connector_role_docs: Dict[str, Dict[str, str]] = {}  # {link_id: {link_end_id: doc}}
        self.connector_stereotypes: Dict[str, str] = {}  # {link_id: stereotype}
        self.connector_role_stereotypes: Dict[str, Dict[str, str]] = {}  # {link_id: {link_end_id: stereotype}}
        self.element_stereotypes: Dict[str, str] = {}
        self.attribute_stereotypes: Dict[str, str] = {}
        self.generalizations_list: List[dict] = []
        self.associacion_list: List[dict] = []

    def parse(self) -> None:
        """Parse the XMI file and build complete model"""
        try:
            # Ensure Unicode output (icons, arrows, etc.) doesn't crash on Windows codepages
            try:
                import sys

                if hasattr(sys.stdout, "reconfigure"):
                    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
                if hasattr(sys.stderr, "reconfigure"):
                    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass

            tree = ET.parse(self.xmi_file)
            root = tree.getroot()
            self.root = root  # Store root for children extraction in v3.12

            self._detect_namespaces(root)

            (
                self.element_docs,
                self.attribute_docs,
                self.attribute_initial_values,
                self.connector_docs,
                self.connector_role_docs,
                self.connector_stereotypes,
                self.connector_role_stereotypes,
                self.element_stereotypes,
                self.attribute_stereotypes,
            ) = self._parse_extension_documentation(root)
            print(f"Extracted {len(self.element_docs)} element descriptions")
            print(f"Extracted {len(self.attribute_docs)} attribute descriptions")
            print(f"Extracted {len(self.attribute_initial_values)} attribute initial values")
            print(f"Extracted {len(self.connector_docs)} connector descriptions")
            print(f"Extracted {len(self.connector_role_docs)} connector role descriptions")
            print(f"Extracted {len(self.connector_stereotypes)} connector stereotypes")
            print(f"Extracted {len(self.connector_role_stereotypes)} connector role stereotypes")
            print(f"Extracted {len(self.element_stereotypes)} element stereotypes")
            print(f"Extracted {len(self.attribute_stereotypes)} attribute stereotypes")

            self._extract_packages_and_elements(root)
            # Collect all UML Generalizations once (for export and reuse)
            self.generalizations_list = self._collect_generalizations_list(root)
            # Collect all UML Associations once (for export and reuse)
            self.associacion_list = self._collect_associacion_list(root)
            self._extract_attributes(root)
            self._extract_generalizations(root)
            self._extract_associations(root)

            self._apply_stereotypes()

            # Extract children (descendants) from EA Extension - NEW in v3.12
            self._extract_children_from_extension()
            self._build_hierarchy()

            print(f"Successfully parsed {len(self.packages)} packages")
            print(f"Found {len(self.elements_by_id)} elements")
            print(f"Extracted {self.total_attributes} attributes")
            print(f"Extracted {self.total_links} links")

        except FileNotFoundError:
            print(f"Error: File '{self.xmi_file}' not found")
            raise
        except ET.ParseError as e:
            print(f"Error parsing XMI file: {e}")
            raise

    def _detect_namespaces(self, root) -> None:
        """Detect and update namespaces from the XML root"""
        for prefix, uri in root.attrib.items():
            if prefix.startswith('{http://www.w3.org/2000/xmlns/}'):
                ns_prefix = prefix.split('}')[1]
                self.namespace[ns_prefix] = uri

        for elem in root.iter():
            if '}' in elem.tag:
                namespace_uri = elem.tag.split('}')[0][1:]
                if 'UML' in namespace_uri.upper():
                    self.namespace['uml'] = namespace_uri
                elif 'XMI' in namespace_uri.upper():
                    self.namespace['xmi'] = namespace_uri

    def _parse_extension_documentation(
        self, root
    ) -> Tuple[
        Dict[str, str],
        Dict[str, str],
        Dict[str, str],
        Dict[str, str],
        Dict[str, Dict[str, str]],
        Dict[str, str],
        Dict[str, Dict[str, str]],
        Dict[str, str],
        Dict[str, str],
    ]:
        """Parse Enterprise Architect Extension to extract documentation and stereotypes"""
        element_docs = {}
        attribute_docs = {}
        attribute_initial_values = {}
        connector_docs = {}
        connector_role_docs = {}  # {link_id: {link_end_id: doc}}
        connector_stereotypes: Dict[str, str] = {}
        connector_role_stereotypes: Dict[str, Dict[str, str]] = {}
        element_stereotypes = {}
        attribute_stereotypes = {}

        for elem in root:
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            if tag == 'Extension':
                extender = elem.get('extender')
                if extender == 'Enterprise Architect':
                    for child in elem.iter():
                        child_tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag

                        if child_tag == 'element':
                            xmi_idref = child.get(f"{{{self.namespace['xmi']}}}idref") or child.get('xmi:idref')
                            if xmi_idref:
                                for prop in child:
                                    prop_tag = prop.tag.split('}')[-1] if '}' in prop.tag else prop.tag
                                    if prop_tag == 'properties':
                                        doc = prop.get('documentation')
                                        if doc:
                                            element_docs[xmi_idref] = doc
                                        st = prop.get('stereotype')
                                        if st is not None:
                                            element_stereotypes[xmi_idref] = st
                                        break

                        elif child_tag == 'attribute':
                            xmi_idref = child.get(f"{{{self.namespace['xmi']}}}idref") or child.get('xmi:idref')
                            if xmi_idref:
                                for doc_elem in child:
                                    doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                    if doc_tag == 'documentation':
                                        doc_value = doc_elem.get('value')
                                        if doc_value:
                                            attribute_docs[xmi_idref] = doc_value
                                    elif doc_tag == 'initial':
                                        init_value = doc_elem.get('value')

                                        # Enterprise Architect often stores literal/attribute init values as <initial body="..."/>
                                        if init_value is None:
                                            init_value = doc_elem.get('body')

                                        if init_value is None:
                                            init_value = (doc_elem.text or "").strip()

                                        attribute_initial_values[xmi_idref] = init_value or ""
                                    elif doc_tag == 'stereotype':
                                        st = doc_elem.get('stereotype')
                                        if st is not None:
                                            attribute_stereotypes[xmi_idref] = st

                                # If stereotype tag exists but empty (<stereotype/>), keep explicit empty
                                if xmi_idref not in attribute_stereotypes:
                                    for doc_elem in child:
                                        doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                        if doc_tag == 'stereotype':
                                            attribute_stereotypes[xmi_idref] = ""
                                            break

                        elif child_tag == 'connector':
                            xmi_idref = child.get(f"{{{self.namespace['xmi']}}}idref") or child.get('xmi:idref')
                            if xmi_idref:
                                # Извлекаем общую документацию коннектора
                                for doc_elem in child:
                                    doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                    if doc_tag == 'documentation':
                                        doc_value = doc_elem.get('value')
                                        if doc_value:
                                            connector_docs[xmi_idref] = doc_value
                                        break

                                # Стереотип коннектора (connector/properties/@stereotype)
                                connector_stereotype = None
                                for doc_elem in child:
                                    doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                    if doc_tag == 'properties':
                                        connector_stereotype = doc_elem.get('stereotype')
                                        break
                                if connector_stereotype is None:
                                    connector_stereotype = ""
                                connector_stereotypes[xmi_idref] = connector_stereotype

                                # Документация/стереотипы концов (source/target)
                                role_docs: Dict[str, str] = {}
                                role_stereotypes: Dict[str, str] = {}
                                for role_elem in child:
                                    role_tag = role_elem.tag.split('}')[-1] if '}' in role_elem.tag else role_elem.tag

                                    if role_tag in ['source', 'target']:
                                        role_idref = role_elem.get(f"{{{self.namespace['xmi']}}}idref") or role_elem.get('xmi:idref')
                                        if role_idref:
                                            # Ищем documentation внутри source/target
                                            for doc_elem in role_elem:
                                                doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                                if doc_tag == 'documentation':
                                                    doc_value = doc_elem.get('value')
                                                    if doc_value:
                                                        role_docs[role_idref] = doc_value
                                                    break

                                            # Ищем stereotype внутри source/target/role
                                            role_st = None
                                            for doc_elem in role_elem:
                                                doc_tag = doc_elem.tag.split('}')[-1] if '}' in doc_elem.tag else doc_elem.tag
                                                if doc_tag == 'role':
                                                    role_st = doc_elem.get('stereotype')
                                                    break
                                            if role_st is None:
                                                role_st = ""
                                            role_stereotypes[role_idref] = role_st

                                if role_docs:
                                    connector_role_docs[xmi_idref] = role_docs

                                if role_stereotypes:
                                    connector_role_stereotypes[xmi_idref] = role_stereotypes

                break

        return (
            element_docs,
            attribute_docs,
            attribute_initial_values,
            connector_docs,
            connector_role_docs,
            connector_stereotypes,
            connector_role_stereotypes,
            element_stereotypes,
            attribute_stereotypes,
        )

    def _extract_association_end_multiplicity(self, owned_end) -> str:
        """Extract multiplicity for an association ownedEnd using lowerValue/upperValue."""
        lower = None
        upper = None

        for mult_elem in owned_end:
            mult_tag = mult_elem.tag.split('}')[-1] if '}' in mult_elem.tag else mult_elem.tag
            if mult_tag == 'lowerValue':
                lower = mult_elem.get('value', '0')
            elif mult_tag == 'upperValue':
                upper_val = mult_elem.get('value', '1')
                upper = '*' if upper_val == '-1' else upper_val

        return self._format_multiplicity(lower, upper)

    def _collect_associacion_list(self, root) -> List[dict]:
        """Collect a flat list of all UML Associations in the model.

        Exported only for rootPackages (not for nested children packages).

        Each entry has the structure:
        {
          "link_id": str|None,
          "link_type": "Association",
          "documentation": str,
          "stereotype": str,
          "linkEnd": [
            {
              "link_end_id": str|None,
              "link_end_name": str,
              "link_end_class_id": str|None,
              "link_end_class_name": str|None,
              "multiplicity": str,
              "documentation": str,
              "stereotype": str
            },
            ...
          ]
        }
        """
        class_name_by_id = {elem.xmi_id: elem.name for elem in self.elements_by_id.values()}
        associations: List[dict] = []

        for elem in root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            if tag != 'packagedElement':
                continue

            xmi_type = elem.get(f"{{{self.namespace['xmi']}}}type") or elem.get('type')
            if xmi_type != 'uml:Association':
                continue

            link_id = elem.get(f"{{{self.namespace['xmi']}}}id") or elem.get('id')

            assoc_documentation = self.connector_docs.get(link_id, "") if link_id else ""
            assoc_stereotype = self.connector_stereotypes.get(link_id, "") if link_id else ""

            link_ends: List[dict] = []
            for child in elem:
                child_tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                if child_tag != 'ownedEnd':
                    continue

                end_id = child.get(f"{{{self.namespace['xmi']}}}id") or child.get('id')
                end_name = child.get('name', '')

                end_class_id = None
                for type_elem in child:
                    type_tag = type_elem.tag.split('}')[-1] if '}' in type_elem.tag else type_elem.tag
                    if type_tag == 'type':
                        end_class_id = type_elem.get(f"{{{self.namespace['xmi']}}}idref") or type_elem.get('idref')
                        break

                end_class_name = class_name_by_id.get(end_class_id) if end_class_id else None
                multiplicity = self._extract_association_end_multiplicity(child)

                end_doc = ""
                end_st = ""
                if link_id and end_class_id:
                    role_docs = self.connector_role_docs.get(link_id, {}) or {}
                    role_sts = self.connector_role_stereotypes.get(link_id, {}) or {}

                    # По ТЗ: ищем внутри EA Extension connector/source|target по xmi:idref == link_end_class_id
                    end_doc = role_docs.get(end_class_id, "")
                    end_st = role_sts.get(end_class_id, "")

                link_ends.append(
                    {
                        'link_end_id': end_id,
                        'link_end_name': end_name,
                        'link_end_class_id': end_class_id,
                        'link_end_class_name': end_class_name,
                        'multiplicity': multiplicity,
                        'documentation': end_doc,
                        'stereotype': end_st,
                    }
                )

            # According to expected export structure, association ends must be exactly two
            if len(link_ends) != 2:
                continue

            associations.append(
                {
                    'link_id': link_id,
                    'link_type': 'Association',
                    'documentation': assoc_documentation,
                    'stereotype': assoc_stereotype,
                    'linkEnd': link_ends,
                }
            )

        return associations

    def _apply_stereotypes(self) -> None:
        """Apply extracted stereotypes from EA Extension to parsed elements/attributes."""
        for elem_id, elem in self.elements_by_id.items():
            if elem_id in self.element_stereotypes:
                elem.stereotype = self.element_stereotypes[elem_id]
            elif elem.stereotype is None:
                elem.stereotype = ""

            for attr in elem.attributes:
                if attr.attr_id and attr.attr_id in self.attribute_stereotypes:
                    attr.stereotype = self.attribute_stereotypes[attr.attr_id]
                elif attr.stereotype is None:
                    attr.stereotype = ""

    def _get_element_type(self, xmi_type: str) -> str:
        """Extract element type from xmi:type attribute"""
        if ':' in xmi_type:
            return xmi_type.split(':')[1]
        return xmi_type

    def _get_documentation(self, element) -> Optional[str]:
        """Extract documentation/description from element (fallback)"""
        for child in element:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag == 'ownedComment':
                body = child.get('body')
                if body:
                    return body
                for subchild in child:
                    if subchild.tag.endswith('body') or subchild.text:
                        return subchild.text
        return None

    def _extract_packages_and_elements(self, element, parent_id: Optional[str] = None) -> None:
        """Recursively extract packages and their elements"""
        for elem in element:
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

            if tag == 'packagedElement':
                xmi_type = elem.get(f"{{{self.namespace['xmi']}}}type") or elem.get('type')

                if not xmi_type:
                    continue

                element_type = self._get_element_type(xmi_type)
                xmi_id = elem.get(f"{{{self.namespace['xmi']}}}id") or elem.get('id')
                name = elem.get('name', f'Unnamed_{len(self.packages)}')

                if not xmi_id:
                    continue

                if element_type == 'Package':
                    if xmi_id not in self.processed_ids:
                        description = self.element_docs.get(xmi_id) or self._get_documentation(elem)

                        package = Package(xmi_id=xmi_id, name=name, type="Package", description=description, parent_id=parent_id)
                        self.packages[xmi_id] = package
                        self.processed_ids.add(xmi_id)
                        self._extract_packages_and_elements(elem, parent_id=xmi_id)

                elif element_type in ['Class', 'Interface', 'DataType', 'Enumeration', 'PrimitiveType']:
                    if parent_id and parent_id in self.packages:
                        visibility = elem.get('visibility', 'public')
                        is_abstract = elem.get('isAbstract', 'false').lower() == 'true'

                        description = self.element_docs.get(xmi_id) or self._get_documentation(elem)

                        uml_element = UMLElement(
                            xmi_id=xmi_id,
                            name=name,
                            element_type=element_type,
                            description=description,
                            visibility=visibility,
                            is_abstract=is_abstract
                        )

                        # Enumeration literals: <ownedLiteral ...>
                        if element_type == 'Enumeration':
                            for lit_elem in elem:
                                lit_tag = lit_elem.tag.split('}')[-1] if '}' in lit_elem.tag else lit_elem.tag
                                if lit_tag != 'ownedLiteral':
                                    continue

                                literal_id = lit_elem.get(f"{{{self.namespace['xmi']}}}id") or lit_elem.get('id')
                                literal_name = lit_elem.get('name', '')

                                description = (self.attribute_docs.get(literal_id) or "") if literal_id else ""
                                initial_value = (self.attribute_initial_values.get(literal_id) or "") if literal_id else ""

                                uml_element.literals.append(
                                    EnumLiteral(
                                        name=literal_name,
                                        literal_id=literal_id,
                                        description=description,
                                        initial_value=initial_value,
                                    )
                                )

                        self.packages[parent_id].elements.append(uml_element)
                        self.elements_by_id[xmi_id] = uml_element

            elif tag == 'Package':
                xmi_id = elem.get(f"{{{self.namespace['xmi']}}}id") or elem.get('id')
                name = elem.get('name', f'Package_{len(self.packages)}')

                if xmi_id and xmi_id not in self.processed_ids:
                    description = self.element_docs.get(xmi_id) or self._get_documentation(elem)
                    package = Package(xmi_id=xmi_id, name=name, type="Package", description=description, parent_id=parent_id)
                    self.packages[xmi_id] = package
                    self.processed_ids.add(xmi_id)
                    self._extract_packages_and_elements(elem, parent_id=xmi_id)

            else:
                self._extract_packages_and_elements(elem, parent_id)

    def _extract_attributes(self, root) -> None:
        """Extract attributes for all elements"""
        type_lookup = {}
        for elem in root.iter():
            xmi_id = elem.get(f"{{{self.namespace['xmi']}}}id")
            if xmi_id:
                name = elem.get('name')
                if name:
                    type_lookup[xmi_id] = name

        for elem in root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

            if tag == 'packagedElement':
                xmi_type = elem.get(f"{{{self.namespace['xmi']}}}type") or elem.get('type')
                owner_id = elem.get(f"{{{self.namespace['xmi']}}}id") or elem.get('id')

                if xmi_type in ['uml:Class', 'uml:Interface'] and owner_id and owner_id in self.elements_by_id:
                    for child in elem:
                        child_tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag

                        if child_tag == 'ownedAttribute':
                            association_attr = child.get('association')
                            if association_attr:
                                continue

                            attr_name = child.get('name', 'unnamed')
                            attr_id = child.get(f"{{{self.namespace['xmi']}}}id") or child.get('id')
                            visibility = child.get('visibility', 'public')
                            is_derived = child.get('isDerived', 'false').lower() == 'true'
                            default_value = child.get('default')

                            attr_type = None
                            data_type_id = None
                            for type_elem in child:
                                type_tag = type_elem.tag.split('}')[-1] if '}' in type_elem.tag else type_elem.tag
                                if type_tag == 'type':
                                    type_ref = type_elem.get(f"{{{self.namespace['xmi']}}}idref")
                                    data_type_id = type_ref
                                    if type_ref and type_ref in type_lookup:
                                        attr_type = type_lookup[type_ref]
                                    break

                            multiplicity = self._extract_multiplicity(child)
                            description = self.attribute_docs.get(attr_id) or self._get_documentation(child)
                            initial_value = (self.attribute_initial_values.get(attr_id) or "") if attr_id else ""

                            attribute = Attribute(
                                name=attr_name,
                            attr_id=attr_id,  # NEW in v3.12
                                attribute_type=attr_type,
                                data_type_id=data_type_id,
                                description=description,
                                multiplicity=multiplicity,
                                visibility=visibility,
                                is_derived=is_derived,
                                default_value=default_value,
                                initial_value=initial_value,
                            )

                            self.elements_by_id[owner_id].attributes.append(attribute)
                            self.total_attributes += 1

    def _extract_generalizations(self, root) -> None:
        """Extract Generalization relationships from <generalization> tags"""
        # Reuse pre-collected list to avoid re-walking the XML
        for gen in self.generalizations_list:
            child = gen.get('child') or {}
            parent = gen.get('parent') or {}

            child_id = child.get('class_id')
            parent_id = parent.get('class_id')
            link_id = gen.get('link_id')

            if not child_id or child_id not in self.elements_by_id:
                continue
            if not parent_id:
                continue

            uml_elem = self.elements_by_id[child_id]
            parent_name = parent.get('class_name') or f'Unknown_{parent_id}'
            target_description = self.connector_docs.get(link_id) if link_id else None

            link = Link(
                link_id=link_id,
                relation_kind="Generalization",
                role="child",
                target_class_id=parent_id,
                target_class_name=parent_name,
                target_description=target_description,
            )

            uml_elem.links.append(link)
            self.total_links += 1

    def _collect_generalizations_list(self, root) -> List[dict]:
        """Collect a flat list of all UML Generalization relations in the model.

                Each entry has the structure:
        {
          "link_id": str|None,
                    "link_type": "Generalization",
                    "documentation": str,
                    "stereotype": str,
                    "parent": {"class_id": str|None, "class_name": str|None},
                    "child":  {"class_id": str|None, "class_name": str|None}
        }
        """
        class_name_by_id = {elem.xmi_id: elem.name for elem in self.elements_by_id.values()}
        generalizations: List[dict] = []

        for elem in root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            if tag != 'packagedElement':
                continue

            xmi_type = elem.get(f"{{{self.namespace['xmi']}}}type") or elem.get('type')
            if xmi_type != 'uml:Class':
                continue

            child_id = elem.get(f"{{{self.namespace['xmi']}}}id") or elem.get('id')
            child_name = elem.get('name')

            if not child_id:
                continue

            for child in elem:
                child_tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                if child_tag != 'generalization':
                    continue

                link_id = child.get(f"{{{self.namespace['xmi']}}}id") or child.get('id')
                parent_id = child.get('general')
                parent_name = class_name_by_id.get(parent_id) if parent_id else None

                documentation = self.connector_docs.get(link_id, "") if link_id else ""
                stereotype = self.connector_stereotypes.get(link_id, "") if link_id else ""

                generalizations.append(
                    {
                        'link_id': link_id,
                        'link_type': 'Generalization',
                        'documentation': documentation,
                        'stereotype': stereotype,
                        'parent': {
                            'class_id': parent_id,
                            'class_name': parent_name,
                        },
                        'child': {
                            'class_id': child_id,
                            'class_name': child_name,
                        },
                    }
                )

        return generalizations

    def _extract_associations(self, root) -> None:
        """Extract Association relationships from <packagedElement xmi:type="uml:Association">"""
        # Теперь для каждого класса находим его ассоциации (используем предсобранный self.associacion_list)
        class_name_by_id = {elem.xmi_id: elem.name for elem in self.elements_by_id.values()}

        # Convert list entries to a simpler internal structure for per-class link filling
        associations: List[dict] = []
        for assoc in self.associacion_list:
            link_id = assoc.get('link_id')
            ends = assoc.get('linkEnd') or []
            if len(ends) != 2:
                continue
            associations.append({'link_id': link_id, 'ends': ends})

        for elem in self.elements_by_id.values():
            class_id = elem.xmi_id

            # Ищем ассоциации, где этот класс участвует
            for assoc in associations:
                # Проверяем оба конца ассоциации
                for i, end in enumerate(assoc['ends']):
                    if end.get('link_end_class_id') == class_id:
                        # Этот класс является целью одного из концов
                        # Берём информацию о другом конце (противоположном)
                        other_end = assoc['ends'][1 - i]  # Другой конец (0->1 или 1->0)

                        target_class_id = other_end.get('link_end_class_id')
                        target_class_name = class_name_by_id.get(target_class_id, f'Unknown_{target_class_id}')

                        # Описание для целевого конца (EA Extension source/target/documentation)
                        target_description = other_end.get('documentation')

                        link = Link(
                            link_id=assoc['link_id'],
                            relation_kind="Association",
                            role="unspecified",
                            target_class_id=target_class_id,
                            target_class_name=target_class_name,
                            target_class_role_name=other_end.get('link_end_name'),
                            src_class_role_name=end.get('link_end_name'),
                            target_description=target_description,  # ✅ ИЗМЕНЕНО
                            multiplicity=other_end.get('multiplicity') or "1",
                            stereotype=None
                        )

                        elem.links.append(link)
                        self.total_links += 1

    def _format_multiplicity(self, lower: Optional[str], upper: Optional[str]) -> str:
        """Format multiplicity from lower and upper values"""
        if lower is None and upper is None:
            return "1"

        if lower is None:
            lower = "0"
        if upper is None:
            upper = "1"

        if upper == '*':
            if lower == '0':
                return "0..*"
            elif lower == '1':
                return "1..*"
            else:
                return f"{lower}..*"
        elif lower == upper:
            return lower
        else:
            return f"{lower}..{upper}"

    def _extract_multiplicity(self, elem) -> str:
        """Extract multiplicity from element"""
        lower = None
        upper = None

        for child in elem:
            tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if tag == 'lowerValue':
                lower = child.get('value', '0')
            elif tag == 'upperValue':
                upper = child.get('value', '1')

        if lower is not None and upper is not None:
            if upper == '*':
                return f"{lower}..*"
            elif lower == upper:
                return lower
            else:
                return f"{lower}..{upper}"

        return "1"

    def _build_hierarchy(self) -> None:
        """Build parent-child relationships between packages"""
        for pkg_id, package in self.packages.items():
            if package.parent_id and package.parent_id in self.packages:
                parent = self.packages[package.parent_id]
                if package not in parent.children:
                    parent.children.append(package)
            elif package.parent_id is None:
                if package not in self.root_packages:
                    self.root_packages.append(package)

    def _get_element_icon(self, element_type: str) -> str:
        """Get icon for element type"""
        icons = {
            'Class': '🔷',
            'Interface': '🔶',
            'DataType': '📊',
            'PrimitiveType': '📊',
            'Enumeration': '🔢',
            'Package': '📦'
        }
        return icons.get(element_type, '📄')

    def print_hierarchy_detailed(self, package: Optional[Package] = None, indent: int = 0) -> None:
        """Print detailed package hierarchy with full class information"""
        if package is None:
            print("\n" + "="*80)
            print("UML Package Hierarchy with Detailed Class Information v3.9")
            print("="*80)
            for root in self.root_packages:
                self.print_hierarchy_detailed(root, 0)
            print("="*80)
        else:
            prefix = "  " * indent
            element_count = len(package.elements)
            print(f"\n{prefix}📦 {package.name} (type: {package.type}, {element_count} elements)")

            if package.description:
                desc_lines = package.description.strip().split('\n')
                for line in desc_lines[:2]:
                    if line.strip():
                        print(f"{prefix}   📝 {line.strip()}")

            for elem in package.elements:
                self._print_element_details(elem, indent + 1)

            for child in package.children:
                self.print_hierarchy_detailed(child, indent + 1)

    def _print_element_details(self, elem: UMLElement, indent: int) -> None:
        """Print detailed information about a single element"""
        prefix = "  " * indent
        icon = self._get_element_icon(elem.element_type)
        abstract_marker = " [abstract]" if elem.is_abstract else ""

        stereotype_str = f" <<{elem.stereotype}>>" if elem.stereotype else ""

        print(f"\n{prefix}{icon} {elem.name} ({elem.element_type}){abstract_marker}{stereotype_str}")

        if elem.description:
            desc_lines = elem.description.strip().split('\n')
            for line in desc_lines[:3]:
                if line.strip():
                    print(f"{prefix}   📝 {line.strip()}")
            if len(desc_lines) > 3:
                print(f"{prefix}   📝 ...")

        if elem.attributes:
            print(f"{prefix}   Атрибуты ({len(elem.attributes)}):")
            for attr in elem.attributes:
                mult_str = f" [{attr.multiplicity}]" if attr.multiplicity != "1" else ""
                type_str = f": {attr.attribute_type}" if attr.attribute_type else ""
                attr_stereotype_str = f" <<{attr.stereotype}>>" if attr.stereotype else ""
                print(f"{prefix}      • {attr.name}{type_str}{mult_str}{attr_stereotype_str}")
                if attr.description:
                    desc_preview = attr.description[:80] + "..." if len(attr.description) > 80 else attr.description
                    print(f"{prefix}        → {desc_preview}")

        if elem.links:
            print(f"{prefix}   Связи ({len(elem.links)}):")
            for link in elem.links:
                print(f"{prefix}      - Связь:")
                print(f"{prefix}          тип связи: {link.relation_kind}")
                print(f"{prefix}          вид связи: {link.role}")
                print(f"{prefix}          Имя класса: {link.target_class_name}")
                if link.target_class_role_name:
                    print(f"{prefix}          роль целевого класса: {link.target_class_role_name}")
                if link.src_class_role_name:
                    print(f"{prefix}          роль класса-источника: {link.src_class_role_name}")
                if link.multiplicity != '1':
                    print(f"{prefix}          множественность: {link.multiplicity}")
                if link.target_description:
                    print(f"{prefix}          описание целевого: {link.target_description[:60]}...")

        if elem.element_type == 'Enumeration' and elem.literals:
            print(f"{prefix}   Значения перечисления ({len(elem.literals)}):")
            for lit in elem.literals:
                lit_id = lit.literal_id or ""
                print(f"{prefix}      • {lit.name} ({lit_id})")
                if lit.description:
                    desc_preview = lit.description[:80] + "..." if len(lit.description) > 80 else lit.description
                    print(f"{prefix}        → {desc_preview}")
                if lit.initial_value:
                    init_preview = lit.initial_value[:80] + "..." if len(lit.initial_value) > 80 else lit.initial_value
                    print(f"{prefix}        = {init_preview}")

    def _extract_children_from_extension(self):
        """Extract children (descendants) relationships from EA Extension."""
        try:
            # ИСПРАВЛЕНО: Extension находится с namespace
            extension = self.root.find('.//{http://schema.omg.org/spec/XMI/2.1}Extension')
            if extension is None:
                # Попробуем без namespace
                extension = self.root.find('.//Extension')

            if extension is None:
                print("   ⚠️  Extension section not found")
                return

            children_found = 0

            # Элементы в Extension НЕ имеют namespace prefix
            for element in extension.findall('.//element'):
                parent_id = element.get(f'{{{self.namespace.get("xmi", "")}}}idref')
                if not parent_id:
                    parent_id = element.get('idref')
                if not parent_id or parent_id not in self.elements_by_id:
                    continue

                parent_elem = self.elements_by_id[parent_id]
                links_section = element.find('.//links')
                if links_section is None:
                    continue

                for gen in links_section.findall('.//Generalization'):
                    end_id = gen.get('end')
                    if end_id == parent_id:
                        child_id = gen.get('start')
                        gen_id = gen.get(f'{{{self.namespace.get("xmi", "")}}}id') or gen.get('id')

                        if not child_id or child_id not in self.elements_by_id:
                            continue

                        child_elem = self.elements_by_id[child_id]
                        child_link = Link(
                            link_id=gen_id,
                            relation_kind="Generalization",
                            role="parent",
                            target_class_id=child_id,
                            target_class_name=child_elem.name,
                            target_class_role_name=None,
                            src_class_role_name=None,
                            target_description=None,
                            multiplicity="1"
                        )
                        parent_elem.links.append(child_link)
                        children_found += 1

            print(f"   ✓ Children relationships extracted: {children_found}")
        except Exception as e:
            print(f"   ⚠️  Error extracting children: {e}")
            import traceback
            traceback.print_exc()


    def export_to_json_detailed(self, output_file: Optional[str] = None) -> str:
        """Export detailed model to JSON"""
        import json

        def link_to_dict(link: Link) -> dict:
            return {
                'linkId': link.link_id,
                'relationKind': link.relation_kind,
                'role': link.role,
                'targetClassId': link.target_class_id,
                'targetClassName': link.target_class_name,
                'targetClassRoleName': link.target_class_role_name,
                'srcClassRoleName': link.src_class_role_name,
                'targetDescription': link.target_description,
                'multiplicity': link.multiplicity,
            }

        def literal_to_dict(lit: EnumLiteral) -> dict:
            return {
                'name': lit.name,
                'id': lit.literal_id,
                'documentation': lit.description,
                'initialValue': lit.initial_value,
            }

        def attribute_to_dict(attr: Attribute) -> dict:
            return {
                'name': attr.name,
                'id': attr.attr_id,  # NEW in v3.9
                'dataTypeId': attr.data_type_id,
                'stereotype': attr.stereotype or "",  # NEW v3.12
                'documentation': attr.description,
                'documentationRu': "",
                'details': "",
                'multiplicity': attr.multiplicity,
                'initialValue': attr.initial_value,
            }

        def generalization_list_entry_to_dict(gen: dict) -> dict:
            parent = gen.get('parent') or {}
            child = gen.get('child') or {}
            return {
                'linkId': gen.get('link_id'),
                'linkType': gen.get('link_type') or 'Generalization',
                'documentation': gen.get('documentation') or "",
                'documentationRu': "",
                'details': "",
                'stereotype': gen.get('stereotype') or "",
                'parent': {
                    'classId': parent.get('class_id'),
                },
                'child': {
                    'classId': child.get('class_id'),
                },
            }

        def association_link_end_to_dict(end: dict) -> dict:
            return {
                'linkEndId': end.get('link_end_id'),
                'linkEndName': end.get('link_end_name') or "",
                'linkEndClassId': end.get('link_end_class_id'),
                'multiplicity': end.get('multiplicity') or "1",
                'documentation': end.get('documentation') or "",
                'documentationRu': "",
                'details': "",
                'stereotype': end.get('stereotype') or "",
            }

        def association_list_entry_to_dict(assoc: dict) -> dict:
            ends = assoc.get('linkEnd') or []
            return {
                'linkId': assoc.get('link_id'),
                'linkType': assoc.get('link_type') or 'Association',
                'documentation': assoc.get('documentation') or "",
                'documentationRu': "",
                'details': "",
                'stereotype': assoc.get('stereotype') or "",
                'linkEnd': [association_link_end_to_dict(e) for e in ends],
            }

        def element_to_dict(elem: UMLElement) -> dict:
            return {
                'id': elem.xmi_id,
                'name': elem.name,
                'type': elem.element_type,
                'stereotype': elem.stereotype or "",  # NEW v3.12
                'documentation': elem.description,
                'documentationRu': "",
                'details': "",
                'isAbstract': elem.is_abstract,
                'attributes': [attribute_to_dict(attr) for attr in elem.attributes],
                'literals': [literal_to_dict(lit) for lit in elem.literals],
            }

        def package_to_dict(
            package: Package,
            include_generalizations_list: bool = False,
            include_associacion_list: bool = False,
        ) -> dict:
            data = {
                'id': package.xmi_id,
                'name': package.name,
                'type': package.type,
                'documentation': package.description,
                'documentationRu': "",
                'details': "",
                'elementCount': len(package.elements),
                'classes': [element_to_dict(elem) for elem in package.elements],
                'subPackages': [
                    package_to_dict(child, include_generalizations_list=False, include_associacion_list=False)
                    for child in package.children
                ]
            }

            if include_generalizations_list:
                data['generalizationsList'] = [
                    generalization_list_entry_to_dict(gen) for gen in self.generalizations_list
                ]

            if include_associacion_list:
                # Note: schemas use camelCase; list is still stored internally as self.associacion_list
                data['associationList'] = [
                    association_list_entry_to_dict(assoc) for assoc in self.associacion_list
                ]

            return data

        result = {
            'totalPackages': len(self.packages),
            'totalElements': len(self.elements_by_id),
            'totalAttributes': self.total_attributes,
            'totalLinks': self.total_links,
            'packages': [
                package_to_dict(root, include_generalizations_list=True, include_associacion_list=True)
                for root in self.root_packages
            ]
        }

        json_str = json.dumps(result, indent=2, ensure_ascii=False)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(json_str)
            print(f"JSON exported to: {output_file}")

        return json_str

    def export_to_markdown_detailed(self, output_file: Optional[str] = None) -> str:
        """Export detailed model to Markdown"""
        lines = ['# UML Model Documentation\n']

        def add_package(package: Package, level: int = 0) -> None:
            heading = '#' * min(level + 2, 6)
            lines.append(f'{heading} 📦 {package.name} (type: {package.type})\n')

            if package.description:
                lines.append(f'**Описание:** {package.description}\n')
            lines.append('')

            if package.elements:
                for elem in package.elements:
                    icon = self._get_element_icon(elem.element_type)
                    abstract_marker = ' *(abstract)*' if elem.is_abstract else ''
                    lines.append(f'### {icon} {elem.name} ({elem.element_type}){abstract_marker}\n')

                    if elem.description:
                        lines.append(f'**Описание:** {elem.description}\n')
                    lines.append('')

                    if elem.attributes:
                        lines.append(f'**Атрибуты:** ({len(elem.attributes)})\n')
                        for attr in elem.attributes:
                            type_str = f': `{attr.attribute_type}`' if attr.attribute_type else ''
                            mult_str = f' `[{attr.multiplicity}]`' if attr.multiplicity != '1' else ''
                            lines.append(f'- **{attr.name}**{type_str}{mult_str}')
                            if attr.description:
                                lines.append(f'  - *{attr.description}*')
                        lines.append('')

                    if elem.links:
                        lines.append(f'**Связи:** ({len(elem.links)})\n')
                        for link in elem.links:
                            lines.append(f'- **{link.relation_kind}**: {link.target_class_name}')
                            lines.append(f'  - Вид связи: {link.role}')
                            if link.target_class_role_name:
                                lines.append(f'  - Роль целевого класса: {link.target_class_role_name}')
                            if link.src_class_role_name:
                                lines.append(f'  - Роль класса-источника: {link.src_class_role_name}')
                            if link.multiplicity != '1':
                                lines.append(f'  - Множественность: {link.multiplicity}')
                            if link.target_description:
                                lines.append(f'  - Описание целевого: {link.target_description}')
                        lines.append('')

                    lines.append('---\n')

            for child in package.children:
                add_package(child, level + 1)

        for root in self.root_packages:
            add_package(root)

        result = '\n'.join(lines)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            print(f"Markdown exported to: {output_file}")

        return result

    def print_statistics(self) -> None:
        """Print comprehensive statistics"""
        # Подсчёт Generalization и Association отдельно
        gen_count = 0
        assoc_count = 0
        for elem in self.elements_by_id.values():
            for link in elem.links:
                if link.relation_kind == 'Generalization':
                    gen_count += 1
                elif link.relation_kind == 'Association':
                    assoc_count += 1

        print("\n" + "="*80)
        print("Model Statistics v3.9")
        print("="*80)
        print(f"Total packages: {len(self.packages)}")
        print(f"Total elements: {len(self.elements_by_id)}")
        print(f"Total attributes: {self.total_attributes}")
        print(f"Total links: {self.total_links}")
        print(f"  - Generalization: {gen_count}")
        print(f"  - Association: {assoc_count}")
        print(f"Element descriptions: {len(self.element_docs)}")
        print(f"Attribute descriptions: {len(self.attribute_docs)}")
        print(f"Connector role descriptions: {len(self.connector_role_docs)}")
        print("="*80)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("XMI UML Parser v3.9 with Target Description Support")
        print("="*80)
        print("Usage: python xmi_parser.py <xmi_file> [output_format] [output_file]")
        print("\nSupported output formats:")
        print("  detailed   - Detailed text output (default)")
        print("  json       - JSON with complete data")
        print("  markdown   - Markdown documentation")
        sys.exit(1)

    xmi_file = sys.argv[1]
    output_format = sys.argv[2] if len(sys.argv) > 2 else "detailed"
    output_file = sys.argv[3] if len(sys.argv) > 3 else None

    parser = XMIPackageParser(xmi_file)
    parser.parse()
    parser.print_statistics()

    if output_format == "detailed":
        parser.print_hierarchy_detailed()
    elif output_format == "json":
        if not output_file:
            output_file = "model_detailed.json"
        parser.export_to_json_detailed(output_file)
    elif output_format == "markdown":
        if not output_file:
            output_file = "model_documentation.md"
        parser.export_to_markdown_detailed(output_file)
    else:
        print(f"Unknown format: {output_format}")
        sys.exit(1)
