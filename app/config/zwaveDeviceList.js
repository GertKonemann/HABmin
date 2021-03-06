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

/**
 * OpenHAB Admin Console HABmin
 *
 * @author Chris Jackson
 */


Ext.define('openHAB.config.zwaveDeviceList', {
    extend:'Ext.panel.Panel',
    icon:'images/application-list.png',
    title:'ZWave Devices',
    border:false,
    layout:'fit',

    initComponent:function () {
        var toolbar = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/arrow-circle-315.png',
                    itemId:'reload',
                    text:'Reload Properties',
                    cls:'x-btn-icon',
                    disabled:false,
                    tooltip:'Reload the configuration',
                    handler:function () {
                        var store = list.getStore();
                        if (store == null)
                            return;

                        // Reload the store
                        store.reload();
                    }
                }
            ]
        });


        Ext.define('ZWaveConfigModel', {
            extend:'Ext.data.Model',
            fields:[
                {name:'domain', type:'string'},
                {name:'name', type:'string'},
                {name:'label', type:'string'},
                {name:'optional', type:'boolean'},
                {name:'readonly', type:'boolean'},
                {name:'type', type:'string'},
                {name:'value', type:'string'},
                {name:'state', type:'string'},
                {name:'description', type:'string'},
                {name:'valuelist'},
                {name:'actionlist'}
            ]
        });

        var list = Ext.create('Ext.tree.Panel', {
            store:{
                extend:'Ext.data.TreeStore',
                model:'ZWaveConfigModel',
                clearOnLoad: true,
                clearRemovedOnLoad: true,
                proxy:{
                    type:'rest',
                    url:HABminBaseURL + '/zwave',
                    reader:{
//                        type:'rest',
                        root:'records'
                    },
                    headers:{'Accept':'application/json'},
                    pageParam:undefined,
                    startParam:undefined,
                    sortParam:undefined,
                    limitParam:undefined
                },
                nodeParam:"domain",
                root:{
                    text:'nodes',
                    id:'nodes/',
                    expanded:true
                },
                listeners:{
                    load:function (tree, node, records) {
                        node.eachChild(function (childNode) {
                            var domain = childNode.get('domain');
                            childNode.set('id', domain);

                            // Set the icons and leaf attributes for the tree
                            if (domain.indexOf('/', domain.length - 1) == -1) {
                                childNode.set('leaf', true);

                                if (childNode.get('readonly') == true)
                                    childNode.set('iconCls', 'x-config-icon-readonly');
                                else
                                    childNode.set('iconCls', 'x-config-icon-editable');
                            }
                            else {
                                childNode.set('iconCls', 'x-config-icon-domain');
                                childNode.set('leaf', false);
                            }
                        });
                    }
                }
            },
            flex:1,
            header:false,
            split:true,
            tbar:toolbar,
            collapsible:false,
            multiSelect:false,
            singleExpand:true,
            rootVisible:false,
            plugins:[
                Ext.create('Ext.grid.plugin.CellEditing', {
                    clicksToEdit:2,
                    listeners:{
                        beforeedit:function (e, editor) {
                            // Only allow editing if this is not a read-only cell
                            if (editor.record.get('readonly') == true)
                                return false;
                        },
                        edit:function (editor, e) {
                            // Detect if data has actually changed
                            if(e.originalValue == e.value) {
                                // No change!
                                return;
                            }

                            var domain = e.record.get('domain');

                            // Data has changed
                            Ext.Ajax.request({
                                url:HABminBaseURL + '/zwave/set/' + domain,
                                method:'PUT',
                                jsonData:e.value,
                                headers:{'Accept':'application/json'},
                                success:function (response, opts) {
                                },
                                failure:function () {
                                }
                            });
                        }
                    }
                })
            ],
            columns:[
                {
                    text:'Node',
                    xtype:'treecolumn',
                    flex:1,
                    dataIndex:'label',
                    renderer: function (value, meta, record) {
                        // If a description is provided, then display this as a tooltip
                        var description = record.get("description");
                        if(description != "") {
                            description = Ext.String.htmlEncode(description);
                            meta.tdAttr = 'data-qtip="' + description + '"';
                        }

                        var img = "";
                        switch(record.get('state')) {
                            case 'OK':
                                img = '<img height="12" src="images/status.png">';
                                break;
                            case 'WARNING':
                                img = '<img height="12" src="images/status-away.png">';
                                break;
                            case 'ERROR':
                                img = '<img height="12" src="images/status-busy.png">';
                                break;
                            case 'INITIALIZING':
                                img = '<img height="12" src="images/status-offline.png">';
                                break;
                        }

                        return '<span>' + value + '</span><span style="float:right">' + img + '</span>';
                    }
                },
                {
                    text:'Value',
                    flex:1,
                    dataIndex:'value',
                    renderer:function (value, meta, record) {
                        if (value == "")
                            return "";

                        // If this is a list, then we want to display the value, not the number!
                        var type = record.get('type');
                        if (type != "LIST")
                            return value;

                        var list = record.get('valuelist');
                        if (list == null || list.entry == null)
                            return value;

                        for (var cnt = 0; cnt < list.entry.length; cnt++) {
                            if (value == list.entry[cnt].key)
                                return list.entry[cnt].value;
                        }
                    },
                    getEditor:function (record, defaultField) {
                        var type = record.get('type');

                        if (type == "LIST") {
                            // This is a list, so we need to load the data into a store
                            // and create a combobox editor.
                            Ext.define('ListComboModel', {
                                extend:'Ext.data.Model',
                                fields:[
                                    {name:'key'},
                                    {name:'value'}
                                ]
                            });
                            // Create the data store
                            var store = Ext.create('Ext.data.ArrayStore', {
                                model:'ListComboModel'
                            });
                            var list = record.get('valuelist')
                            if (list != null && list.entry != null)
                                store.loadData(list.entry);

                            var editor = Ext.create('Ext.grid.CellEditor', {
                                field:Ext.create('Ext.form.field.ComboBox', {
                                    store:store,
                                    editable:false,
                                    displayField:'value',
                                    valueField:'key',
                                    queryMode:'local'
                                })
                            });

                            editor.field.setEditable(false);
                            editor.field.setValue("YYY");
                            return editor;
                        } else {
                            return Ext.create('Ext.grid.CellEditor', {
                                field:Ext.create('Ext.form.field.Text')
                            });
                        }
                    }
                }
            ],
            listeners:{
                select:function (grid, record, index, eOpts) {
                    // Remove all current action buttons
                    for (var cnt = 1; cnt < toolbar.items.length; cnt++) {
                        toolbar.remove(toolbar.items.get(cnt), true);
                    }

                    if (record == null)
                        return;

                    var list = record.get("actionlist");
                    if (list == null || list.entry == null)
                        return;

                    var actions = [].concat(list.entry);
                    if (actions.length == 0)
                        return;

                    var domain = record.get("domain");
                    var name = record.get("name");

                    // Add any actions for the selected item
//                    for (var cnt = 0; cnt < actions.length; cnt++) {
                        var x =   {
//                            itemId:"action" + 0,
                            icon:'images/gear.png',
                            cls:'x-btn-icon',
                            text:actions[0].value,
                            handler:function () {
                                var data = {};
                                data.action = actions[0].key;
//                                data.name = name;
                                Ext.Ajax.request({
                                    url:HABminBaseURL + '/zwave/action/' + domain,
                                    method:'PUT',
                                    jsonData:actions[0].key,
                                    headers:{'Accept':'application/json'},
                                    success:function (response, opts) {
                                    },
                                    failure:function () {
                                    }
                                });
                            }
                        };

                        toolbar.add(x);
//                     }

                    // Get the node ID
                    var nodeName;
                },
                afteritemcollapse: function( node, index, item, eOpts ) {
//                    node.removeAll();
                }
            }
        });

        this.items = [list];
        this.callParent();
    }
})
;