/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */
/**
 *  RightMenu.js
 *
 *  Created on 1/17/14
 *
 */

define([
    'core',
    'documenteditor/main/app/view/RightMenu'
], function () {
    'use strict';

    DE.Controllers.RightMenu = Backbone.Controller.extend({
        models: [],
        collections: [],
        views: [
            'RightMenu'
        ],

        initialize: function() {
            this.editMode = true;
            this._initSettings = true;
            this._state = {
                docProtection: {
                    isReadOnly: false,
                    isReviewOnly: false,
                    isFormsOnly: false,
                    isCommentsOnly: false
                }
            };
            this.addListeners({
                'RightMenu': {
                    'rightmenuclick': this.onRightMenuClick,
                    'button:click':  _.bind(this.onBtnCategoryClick, this)
                },
                'ViewTab': {
                    'rightmenu:hide': _.bind(this.onRightMenuHide, this)
                },
                'Common.Views.Plugins': {
                    'plugins:addtoright': _.bind(this.addNewPlugin, this),
                    'pluginsright:open': _.bind(this.openPlugin, this),
                    'pluginsright:close': _.bind(this.closePlugin, this),
                    'pluginsright:hide': _.bind(this.onHidePlugins, this),
                    'pluginsright:updateicons': _.bind(this.updatePluginButtonsIcons, this)
                }
            });

            Common.Utils.InternalSettings.set("de-rightpanel-active-form", 1);
        },

        onLaunch: function() {
            this.rightmenu = this.createView('RightMenu');

            this.rightmenu.on('render:after', _.bind(this.onRightMenuAfterRender, this));
        },

        onRightMenuAfterRender: function(rightMenu) {
            rightMenu.imageSettings.application = rightMenu.shapeSettings.application = rightMenu.textartSettings.application = this.getApplication();

            this._settings = [];
            this._settings[Common.Utils.documentSettingsType.Paragraph] = {panelId: "id-paragraph-settings",  panel: rightMenu.paragraphSettings,btn: rightMenu.btnText,        hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.Table] =     {panelId: "id-table-settings",      panel: rightMenu.tableSettings,    btn: rightMenu.btnTable,       hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.Image] =     {panelId: "id-image-settings",      panel: rightMenu.imageSettings,    btn: rightMenu.btnImage,       hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.Header] =    {panelId: "id-header-settings",     panel: rightMenu.headerSettings,   btn: rightMenu.btnHeaderFooter,hidden: 1, locked: false, needShow: true};
            this._settings[Common.Utils.documentSettingsType.Shape] =     {panelId: "id-shape-settings",      panel: rightMenu.shapeSettings,    btn: rightMenu.btnShape,       hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.TextArt] =   {panelId: "id-textart-settings",    panel: rightMenu.textartSettings,  btn: rightMenu.btnTextArt,     hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.Chart] = {panelId: "id-chart-settings",          panel: rightMenu.chartSettings,    btn: rightMenu.btnChart,       hidden: 1, locked: false};
            this._settings[Common.Utils.documentSettingsType.MailMerge] = {panelId: "id-mail-merge-settings", panel: rightMenu.mergeSettings,    btn: rightMenu.btnMailMerge,   hidden: 1, props: {}, locked: false};
            this._settings[Common.Utils.documentSettingsType.Signature] = {panelId: "id-signature-settings",  panel: rightMenu.signatureSettings, btn: rightMenu.btnSignature,  hidden: 1, props: {}, locked: false};
            this._settings[Common.Utils.documentSettingsType.Form] = {panelId: "id-form-settings",  panel: rightMenu.formSettings, btn: rightMenu.btnForm,  hidden: 1, props: {}, locked: false};
        },

        setApi: function(api) {
            this.api = api;
            this.api.asc_registerCallback('asc_onUpdateSignatures', _.bind(this.onApiUpdateSignatures, this));
            Common.NotificationCenter.on('protect:doclock', _.bind(this.onChangeProtectDocument, this));
            this.api.asc_registerCallback('asc_onCoAuthoringDisconnect',_.bind(this.onCoAuthoringDisconnect, this));
            Common.NotificationCenter.on('api:disconnect',              _.bind(this.onCoAuthoringDisconnect, this));
        },

        setMode: function(mode) {
            this.editMode = mode.isEdit;
        },

        onRightMenuClick: function(menu, type, minimized, event) {
            if (!minimized && this.editMode) {
                if (event) { // user click event
                    if (!this._settings[Common.Utils.documentSettingsType.Form].hidden) {
                        if (type == Common.Utils.documentSettingsType.Form) {
                            if (!this._settings[Common.Utils.documentSettingsType.Paragraph].hidden)
                                Common.Utils.InternalSettings.set("de-rightpanel-active-para", 0);
                            if (!this._settings[Common.Utils.documentSettingsType.Image].hidden)
                                Common.Utils.InternalSettings.set("de-rightpanel-active-image", 0);
                            if (!this._settings[Common.Utils.documentSettingsType.Shape].hidden)
                                Common.Utils.InternalSettings.set("de-rightpanel-active-shape", 0);
                        } else if (type == Common.Utils.documentSettingsType.Paragraph) {
                            Common.Utils.InternalSettings.set("de-rightpanel-active-para", 2);
                        } else if (type == Common.Utils.documentSettingsType.Image) {
                            Common.Utils.InternalSettings.set("de-rightpanel-active-image", 2);
                            Common.Utils.InternalSettings.set("de-rightpanel-active-shape", 0);
                        } else if (type == Common.Utils.documentSettingsType.Shape) {
                            Common.Utils.InternalSettings.set("de-rightpanel-active-shape", 2);
                            Common.Utils.InternalSettings.set("de-rightpanel-active-image", 0);
                        }
                    }
                }

                var panel = this._settings[type].panel;
                var props = this._settings[type].props;
                if (props && panel) {
                    panel.ChangeSettings.call(panel, (type==Common.Utils.documentSettingsType.MailMerge || type==Common.Utils.documentSettingsType.Signature) ? undefined : props);
                    this.rightmenu.updateScroller();
                }
            } else if (minimized && type==Common.Utils.documentSettingsType.MailMerge) {
                this.rightmenu.mergeSettings.disablePreviewMode();
            }
            Common.NotificationCenter.trigger('layout:changed', 'rightmenu');
            this.rightmenu.fireEvent('editcomplete', this.rightmenu);
        },

        onApiFocusObject: function(SelectedObjects) {
            this.onFocusObject(SelectedObjects);
        },

        onFocusObject: function(SelectedObjects, forceSignature, forceOpen) {
            if (!this.editMode && !forceSignature)
                return;

            var open = this._initSettings ? !Common.localStorage.getBool("de-hide-right-settings", this.rightmenu.defaultHideRightMenu) : !!forceOpen;
            this._initSettings = false;

            var can_add_table = false, 
                in_equation = false,
                needhide = true;
            for (var i=0; i<this._settings.length; i++) {
                if (i==Common.Utils.documentSettingsType.MailMerge || i==Common.Utils.documentSettingsType.Signature) continue;
                if (this._settings[i]) {
                    this._settings[i].hidden = 1;
                    this._settings[i].locked = false;
                }
            }
            this._settings[Common.Utils.documentSettingsType.MailMerge].locked = false;
            this._settings[Common.Utils.documentSettingsType.Signature].locked = false;

            var isChart = false,
                isShape = false,
                isSmartArtInternal = false,
                isProtected = this._state.docProtection.isReadOnly || this._state.docProtection.isFormsOnly || this._state.docProtection.isCommentsOnly,
                unprotectedRegion = {};

            var control_props = this.api.asc_IsContentControl() ? this.api.asc_GetContentControlProperties() : null,
                is_form = control_props && control_props.get_FormPr(),
                control_lock = false;
            for (i=0; i<SelectedObjects.length; i++)
            {
                var content_locked = false;
                var eltype = SelectedObjects[i].get_ObjectType(),
                    value = SelectedObjects[i].get_ObjectValue(),
                    settingsType = this.getDocumentSettingsType(eltype);
                if (eltype === Asc.c_oAscTypeSelectElement.Math)
                    in_equation = true;
                else if (eltype === Asc.c_oAscTypeSelectElement.UnProtectedRegion) { //(unprotected region)
                    unprotectedRegion = {
                        canEditText: value.get_canEditText(),
                        canEditPara: value.get_canEditPara(),
                        canInsObject: value.get_canInsObject()
                    };
                }

                if (settingsType===undefined || settingsType>=this._settings.length || this._settings[settingsType]===undefined)
                    continue;

                if (settingsType == Common.Utils.documentSettingsType.Image) {
                    var lock_type = (control_props) ? control_props.get_Lock() : Asc.c_oAscSdtLockType.Unlocked;
                    content_locked = lock_type==Asc.c_oAscSdtLockType.SdtContentLocked || lock_type==Asc.c_oAscSdtLockType.ContentLocked;

                    if (value.get_ChartProperties() !== null) {
                        isChart = true;
                        settingsType = Common.Utils.documentSettingsType.Chart;
                    } else if (value.get_ShapeProperties() !== null) {
                        isShape = true;
                        isChart = value.get_ShapeProperties().get_FromChart();
                        isSmartArtInternal = value.get_ShapeProperties().get_FromSmartArtInternal();
                        settingsType = Common.Utils.documentSettingsType.Shape;
                        if (value.get_ShapeProperties().asc_getTextArtProperties()) {
                            this._settings[Common.Utils.documentSettingsType.TextArt].props = value;
                            this._settings[Common.Utils.documentSettingsType.TextArt].hidden = 0;
                            this._settings[Common.Utils.documentSettingsType.TextArt].locked = value.get_Locked() || content_locked || isProtected;
                        }
                    }
                    control_lock = control_lock || value.get_Locked();
                } else if (settingsType == Common.Utils.documentSettingsType.Paragraph && !(is_form && is_form.get_Fixed())) {
                    this._settings[settingsType].panel.isChart = isChart;
                    this._settings[settingsType].panel.isSmartArtInternal = isSmartArtInternal;
                    can_add_table = value.get_CanAddTable();
                    control_lock = control_lock || value.get_Locked();
                    content_locked = !value.can_EditBlockContentControl();
                }
                this._settings[settingsType].props = value;
                this._settings[settingsType].hidden = 0;
                if (settingsType == Common.Utils.documentSettingsType.Paragraph) { // unlock paraphaph in unprotected regions
                    this._settings[settingsType].locked = value.get_Locked() || content_locked || this._state.docProtection.isReadOnly && !unprotectedRegion.canEditPara ||
                                                          this._state.docProtection.isFormsOnly || this._state.docProtection.isCommentsOnly && !unprotectedRegion.canEditPara;
                } else
                    this._settings[settingsType].locked = value.get_Locked() || content_locked || isProtected;

                if (!this._settings[Common.Utils.documentSettingsType.MailMerge].locked) // lock MailMerge-InsertField, если хотя бы один объект locked
                    this._settings[Common.Utils.documentSettingsType.MailMerge].locked = value.get_Locked() || isProtected;
                if (!this._settings[Common.Utils.documentSettingsType.Signature].locked) // lock Signature, если хотя бы один объект locked
                    this._settings[Common.Utils.documentSettingsType.Signature].locked = value.get_Locked();
            }

            if(is_form && is_form.get_Fixed()) {
                this._settings[Common.Utils.documentSettingsType.Paragraph].hidden = 1;
            }

            if (is_form && this.rightmenu.formSettings) {
                var spectype = control_props.get_SpecificType();
                if (spectype==Asc.c_oAscContentControlSpecificType.CheckBox || spectype==Asc.c_oAscContentControlSpecificType.Picture || spectype==Asc.c_oAscContentControlSpecificType.Complex ||
                    spectype==Asc.c_oAscContentControlSpecificType.ComboBox || spectype==Asc.c_oAscContentControlSpecificType.DropDownList || spectype==Asc.c_oAscContentControlSpecificType.None ||
                    spectype==Asc.c_oAscContentControlSpecificType.DateTime || spectype==Asc.c_oAscContentControlSpecificType.Signature) {
                    settingsType = Common.Utils.documentSettingsType.Form;
                    this._settings[settingsType].props = control_props;
                    this._settings[settingsType].locked = control_lock || isProtected;
                    this._settings[settingsType].hidden = 0;
                    if (is_form.get_Fixed())
                        this._settings[Common.Utils.documentSettingsType.TextArt].hidden = 1;
                }
            }

            if ( this._settings[Common.Utils.documentSettingsType.Header].locked ) { // all elements are locked if header/footer is locked
                for (i=0; i<this._settings.length; i++)  {
                    if (this._settings[i])
                        this._settings[i].locked = true;
                }
            }

            if (!this._settings[Common.Utils.documentSettingsType.MailMerge].locked) { // disable MailMerge-InsertField when disable btnInsertTable
                this._settings[Common.Utils.documentSettingsType.MailMerge].locked = !can_add_table || in_equation;
            }

            var lastactive = -1, currentactive, priorityactive = -1,
                activePane = this.rightmenu.GetActivePane();
            for (i=0; i<this._settings.length; i++) {
                var pnl = this._settings[i];
                if (pnl===undefined || pnl.btn===undefined || pnl.panel===undefined) continue;

                if ( pnl.hidden ) {
                    if (!pnl.btn.isDisabled()) {
                        pnl.btn.setDisabled(true);
                        this.rightmenu.setDisabledMoreMenuItem(pnl.btn, true);
                    }
                    if (activePane == pnl.panelId)
                        currentactive = -1;
                } else {
                    if (pnl.btn.isDisabled()) {
                        pnl.btn.setDisabled(false);
                        this.rightmenu.setDisabledMoreMenuItem(pnl.btn, false);
                    }
                    if (i!=Common.Utils.documentSettingsType.MailMerge && i!=Common.Utils.documentSettingsType.Signature) lastactive = i;
                    if ( pnl.needShow ) {
                        pnl.needShow = false;
                        priorityactive = i;
                    } else if (activePane == pnl.panelId)
                        currentactive = i;
                    pnl.panel.setLocked(pnl.locked);
                }
            }
            if (!this._settings[Common.Utils.documentSettingsType.MailMerge].hidden)
                this._settings[Common.Utils.documentSettingsType.MailMerge].panel.setLocked(this._settings[Common.Utils.documentSettingsType.MailMerge].locked);

            if (!this._settings[Common.Utils.documentSettingsType.Signature].hidden)
                this._settings[Common.Utils.documentSettingsType.Signature].panel.setProtected(isProtected);

            if (!this.rightmenu.minimizedMode || open) {
                var active;

                if (priorityactive<0 && !this._settings[Common.Utils.documentSettingsType.Form].hidden &&
                    (!this._settings[Common.Utils.documentSettingsType.Paragraph].hidden || !this._settings[Common.Utils.documentSettingsType.Image].hidden
                    || !this._settings[Common.Utils.documentSettingsType.Shape].hidden)) {
                    var imageactive = Common.Utils.InternalSettings.get("de-rightpanel-active-image") || 0,
                        shapeactive = Common.Utils.InternalSettings.get("de-rightpanel-active-shape") || 0,
                        paraactive = Common.Utils.InternalSettings.get("de-rightpanel-active-para") || 0,
                        formactive = Common.Utils.InternalSettings.get("de-rightpanel-active-form") || 0;

                    if (!this._settings[Common.Utils.documentSettingsType.Paragraph].hidden) {
                        priorityactive = (formactive>paraactive) ? Common.Utils.documentSettingsType.Form : Common.Utils.documentSettingsType.Paragraph;
                    } else if (!this._settings[Common.Utils.documentSettingsType.Paragraph].Image || !this._settings[Common.Utils.documentSettingsType.Shape].hidden) {
                        if (formactive>shapeactive && formactive>imageactive)
                            priorityactive = Common.Utils.documentSettingsType.Form;
                        else if (shapeactive>formactive && shapeactive>imageactive)
                            priorityactive = Common.Utils.documentSettingsType.Shape;
                        else
                            priorityactive = Common.Utils.documentSettingsType.Image;
                    }
                }

                if (priorityactive>-1) active = priorityactive;
                else if (lastactive>=0 && currentactive<0) active = lastactive;
                else if (currentactive>=0) active = currentactive;
                else if (forceSignature && !this._settings[Common.Utils.documentSettingsType.Signature].hidden) active = Common.Utils.documentSettingsType.Signature;
                else if (!this._settings[Common.Utils.documentSettingsType.MailMerge].hidden) active = Common.Utils.documentSettingsType.MailMerge;

                if (active == undefined && open && lastactive>=0)
                    active = lastactive;
                
                if (active !== undefined) {
                    this.rightmenu.SetActivePane(active, open);
                    if (active === Common.Utils.documentSettingsType.Form)
                        this._settings[active].panel.ChangeSettings.call(this._settings[active].panel, this._settings[active].props, isShape);
                    else if (active!=Common.Utils.documentSettingsType.MailMerge && active!=Common.Utils.documentSettingsType.Signature)
                        this._settings[active].panel.ChangeSettings.call(this._settings[active].panel, this._settings[active].props);
                    else
                        this._settings[active].panel.ChangeSettings.call(this._settings[active].panel);
                    (active !== currentactive) && this.rightmenu.updateScroller();
                } else if (activePane) { // lock active pane if no selected objects (ex. drawing)
                    for (var i=0; i<this._settings.length; i++) {
                        if (this._settings[i] && this._settings[i].panelId === activePane) {
                            this._settings[i].locked = true;
                            this._settings[i].panel.setLocked(true);
                            this._settings[i].panel.disableControls(true);
                            break;
                        }
                    }
                }
            }

            this._settings[Common.Utils.documentSettingsType.Image].needShow = false;
            this._settings[Common.Utils.documentSettingsType.Chart].needShow = false;
        },

        onCoAuthoringDisconnect: function() {
            this.SetDisabled(true, false);
        },

        onInsertTable:  function() {
            this._settings[Common.Utils.documentSettingsType.Table].needShow = true;
        },

        onInsertImage:  function() {
            this._settings[Common.Utils.documentSettingsType.Image].needShow = true;
        },

        onInsertChart:  function() {
            this._settings[Common.Utils.documentSettingsType.Chart].needShow = true;
        },

        onInsertShape:  function() {
            this._settings[Common.Utils.documentSettingsType.Shape].needShow = true;
        },

        onInsertTextArt:  function() {
            this._settings[Common.Utils.documentSettingsType.TextArt].needShow = true;
        },

        onInsertControl:  function() {
            if (this._settings[Common.Utils.documentSettingsType.Form])
                this._settings[Common.Utils.documentSettingsType.Form].needShow = true;
        },

        UpdateThemeColors:  function() {
            this.rightmenu.paragraphSettings.UpdateThemeColors();
            this.rightmenu.tableSettings.UpdateThemeColors();
            this.rightmenu.shapeSettings.UpdateThemeColors();
            this.rightmenu.textartSettings.UpdateThemeColors();
            this.rightmenu.formSettings && this.rightmenu.formSettings.UpdateThemeColors();
        },

        updateMetricUnit: function() {
            this.rightmenu.headerSettings.updateMetricUnit();
            this.rightmenu.paragraphSettings.updateMetricUnit();
            this.rightmenu.chartSettings.updateMetricUnit();
            this.rightmenu.imageSettings.updateMetricUnit();
            this.rightmenu.tableSettings.updateMetricUnit();
            this.rightmenu.formSettings && this.rightmenu.formSettings.updateMetricUnit();
        },

        createDelayedElements: function() {
            var me = this;
            if (this.api) {
                this.api.asc_registerCallback('asc_onFocusObject',       _.bind(this.onApiFocusObject, this));
                this.api.asc_registerCallback('asc_doubleClickOnObject', _.bind(this.onDoubleClickOnObject, this));
                if (this.rightmenu.mergeSettings) {
                    this.rightmenu.mergeSettings.setDocumentName(this.getApplication().getController('Viewport').getView('Common.Views.Header').getDocumentCaption());
                    this.api.asc_registerCallback('asc_onStartMailMerge',    _.bind(this.onStartMailMerge, this));
                }
                this.api.asc_registerCallback('asc_onError',             _.bind(this.onError, this));
            }
            if (this.editMode && this.api) {
                // this.rightmenu.shapeSettings.createDelayedElements();
                var selectedElements = this.api.getSelectedElements();
                if (selectedElements.length>0) {
                    this.onFocusObject(selectedElements);
                }
            }
            this.onChangeProtectDocument();
            this.rightmenu.setButtons();
            this.rightmenu.setMoreButton();
        },

        onDoubleClickOnObject: function(obj) {
            if (!this.editMode) return;

            var eltype = obj.get_ObjectType(),
                settingsType = this.getDocumentSettingsType(eltype);

            if (settingsType===undefined || settingsType>=this._settings.length || this._settings[settingsType]===undefined)
                return;

            var value = obj.get_ObjectValue();
            if (settingsType == Common.Utils.documentSettingsType.Image) {
                if (value.get_ChartProperties() !== null) {
                    settingsType = Common.Utils.documentSettingsType.Chart;
                } else if (value.get_ShapeProperties() !== null) {
                    settingsType = Common.Utils.documentSettingsType.Shape;
                }
            }

            if (settingsType !== Common.Utils.documentSettingsType.Paragraph) {
                this.rightmenu.SetActivePane(settingsType, true);
                this._settings[settingsType].panel.ChangeSettings.call(this._settings[settingsType].panel, this._settings[settingsType].props);
                this.rightmenu.updateScroller();
            }
        },

        onStartMailMerge: function() {
            var type = Common.Utils.documentSettingsType.MailMerge;
            this._settings[type].hidden = 0;
            this._settings[type].btn.setDisabled(false);
            this.rightmenu.setDisabledMoreMenuItem(this._settings[type].btn, false);
            this.rightmenu.SetActivePane(type, true);
            this._settings[type].panel.setLocked(this._settings[type].locked);
            this._settings[type].panel.ChangeSettings.call(this._settings[type].panel);
            this.rightmenu.updateScroller();
        },

        onError: function(id, level, errData) {
            if (id==Asc.c_oAscError.ID.MailMergeLoadFile) {
                this._settings[Common.Utils.documentSettingsType.MailMerge].hidden = 1;
                this._settings[Common.Utils.documentSettingsType.MailMerge].btn.setDisabled(true);
                this.rightmenu.setDisabledMoreMenuItem(this._settings[Common.Utils.documentSettingsType.MailMerge].btn, true);
                var selectedElements = this.api.getSelectedElements();
                if (selectedElements.length>0)
                    this.onFocusObject(selectedElements);
            }
        },

        onApiUpdateSignatures: function(valid, requested){
            if (!this.rightmenu.signatureSettings) return;

            var disabled = (!valid || valid.length<1) && (!requested || requested.length<1),
                type = Common.Utils.documentSettingsType.Signature;
            this._settings[type].hidden = disabled ? 1 : 0;
            this._settings[type].btn.setDisabled(disabled);
            this.rightmenu.setDisabledMoreMenuItem(this._settings[type].btn, disabled);
            this._settings[type].panel.setLocked(this._settings[type].locked);
            this._settings[type].panel.setProtected(this._state.docProtection ? this._state.docProtection.isReadOnly || this._state.docProtection.isFormsOnly || this._state.docProtection.isCommentsOnly : false);
        },

        SetDisabled: function(disabled, allowMerge, allowSignature) {
            this.setMode({isEdit: !disabled});
            if (this.rightmenu && this.rightmenu.paragraphSettings) {
                this.rightmenu.paragraphSettings.disableControls(disabled);
                this.rightmenu.shapeSettings.disableControls(disabled);
                this.rightmenu.textartSettings.disableControls(disabled);
                this.rightmenu.headerSettings.disableControls(disabled);
                this.rightmenu.tableSettings.disableControls(disabled);
                this.rightmenu.imageSettings.disableControls(disabled);
                this.rightmenu.formSettings && this.rightmenu.formSettings.disableControls(disabled);
                if (!allowMerge && this.rightmenu.mergeSettings) {
                    this.rightmenu.mergeSettings.disableControls(disabled);
                    disabled && this.rightmenu.btnMailMerge.setDisabled(disabled);
                }
                this.rightmenu.chartSettings.disableControls(disabled);

                if (this.rightmenu.signatureSettings) {
                    !allowSignature && this.rightmenu.btnSignature.setDisabled(disabled);
                    allowSignature && disabled && this.onFocusObject([], true); // force press signature button
                }

                if (disabled) {
                    this.rightmenu.btnText.setDisabled(disabled);
                    this.rightmenu.btnTable.setDisabled(disabled);
                    this.rightmenu.btnImage.setDisabled(disabled);
                    this.rightmenu.btnHeaderFooter.setDisabled(disabled);
                    this.rightmenu.btnShape.setDisabled(disabled);
                    this.rightmenu.btnTextArt.setDisabled(disabled);
                    this.rightmenu.btnChart.setDisabled(disabled);
                    this.rightmenu.btnForm && this.rightmenu.btnForm.setDisabled(disabled);
                    this.rightmenu.setDisabledAllMoreMenuItems(disabled);
                } else {
                    var selectedElements = this.api.getSelectedElements();
                    if (selectedElements.length > 0)
                        this.onFocusObject(selectedElements, false, !Common.Utils.InternalSettings.get("de-hide-right-settings") && // user didn't close panel
                                                                                            !Common.Utils.InternalSettings.get("de-hidden-rightmenu")); // user didn't hide right menu
                }
            }
        },

        getDocumentSettingsType: function(type) {
            switch (type) {
                case Asc.c_oAscTypeSelectElement.Paragraph:
                    return Common.Utils.documentSettingsType.Paragraph;
                case Asc.c_oAscTypeSelectElement.Table:
                    return Common.Utils.documentSettingsType.Table;
                case Asc.c_oAscTypeSelectElement.Image:
                    return Common.Utils.documentSettingsType.Image;
                case Asc.c_oAscTypeSelectElement.Header:
                    return Common.Utils.documentSettingsType.Header;
            }
        },

        onChangeProtectDocument: function(props) {
            if (!props) {
                var docprotect = this.getApplication().getController('DocProtection');
                props = docprotect ? docprotect.getDocProps() : null;
            }
            if (props) {
                this._state.docProtection = props;
                if (this.api) {
                    var selectedElements = this.api.getSelectedElements();
                    if (selectedElements.length > 0)
                        this.onFocusObject(selectedElements);
                }
            }
        },

        onRightMenuHide: function (view, status) { // status = true when show panel
            if (this.rightmenu) {
                !status && this.rightmenu.clearSelection();
                status ? this.rightmenu.show() : this.rightmenu.hide();
                Common.localStorage.setBool('de-hidden-rightmenu', !status);
                Common.Utils.InternalSettings.set("de-hidden-rightmenu", !status);
                if (status) {
                    var selectedElements = this.api.getSelectedElements();
                    if (selectedElements.length > 0)
                        this.onFocusObject(selectedElements, false, !Common.Utils.InternalSettings.get("de-hide-right-settings"));
                } else {
                    this.rightmenu.signatureSettings && this.rightmenu.signatureSettings.hideSignatureTooltip();
                }
                !status && Common.NotificationCenter.trigger('forms:close-help', 'key');
                !status && Common.NotificationCenter.trigger('forms:close-help', 'group-key');
                !status && Common.NotificationCenter.trigger('forms:close-help', 'settings');

                !view && this.rightmenu.fireEvent('view:hide', [this, !status]);
            }
            Common.NotificationCenter.trigger('layout:changed', 'main');
            Common.NotificationCenter.trigger('edit:complete', this.rightmenu);
        },

        onRightMenuOpen: function(type) {
            if (this._settings[type]===undefined || this._settings[type].hidden || this._settings[type].btn.isDisabled() || this._settings[type].panelId===this.rightmenu.GetActivePane()) return;

            this.tryToShowRightMenu();
            this.rightmenu.SetActivePane(type, true);
            this._settings[type].panel.ChangeSettings.call(this._settings[type].panel, this._settings[type].props);
            this.rightmenu.updateScroller();
        },

        tryToShowRightMenu: function() {
            if (this.rightmenu && this.rightmenu.mode && (!this.rightmenu.mode.canBrandingExt || !this.rightmenu.mode.customization || this.rightmenu.mode.customization.rightMenu !== false) && Common.UI.LayoutManager.isElementVisible('rightMenu'))
                this.onRightMenuHide(null, true);
        },

        addNewPlugin: function (button, $button, $panel) {
            this.rightmenu.insertButton(button, $button);
            this.rightmenu.insertPanel($panel);
        },

        openPlugin: function (guid) {
            this.rightmenu.openPlugin(guid);
        },

        closePlugin: function (guid) {
            this.rightmenu.closePlugin(guid);
            this.rightmenu.onBtnMenuClick();
            Common.NotificationCenter.trigger('layout:changed', 'rightmenu');
            this.rightmenu.fireEvent('editcomplete', this.rightmenu);
        },

        onHidePlugins: function() {
            Common.NotificationCenter.trigger('layout:changed', 'rightmenu');
        },

        updatePluginButtonsIcons: function (icons) {
            this.rightmenu.updatePluginButtonsIcons(icons);
        },

        onBtnCategoryClick: function (btn) {
            if (btn.options.type === 'plugin' && !btn.isDisabled()) {
                this.rightmenu.onBtnMenuClick(btn);
                if (btn.pressed) {
                    this.rightmenu.fireEvent('plugins:showpanel', [btn.options.value]); // show plugin panel
                } else {
                    this.rightmenu.fireEvent('plugins:hidepanel', [btn.options.value]);
                }
                Common.NotificationCenter.trigger('layout:changed', 'rightmenu');
                this.rightmenu.fireEvent('editcomplete', this.rightmenu);
            }
        },
    });
});