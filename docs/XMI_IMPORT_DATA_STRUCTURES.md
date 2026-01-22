# Структуры данных импорта модели из XMI (JSON)

Этот документ описывает формат JSON, который генерирует парсер XMI и который предназначен для импорта UML/CIM-моделей.

- **Источник истины для структуры**: схема JSON Schema 2020-12: [src/data-schema/xmi_model_detailed.schema.2020-12.json](../src/data-schema/xmi_model_detailed.schema.2020-12.json)
- **Генератор**: [src/parser/xmi_parser_v3_12.py](../src/parser/xmi_parser_v3_12.py) (`export_to_json_detailed()`)

Важно: этот JSON — это **импортный/обменный формат** парсера. Он не обязан 1:1 совпадать с каноническим контрактом приложения из [docs/DATA_STRUCTURES.md](DATA_STRUCTURES.md). Например, в этом формате связи представлены агрегированно (через списки `generalizationsList`/`associationList`), а не как производные `links` внутри каждого класса.

---

## 1) Корневой объект

```ts
interface XmiModelDetailed {
  totalPackages: number; // >= 0, количество пакетов (включая вложенные)
  totalElements: number; // >= 0, количество UML элементов (классы/типы/перечисления)
  totalAttributes: number; // >= 0, количество атрибутов классов
  totalLinks: number; // >= 0, количество связей (используется для статистики)

  packages: Package[]; // корневые пакеты модели

  // связи модели (агрегировано на уровне всей модели)
  generalizationsList: GeneralizationLink[];
  associationList: AssociationLink[];
}
```

### Примечания по заполнению парсером

- `packages` соответствует `XMIPackageParser.root_packages`.
- Счётчики `total*` формируются парсером во время обхода XMI.

---

## 2) Package

```ts
interface Package {
  id: string; // xmi:id пакета, непустой
  name: string;
  type: string; // обычно "Package"

  documentation: string | null;
  documentationRu: string | null;
  details: string | null;

  elementCount: number; // >= 0, количество элементов в этом пакете

  classes: UmlClass[]; // UML элементы (Class/Interface/DataType/Enumeration/PrimitiveType)
  subPackages: Package[]; // дочерние пакеты
}
```

### Примечания по заполнению парсером

- `classes` — это то, что внутри парсера называется `package.elements` (в него попадают классы, интерфейсы, типы и перечисления).
- `subPackages` строится из `package.children` после `_build_hierarchy()`.
- `elementCount` = `len(classes)`.
- `generalizationsList`/`associationList` находятся в корневом объекте и относятся ко всей модели.

---

## 3) Class (UML Element)

В схеме это называется `class`, но по смыслу это «UML элемент».

```ts
interface UmlClass {
  id: string; // xmi:id, непустой
  name: string;
  type: string; // "Class" | "Interface" | "DataType" | "Enumeration" | "PrimitiveType" | ...

  stereotype: string;

  documentation: string | null;
  documentationRu: string | null;
  details: string | null;

  isAbstract: boolean;

  attributes: Attribute[];
  literals: EnumLiteral[]; // только для Enumeration, иначе обычно []
}
```

### Примечания по заполнению парсером

- `stereotype` извлекается из секции EA Extension (если есть), иначе устанавливается в `""`.
- `documentation` берётся из EA Extension, либо fallback — из `ownedComment`.
- Поля `documentationRu` и `details` сейчас заполняются пустой строкой `""`.

---

## 4) Attribute

```ts
interface Attribute {
  name: string;
  id: string | null; // xmi:id ownedAttribute

  dataTypeId: string | null; // xmi:idref из ownedAttribute/type

  stereotype: string;

  documentation: string | null;
  documentationRu: string | null;
  details: string | null;

  multiplicity: string; // например: "1", "0..1", "0..*", "1..*"
  initialValue: string; // значение по умолчанию/инициализации
}
```

### Примечания по заполнению парсером

- `dataTypeId` — это ссылка на тип атрибута в XMI (`<type xmi:idref="..."/>`).
- `multiplicity` вычисляется по `lowerValue/upperValue`. Значение `upperValue=-1` преобразуется в `*`.
- `initialValue` берётся из EA Extension (`attribute/initial/@value` или `@body`).

---

## 5) EnumLiteral

```ts
interface EnumLiteral {
  name: string;
  id: string | null; // xmi:id ownedLiteral
  documentation: string;
  initialValue: string;
}
```

### Примечания

- Литералы извлекаются только для `type="Enumeration"`.

---

## 6) GeneralizationLink (generalizationsList)

```ts
interface GeneralizationLink {
  linkId: string | null;
  linkType: "Generalization";

  documentation: string;
  documentationRu: string | null;
  details: string | null;

  stereotype: string;

  parent: { classId: string | null };
  child: { classId: string | null };
}
```

### Семантика

- `parent.classId` — `xmi:id` базового (родительского) класса.
- `child.classId` — `xmi:id` производного (дочернего) класса.

---

## 7) AssociationLink (associationList)

```ts
interface AssociationLink {
  linkId: string | null;
  linkType: "Association";

  documentation: string;
  documentationRu: string | null;
  details: string | null;

  stereotype: string;

  linkEnd: [AssociationLinkEnd, AssociationLinkEnd];
}

interface AssociationLinkEnd {
  linkEndId: string | null;
  linkEndName: string;
  linkEndClassId: string | null; // xmi:id класса, участвующего в ассоциации

  multiplicity: string;

  documentation: string;
  documentationRu: string | null;
  details: string | null;

  stereotype: string;
}
```

### Семантика

- `linkEnd` всегда содержит **ровно 2 конца** ассоциации.
- `linkEndClassId` указывает на `UmlClass.id`.
- `multiplicity` формируется из `lowerValue/upperValue` конца ассоциации.
- Документация/стереотипы концов ассоциации могут извлекаться из EA Extension (connector/source|target), если присутствуют.

---

## Минимальный пример (сильно сокращён)

```json
{
  "totalPackages": 1,
  "totalElements": 1,
  "totalAttributes": 1,
  "totalLinks": 0,
  "packages": [
    {
      "id": "EAPK_...",
      "name": "Model",
      "type": "Package",
      "documentation": null,
      "documentationRu": "",
      "details": "",
      "elementCount": 1,
      "classes": [
        {
          "id": "EAID_...",
          "name": "SomeClass",
          "type": "Class",
          "stereotype": "",
          "documentation": null,
          "documentationRu": "",
          "details": "",
          "isAbstract": false,
          "attributes": [
            {
              "name": "someAttr",
              "id": "EAID_...",
              "dataTypeId": "EAID_...",
              "stereotype": "",
              "documentation": null,
              "documentationRu": "",
              "details": "",
              "multiplicity": "1",
              "initialValue": ""
            }
          ],
          "literals": []
        }
      ],
      "subPackages": []
    }
  ]
}
```
