/**
 * HABmin - the openHAB admin interface
 *
 * openHAB, the open Home Automation Bus.
 * Copyright (C) 2010-2013, openHAB.org <admin@openhab.org>
 *
 * See the contributors.txt file in the distribution for a
 * full listing of individual contributors.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <http://www.gnu.org/licenses>.
 *
 * Additional permission under GNU GPL version 3 section 7
 *
 * If you modify this Program, or any covered work, by linking or
 * combining it with Eclipse (or a modified version of that library),
 * containing parts covered by the terms of the Eclipse Public License
 * (EPL), the licensors of this Program grant you additional permission
 * to convey the resulting work.
 */

/** OpenHAB Admin Console HABmin
 *
 * @author Chris Jackson
 */

var force_transport = 'auto';

Ext.Container.prototype.bufferResize = false;

Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false, // For debug only
    'paths': {
        'Ext.ux': 'js/extux',
        'Ext.ux.window': 'js/extux/notification',
        'Ext.ux.grid.property': 'js/extux/propertygrid',
        'Ext.ux.aceeditor': 'js/extux/aceeditor',
        'openHAB': 'app'
    }
});

Ext.require([
    'Ext.tab.*',
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.form.*',
    'Ext.tree.Panel',
    'Ext.container.Viewport',
    'Ext.selection.CellModel',
    'Ext.layout.container.Border',
    'Ext.layout.container.Accordion',
    'Ext.ux.statusbar.StatusBar',
    'Ext.ux.aceeditor.Panel',
    'Ext.ux.window.Notification',
    'openHAB.graph.graph',
    'openHAB.graph.saveGraph',
    'openHAB.graph.itemList',
    'openHAB.graph.graphList',
    'openHAB.graph.graphTable',
    'openHAB.graph.graphHighcharts',
    'openHAB.config.config',
    'openHAB.config.bindingList',
    'openHAB.config.bindingProperties',
    'openHAB.config.groupTree',
    'openHAB.config.itemBindings',
    'openHAB.config.itemList',
    'openHAB.config.itemProperties',
    'openHAB.config.itemRules',
    'openHAB.config.mappingList',
    'openHAB.config.mappingProperties',
    'openHAB.config.sitemapList',
    'openHAB.config.sitemapTheme',
    'openHAB.config.zwaveDeviceList',
    'openHAB.config.zwaveProductList',
    'openHAB.config.zwaveNetwork',
    'openHAB.config.sitemapProperties',
    'openHAB.system.system',
    'openHAB.system.logViewer',
    'openHAB.system.systemBundles',
    'openHAB.automation.automation',
    'openHAB.automation.notificationList',
    'openHAB.automation.ruleList',
    'openHAB.automation.ruleLibrary',
    'openHAB.automation.ruleProperties'
]);

var viewPort;

var statusTooltip;
var STATUS_ONLINE = 1;
var STATUS_BUSY = 2;
var STATUS_OFFLINE = 3;
var onlineStatus = STATUS_OFFLINE;

var NOTIFICATION_ERROR = 1;
var NOTIFICATION_OK = 2;
var NOTIFICATION_WARNING = 3;

// Global data stores from openHAB
var persistenceItemStore;
var persistenceServiceStore;
var itemTypeStore;
var itemIconStore;
var widgetStore;
var sitemapStore;
var bindingStore;
var itemConfigStore;
var itemFormatStore;
var translationServiceStore;
var ruleLibraryStore;
var ruleStore;
var cronRuleStore;

// Global variables
var persistenceService = "";
var HABminBaseURL = "/services/habmin";

// User preferences
var userPrefs = {};

var itemTypeArray = [
    {name: "GroupItem", icon: "images/category-group.png"},
    {name: "SwitchItem", icon: "images/switch.png"},
    {name: "NumberItem", icon: "images/counter.png"},
    {name: "ColorItem", icon: "images/color.png"},
    {name: "ContactItem", icon: "images/door-open.png"},
    {name: "DateTimeItem", icon: "images/clock.png"},
    {name: "DimmerItem", icon: "images/ui-slider.png"},
    {name: "RollerShutterItem", icon: "images/curtain.png"},
    {name: "StringItem", icon: "images/edit.png"}
];

