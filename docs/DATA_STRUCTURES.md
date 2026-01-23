# Структуры данных Nautilus. CIM

> **⭐ CANONICAL DATA CONTRACT**  
> This is the authoritative, canonical reference for all data structures in the NauCim application.  
> All code, documentation, and development must follow the data structures defined in this document.  
> When in doubt about data structure definitions, always refer to this document as the source of truth.

Этот документ описывает все структуры данных, используемые в приложении.

---

## Table of Contents

- [Project](#project)
- [Model](#model)
- [Profile](#profile)
- [Class](#class)
- [Attribute](#attribute)
- [Package](#package)
- [Enums](#enums)

---

## Project

Основная сущность — проект CIM.

```typescript
interface Project {
  id: string; // Уникальный идентификатор (например, "project-1703001234567-k3j9x2q")
  name: string; // Название проекта
  description?: string; // Описание проекта
  version: string; // Версия проекта (например, "1.0", "2.3.1")
  createDate: string; // Дата создания (ISO 8601: "2025-01-15T10:30:00.000Z")
  modifyDate: string; // Дата последнего изменения (ISO 8601)
  accessRights: AccessRights; // Права доступа (см. Enums)
  models: Model[]; // Массив моделей проекта
  profiles: Profile[]; // Массив профилей проекта
}
```

### Пример:

```json
{
  "id": "project-1703001234567-abc123",
  "name": "Энергосистема РФ",
  "description": "Модель электросетевого комплекса",
  "version": "1.0",
  "createDate": "2025-01-15T10:30:00.000Z",
  "modifyDate": "2025-01-20T14:22:00.000Z",
  "models": [... ],
  "profiles": [...]
}
```

---

## Model

Модель данных (CIM, UML и т.д.).

```typescript
interface Model {
  id: string; // Уникальный идентификатор
  name: string; // Название модели
  description?: string; // Описание модели
  type?: ModelType?; // Тип модели  Не понятно зачем и чо указывать
  version: string; // Версия
  createDate: string; // Дата создания/загрузки (ISO 8601)
  modifyDate: string; // Дата последнего изменения (ISO 8601)
  legalState: LegalState; // Статус разработки (см.  Enums)
  legalAct: string; // нормативный акт, которым утверждена модель
  accessRights: AccessRights; // Права доступа (см. Enums)
  relatedProfiles: ProfileRef[]; // Профили, использующие эту модель
  rootPackages: RootPackage[]; // корневой пакет модели (в backend-импорте/экспорте: массив должен содержать ровно 1 элемент)
}
```

### Пример:

```json
{
  "id": "model-1703001234567-xyz789",
  "name": "IEC 61970 CIM16",
  "description": "Common Information Model версии 16",
  "type": "CIM",
  "createDate": "2025-01-10T08:00:00.000Z",
  "modifyDate": "2025-01-18T12:45:00.000Z",
  "legalState": "project",
  "accessRight": "readWrite",
  "relatedProfiles": [
    { "id": "profile-123", "name": "Equipment Profile" }
  ],
  "rootPackages": [ ... ]
}
```

---

## Profile

Профиль — подмножество модели с дополнительными ограничениями.

```typescript
interface Profile {
  id: string; // Уникальный идентификатор
  name: string; // Название профиля
  description?: string; // Описание профиля
  version: string; // Версия профиля (например, "1.0")
  relatedModels: ModelRef[]; // модели, на которых основан профиль
  createDate: string; // Дата создания/загрузки (ISO 8601)
  modifyDate: string; // Дата последнего изменения (ISO 8601)
  legalState: LegalState; // Статус разработки
  legalAct: string; // нормативный акт, которым утвержден профиль
  accessRights: AccessRights; // Права доступа
  rootPackages: RootPackage[]; // корневой пакет профиля (в backend-импорте/экспорте: массив должен содержать ровно 1 элемент)
}
```

### Пример:

```json
{
  "id": "profile-1703001234567-def456",
  "name": "Equipment Profile",
  "description": "Профиль для описания оборудования",
  "version": "1.0",
  "relatedModels": [],
  "createDate": "2025-01-12T09:00:00.000Z",
  "modifyDate": "2025-01-19T16:30:00.000Z",
  "legalState": "project",
  "accessRight": "readWrite",
  "rootPackages": [...]
}
```

---

## RootPackage

корневой пакет модели или профиля — содержимое модели или профиля: пакеты, классы, диаграммы, перечень связей наследования и ассоциаций.

```typescript
interface RootPackage {
  packages: Package[]; // массив пакетов, входящих в модель или профиль
  generalizationsList: GeneralizationLink[]; // массив связей типа  Generalization
  associationList: AssociationLink[]; // массив связей типа  Association
}
```

### Пример:

// todo - сделать нормальный пример "..."

```json
{
  "packages": [
      {
        "id": "EAPK_566B73D4_ED02_4d03_B450_704BD1F935D5",
        "name": "IEC61970",
        "type": "Package",
        "documentation": "Пакет верхнего уровня для IEC 61970.",
        "documentationRu": null,
        "details": null,
        "elementCount": 1,
        "classes": [
            {
              "id": "EAID_9A4F1243_5579_4da3_9DAD_D4CBAB29CC65",
              "name": "BusArrangement",
              "type": "Class",
              "stereotype": "rf",
              "documentation": "Ошиновка.",
              "documentationRu": null,
              "details": null,
              "isAbstract": false,
              "attributes": [...],
              "links": [ ... ],
              "literals": [],
              "profileRelations": [],
              "modelId": null,
              "modelItemId": null
            }
          ],
        "subPackages": []
      }
    ],
  "generalizationsList": [...],
  "associationList": [...]
}
```

---

## Package

Пакет (иерархическая структура для группировки классов).

```typescript
interface Package {
  id: string; // Уникальный идентификатор
  name: string; // Название пакета (например, "Wires")
  type: string; // Фиксированное значение: Package
  parentPackageId?: string | null; // ID родительского пакета (для вложенности). В экспортируемых данных облегчает навигацию по дереву.
  documentation?: string; // Описание пакета
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  modelId?: string; //идентификатор модели, которой принадлежит пакет (заполняется, если пакет принадлежит модели)
  profileId?: string; // идентификатор профиля, которому принадлежит пакет (заполняется, если пакет принадлежит профилю)
  diagrams: Diagram[]; // Массив диаграмм, входящих в пакет
  classes: Class[]; // Массив классов, входящих в пакет
  subPackages: Package[]; // Вложенные пакеты
}
```

### Пример:

//todo - нужен вложенный пакет и класс

```json
{
  "id": "EAPK_566B73D4_ED02_4d03_B450_704BD1F935D5",
  "name": "IEC61970",
  "type": "Package",
  "documentation": "Пакет верхнего уровня для IEC 61970.",
  "documentationRu": null,
  "details": null,
  "modelId": null,
  "profileId": null,
  "classes": [
    {
      "id": "EAID_9A4F1243_5579_4da3_9DAD_D4CBAB29CC65",
      "name": "BusArrangement",
      "type": "Class",
      "stereotype": "rf",
      "documentation": "Ошиновка.",
      "documentationRu": null,
      "details": null,
      "isAbstract": false,
      "attributes": [...],
      "links": [ ... ],
      "literals": [],
      "profileRelations": [],
      "modelId": "",
      "profileId": "",
      "refModelId": null,
      "refModelItemId": null
    }
  ],
  "subPackages": [
      {
        "id": "EAPK_C7240E2E_AE77_457a_B415_A6CB16ECF3CC",
        "name": "Domain",
        "type": "Package",
        "documentation": null,
        "documentationRu": null,
        "details": null,
        "elementCount": 6,
        "modelId":  "",
        "profileId": "",
        "classes": [ ... ],
        "subPackages": []
      }
    ]
}
```

---

## Class

Класс в модели или профиле.

```typescript
interface Class {
  id: string; // Уникальный идентификатор
  name: string; // Название класса (например, "ACLineSegment")
  type: string; // тип: Class, Enumeration
  stereotype: string; // Стереотип. Может иметь значение, назначенное  пользователем, например "rs"
  packageName?: string; // Имя пакета, к которому принадлежит класс
  documentation?: string; // Описание класса
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  isAbstract: boolean; // Является ли класс абстрактным
  attributes: Attribute[]; // Атрибуты класса
  links: ClassLink[]; // ⚠️ производные данные (см. ClassLink); источник правды: GeneralizationLink/AssociationLink
  literals: Literal[]; // Значения в перечислении. заполняется только при типе Enumeration
  profileRelations: ProfileItemRef[]; //массив ссылок на объекты профиля, которые основаны на данной модели. Может быть заполнен только в классе в составе модели
  modelId?: string; //идентификатор модели,  которой принадлежит класс (заполняется, если класс принадлежит модели)
  profileId?: string; // идентификатор профиля, которому принадлежит класс (заполняется, если класс принадлежит профилю)
  refModelId?: string; //Идентификатор родительской модели.  Может быть заполнен только в классе в составе профиля
  refModelItemId?: string; // Идентификатор родительского класса. Может быть заполнен только в классе в составе профиля
}
```

### Пример:

// todo заполнить атрибут и 2 линка

```json
{
  "id": "EAID_9A4F1243_5579_4da3_9DAD_D4CBAB29CC65",
  "name": "BusArrangement",
  "type": "Class",
  "stereotype": "rf",
  "documentation": "Ошиновка.",
  "documentationRu": null,
  "details": null,
  "isAbstract": false,
  "attributes": [
    {
      "name": "r0",
      "id": "EAID_3FC50F42_C09F_48fe_B9BA_76CFB4BC07B6",
      "dataType": "Resistance",
      "dataTypeId": "qwerty-1234567",
      "stereotype": "",
      "documentation": "Взаимное активное сопротивление нулевой последовательности, Ом.",
      "documentationRu": null,
      "details": null,
      "multiplicity": "0..1",
      "visibility": "public",
      "initialValue": ""
    }
  ],
  "links": [
    {
      "linkId": "EAID_13C9A56B_14C6_43ce_B9D7_AC3B925C08C3",
      "relationKind": "Generalization",
      "role": "child",
      "targetClassId": "EAID_F8D24DB4_6AD0_4462_854F_08AE97EC3DC0",
      "targetClassName": "PerLengthLineParameter",
      "targetClassRoleName": null,
      "srcClassRoleName": null,
      "targetDescription": null,
      "multiplicity": "1"
    },
    {
      "linkId": "EAID_79AFE40F_EF83_430a_8C6C_6805845870AA",
      "relationKind": "Association",
      "role": "unspecified",
      "targetClassId": "EAID_DB1BE59A_9417_4a12_9A53_17007675EEA5",
      "targetClassName": "ACLineSegment",
      "targetClassRoleName": "ACLineSegments",
      "srcClassRoleName": "PerLengthImpedance",
      "targetDescription": "Участки линии переменного тока, имеющие указанные удельные параметры.",
      "multiplicity": "0..*"
    }
  ],
  "literals": [],
  "profileRelations": [],
  "modelId": null,
  "profileId": null,
  "refModelId": null,
  "refModelItemId": null
}
```

---

## Attribute

Атрибут класса.

```typescript
interface Attribute {
  id: string; // Уникальный идентификатор
  name: string; // Название атрибута (например, "r")
  dataType: string; // Тип данных (например, "Float", "String", "Integer"). Может быть назначен пользовательский тип данных
  dataTypeId?: string; //идентификатор типа данных в модели или профиле
  stereotype: string; // Стереотип. Может иметь значение, назначенное  пользователем, например "rs"
  documentation?: string; // Описание атрибута
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  multiplicity: string; // Кардинальность (например, "1", "0..1", "0..*")
  initialValue?: string; // Значение по умолчанию
}
```

### Пример:

```json
{
  "name": "r0",
  "id": "EAID_3FC50F42_C09F_48fe_B9BA_76CFB4BC07B6",
  "dataType": "Resistance",
  "dataTypeId": "qwerty-1234567",
  "stereotype": "",
  "documentation": "Взаимное активное сопротивление нулевой последовательности, Ом.",
  "documentationRu": null,
  "details": null,
  "multiplicity": "0..1",
  "visibility": "public",
  "initialValue": ""
}
```

---

## ClassLink

> ⚠️ **Derived / Planned deprecation**
>
> `ClassLink` — это **зависимые (производные) данные**, построенные на основе:
>
> - `GeneralizationLink` (наследование)
> - `AssociationLink` + `AssociationLinkEnd[]` (ассоциации)
>
> `ClassLink` может быть дополнительно обогащён бизнес-логикой (роль, имена ролей, описания концов и т.п.).

Связи класса. справочная информация.

```typescript
interface ClassLink {
  linkId: string; // Уникальный идентификатор
  relationKind: string; // тип связи Generalization, Association
  role: string; // роль, которую выполняет класс, по отношению к target-class:  child - класс является потомком от target-class, parent - класс является родителем для target-class (для типа Generalization); unspecified - для типа Association
  targetClassId: string; // идентификатор целевого класса
  targetClassName: string; // имя целевого класса
  targetClassRoleName?: string; // имя роли для конца ассоциации для целевого класса (заполняется для Association)
  srcClassRoleName?: string; // имя роли для конца ассоциации для класса-источника (заполняется для Association)
  targetDescription?: string; // описание роли для конца ассоциации для целевого класса (заполняется для Association)
  targetDocumentationRu: string; // Дополнительная информация для целевого класса (заполняется для Association)
  targetDetails: string;
  multiplicity: string; // Кардинальность (например, "1", "0..1", "0..*")
}
```

### Пример:

```json
{
  "linkId": "EAID_79AFE40F_EF83_430a_8C6C_6805845870AA",
  "relationKind": "Association",
  "role": "unspecified",
  "targetClassId": "EAID_DB1BE59A_9417_4a12_9A53_17007675EEA5",
  "targetClassName": "ACLineSegment",
  "targetClassRoleName": "ACLineSegments",
  "srcClassRoleName": "PerLengthImpedance",
  "targetDescription": "Участки линии переменного тока, имеющие указанные удельные параметры.",
  "multiplicity": "0..*"
}
```

---

## Diagram

Диаграмма классов

```typescript
interface Diagram {
  id: string; // Уникальный идентификатор
  diagramType: string; // тип диаграммы - ClassDiagram,
  diagramName: string; // название диаграммы
  documentation?: string; // Описание диаграммы
  details?: string; // Справочная и поясняющая информация
  diagramBody?: string; // тело диаграммы в текстовом виде или преобразованное в base64
}
```

### Пример:

```json
{
  "id": "DDID_E9FB4B7B_727E_4456_9697_0181F1285F2E",
  "diagramType": "ClassDiagram",
  "diagramName": "Диаграмма связей пакета Asset",
  "documentation": "Описание назначения диаграммы",
  "details": null,
  "diagramBody": null
}
```

---

## GeneralizationLink

Связь типа Generalization

```typescript
interface GeneralizationLink {
  linkId: string; // Уникальный идентификатор
  linkType: string; // тип связи - Generalization,
  documentation?: string; // Описание связи
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  stereotype: string; // Стереотип. Может иметь значение, назначенное  пользователем, например "rs"
  parent: ClassRef; // ссылка на класс - родитель
  child: ClassRef; // ссылка на класс - потомок
}
```

### Пример:

```json
{
  "linkId": "EAID_E9FB4B7B_727E_4456_9697_0181F1285F2E",
  "linkType": "Generalization",
  "documentation": null,
  "documentationRu": null,
  "details": null,
  "stereotype": "",
  "parent": {
    "classId": "EAID_64D19B75_EB20_49ee_80E2_53F98D5A15B6",
    "className": "AssetPersonRole"
  },
  "child": {
    "classId": "EAID_F7EEC20F_E02C_4809_A74A_69B7C1781737",
    "className": "AssetPersonOwner"
  }
}
```

---

## AssociationLink

Связь типа Association

```typescript
interface AssociationLink {
  linkId: string; // Уникальный идентификатор
  linkType: string; // тип связи - Association,
  documentation?: string; // Описание связи
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  stereotype: string; // Стереотип. Может иметь значение, назначенное  пользователем, например "rs"
  linkEnd: AssociationLinkEnd[]; // сведения о концах ассоциации. Массив из 2х элементов
}
```

### Пример:

```json
    {
      "linkId": "EAID_2B2408CF_541B_45f3_BD69_814D8BCB81FD",
      "linkType": "Association",
      "documentation": null,
      "documentationRu": null,
      "details": null,
      "stereotype": "",
      "linkEnd": [
        {
          "linkEndId": "EAID_dst2408CF_541B_45f3_BD69_814D8BCB81FD",
          "linkEndName": "ServiceCategories",
          "linkEndClassId": "EAID_D396E6CF_BA6C_4c5c_84C4_058B7E88C5DC",
          "linkEndClassName": "ServiceCategory",
          "multiplicity": "0..*",
          "documentation": null,
          "documentationRu": null,
          "details": "",
          "stereotype": ""
        },
        {
          "linkEndId": "EAID_src2408CF_541B_45f3_BD69_814D8BCB81FD",
          "linkEndName": "AuxiliaryAgreements",
          "linkEndClassId": "EAID_C3FB2D2D_52D2_446e_9D18_B0B5091DC872",
          "linkEndClassName": "AuxiliaryAgreement",
          "multiplicity": "1..*",
          "documentation": null,
          "documentationRu": null,
          "details": "",
          "stereotype": ""
        }
      ]
    },
```

---

## AssociationLinkEnd

Описание концов связи типа Association

```typescript
interface AssociationLinkEnd {
  linkEndId: string; // Уникальный идентификатор
  linkEndName: string; // имя,  присвоенное концу ассоциации (имя роли),
  linkEndClassId: string; // уникальный идентификатор класса, на который указывает конец ассоциации
  linkEndClassName: string; // имя класса, на который указывает конец ассоциации
  multiplicity: string; // Кардинальность (например, "1", "0..1", "0..*")
  documentation?: string; // Описание атрибута
  documentationRu?: string; // Дополнительное описание на русском языке
  details?: string; // Справочная и поясняющая информация
  stereotype: string; // Стереотип. Может иметь значение, назначенное  пользователем, например "rs"
}
```

### Пример:

```json
{
  "linkEndId": "EAID_dst2408CF_541B_45f3_BD69_814D8BCB81FD",
  "linkEndName": "ServiceCategories",
  "linkEndClassId": "EAID_D396E6CF_BA6C_4c5c_84C4_058B7E88C5DC",
  "linkEndClassName": "ServiceCategory",
  "multiplicity": "0..*",
  "documentation": null,
  "documentationRu": null,
  "details": null,
  "stereotype": ""
}
```

---

## ClassRef

Ссылка на класс (используется в GeneralizationLink.parent, GeneralizationLink.child).

```typescript
interface ClassRef {
  classId: string; // ID класса
  className: string; // Имя класса
}
```

### Пример:

```json
{
  "id": "profile-123",
  "name": "Equipment Profile"
}
```

---

## ProfileRef

Ссылка на профиль (используется в Model.relatedProfiles).

```typescript
interface ProfileRef {
  id: string; // ID профиля
  name: string; // Название профиля
}
```

### Пример:

```json
{
  "id": "profile-123",
  "name": "Equipment Profile"
}
```

---

## ModelRef

Ссылка на модель (используется в Profile.relatedModels).

```typescript
interface ModelRef {
  id: string; // ID модели
  name: string; // Название модели
}
```

### Пример:

```json
{
  "id": "model-123",
  "name": "GOSTR Model"
}
```

---

## Literal

Значение literal для Enumeration

```typescript
interface Literal {
  name: string; //значение литерала
  id: string; // Уникальный идентификатор
  documentation?: string; // Описание значения
  initialValue?: string; // Значение по умолчанию
}
```

### Пример:

```json

  {
    "name": "manhole",
    "id": "EAID_8AD35949_9281_4c08_9F00_D16F95C75B3F",
    "documentation": "Кабельный колодец.",
    "initialValue": ""
  },
```

---

## Enums

### ModelType

```typescript
type ModelType = "CIM" | "UML" | "Custom";
```

- `CIM` — Common Information Model (IEC 61970/61968)
- `UML` — Universal Modeling Language
- `Custom` — Пользовательская модель

---

### LegalState

Статус разработки проекта/модели/профиля.

```typescript
type LegalState = "project" | "draft" | "approved" | "deprecated";
```

- `project` — В разработке
- `draft` — Черновик
- `approved` — Утверждено
- `deprecated` — Устарело

**Текущая версия (минимальная):**

```typescript
type LegalState = "project";
```

---

### AccessRights

Права доступа.

```typescript
type AccessRights = "readOnly" | "readWrite" | "custom";
```

- `readOnly` — Только чтение
- `readWrite` — Чтение и запись
- `custom` — различны для различных компонентов проекта

---

## Вспомогательные типы

### DateString

ISO 8601 дата в формате строки.

```typescript
type DateString = string; // "2025-01-15T10:30:00.000Z"
```

---

### ID

Уникальный идентификатор (UUID).

```typescript
type ID = string; // "CD24235B-3779-4817-BFA9-AEA7831D10C9" Должен иметь формат UUID
```

---

## Правила генерации ID

Все ID, которые формируются в системе являются UUID. ID, созданные во внешних системах являются строкой

```javascript
function generateUUID() {
  return crypto.randomUUID();
}
```

Примеры:

- `CD24235B-3779-4817-BFA9-AEA7831D10C9`

---

## Валидация данных

### Обязательные поля

| Сущность  | Обязательные поля                      |
| --------- | -------------------------------------- |
| Project   | `id`, `name`, `version`,               |
| Model     | `id`, `name`, `version`, `createDate`, |
| Profile   | `id`, `name`, `version`, `createDate`, |
| Class     | `id`, `name`                           |
| Attribute | `id`, `name`, `className`, `dataType`  |

### Минимальная длина строк

- `name`: минимум 3 символа (после trim)
- `description`: опционально, без ограничений

### Значения по умолчанию

```javascript
// Project
version: "0.1";
models: [];
profiles: [];

// Model
type: "Custom";
version: "0.1";
legalState: "project";
accessRight: "readWrite";
relatedProfiles: [];
rootPackages: [];

// Profile
version: "0.1";
legalState: "project";
accessRight: "readWrite";
classes: [];

// Class
isAbstract: false;
attributes: [];

// Attribute
isRequired: false;
multiplicity: "0..1";
```

---

## Примеры полных структур

### Минимальный проект

```json
{
  "id": "project-1",
  "name": "Тестовый проект",
  "version": "1.0",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z",
  "models": [],
  "profiles": []
}
```

### Проект с моделью

```json
{
  "id": "project-1",
  "name": "Энергосистема",
  "description": "Модель электросетевого комплекса",
  "version": "1.0",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-20T14:22:00.000Z",
  "models": [
    {
      "id": "model-1",
      "name": "IEC 61970 CIM16",
      "description": "Common Information Model",
      "type": "CIM",
      "createDate": "2025-01-10T08:00:00.000Z",
      "modifyDate": "2025-01-18T12:45:00.000Z",
      "legalState": "project",
      "accessRight": "readWrite",
      "relatedProfiles": [],
      "packages": [
        {
          "id": "EAPK_566B73D4_ED02_4d03_B450_704BD1F935D5",
          "name": "IEC61970",
          "type": "Package",
          "documentation": "Пакет верхнего уровня для IEC 61970.",
          "documentationRu": null,
          "details": null,
          "elementCount": 1,
          "classes": [
            {
              "id": "EAID_9A4F1243_5579_4da3_9DAD_D4CBAB29CC65",
              "name": "BusArrangement",
              "type": "Class",
              "stereotype": "rf",
              "documentation": "Ошиновка.",
              "documentationRu": null,
              "details": null,
              "isAbstract": false,
              "attributes": [],
              "links": [],
              "literals": [],
              "profileRelations": [],
              "modelId": null,
              "modelItemId": null
            }
          ],
          "subPackages": []
        }
      ],
      "generalizationsList": [],
      "associationList": []
    }
  ],
  "profiles": []
}
```

---

## Миграция данных

При изменении структуры данных:

1. Обновить этот документ
2. Создать миграцию в `src/migrations/`
3. Обновить TypeScript-определения (если используются)
4. Обновить тестовые данные в `src/services/dataloader.js`

---

## История изменений

| Дата       | Версия | Изменения                        |
| ---------- | ------ | -------------------------------- |
| 2025-01-27 | 1.0    | Начальная версия структур данных |

---

## Связанные документы

<!-- - [API Documentation](./API.md)
- [Service Layer](./SERVICES.md)
- [Data Migration Guide](./MIGRATIONS.md) -->
