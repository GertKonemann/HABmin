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

Ext.define('openHAB.config.sitemapList', {
    extend:'Ext.panel.Panel',
    layout:'fit',
    tabTip:'Sitemap list',
    title:'Sitemaps',
    icon:'images/maps-stack.png',

    initComponent:function () {
        var toolbar = Ext.create('Ext.toolbar.Toolbar', {
            items:[
                {
                    icon:'images/minus-button.png',
                    itemId:'delete',
                    text:'Delete Sitemap',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Delete the sitemap from openHAB',
                    handler:function () {
                        // Get the sitemap name to delete
                        var record = sitemapList.getSelectionModel().getSelection()[0];
                        if (record == null)
                            return;

                        // Make sure we really want to do this!!!
                        var sitemapName = record.get('name');
                        Ext.Msg.show({
                            title:"Confirm Delete",
                            msg:'Are you sure you want to delete the sitemap "' + sitemapName + '"?',
                            buttons:Ext.Msg.YESNO,
                            config:{
                                obj:this,
                                name:sitemapName
                            },
                            fn:deleteSitemap,
                            icon:Ext.MessageBox.QUESTION
                        });
                    }
                },
                {
                    icon:'images/plus-button.png',
                    itemId:'add',
                    text:'Add New Sitemap',
                    cls:'x-btn-icon',
                    disabled:false,
                    tooltip:'Add a new sitemap to openHAB',
                    handler:function () {
                        // Pop up a dialogue box asking for the sitemap name
                        Ext.MessageBox.prompt('Sitemap Name', 'Please enter the new sitemap name:', newSitemap);
                    }
                },
                {
                    icon:'images/document-copy.png',
                    itemId:'copy',
                    text:'Copy Sitemap',
                    cls:'x-btn-icon',
                    disabled:true,
                    tooltip:'Copy the selected sitemap as a new sitemap',
                    handler:function () {
                        // Pop up a dialogue box asking for the sitemap name
                        Ext.MessageBox.prompt('Sitemap Name', 'Please enter the new sitemap name:', copySitemap);
                    }
                },
                { xtype:'tbfill' },
                {
                    icon:'images/arrow-circle-315.png',
                    itemId:'refresh',
                    cls:'x-btn-icon',
                    disabled:false,
                    tooltip:'Refresh the sitemap list',
                    handler:function () {
                        sitemapStore.load();
                    }
                }
            ]
        });

        var sitemapList = Ext.create('Ext.grid.Panel', {
            store:sitemapStore,
            header:false,
            tbar:toolbar,
            columns:[
                {
                    text:'',
                    hideable:false,
                    width:24,
                    sortable:true,
                    dataIndex:'icon',
                    renderer:function (v) {
                        if (v == null || v == "")
                            return;
                        return '<img src="../images/' + v + '.png"  height="16">';
                    }
                },
                {
                    text:'Name',
                    hideable:false,
                    flex:1,
                    sortable:true,
                    dataIndex:'name'
                },
                {
                    text:'Label',
                    hideable:false,
                    flex:2,
                    sortable:true,
                    dataIndex:'label'
                }
            ],
            layout:'fit',
            viewConfig:{
                stripeRows:false,
                enableTextSelection:false,
                markDirty:false
            },
            listeners:{
                itemclick:function (grid, record) {
                    if (record == null)
                        return;

                    // Create a new itemProperties
                    var newProperties = Ext.create('openHAB.config.sitemapProperties');
                    var newName = record.get('name');
                    newProperties.setItem(newName);

                    Ext.getCmp('configPropertyContainer').setNewProperty(newProperties);

                    // Allow this sitemap to be deleted and copied
                    toolbar.getComponent('delete').enable();
                    toolbar.getComponent('copy').enable();
                }
            }
        });

        this.items = sitemapList;

        this.callParent();

        function deleteSitemap(button, text, options) {
            if (button !== 'yes')
                return;

            // Tell OH to Remove the sitemap
            Ext.Ajax.request({
                url:HABminBaseURL + "/config/sitemap/" + options.config.name,
                headers:{'Accept':'application/json'},
                method:'DELETE',
                success:function (response, opts) {
                    handleStatusNotification(NOTIFICATION_OK,'Sitemap deleted');
                },
                failure:function (result, request) {
                    handleStatusNotification(NOTIFICATION_ERROR,'Error deleting sitemap');
                },
                callback:function (options, success, response) {
                    // Reload the store
                    sitemapStore.reload();

                    // Clear the sitemap properties
                    Ext.getCmp('configPropertyContainer').removeProperty();

                    // Disable delete
                    toolbar.getComponent('delete').disable();
                }
            });
        }

        function copySitemap(button, text) {
            if (button !== 'ok')
                return;

            // Get the selected sitemap
            var record = sitemapList.getSelectionModel().getSelection()[0];
            if (record == null)
                return;

            var sitemapName = record.get('name');
            doNewSitemap(text, sitemapName);
        }

        function newSitemap(button, text) {
            if (button !== 'ok')
                return;

            doNewSitemap(text, null);
        }

        function doNewSitemap(newName, copyName) {
            if (newName.indexOf('.') != -1) {
                Ext.MessageBox("Error", "Sitemap name can only contain alphanumeric characters.");
                return;
            }

            var parms = {};
            if (copyName != null)
                parms.copy = copyName;

            // Tell OH to add the new sitemap
            Ext.Ajax.request({
                url:HABminBaseURL + "/config/sitemap/" + newName,
                headers:{'Accept':'application/json'},
                method:'POST',
                params:parms,
                success:function (response, opts) {
                    handleStatusNotification(NOTIFICATION_OK,'Sitemap created');
                },
                failure:function (result, request) {
                    handleStatusNotification(NOTIFICATION_ERROR,'Error creating new sitemap');
                },
                callback:function (options, success, response) {
                    // Reload the store
                    sitemapStore.reload();

                    // Clear the sitemap properties
                    Ext.getCmp('configPropertyContainer').removeProperty();

                    // Disable delete and copy
                    toolbar.getComponent('delete').disable();
                    toolbar.getComponent('copy').disable();
                }
            });
        }
    }
})
;