var widgetTypeArray = [
    {type: "Group", icon: "images/ui-scroll-pane.png", iconCls: "widget-group"},
    {type: "Frame", icon: "images/ui-group-box.png", iconCls: "widget-frame"},
    {type: "Image", icon: "images/picture.png", iconCls: "widget-image"},
    {type: "Selection", icon: "images/ui-combo-box-blue.png", iconCls: "widget-selection"},
    {type: "Slider", icon: "images/ui-slider.png", iconCls: "widget-slider"},
    {type: "Video", icon: "images/film.png", iconCls: "widget-video"},
    {type: "Webview", icon: "images/globe.png", iconCls: "widget-webview"},
    {type: "Setpoint", icon: "images/ui-scroll-bar.png", iconCls: "widget-setpoint"},
    {type: "Switch", icon: "images/switch.png", iconCls: "widget-switch"},
    {type: "Colorpicker", icon: "images/color.png", iconCls: "widget-colorpicker"},
    {type: "Text", icon: "images/edit.png", iconCls: "widget-text"}
];

var formatLookupArray = [
    {format: '%d', label: 'Integer'},
    {format: '%.1f', label: 'Float (1 decimal place)'},
    {format: '%.2f', label: 'Float (2 decimal place)'},
    {format: '%.3f', label: 'Float (3 decimal place)'},
    {format: '%b', label: 'Boolean (lower case)'},
    {format: '%B', label: 'Boolean (upper case)'},
    {format: '%s', label: 'String (lower case)'},
    {format: '%S', label: 'String (upper case)'},
    {format: '%x', label: 'Hexadecimal (lower case)'},
    {format: '%X', label: 'Hexadecimal (upper case)'},
    {format: '%o', label: 'Octal'},
    {format: '%1$tR', label: 'Time (HH:MM)'},
    {format: '%1$tT', label: 'Time (HH:MM:SS)'},
    {format: '%1$td %1$tb %1$tY', label: 'Date (dd MMM YYYY)'},
    {format: '%1$ta %1$td %1$tb %1$tY', label: 'Date (DDD dd MMM YYYY)'},
    {format: '%1$ta %1$tR', label: 'Day/Time (DDD HH:MM)'},
    {format: '%1$ta %1$tT', label: 'Day/Time (DDD HH:MM:SS)'},
    {format: '%1$td %1$tb %1$tY %1$tR', label: 'Date/Time (dd MMM YYYY HH:MM)'},
    {format: '%1$td %1$tb %1$tY %1$tT', label: 'Date/Time (dd MMM YYYY HH:MM:SS)'},
    {format: '%1$tT %1$td %1$tb %1$tY', label: 'Date/Time (HH:MM:SS dd MMM YYYY)'}
];

var translationServiceArray = [
    {name: "MAP", label: "Map File"},
    {name: "REGEX", label: "Regular Expression"},
    {name: "JAVASCRIPT", label: "JavaScript"},
    {name: "EXEC", label: "Exec"},
    {name: "XSLT", label: "XML Style Sheet"},
    {name: "XPATH", label: "XPath"}
];

var cronRuleArray = [
    {label: "Every 15 seconds", rule: "0/15 * * * * ?"},
    {label: "Every 30 seconds", rule: "0/30 * * * * ?"},
    {label: "Every 1 minute", rule: "0 * * * * ?"},
    {label: "Every 2 minutes", rule: "0/2 * * * * ?"},
    {label: "Every 5 minutes", rule: "0/5 * * * * ?"},
    {label: "Every 10 minutes", rule: "0/10 * * * * ?"},
    {label: "Every 15 minutes", rule: "0/15 * * * * ?"},
    {label: "Every 20 minutes", rule: "0/20 * * * * ?"},
    {label: "Every 30 minutes", rule: "0/30 * * * * ?"},
    {label: "Every 1 hour", rule: "0 0 * * * ?"},
    {label: "Every 2 hours", rule: "0 0 0/2 * * ?"},
    {label: "Every 3 hours", rule: "0 0 0/3 * * ?"},
    {label: "Every 6 hours", rule: "0 0 0/6 * * ?"},
    {label: "Every 12 hours (midday/midnight)", rule: "0 0 0/12 * * ?"},
    {label: "Every day at midday", rule: "0 0 12 * * ?"},
    {label: "Every day at midnight", rule: "0 0 0 * * ?"}
];

