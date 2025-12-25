# Структуры данных Nautilus. CIM

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
  id: string;                    // Уникальный идентификатор (например, "project-1703001234567-k3j9x2q")
  name: string;                  // Название проекта
  description?:  string;          // Описание проекта
  version: string;               // Версия проекта (например, "1.0", "2.3.1")
  createDate: string;             // Дата создания (ISO 8601: "2025-01-15T10:30:00.000Z")
  modifyDate: string;             // Дата последнего изменения (ISO 8601)
  models: Model[];               // Массив моделей проекта
  profiles: Profile[];           // Массив профилей проекта
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
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название модели
  description?:  string;          // Описание модели
  type?: ModelType?;               // Тип модели  Не понятно зачем и чо указывать
  version: string;               // Версия
  createDate: string;            // Дата создания/загрузки (ISO 8601)
  modifyDate: string;            // Дата последнего изменения (ISO 8601)
  legalState: LegalState;        // Статус разработки (см.  Enums)
  legalAct: string;              // нормативный акт, которым утверждена модель
  accessRight: AccessRight;      // Права доступа (см. Enums)
  relatedProfiles: ProfileRef[]; // Профили, использующие эту модель
  rootPackages: ModelRootPackage[]; // корневой пакет модели
  // packages: Package[];           // Пакеты (иерархическая структура)
  // classes: Class[];              // Классы модели
  // attributes: Attribute[];       // Атрибуты (плоский список для быстрого доступа)
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
  "rootPackages": []
  // "packages": [... ],
  // "classes": [...],
  // "attributes": [...]
}
```

---

## Profile

Профиль — подмножество модели с дополнительными ограничениями.

```typescript
interface Profile {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название профиля
  description?:  string;          // Описание профиля
  version: string;               // Версия профиля (например, "1.0")
  relatedModels: ModelRef[];             // модели, на которых основан профиль
  createDate: string;            // Дата создания/загрузки (ISO 8601)
  modifyDate: string;            // Дата последнего изменения (ISO 8601)
  legalState: LegalState;        // Статус разработки
  legalAct: string;              // нормативный акт, которым утвержден профиль
  accessRight: AccessRight;      // Права доступа
  rootPackages: ProfileRootPackage[]; // корневой пакет профиля
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
  "rootPackages": []
}
```

---

## Class

Класс в модели или профиле. 

```typescript
interface Class {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название класса (например, "ACLineSegment")
  packageName?:  string;          // Имя пакета, к которому принадлежит класс
  description?: string;          // Описание класса
  stereotype?: string;           // Стереотип UML (например, "Concrete", "Abstract")
  parentClass?: string;          // Имя родительского класса (наследование)
  isAbstract:  boolean;           // Является ли класс абстрактным
  attributes: Attribute[];       // Атрибуты класса
}
```

### Пример:

```json
{
  "id": "class-abc123",
  "name": "ACLineSegment",
  "packageName": "Wires",
  "description": "Сегмент линии переменного тока",
  "stereotype": "Concrete",
  "parentClass": "Conductor",
  "isAbstract": false,
  "attributes": [...]
}
```

---

## Attribute

Атрибут класса.

```typescript
interface Attribute {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название атрибута (например, "r")
  className: string;             // Имя класса, к которому принадлежит атрибут
  dataType: string;              // Тип данных (например, "Float", "String", "Integer")
  multiplicity?: string;         // Кардинальность (например, "1", "0..1", "0..*")
  isRequired:  boolean;           // Обязательный ли атрибут
  description?: string;          // Описание атрибута
  defaultValue?: string;         // Значение по умолчанию
  unit?: string;                 // Единица измерения (например, "Ohm", "Meter")
}
```

### Пример:

```json
{
  "id": "attr-xyz789",
  "name": "r",
  "className": "ACLineSegment",
  "dataType": "Float",
  "multiplicity": "1",
  "isRequired": true,
  "description": "Активное сопротивление",
  "defaultValue": null,
  "unit": "Ohm"
}
```

---

## Package

Пакет (иерархическая структура для группировки классов).

```typescript
interface Package {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название пакета (например, "Wires")
  parentPackage?: string;        // Имя родительского пакета (для вложенности)
  description?: string;          // Описание пакета
  classes: string[];             // Массив имён классов, входящих в пакет
  subPackages: Package[];        // Вложенные пакеты
}
```

### Пример:

```json
{
  "id": "package-abc123",
  "name": "Core",
  "parentPackage":  null,
  "description": "Базовые классы CIM",
  "classes": ["IdentifiedObject", "PowerSystemResource"],
  "subPackages": [
    {
      "id":  "package-def456",
      "name": "Wires",
      "parentPackage": "Core",
      "description": "Классы для электрических сетей",
      "classes": ["ACLineSegment", "Breaker"],
      "subPackages": []
    }
  ]
}
```

---

## ProfileClass

Класс в профиле (с ограничениями и флагами включения атрибутов).

```typescript
interface ProfileClass {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название класса (ссылка на Model.Class)
  baseClassId: string;           // ID класса в базовой модели
  isIncluded: boolean;           // Включён ли класс в профиль
  attributes: ProfileAttribute[]; // Атрибуты с ограничениями
}
```

### Пример:

```json
{
  "id": "profile-class-abc123",
  "name": "ACLineSegment",
  "baseClassId": "class-abc123",
  "isIncluded": true,
  "attributes":  [...]
}
```

---

## ProfileAttribute

Атрибут в профиле (с переопределёнными ограничениями).

```typescript
interface ProfileAttribute {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Название атрибута
  baseAttributeId: string;       // ID атрибута в базовой модели
  isIncluded: boolean;           // Включён ли атрибут в профиль
  multiplicity?: string;         // Переопределённая кардинальность (может быть строже)
  isRequired?:  boolean;          // Переопределённая обязательность
  description?: string;          // Дополнительное описание для профиля
}
```

### Пример:

```json
{
  "id": "profile-attr-xyz789",
  "name": "r",
  "baseAttributeId": "attr-xyz789",
  "isIncluded": true,
  "multiplicity": "1",
  "isRequired": true,
  "description": "Обязательный атрибут в данном профиле"
}
```

---

## ProfileRef

Ссылка на профиль (используется в Model.relatedProfiles).

```typescript
interface ProfileRef {
  id:  string;                    // ID профиля
  name: string;                  // Название профиля
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
  id:  string;                    // ID модели
  name: string;                  // Название модели
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

### AccessRight

Права доступа. 

```typescript
type AccessRight = "readOnly" | "readWrite";
```

- `readOnly` — Только чтение
- `readWrite` — Чтение и запись

---

## Вспомогательные типы

### DateString

ISO 8601 дата в формате строки.

```typescript
type DateString = string; // "2025-01-15T10:30:00.000Z"
```

---

### ID

Уникальный идентификатор (string).

```typescript
type ID = string; // "project-1703001234567-abc123"
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
- `project-1703001234567-k3j9x2q`
- `model-1703001234568-a7b2c9d`
- `profile-1703001234569-x1y2z3a`
- `class-1703001234570-m4n5o6p`
- `attr-1703001234571-q7r8s9t`

---

## Валидация данных

### Обязательные поля

| Сущность | Обязательные поля |
|----------|-------------------|
| Project  | `id`, `name`, `version`, |
| Model    | `id`, `name`, `version`, `createDate`, |
| Profile  | `id`, `name`, `version`, `createDate`, |
| Class    | `id`, `name` |
| Attribute| `id`, `name`, `className`, `dataType` |

### Минимальная длина строк

- `name`: минимум 3 символа (после trim)
- `description`: опционально, без ограничений

### Значения по умолчанию

```javascript
// Project
version: "0.1"
models: []
profiles: []

// Model
type: "Custom"
version: "0.1"
legalState: "project"
accessRight: "readWrite"
relatedProfiles: []
rootPackages: []


// Profile
version: "0.1"
legalState: "project"
accessRight: "readWrite"
classes: []

// Class
isAbstract: false
attributes: []

// Attribute
isRequired: false
multiplicity: "0..1"
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
      "id":  "model-1",
      "name": "IEC 61970 CIM16",
      "description": "Common Information Model",
      "type": "CIM",
      "createDate": "2025-01-10T08:00:00.000Z",
      "modifyDate": "2025-01-18T12:45:00.000Z",
      "legalState": "project",
      "accessRight":  "readWrite",
      "relatedProfiles": [],
      "packages": [],
      "classes": [
        {
          "id": "class-1",
          "name": "ACLineSegment",
          "packageName": "Wires",
          "description": "Сегмент линии переменного тока",
          "stereotype":  "Concrete",
          "parentClass": "Conductor",
          "isAbstract": false,
          "attributes": [
            {
              "id": "attr-1",
              "name":  "r",
              "className":  "ACLineSegment",
              "dataType": "Float",
              "multiplicity": "1",
              "isRequired": true,
              "description": "Активное сопротивление",
              "unit": "Ohm"
            }
          ]
        }
      ],
      "attributes": []
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

| Дата       | Версия | Изменения |
|------------|--------|-----------|
| 2025-01-25 | 1.0    | Начальная версия структур данных |

---

## Связанные документы

- [API Documentation](./API.md)
- [Service Layer](./SERVICES.md)
- [Data Migration Guide](./MIGRATIONS.md)
