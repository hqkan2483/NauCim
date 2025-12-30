# 📋 Документация: Data-атрибуты в Nautilus. CIM

На основе анализа репозитория `thachanhtuan/NauCim` и структуры данных Version 5.

---

## 📄 Страница: `project-details.html`

### 1. **Project (Проект)**

| Data-атрибут      | Источник данных | Описание              | Использование                          |
| ----------------- | --------------- | --------------------- | -------------------------------------- |
| `data-project-id` | `Project. id`   | Уникальный ID проекта | Идентификация проекта в дереве sidebar |

**Пример:**

```html
<button data-project-id="project-123" data-action="toggle-project"></button>
```

---

### 2. **Model (Модель)**

| Data-атрибут    | Источник данных | Описание             | Использование                                |
| --------------- | --------------- | -------------------- | -------------------------------------------- |
| `data-model-id` | `Model.id`      | Уникальный ID модели | Выбор модели в списке, дереве                |
| `data-action`   | —               | Тип действия         | `select-model`, `edit-model`, `delete-model` |

**Пример:**

```html
<span data-type="model" data-model-id="model-789" data-action="select-model">
  <button data-action="edit-model" data-model-id="model-789"></button
></span>
```

---

### 3. **Profile (Профиль)**

| Data-атрибут      | Источник данных | Описание              | Использование                                      |
| ----------------- | --------------- | --------------------- | -------------------------------------------------- |
| `data-profile-id` | `Profile.id`    | Уникальный ID профиля | Выбор профиля в списке, дереве                     |
| `data-action`     | —               | Тип действия          | `select-profile`, `edit-profile`, `delete-profile` |

**Пример:**

```html
<span
  data-type="profile"
  data-profile-id="profile-456"
  data-action="select-profile"
>
  <button data-action="edit-profile" data-profile-id="profile-456"></button
></span>
```

---

### 4. **Package (Пакет)**

| Data-атрибут      | Источник данных     | Описание                    | Использование                                     |
| ----------------- | ------------------- | --------------------------- | ------------------------------------------------- |
| `data-package-id` | `Package.id`        | Уникальный ID пакета        | Выбор пакета в дереве                             |
| `data-model-id`   | `Package.modelId`   | ID модели-владельца пакета  | Связь с моделью (если пакет принадлежит модели)   |
| `data-profile-id` | `Package.profileId` | ID профиля-владельца пакета | Связь с профилем (если пакет принадлежит профилю) |
| `data-action`     | —                   | Тип действия                | `select-package`                                  |

**Пример:**

```html
<span
  data-type="package"
  data-package-id="EAPK_566B73D4"
  data-model-id="model-789"
  data-profile-id=""
  data-action="select-package"
></span>
```

---

### 5. **Class (Класс)**

| Data-атрибут             | Источник данных                | Описание                                        | Использование                                 |
| ------------------------ | ------------------------------ | ----------------------------------------------- | --------------------------------------------- |
| `data-class-id`          | `Class.id`                     | Уникальный ID класса                            | Выбор класса в дереве, идентификация в формах |
| `data-model-id`          | `Class.modelId`                | ID модели-владельца класса                      | Связь с моделью                               |
| `data-profile-id`        | `Class.profileId`              | ID профиля-владельца класса                     | Связь с профилем                              |
| `data-ref-model-id`      | `Class.refModelId`             | ID родительской модели (для классов в профиле)  | Связь с исходной моделью                      |
| `data-ref-model-item-id` | `Class.refModelItemId`         | ID родительского класса (для классов в профиле) | Связь с исходным классом                      |
| `data-is-enumeration`    | `Class.type === 'Enumeration'` | Флаг Enumeration                                | CSS-стилизация, условная логика               |
| `data-is-abstract`       | `Class.isAbstract`             | Флаг абстрактного класса                        | CSS-стилизация, условная логика               |
| `data-action`            | —                              | Тип действия                                    | `select-class`                                |

**Пример:**

```html
<span
  data-type="class"
  data-class-id="EAID_9A4F1243"
  data-model-id="model-789"
  data-profile-id=""
  data-ref-model-id=""
  data-ref-model-item-id=""
  data-is-enumeration="false"
  data-is-abstract="false"
  data-action="select-class"
></span>
```

---

### 6. **Attribute (Атрибут)**

| Data-атрибут   | Источник данных | Описание               | Использование                                            |
| -------------- | --------------- | ---------------------- | -------------------------------------------------------- |
| `data-attr-id` | `Attribute.id`  | Уникальный ID атрибута | Идентификация в дереве, кнопках редактирования/удаления  |
| `data-action`  | —               | Тип действия           | `select-attribute`, `edit-attribute`, `delete-attribute` |

**Пример:**

```html
<span
  data-type="attribute"
  data-attr-id="EAID_3FC50F42"
  data-action="select-attribute"
>
  <button data-action="edit-attribute" data-attr-id="EAID_3FC50F42">
    <button
      data-action="delete-attribute"
      data-attr-id="EAID_3FC50F42"
    ></button></button
></span>
```