var initState = 0;
var initList = [
    {type: 0, name: "openHAB Version", variable: "openHABVersion", url: "/static/version", fatal: true, notify: "Unable to get openHAB version"}//,
];


Ext.application({
    name: 'HABmin',
    launch: function () {
        initState = 0;
        loadNextConfig();
    }
});

Ext.Ajax.defaultHeaders = {
    'Accept': 'application/json,application/xml',
    'Content-Type': 'application/json'
};

function loadNextConfig() {
    Ext.Ajax.request({
        url: initList[initState].url,
        headers: {'Accept': 'application/json'},

        success: function (response, opts) {
            if (response.responseText == "No handler") {
                loadError(initList[initState].notify);
                return;
            }

            if (initList[initState].type == 0) {
                openHABVersion = response.responseText;
                Ext.fly('openHABVersion').update(openHABVersion, false);
//              Ext.fly('guiVersion').update(guiVersion, false);
            }
            else
                window[initList[initState].variable] = Ext.decode(response.responseText);


            initState++;

            if (initState < initList.length) {
                loadNextConfig();
                return;
            }

            // All configs loaded
            createUI();
        },
        failure: function (response, opts) {
            if (initList[initState].fatal == true) {
                loadError(initList[initState].notify);
                return;
            }

            // Error was non-fatal. Ignore and continue
            initState++;

            if (initState < initList.length) {
                loadNextConfig();
                return;
            }

            // All configs loaded
            createUI();
        }
    });
}

function loadError(errorText) {
}

// Handle user preferences
// This ensures that all required preferences are set, and are valid
function checkUserPrefs() {
    if(userPrefs == null)
        userPrefs = {};

    // Time to show error message
    if(userPrefs.messageTimeError == null)
        userPrefs.messageTimeError = 2500;
    if(userPrefs.messageTimeError > 10000)
        userPrefs.messageTimeError = 2500;
    if(userPrefs.messageTimeError < 0)
        userPrefs.messageTimeError = 2500;

    // Time to show warning message
    if(userPrefs.messageTimeWarning == null)
        userPrefs.messageTimeWarning = 2500;
    if(userPrefs.messageTimeWarning > 10000)
        userPrefs.messageTimeWarning = 2500;
    if(userPrefs.messageTimeWarning < 0)
        userPrefs.messageTimeWarning = 2500;

    // Time to show ok message
    if(userPrefs.messageTimeSuccess == null)
        userPrefs.messageTimeSuccess = 1500;
    if(userPrefs.messageTimeSuccess > 10000)
        userPrefs.messageTimeSuccess = 1500;
    if(userPrefs.messageTimeSuccess < 0)
        userPrefs.messageTimeSuccess = 1500;
}

function handleStatusNotification(type, message) {
    if(type == NOTIFICATION_ERROR) {
        Ext.create('widget.uxNotification', {
            position: 'tr',
            useXAxis: false,
            cls: 'ux-notification-error',
            iconCls: 'ux-notification-error-icon',
            closable: true,
            title: 'Error',
            html: message,
            slideInDuration: 800,
            slideBackDuration: 1500,
            autoCloseDelay: 20000,
            width: 250,
            height: 75,
            slideInAnimation: 'bounceOut',
            slideBackAnimation: 'easeIn'
        }).show();
    }
    else if(type == NOTIFICATION_WARNING) {
        Ext.create('widget.uxNotification', {
            position: 'tr',
            useXAxis: false,
            cls: 'ux-notification-warning',
            iconCls: 'ux-notification-warning-icon',
            closable: false,
            title: 'Warning',
            html: message,
            slideInDuration: 800,
            slideBackDuration: 1500,
            autoCloseDelay: 3000,
            width: 250,
            height: 75,
            slideInAnimation: 'bounceOut',
            slideBackAnimation: 'easeIn'
        }).show();
    }
    else {
        Ext.create('widget.uxNotification', {
            position: 'tr',
            useXAxis: false,
            cls: 'ux-notification-success',
            iconCls: 'ux-notification-success-icon',
            closable: false,
            title: 'Success',
            html: message,
            slideInDuration: 800,
            slideBackDuration: 1500,
            autoCloseDelay: 3000,
            width: 250,
            height: 75,
            slideInAnimation: 'bounceOut',
            slideBackAnimation: 'easeIn'
        }).show();
    }
}

