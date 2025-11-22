// Данные модели IEC61968 в формате JavaScript
// Можно вставить прямо в data.js или использовать как отдельный модуль

const MODEL_LIGHT_DATA = {
  "totalPackages": 14,
  "totalElements": 123,
  "totalAttributes": 342,
  "totalLinks": 218,
  "rootPackages": [
    {
      "id": "EAPK_A395E6F1_5B32_439a_8A27_2670237584E0",
      "name": "IEC61968",
      "type": "Package",
      "description": "Пакет верхнего уровня для IEC 61968.",
      "elementCount": 1,
      "elements": [
        {
          "id": "EAID_421FE0F5_637F_4d59_8483_619A82FA3FB6",
          "name": "IEC61968CIMVersion",
          "type": "Class",
          "description": "Номер версии IEC 61968 CIM, присвоенный этой модели UML.",
          "visibility": "public",
          "isAbstract": false,
          "attributeCount": 2,
          "linkCount": 0,
          "attributes": [
            {
              "name": "date",
              "type": "Date",
              "description": "Форма - ГГГГ-ММ-ДД, например, для 5 января 2009 года это 2009-01-05.",
              "multiplicity": "1",
              "visibility": "public"
            },
            {
              "name": "version",
              "type": "String",
              "description": "Форма - IEC61968CIMXXvYY, где XX - основная версия пакета CIM, а YY - младшая версия. Например, IEC61968CIM10v17a.",
              "multiplicity": "1",
              "visibility": "public"
            }
          ],
          "links": []
        }
      ],
      "children": [
        {
          "id": "EAPK_B566F0C3_27CA_4e61_B16F_54AC3A86094A",
          "name": "LoadControl",
          "type": "Package",
          "description": "Этот пакет содержит информационные классы, которые поддерживают специализированные приложения, такие как управление спросом с использованием оборудования для мониторинга нагрузки.",
          "elementCount": 2,
          "elements": [
            {
              "id": "EAID_60F6FA16_E95D_453f_B107_048EACEB8131",
              "name": "ConnectDisconnectFunction",
              "type": "Class",
              "description": "Функция, которая отключает и повторно подключает нагрузку клиента при определенных условиях.",
              "visibility": "public",
              "isAbstract": false,
              "attributeCount": 8,
              "linkCount": 1,
              "attributes": [
                {
                  "name": "eventCount",
                  "type": "Integer",
                  "description": "Запуск кумулятивного подсчета событий подключения или отключения в течение всего срока службы функции или до тех пор, пока значение не будет очищено.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isConnected",
                  "type": "Boolean",
                  "description": "TRUE, если функция, указанная в предыдущей позиции, находится в подключенном состоянии.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isDelayedDiscon",
                  "type": "Boolean",
                  "description": "Если установлено значение TRUE, коммутатор может отключить службу в конце заданной временной задержки после подачи сигнала отключения. Если установлено значение FALSE, коммутатор может отключить службу сразу же после подачи сигнала об отключении.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isLocalAutoDisconOp",
                  "type": "Boolean",
                  "description": "Если установлено значение TRUE и если отключение, указанное в предыдущей позиции, может осуществляться локально, то операция происходит автоматически. В противном случае это происходит вручную.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isLocalAutoReconOp",
                  "type": "Boolean",
                  "description": "Если установлено значение TRUE и если повторное подключение после отключения, указанного в предыдущей позиции, может выполняться локально, то операция происходит автоматически. В противном случае это происходит вручную.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isRemoteAutoDisconOp",
                  "type": "Boolean",
                  "description": "Если установлено значение TRUE и если отключение, указанное в предыдущей позиции, может управляться удаленно, то операция происходит автоматически. Если установлено значение FALSE и отключением можно управлять удаленно, то операция выполняется вручную.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isRemoteAutoReconOp",
                  "type": "Boolean",
                  "description": "Если установлено значение TRUE и если повторное подключение после отключения, указанного в предыдущей позиции, может осуществляться удаленно, то операция происходит автоматически. Если установлено значение FALSE и если повторное подключение может осуществляться удаленно, то операция выполняется вручную.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "rcdInfo",
                  "type": "RemoteConnectDisconnectInfo",
                  "description": "Информация о реле включения/отключения.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                }
              ],
              "links": [
                {
                  "assoc_id": "EAID_E5E04630_31A6_46ff_9B42_BA31D08C5377",
                  "relation_kind": "Generalization",
                  "role": "child",
                  "target_class_id": "EAID_47A8D588_D4EE_4452_A925_05BB7E7999C3",
                  "target_class_name": "EndDeviceFunction",
                  "target_class_role_name": null,
                  "src_class_role_name": null,
                  "target_description": null,
                  "multiplicity": "1"
                }
              ]
            },
            {
              "id": "EAID_43C2356B_8F95_4a41_80F7_8C03A3887983",
              "name": "RemoteConnectDisconnectInfo",
              "type": "Class",
              "description": "Подробная информация о функции удаленного подключения и отключения.",
              "visibility": "public",
              "isAbstract": false,
              "attributeCount": 12,
              "linkCount": 0,
              "attributes": [
                {
                  "name": "armedTimeout",
                  "type": "Seconds",
                  "description": "Настройка тайм-аута истекшего времени.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "customerVoltageLimit",
                  "type": "Voltage",
                  "description": "Предел напряжения на стороне потребителя выключателя, выше которого подключение не должно выполняться.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "energyLimit",
                  "type": "RealEnergy",
                  "description": "Лимит энергии перед отключением.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "energyUsageStartDateTime",
                  "type": "DateTime",
                  "description": "Дата начала и время накопления энергии для ограничения энергопотребления.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "energyUsageWarning",
                  "type": "RealEnergy",
                  "description": "Предупреждение об ограничении энергии, используемое для запуска кода события, что потребление энергии приближается к пределу.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isArmConnect",
                  "type": "Boolean",
                  "description": "TRUE, если переключатель должен быть включен до начала действия подключения.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isArmDisconnect",
                  "type": "Boolean",
                  "description": "TRUE, если переключатель должен быть включен до начала действия отключения.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "isEnergyLimiting",
                  "type": "Boolean",
                  "description": "TRUE, если потребление энергии ограничено, и клиент будет отключен, если он превысит лимит.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "needsPowerLimitCheck",
                  "type": "Boolean",
                  "description": "TRUE, если необходимо проверить предел нагрузки для немедленного отключения (после подключения), если нагрузка превышает предел.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "needsVoltageLimitCheck",
                  "type": "Boolean",
                  "description": "TRUE, если предел напряжения должен быть проверен, чтобы предотвратить подключение, если напряжение превышает предел.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "powerLimit",
                  "type": "ActivePower",
                  "description": "Лимит мощности, выше которого подключение либо не должно происходить, либо должно привести к немедленному отключению.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                },
                {
                  "name": "usePushbutton",
                  "type": "Boolean",
                  "description": "TRUE, если для подключения необходимо использовать кнопку.",
                  "multiplicity": "0..1",
                  "visibility": "public"
                }
              ],
              "links": []
            }
          ],
          "children": []
        }
      ]
    }
  ]
};

// Использование:
// MemoryStore.addProject({ id: 998, name: "IEC61968 Light", models: [convertFoclPackageToModel(MODEL_LIGHT_DATA.rootPackages[0])] });