---

### 7. **ClassLink (Связь класса)**

| Data-атрибут           | Источник данных           | Описание            | Использование                                           |
| ---------------------- | ------------------------- | ------------------- | ------------------------------------------------------- |
| `data-link-id`         | `ClassLink.linkId`        | Уникальный ID связи | Идентификация в дереве, кнопках редактирования/удаления |
| `data-link-kind`       | `ClassLink.relationKind`  | Тип связи           | `Generalization`, `Association`                         |
| `data-target-class-id` | `ClassLink.targetClassId` | ID целевого класса  | Связь с целевым классом                                 |
| `data-action`          | —                         | Тип действия        | `select-link`, `edit-link`, `delete-link`               |

**Пример:**

```html
<span
  data-type="link"
  data-link-id="EAID_13C9A56B"
  data-link-kind="Generalization"
  data-target-class-id="EAID_F8D24DB4"
  data-action="select-link"
>
  <button data-action="edit-link" data-link-id="EAID_13C9A56B">
    <button
      data-action="delete-link"
      data-link-id="EAID_13C9A56B"
    ></button></button
></span>
```

---

### 8. **Literal (Значение Enumeration)**

| Data-атрибут      | Источник данных | Описание               | Использование                                            |
| ----------------- | --------------- | ---------------------- | -------------------------------------------------------- |
| `data-literal-id` | `Literal.id`    | Уникальный ID литерала | Идентификация в таблице, кнопках редактирования/удаления |
| `data-action`     | —               | Тип действия           | `edit-literal`, `delete-literal`                         |

**Пример:**

```html
<tr data-literal-id="EAID_8AD35949">
  <button data-action="edit-literal" data-literal-id="EAID_8AD35949">
    <button
      data-action="delete-literal"
      data-literal-id="EAID_8AD35949"
    ></button>
  </button>
</tr>
```

---

### 9. **Tabs (Табы в классе)**

| Data-атрибут       | Источник данных | Описание                    | Использование                                    |
| ------------------ | --------------- | --------------------------- | ------------------------------------------------ |
| `data-section-tab` | —               | Идентификатор таба          | `item-attributes`, `item-links`, `item-literals` |
| `data-tab-content` | —               | Идентификатор контента таба | Соответствует `data-section-tab`                 |
| `data-tab`         | —               | Привязка кнопки к табу      | Связь кнопки действия с табом                    |

**Пример:**

```html
<div data-section-tab="item-attributes" data-class-id="EAID_9A4F1243">
  <div data-tab-content="item-attributes">
    <button data-tab="item-attributes" id="add-attribute-btn"></button>
  </div>
</div>
```

---

### 10. **Modal (Модальные окна)**

| Data-атрибут      | Источник данных | Описание                        | Использование                                              |
| ----------------- | --------------- | ------------------------------- | ---------------------------------------------------------- |
| `data-modal-open` | —               | ID модального окна для открытия | `new-model-modal`, `new-profile-modal`, `edit-model-modal` |

**Пример:**

```html
<button data-modal-open="new-model-modal">
  <div data-modal-open="new-profile-modal"></div>
</button>
```

---

### 11. **Tree Actions (Действия в дереве)**

| Data-атрибут   | Описание                      | Значения                                                                                                                                    |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-action`  | Тип действия                  | `toggle-project`, `toggle-tree-item`, `select-model`, `select-profile`, `select-package`, `select-class`, `select-attribute`, `select-link` |
| `data-item-id` | Уникальный ID элемента дерева | Формат: `model-{projectId}-{index}`, `profile-{projectId}-{index}`, `pkg-{parentId}-{index}`                                                |

**Пример:**

```html
<button data-action="toggle-tree-item" data-item-id="model-project123-0">
  <button data-action="toggle-project" data-project-id="project-123"></button>
</button>
```

---

## 📄 Страница: `projects. html`

### 1. **Project Actions**

| Data-атрибут      | Источник данных | Описание              | Использование                                                              |
| ----------------- | --------------- | --------------------- | -------------------------------------------------------------------------- |
| `data-project-id` | `Project.id`    | Уникальный ID проекта | Все действия с проектом                                                    |
| `data-action`     | —               | Тип действия          | `select-project`, `edit-project`, `delete-project`, `open-project-details` |

**Пример:**

```html
<div class="project-card" data-project-id="project-123">
  <button data-action="select-project" data-project-id="project-123">
    <button data-action="edit-project" data-project-id="project-123">
      <button data-action="delete-project" data-project-id="project-123">
        <button
          data-action="open-project-details"
          data-project-id="project-123"
        ></button>
      </button>
    </button>
  </button>
</div>
```

---

## 📄 Страница: `index.html`

### 1. **Project Actions (упрощенные)**

| Data-атрибут      | Источник данных | Описание              | Использование          |
| ----------------- | --------------- | --------------------- | ---------------------- |
| `data-project-id` | `Project.id`    | Уникальный ID проекта | Открытие проекта       |
| `data-action`     | —               | Тип действия          | `open-project-details` |

**Пример:**

```html
<button
  data-action="open-project-details"
  data-project-id="project-123"