function handleOnlineStatus(newStatus) {
    // Don't do anything if the status hasn't changed
    if(onlineStatus == newStatus)
        return;
    onlineStatus = newStatus;

    if (newStatus == STATUS_ONLINE) {
        Ext.get('statusicon').dom.src = 'images/status.png';
        statusTooltip.update("openHAB is online");
        handleStatusNotification(NOTIFICATION_OK, "openHAB is online");
    }
    else if (newStatus == STATUS_BUSY) {
        Ext.get('statusicon').dom.src = 'images/status-busy.png';
        statusTooltip.update("openHAB is busy");
        handleStatusNotification(NOTIFICATION_WARNING, "openHAB is busy");
    }
    else if (newStatus == STATUS_OFFLINE) {
        Ext.get('statusicon').dom.src = 'images/status-offline.png';
        statusTooltip.update("openHAB is offline");
        handleStatusNotification(NOTIFICATION_ERROR, "openHAB is offline");
    }
}

function doStatus() {
    // Periodically retrieve the openHAB server status updates
    var updateStatus = {
        run: function () {
            Ext.Ajax.request({
                type:'rest',
                url:HABminBaseURL + '/status',
                method: 'GET',
                success: function (response, opts) {
                    var res = Ext.decode(response.responseText);
                    if(res == null) {
                        handleOnlineStatus(STATUS_OFFLINE);
                    }
                    else {
                        handleOnlineStatus(STATUS_ONLINE);
                    }
                },
                failure: function (response, opts) {
                    handleOnlineStatus(STATUS_OFFLINE);
                }
            });
        },
        interval: 5000
    }
    Ext.TaskManager.start(updateStatus);
}


// Return an icon based on the ItemType
function getItemTypeIcon(type) {
    var ref = itemTypeStore.findExact("name", type);
    if (ref == -1)
        return "";
    else
        return itemTypeStore.getAt(ref).get('icon');
}

var iterationCnt = 0;

function makeItemGroupTree(parent, group) {
    return;
    // Keep track of the number of iterations
    iterationCnt++;
    if (iterationCnt == 8)
        return;

    // Loop through the configuration
    openHABItems = persistenceStore.getProxy().getReader().getResponseData();
    var numItems = openHABItems.item.length;
    for (var iItem = 0; iItem < numItems; ++iItem) {
        var newItem = [];
        var newItemPnt;

        // Ensure the groups is an array!
        var itemGroups = [].concat(openHABItems.item[iItem].groups);

        // Check if the item is in the required group
        if (itemGroups.indexOf(group) == -1) {
            continue;
        }

        // Create the new item
        newItem.Parent = openHABItems.item[iItem].name;
        newItem.State = openHABItems.item[iItem].state;
        newItem.Type = openHABItems.item[iItem].type;
        newItem.iconCls = 'node-device';
        newItem.children = [];

        // Check if this is a group
        if (openHABItems.item[iItem].type == "GroupItem") {
            makeItemGroupTree(newItem.children, newItem.Parent)
        }

        parent.push(newItem);
    }
    iterationCnt--;
}

function createUI() {
    delete Ext.tip.Tip.prototype.minWidth;

    //======= Quartz CRON Rule Store
    Ext.define('CRONRuleModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'rule'},
            {name: 'label'}
        ]
    });

    // Create the data store
    cronRuleStore = Ext.create('Ext.data.ArrayStore', {
        model: 'CRONRuleModel'
    });
    cronRuleStore.loadData(cronRuleArray);


    //======= Translation Services Store
    Ext.define('TranslationServiceModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'label'}
        ]
    });

    // Create the data store
    translationServiceStore = Ext.create('Ext.data.ArrayStore', {
        model: 'TranslationServiceModel'
    });
    translationServiceStore.loadData(translationServiceArray);


    //======= Item Type Store
    Ext.define('ItemTypeModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'label'},
            {name: 'icon'}
        ]
    });

    // Create the Item data store
    itemTypeStore = Ext.create('Ext.data.ArrayStore', {
        model: 'ItemTypeModel'
    });
    itemTypeStore.loadData(itemTypeArray);


    //======= Persistence Service Store
    Ext.define('PersistenceServiceModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'actions'},
            {name: 'strategies'}
        ]
    });

    persistenceServiceStore = Ext.create('Ext.data.JsonStore', {
            model: 'PersistenceServiceModel',
            proxy: {
                type: 'rest',
                url: HABminBaseURL + '/config/persistence/services',
                reader: {
                    type: 'json',
                    root: 'services'
                },
                headers: {'Accept': 'application/json'},
                pageParam: undefined,
                startParam: undefined,
                sortParam: undefined,
                limitParam: undefined
            },
            autoLoad: true,
            listeners: {
                load: function (store, records, options) {
                    // Get the selection menu
                    var menu = Ext.getCmp("persistenceServiceMenu");

                    // Select the default service
                    for (var cnt = 0; cnt < store.getCount(); cnt++) {
                        var actions = [].concat(store.getAt(cnt).get("actions"));
                        // TODO: Better method to determine default needed!!!
                        if (actions.indexOf("Read")) {
                            persistenceService = store.getAt(cnt).get("name");
                            var newItem = {};
                            newItem.text = store.getAt(cnt).get("name");
                            newItem.icon = "images/database-sql.png";
                            newItem.disabled = false;
                            menu.add(newItem);
                        }
                    }

                    // Update the button for selecting the persistence service
                    var button = Ext.getCmp("persistenceServiceSelect");
                    if (button != null) {
                        button.setText(persistenceService);
                        persistenceItemStore.filterItems(persistenceService);
                    }
                }
            }
        }
    )
    ;


//======= Persistence Items Store
    Ext.define('PersistenceItemModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'label'},
            {name: 'unit'},
            {name: 'format'},
            {name: 'state'},
            {name: 'icon'},
            {name: 'type'},
            {name: 'services'},
            {name: 'groups'}
        ]
    });

    persistenceItemStore = Ext.create('Ext.data.ArrayStore', {
        model: 'PersistenceItemModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/persistence/items',
            reader: {
                type: 'json',
                root: 'items'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true,
        filterItems: function (service) {
            persistenceItemStore.filterBy(function (rec, id) {
                var serviceList = [].concat(rec.get('services'));
                if (serviceList.indexOf(service) != -1)
                    return true;
                else
                    return false;
            });
        }
    });


//======= Item Icon Store
    Ext.define('ItemIconModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'menuicon'},
            {name: 'label'},
            {name: 'description'},
            {name: 'height'},
            {name: 'width'}
        ]
    });

    itemIconStore = Ext.create('Ext.data.ArrayStore', {
        model: 'ItemIconModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/icons',
            reader: {
                type: 'json',
                root: 'icon'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });

//======= Rule Template Store
    Ext.define('RuleTemplateModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'name'},
            {name: 'label'},
            {name: 'type'},
            {name: 'itemtype'},
            {name: 'description'},
            {name: 'extension'},
            {name: 'trigger'},
            {name: 'action'},
            {name: 'variable'},
            {name: 'linkeditem'}
        ]
    });

    // Load the rules for this item
    ruleLibraryStore = Ext.create('Ext.data.JsonStore', {
        model: 'RuleTemplateModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/rules/library/list',
            reader: {
                type: 'json',
                root: 'rule'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });

//======= Widgets Store
    Ext.define('WidgetsModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'type'},
            {name: 'icon'},
            {name: 'iconCls'}
        ]
    });

// Create the Widgets data store
    widgetStore = Ext.create('Ext.data.ArrayStore', {
        model: 'WidgetsModel'
    });
    widgetStore.loadData(widgetTypeArray);