></button>
```

---

## 🗂️ Сводная таблица: Все data-атрибуты

| Атрибут                  | Тип данных | Источник                       | Страницы        | Назначение                                                                        |
| ------------------------ | ---------- | ------------------------------ | --------------- | --------------------------------------------------------------------------------- |
| `data-project-id`        | `string`   | `Project.id`                   | All             | Идентификация проекта                                                             |
| `data-model-id`          | `string`   | `Model.id`                     | project-details | Идентификация модели                                                              |
| `data-profile-id`        | `string`   | `Profile.id`                   | project-details | Идентификация профиля                                                             |
| `data-package-id`        | `string`   | `Package.id`                   | project-details | Идентификация пакета                                                              |
| `data-class-id`          | `string`   | `Class.id`                     | project-details | Идентификация класса                                                              |
| `data-attr-id`           | `string`   | `Attribute.id`                 | project-details | Идентификация атрибута                                                            |
| `data-link-id`           | `string`   | `ClassLink.linkId`             | project-details | Идентификация связи                                                               |
| `data-literal-id`        | `string`   | `Literal.id`                   | project-details | Идентификация литерала                                                            |
| `data-ref-model-id`      | `string`   | `Class.refModelId`             | project-details | Ссылка на исходную модель (для профилей)                                          |
| `data-ref-model-item-id` | `string`   | `Class.refModelItemId`         | project-details | Ссылка на исходный класс (для профилей)                                           |
| `data-is-enumeration`    | `boolean`  | `Class.type === 'Enumeration'` | project-details | Флаг Enumeration                                                                  |
| `data-is-abstract`       | `boolean`  | `Class.isAbstract`             | project-details | Флаг абстрактного класса                                                          |
| `data-link-kind`         | `string`   | `ClassLink.relationKind`       | project-details | Тип связи (Generalization/Association)                                            |
| `data-target-class-id`   | `string`   | `ClassLink.targetClassId`      | project-details | ID целевого класса связи                                                          |
| `data-action`            | `string`   | —                              | All             | Тип действия (см. раздел Actions)                                                 |
| `data-item-id`           | `string`   | Generated                      | project-details | Уникальный ID элемента дерева для expand/collapse                                 |
| `data-section-tab`       | `string`   | —                              | project-details | Идентификатор таба (`item-attributes`, `item-links`, `item-literals`)             |
| `data-tab-content`       | `string`   | —                              | project-details | Идентификатор контента таба                                                       |
| `data-tab`               | `string`   | —                              | project-details | Привязка кнопки к табу                                                            |
| `data-modal-open`        | `string`   | —                              | All             | ID модального окна для открытия                                                   |
| `data-type`              | `string`   | —                              | project-details | Тип элемента дерева (`model`, `profile`, `package`, `class`, `attribute`, `link`) |

---

## 🎯 Actions (data-action)

### Project Actions

- `select-project` — Выбор проекта
- `edit-project` — Редактирование проекта
- `delete-project` — Удаление проекта
- `open-project-details` — Открытие страницы деталей проекта
- `toggle-project` — Раскрытие/сворачивание проекта в дереве

### Model Actions

- `select-model` — Выбор модели
- `edit-model` — Редактирование модели
- `delete-model` — Удаление модели
- `import-model` — Импорт модели
- `export-model` — Экспорт модели
- `check-model` — Проверка модели

### Profile Actions

- `select-profile` — Выбор профиля
- `edit-profile` — Редактирование профиля
- `delete-profile` — Удаление профиля
- `import-profile` — Импорт профиля
- `export-profile` — Экспорт профиля
- `check-profile` — Проверка профиля

### Package Actions

- `select-package` — Выбор пакета

### Class Actions

- `select-class` — Выбор класса

### Attribute Actions

- `select-attribute` — Выбор атрибута
- `edit-attribute` — Редактирование атрибута
- `delete-attribute` — Удаление атрибута

### Link Actions

- `select-link` — Выбор связи
- `edit-link` — Редактирование связи
- `delete-link` — Удаление связи

### Literal Actions

- `edit-literal` — Редактирование литерала
- `delete-literal` — Удаление литерала

### Tree Actions

- `toggle-tree-item` — Раскрытие/сворачивание элемента дерева

---

## 📝 Примечания

1. **Все ID** в системе являются **UUID** или **строками** (для импортированных данных из внешних систем)
2. **data-action** используется для делегирования событий (event delegation)
3. **data-item-id** генерируется динамически для управления состоянием дерева (expand/collapse)
4. **Nullable поля** (`modelId`, `profileId`, `refModelId`, `refModelItemId`) могут быть `null` или `""` — проверяйте на наличие значения
5. **Boolean атрибуты** (`data-is-enumeration`, `data-is-abstract`) передаются как строки `"true"` или `"false"`

---

Готово! 📋 Эта документация будет использоваться для дальнейшей разработки и обеспечения консистентности data-атрибутов во всем приложении. 🚀