//======= Item Format Store
    Ext.define('FormatModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'format'},
            {name: 'label'}
        ]
    });

// Create the Widgets data store
    itemFormatStore = Ext.create('Ext.data.ArrayStore', {
        model: 'FormatModel'
    });
    itemFormatStore.loadData(formatLookupArray);


//======= Rule Store
    Ext.define('RuleModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'item'},
            {name: 'name'},
            {name: 'label'},
            {name: 'description'}
        ]
    });

    ruleStore = Ext.create('Ext.data.ArrayStore', {
        model: 'RuleModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/rules/list',
            reader: {
                type: 'json',
                root: 'rule'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });


//======= Item Config Store
    Ext.define('ItemConfigModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'model'},
            {name: 'name'},
            {name: 'type'},
            {name: 'icon'},
            {name: 'type'},
            {name: 'label'},
            {name: 'format'},
            {name: 'units'},
            {name: 'groups'}
        ]
    });

    itemConfigStore = Ext.create('Ext.data.ArrayStore', {
        model: 'ItemConfigModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/items',
            reader: {
                type: 'json',
                root: 'item'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });


//======= Sitemap Store
    Ext.define('SitemapsModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'icon'},
            {name: 'name'},
            {name: 'label'}
        ]
    });

    sitemapStore = Ext.create('Ext.data.ArrayStore', {
        model: 'SitemapsModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/sitemap',
            reader: {
                type: 'json',
                root: 'sitemap'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });


//======= Bindings Store
    Ext.define('BindingsModel', {
        extend: 'Ext.data.Model',
        fields: [
            {name: 'bundle'},
            {name: 'name'},
            {name: 'pid'},
            {name: 'type'},
            {name: 'author'},
            {name: 'version'},
            {name: 'ohversion'},
            {name: 'link'},
            {name: 'osgiVersion'}
        ]
    });

// Create the Bindings data store
    bindingStore = Ext.create('Ext.data.ArrayStore', {
        model: 'BindingsModel',
        proxy: {
            type: 'rest',
            url: HABminBaseURL + '/config/bindings',
            reader: {
                type: 'json',
                root: 'binding'
            },
            headers: {'Accept': 'application/json'},
            pageParam: undefined,
            startParam: undefined,
            sortParam: undefined,
            limitParam: undefined
        },
        autoLoad: true
    });

    var configTab = Ext.create('openHAB.config.config');
    var chartTab = Ext.create('openHAB.graph.graph');
    var automationTab = Ext.create('openHAB.automation.automation');
    var systemTab = Ext.create('openHAB.system.system');

    Ext.define('StatusBar', {
        extend: 'Ext.Component',
        alias: 'widget.onlinestatusbar',
        html: '<div id="onlineStatus" style="position:absolute;right:5px;top:3px;width:250px;text-align:right"><span id="statustext" style="vertical-align: top;">Online Status </span><img style="margin-top:-1px;" id="statusicon" src="images/status-offline.png"></div>'
    });

    var tabMain = Ext.create('Ext.tab.Panel', {
        layout: 'fit',
        items: [chartTab, configTab, automationTab, systemTab],
        listeners: {
            render: function () {
                this.tabBar.add(
                    { xtype: 'tbfill' },
                    { xtype: 'onlinestatusbar' }
                );
            },
            tabchange: function (tabPanel, newCard, oldCard, eOpts) {
                if (newCard.id == 'maintabGraph') {
                }
                else if (newCard.id == 'maintabSystem') {
                }
                else if (newCard.id == 'maintabConfig') {
                }
            }
        }

    });

    viewPort = Ext.create('Ext.container.Viewport', {
        el: 'openHAB',
        layout: 'fit',
        renderTo: 'HABmin',
        hidden: true,
        items: [tabMain]
    });

    viewPort.show(true);

    Ext.get('splashscreen').fadeOut({
        duration: 500,
        remove: true
    });

    Ext.get('HABmin').show(true);

    // Create the status toolbar and start the status update thread
    statusTooltip = Ext.create('Ext.tip.ToolTip', {target: 'onlineStatus', html: 'Offline'});
    doStatus();
}
