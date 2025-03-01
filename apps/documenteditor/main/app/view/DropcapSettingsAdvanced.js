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
 *  DropcapSettingsAdvanced.js
 *
 *  Created on 2/24/14
 *
 */

var c_oAscFrameWrap = {
    None    : -1,
    Inline  : false,
    Flow    : true
};

define([
    'text!documenteditor/main/app/template/DropcapSettingsAdvanced.template',
    'common/main/lib/component/TableStyler',
    'common/main/lib/view/AdvancedSettingsWindow',
], function (contentTemplate) {
    'use strict';

    DE.Views.DropcapSettingsAdvanced = Common.Views.AdvancedSettingsWindow.extend(_.extend({
        options: {
            contentWidth: 320,
            contentHeight: 295,
            toggleGroup : 'dropcap-adv-settings-group',
            storageName: 'de-dropcap-settings-adv-category'
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle,
                contentTemplate: _.template(contentTemplate)({
                    scope: this
                }),
                items: [
                    {panelId: 'id-adv-dropcap-frame',   panelCaption: this.textFrame},
                    {panelId: 'id-adv-dropcap-dropcap', panelCaption: this.strDropcap},
                    {panelId: 'id-adv-dropcap-borders', panelCaption: this.strBorders},
                    {panelId: 'id-adv-dropcap-margins', panelCaption: this.strMargins}
                ]
            }, options);

            this.tableStylerRows    = this.options.tableStylerRows;
            this.tableStylerColumns = this.options.tableStylerColumns;
            this.fontStore          = this.options.fontStore;
            this.borderProps        = this.options.borderProps;
            this.isFrame            = this.options.isFrame;
            this.api                = this.options.api;
            this.Borders            = {};
            this.BorderSize         = {ptValue: 0, pxValue: 0};
            this.paragraphShade     = 'transparent';
            this._changedProps      = null;
            this.ChangedBorders     = undefined; // undefined - не менялись, null - применялись пресеты, отправлять Borders, object - менялись отдельные границы, отправлять ChangedBorders
            this._noApply           = true;
            this.Margins            = undefined;

            this._originalProps = new Asc.asc_CParagraphProperty(this.options.paragraphProps);

            Common.Views.AdvancedSettingsWindow.prototype.initialize.call(this, this.options);
        },

        render: function() {
            var me = this;

            Common.Views.AdvancedSettingsWindow.prototype.render.call(this);

            this.tableStyler = new Common.UI.TableStyler({
                el: $('#drop-advanced-borderstyler'),
                width: 200,
                height: 170,
                rows: this.tableStylerRows,
                columns: this.tableStylerColumns,
                spacingMode: false
            });

            this._btnsBorderPosition = [];
            _.each([
                [c_tableBorder.BORDER_HORIZONTAL_TOP,     't',     'toolbar__icon toolbar__icon-big btn-paragraph-borders-top',       '00'],
                [c_tableBorder.BORDER_HORIZONTAL_CENTER,  'm',     'toolbar__icon toolbar__icon-big btn-paragraph-borders-inner',     '01'],
                [c_tableBorder.BORDER_HORIZONTAL_BOTTOM,  'b',     'toolbar__icon toolbar__icon-big btn-paragraph-borders-bottom',    '10'],
                [c_tableBorder.BORDER_OUTER,              'lrtb',  'toolbar__icon toolbar__icon-big btn-paragraph-borders-outer',     '11'],
                [c_tableBorder.BORDER_VERTICAL_LEFT,      'l',     'toolbar__icon toolbar__icon-big btn-paragraph-borders-left',      '20'],
                [c_tableBorder.BORDER_ALL,                'lrtbm', 'toolbar__icon toolbar__icon-big btn-paragraph-borders-all',       '21'],
                [c_tableBorder.BORDER_VERTICAL_RIGHT,     'r',     'toolbar__icon toolbar__icon-big btn-paragraph-borders-right',     '30'],
                [c_tableBorder.BORDER_NONE,               '',      'toolbar__icon toolbar__icon-big btn-paragraph-borders-none',      '31']
            ], function(item, index) {
                var _btn = new Common.UI.Button({
                    parentEl: $('#drop-advanced-button-borderline-' + item[3]),
                    posId   : item[0],
                    strId   : item[1],
                    iconCls : item[2],
                    style   : 'margin-bottom: 4px;',
                    cls     : 'btn-options large border-off margin-left-5'
                });

                _btn.on('click', function(btn) {
                    me._ApplyBorderPreset(btn.options.strId);
                });
                me._btnsBorderPosition.push( _btn );
            }, this);

            var txtPt = Common.Utils.Metric.getMetricName(Common.Utils.Metric.c_MetricUnits.pt);
            this.cmbBorderSize = new Common.UI.ComboBorderSize({
                el          : $('#drop-advanced-input-bordersize'),
                style       : 'width: 90px;',
                takeFocusOnClose: true
            }).on('selected', _.bind(function(combo, record) {
                this.BorderSize = {ptValue: record.value, pxValue: record.pxValue};
                this.tableStyler.setVirtualBorderSize(this.BorderSize.pxValue);
            }, this));
            var rec = this.cmbBorderSize.store.at(2);
            this.cmbBorderSize.setValue(rec.get('value'));
            this.BorderSize = {ptValue: rec.get('value'), pxValue: rec.get('pxValue')};

            this.btnBorderColor = new Common.UI.ColorButton({
                parentEl: $('#drop-advanced-button-bordercolor'),
                additionalAlign: this.menuAddAlign,
                color: 'auto',
                auto: true,
                takeFocusOnClose: true
            });
            this.btnBorderColor.on('color:select', _.bind(function(btn, color) {
                this.tableStyler.setVirtualBorderColor((typeof(color) == 'object') ? color.color : color);
            }, this));
            this.btnBorderColor.on('auto:select', _.bind(function(btn, color) {
                this.tableStyler.setVirtualBorderColor((typeof(color) == 'object') ? color.color : color);
            }, this));
            this.colorsBorder = this.btnBorderColor.getPicker();

            this.btnBackColor = new Common.UI.ColorButton({
                parentEl: $('#drop-advanced-button-color'),
                additionalAlign: this.menuAddAlign,
                transparent: true,
                takeFocusOnClose: true
            });
            this.btnBackColor.on('color:select', _.bind(function(btn, color) {
                var clr, border;
                me.paragraphShade = color;

                if (me._changedProps) {
                    if (me._changedProps.get_Shade()===undefined || me._changedProps.get_Shade()===null) {
                        me._changedProps.put_Shade(new Asc.asc_CParagraphShd());
                    }
                    if (color=='transparent') {
                        me._changedProps.get_Shade().put_Value(Asc.c_oAscShdNil);
                    } else {
                        me._changedProps.get_Shade().put_Value(Asc.c_oAscShdClear);
                        me._changedProps.get_Shade().put_Color(Common.Utils.ThemeColor.getRgbColor(color));
                    }
                }
                var colorstr = (typeof(color) == 'object') ? color.color : color;
                me.tableStyler.setTableColor(colorstr);
                me.tableStyler.redrawTable();
            }, this));
            this.colorsBack = this.btnBackColor.getPicker();

            this.spnMarginTop = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-top'),
                step        : 0.1,
                width       : 100,
                value       : '0 cm',
                defaultUnit : 'cm',
                maxValue    : 55.87,
                minValue    : 0
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (!this._noApply) {
                    if (_.isUndefined(this.Margins))
                        this.Margins = {};

                    this.Margins.Top = Common.Utils.Metric.fnRecalcToMM(field.getNumberValue());
                }
            }, me));

            this.spnMarginLeft = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-left'),
                step        : 0.1,
                width       : 100,
                value       : '0 cm',
                defaultUnit : 'cm',
                maxValue    : 55.87,
                minValue    : 0
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (!this._noApply) {
                    if (_.isUndefined(this.Margins))
                        this.Margins = {};

                    this.Margins.Left = Common.Utils.Metric.fnRecalcToMM(field.getNumberValue());
                }
            }, me));

            this.spnMarginBottom = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-bottom'),
                step        : 0.1,
                width       : 100,
                value       : '0 cm',
                defaultUnit : 'cm',
                maxValue    : 55.87,
                minValue    : 0
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (!this._noApply) {
                    if (_.isUndefined(this.Margins))
                        this.Margins = {};

                    this.Margins.Bottom = Common.Utils.Metric.fnRecalcToMM(field.getNumberValue());
                }
            }, me));

            this.spnMarginRight = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-right'),
                step        : 0.1,
                width       : 100,
                value       : '0 cm',
                defaultUnit : 'cm',
                maxValue    : 55.87,
                minValue    : 0
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (!this._noApply) {
                    if (_.isUndefined(this.Margins))
                        this.Margins = {};

                    this.Margins.Right = Common.Utils.Metric.fnRecalcToMM(field.getNumberValue());
                }
            }, me));

            this.btnNone = new Common.UI.Button({
                parentEl: $('#drop-advanced-button-none'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'icon-advanced-wrap options__icon options__icon-huge btn-drop-none',
                enableToggle: true,
                toggleGroup : 'dropAdvGroup',
                allowDepress: false,
                hint: this.textNone
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(Asc.c_oAscDropCap.None);
                    me._changedProps.put_DropCap(Asc.c_oAscDropCap.None);
                }
            }, me));

            this.btnInText = new Common.UI.Button({
                parentEl: $('#drop-advanced-button-intext'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'icon-advanced-wrap options__icon options__icon-huge btn-drop-text icon-rtl',
                enableToggle: true,
                toggleGroup : 'dropAdvGroup',
                allowDepress: false,
                hint: this.textInText
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(Asc.c_oAscDropCap.Drop);
                    me._changedProps.put_DropCap(Asc.c_oAscDropCap.Drop);
                }
            }, me));

            this.btnInMargin = new Common.UI.Button({
                parentEl: $('#drop-advanced-button-inmargin'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'icon-advanced-wrap options__icon options__icon-huge btn-drop-margin',
                enableToggle: true,
                toggleGroup : 'dropAdvGroup',
                allowDepress: false,
                hint: this.textInMargin
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(Asc.c_oAscDropCap.Margin);
                    me._changedProps.put_DropCap(Asc.c_oAscDropCap.Margin);
                }
            }, me));

            this.spnRowHeight = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-rowheight'),
                step        : 1,
                width       : 120,
                value       : 3,
                defaultUnit : '',
                maxValue    : 10,
                minValue    : 1,
                allowDecimal: false
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    me._changedProps.put_Lines(field.getNumberValue());
                }
            }, me));

            this.numDistance = new Common.UI.MetricSpinner({
                el          : $('#drop-advanced-input-distance'),
                step        : 0.1,
                width       : 120,
                value       : '0 cm',
                defaultUnit : 'cm',
                maxValue    : 55.87,
                minValue    : 0
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    me._changedProps.put_HSpace(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
                }
            }, me));

            this.cmbFonts = new Common.UI.ComboBoxFonts({
                el          : $('#drop-advanced-input-fonts'),
                cls         : 'input-group-nr',
                style       : 'width: 290px;',
                menuCls     : 'scrollable-menu',
                menuStyle   : 'min-width: 55px;max-height: 236px;',
                store       : new Common.Collections.Fonts(),
                recent      : 0,
                hint: this.tipFontName,
                takeFocusOnClose: true
            })
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me._changedProps.put_FontFamily(record.name);
                }
            }, me));

            this.btnFrameNone = new Common.UI.Button({
                parentEl: $('#frame-advanced-button-none'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'options__icon options__icon-huge btn-none',
                enableToggle: true,
                toggleGroup : 'frameAdvGroup',
                allowDepress: false,
                hint: this.textNone
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(c_oAscFrameWrap.None);
                    me._changedProps.put_Wrap(c_oAscFrameWrap.None);
                }
            }, me));

            this.btnFrameInline = new Common.UI.Button({
                parentEl: $('#frame-advanced-button-inline'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'options__icon options__icon-huge btn-table-align-center',
                enableToggle: true,
                toggleGroup : 'frameAdvGroup',
                allowDepress: false,
                hint: this.textInline
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(c_oAscFrameWrap.Inline);
                    me._changedProps.put_Wrap(c_oAscFrameWrap.Inline);
                }
            }, me));

            this.btnFrameFlow = new Common.UI.Button({
                parentEl: $('#frame-advanced-button-flow'),
                cls         : 'btn huge-1 btn-options',
                iconCls     : 'options__icon options__icon-huge btn-table-flow',
                enableToggle: true,
                toggleGroup : 'frameAdvGroup',
                allowDepress: false,
                hint: this.textFlow
            })
            .on('toggle', _.bind(function(btn, pressed) {
                if (me._changedProps && pressed) {
                    me._DisableElem(c_oAscFrameWrap.Flow);
                    me._changedProps.put_Wrap(c_oAscFrameWrap.Flow);
                }
            }, me));

            this._arrWidth = [
                {displayValue: this.textAuto, value: 0},
                {displayValue: this.textExact, value: 1}
            ];
            this.cmbWidth = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-widthtype'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 130px;',
                editable    : false,
                takeFocusOnClose: true,
                data        : this._arrWidth
            })
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me.spnWidth.suspendEvents();
                    me.spnWidth.setValue((record.value==0) ? '' : 1);
                    me.spnWidth.resumeEvents();
                    me._changedProps.put_W((record.value==0) ? undefined : Common.Utils.Metric.fnRecalcToMM(this.spnWidth.getNumberValue()));
                }
            }, me));
            this.cmbWidth.setValue(this._arrWidth[0].value);

            this.spnWidth = new Common.UI.MetricSpinner({
                el          : $('#frame-advanced-input-width'),
                maxValue    : 55.88,
                minValue    : 0.02,
                step        : 0.1,
                defaultUnit : "cm",
                value       : ''
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    me.cmbWidth.suspendEvents();
                    me.cmbWidth.setValue(this._arrWidth[1].value);
                    me.cmbWidth.resumeEvents();
                    me._changedProps.put_W(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
                }
            }, me));

            this._arrHeight = [
                {displayValue: this.textAuto, value: 0},
                {displayValue: this.textExact, value: 1},
                {displayValue: this.textAtLeast, value: 2}
            ];
            this.cmbHeight = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-heighttype'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 130px;',
                editable    : false,
                takeFocusOnClose: true,
                data        : this._arrHeight
            })
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me.spnHeight.suspendEvents();
                    me.spnHeight.setValue((record.value==0) ? '' : 1);
                    me.spnHeight.resumeEvents();

                    me._changedProps.put_HRule((record.value==0) ? Asc.linerule_Auto : ((record.value==1) ? Asc.linerule_Exact : Asc.linerule_AtLeast));
                    if (record.value > 0)
                        this._changedProps.put_H(Common.Utils.Metric.fnRecalcToMM(this.spnHeight.getNumberValue()));
                }
            }, me));
            this.cmbHeight.setValue(this._arrHeight[0].value);

            this.spnHeight = new Common.UI.MetricSpinner({
                el          : $('#frame-advanced-input-height'),
                maxValue    : 55.88,
                minValue    : 0.02,
                step        : 0.1,
                defaultUnit : "cm",
                value       : ''
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    var type = Asc.linerule_Auto;
                    if (me.cmbHeight.getValue()==me._arrHeight[1].value)
                        type = Asc.linerule_Exact;
                    else if (me.cmbHeight.getValue()==me._arrHeight[2].value)
                        type = Asc.linerule_AtLeast;

                    if (type==Asc.linerule_Auto) {
                        me.cmbHeight.suspendEvents();
                        me.cmbHeight.setValue(me._arrHeight[2].value);
                        type = Asc.linerule_AtLeast;
                        me.cmbHeight.resumeEvents();
                    }

                    me._changedProps.put_HRule(type);
                    me._changedProps.put_H(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
                }
            }, me));

            this.spnX = new Common.UI.MetricSpinner({
                el          : $('#frame-advanced-input-hdist'),
                maxValue    : 55.87,
                minValue    : 0,
                step        : 0.1,
                defaultUnit : "cm",
                value       : '0 cm',
                width       : 'auto'
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    me._changedProps.put_HSpace(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
                }
            }, me));

            this.spnY = new Common.UI.MetricSpinner({
                el          : $('#frame-advanced-input-vdist'),
                maxValue    : 55.87,
                minValue    : 0,
                step        : 0.1,
                defaultUnit : "cm",
                value       : '0 cm',
                width       : 'auto'
            })
            .on('change', _.bind(function(field, newValue, oldValue) {
                if (me._changedProps) {
                    me._changedProps.put_VSpace(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
                }
            }, me));

            this._arrHAlign = [
                {displayValue: this.textLeft,   value: Asc.c_oAscXAlign.Left},
                {displayValue: this.textCenter, value: Asc.c_oAscXAlign.Center},
                {displayValue: this.textRight,  value: Asc.c_oAscXAlign.Right}
            ];
            this.cmbHAlign = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-hposition'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 130px;',
                data        : this._arrHAlign,
                takeFocusOnClose: true
            })
            .on('changed:after', _.bind(function(combo, record) {
                if (me._changedProps) {
                    if (combo.getSelectedRecord()) {
                        me._changedProps.put_XAlign(record.value);
                    } else {
                        var number = Common.Utils.String.parseFloat(record.value);
                        if (!isNaN(number)) {
                            me._changedProps.put_XAlign(undefined);
                            me._changedProps.put_X(Common.Utils.Metric.fnRecalcToMM(number));
                        }
                    }
                }
            }, me))
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me._changedProps.put_XAlign(record.value);
                }
            }, me));
            this.cmbHAlign.setValue(this._arrHAlign[0].value);

            this._arrHRelative = [
                {displayValue: this.textMargin, value: Asc.c_oAscHAnchor.Margin},
                {displayValue: this.textPage,   value: Asc.c_oAscHAnchor.Page},
                {displayValue: this.textColumn, value: Asc.c_oAscHAnchor.Text}
            ];
            this.cmbHRelative = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-hrelative'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 95px;',
                data        : this._arrHRelative,
                editable    : false,
                takeFocusOnClose: true
            })
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me._changedProps.put_HAnchor(record.value);
                }
            }, me));
            this.cmbHRelative.setValue(this._arrHRelative[1].value);

            this._arrVAlign = [
                {displayValue: this.textTop,    value: Asc.c_oAscYAlign.Top},
                {displayValue: this.textCenter, value: Asc.c_oAscYAlign.Center},
                {displayValue: this.textBottom, value: Asc.c_oAscYAlign.Bottom}
            ];
            this.cmbVAlign = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-vposition'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 130px;',
                data        : this._arrVAlign,
                takeFocusOnClose: true
            })
            .on('changed:after', _.bind(function(combo, record) {
                if (me._changedProps) {
                    if (combo.getSelectedRecord()) {
                        me._changedProps.put_YAlign(record.value);
                    } else {
                        var number = Common.Utils.String.parseFloat(record.value);
                        if (!isNaN(number)) {
                            me._changedProps.put_YAlign(undefined);
                            me._changedProps.put_Y(Common.Utils.Metric.fnRecalcToMM(Common.Utils.String.parseFloat(record.value)));
                        }
                    }
                }
            }, me))
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me._changedProps.put_YAlign(record.value);
                }
            }, me));
            this.cmbVAlign.setValue(this._arrVAlign[0].value);

            this._arrVRelative = [
                {displayValue: this.textMargin,     value: Asc.c_oAscVAnchor.Margin},
                {displayValue: this.textPage,       value: Asc.c_oAscVAnchor.Page},
                {displayValue: this.textParagraph,  value: Asc.c_oAscVAnchor.Text}
            ];
            this.cmbVRelative = new Common.UI.ComboBox({
                el          : $('#frame-advanced-input-vrelative'),
                cls         : 'input-group-nr',
                menuStyle   : 'min-width: 95px;',
                data        : this._arrVRelative,
                editable    : false,
                takeFocusOnClose: true
            })
            .on('selected', _.bind(function(combo, record) {
                if (me._changedProps) {
                    me._changedProps.put_VAnchor(record.value);
                    this.chMove.setValue(record.value == Asc.c_oAscVAnchor.Text, true);
                }
            }, me));
            this.cmbVRelative.setValue(this._arrVRelative[2].value);

            this.chMove = new Common.UI.CheckBox({
                el: $('#frame-advanced-checkbox-move'),
                labelText: this.textMove
            })
            .on('change', _.bind(function(checkbox, state) {
                if (me._changedProps) {
                    var rec = this.cmbVRelative.store.at(state == 'checked' ? 2 : 1);
                    me.cmbVRelative.setValue(rec.get('value'));
                    me._changedProps.put_VAnchor(rec.get('value'));
                }
            }, me));

            this.on('show', _.bind(this.onShowDialog, this));

            this.afterRender();
        },

        afterRender: function() {

            this.updateMetricUnit();
            this.updateThemeColors();

            if (!this.isFrame) {
                this.cmbFonts.fillFonts(this.fontStore);
            }

            this._setDefaults(this._originalProps);

            var colorstr = (typeof(this.paragraphShade) == 'object') ? this.paragraphShade.color : this.paragraphShade;
            this.tableStyler.setTableColor(colorstr);
            (colorstr!='transparent') && this.tableStyler.redrawTable();


            if (this.borderProps !== undefined) {
                this.btnBorderColor.setColor(this.borderProps.borderColor);
                this.btnBorderColor.setAutoColor(this.borderProps.borderColor=='auto');
                this.tableStyler.setVirtualBorderColor((typeof(this.btnBorderColor.color) == 'object') ? this.btnBorderColor.color.color : this.btnBorderColor.color);
                if (this.borderProps.borderColor=='auto')
                    this.colorsBorder.clearSelection();
                else
                    this.colorsBorder.select(this.borderProps.borderColor,true);

                this.cmbBorderSize.setValue(this.borderProps.borderSize.ptValue);
                this.BorderSize = {ptValue: this.borderProps.borderSize.ptValue, pxValue: this.borderProps.borderSize.pxValue};
                this.tableStyler.setVirtualBorderSize(this.BorderSize.pxValue);
            }

            this.setTitle((this.isFrame) ? this.textTitleFrame : this.textTitle);

            this.tableStyler.on('borderclick:cellborder', function(ct, border, size, color){
                if (this.ChangedBorders===undefined) {
                    this.ChangedBorders = new Asc.asc_CParagraphBorders();
                }
                this._UpdateCellBordersStyle(ct, border, size, color, this.Borders);
            }, this);

            this.tableStyler.on('borderclick', function(ct, border, size, color){
                if (this.ChangedBorders===undefined) {
                    this.ChangedBorders = new Asc.asc_CParagraphBorders();
                }
                this._UpdateTableBordersStyle(ct, border, size, color, this.Borders);
            }, this);

            if (this.isFrame)
                this.setInnerHeight(415);

            this.btnsCategory[(this.isFrame) ? 1 : 0].setVisible(false);
            if (this.storageName) {
                var value = Common.localStorage.getItem(this.storageName);
                this.setActiveCategory((value!==null) ? parseInt(value) : 0);
            }
        },

        getFocusedComponents: function() {
            return this.btnsCategory.concat([
                this.btnFrameNone, this.btnFrameInline, this.btnFrameFlow, this.cmbWidth, this.spnWidth, this.cmbHeight, this.spnHeight, this.cmbHAlign, this.cmbHRelative, this.spnX, this.cmbVAlign, this.cmbVRelative, this.spnY, this.chMove, // 0 tab
                this.btnNone, this.btnInText, this.btnInMargin, this.cmbFonts, this.spnRowHeight, this.numDistance, // 1 tab
                this.cmbBorderSize, this.btnBorderColor]).concat(this._btnsBorderPosition).concat([this.btnBackColor,  // 2 tab
                this.spnMarginTop, this.spnMarginLeft, this.spnMarginBottom, this.spnMarginRight // 3 tab
            ]).concat(this.getFooterButtons());
        },

        onCategoryClick: function(btn, index) {
            Common.Views.AdvancedSettingsWindow.prototype.onCategoryClick.call(this, btn, index);

            var me = this;
            setTimeout(function(){
                switch (index) {
                    case 0:
                        me.cmbWidth.focus();
                        break;
                    case 1:
                        me.cmbFonts.focus();
                        break;
                    case 2:
                        me.cmbBorderSize.focus();
                        break;
                    case 3:
                        me.spnMarginTop.focus();
                        break;
                }
            }, 100);
        },

        getSettings: function() {
            if (this.ChangedBorders === null) {
                this._changedProps.put_Borders(this.Borders);
            } else if (this.ChangedBorders !== undefined) {
                this._changedProps.put_Borders(this.ChangedBorders);
            }

            if (this.Margins) {
                var borders = this._changedProps.get_Borders();
                if (borders===undefined || borders===null)  {
                    this._changedProps.put_Borders(new Asc.asc_CParagraphBorders());
                    borders = this._changedProps.get_Borders();
                }
                if (this.Margins.Left!==undefined) {
                    if (borders.get_Left()===undefined || borders.get_Left()===null)
                        borders.put_Left(new Asc.asc_CTextBorder(this.Borders.get_Left()));
                    borders.get_Left().put_Space(this.Margins.Left);
                }
                if (this.Margins.Top!==undefined) {
                    if (borders.get_Top()===undefined || borders.get_Top()===null)
                        borders.put_Top(new Asc.asc_CTextBorder(this.Borders.get_Top()));
                    borders.get_Top().put_Space(this.Margins.Top);
                }
                if (this.Margins.Right!==undefined) {
                    if (borders.get_Right()===undefined || borders.get_Right()===null)
                        borders.put_Right(new Asc.asc_CTextBorder(this.Borders.get_Right()));
                    borders.get_Right().put_Space(this.Margins.Right);
                }
                if (this.Margins.Bottom!==undefined) {
                    if (borders.get_Bottom()===undefined || borders.get_Bottom()===null)
                        borders.put_Bottom(new Asc.asc_CTextBorder(this.Borders.get_Bottom()));
                    borders.get_Bottom().put_Space(this.Margins.Bottom);
                    if (borders.get_Between()===undefined || borders.get_Between()===null)
                        borders.put_Between(new Asc.asc_CTextBorder(this.Borders.get_Between()));
                    borders.get_Between().put_Space(this.Margins.Bottom);
                }
            }

            this._changedProps.put_FromDropCapMenu(!this.isFrame);

            return {
                paragraphProps  : this._changedProps,
                borderProps     : {
                    borderSize      : this.BorderSize,
                    borderColor     : this.btnBorderColor.isAutoColor() ? 'auto' : this.btnBorderColor.color
                }
            };
        },

        onShowDialog: function(dlg) {
            if (!this.isFrame && this.btnNone.pressed)
                this._DisableElem(Asc.c_oAscDropCap.None);
            else if (this.isFrame && this.btnFrameNone.pressed)
                this._DisableElem(c_oAscFrameWrap.None);
        },

        onBtnBordersClick: function(btn, eOpts){
            this.updateBordersStyle(btn.options.strId, true);
            if (this.api) {
                var properties = new Asc.CTableProp();
                properties.put_CellBorders(this.CellBorders);
                properties.put_CellSelect(true);
                this.api.tblApply(properties);
            }
            this.fireEvent('editcomplete', this);
        },

        updateThemeColors: function() {
            this.colorsBorder.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsBack.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
        },

        updateMetricUnit: function() {
            var me = this;

            _.each([
                me.spnMarginTop,
                me.spnMarginLeft,
                me.spnMarginBottom,
                me.spnMarginRight,
                me.numDistance,
                me.spnWidth,
                me.spnHeight,
                me.spnX,
                me.spnY
            ], function(spinner) {
                spinner.setDefaultUnit(Common.Utils.Metric.getCurrentMetricName());
                spinner.setStep(Common.Utils.Metric.getCurrentMetric() == Common.Utils.Metric.c_MetricUnits.pt ? 1 : 0.1);
            });
        },

        _setDefaults: function(props) {
            if (props) {
                this._noApply = true;
                this._originalProps = new Asc.asc_CParagraphProperty(props);
                var frame_props = props.get_FramePr();
                if (frame_props) {
                    var value;
                    if (this.isFrame) {
                        value = frame_props.get_W();
                        this.cmbWidth.setValue((value===undefined) ? this._arrWidth[0].value : this._arrWidth[1].value);
                        this.spnWidth.setValue((value!==undefined) ? Common.Utils.Metric.fnRecalcFromMM(value) : '');

                        value = frame_props.get_HRule();
                        if (value!==undefined) {
                            this.cmbHeight.setValue((value===Asc.linerule_Exact) ? this._arrHeight[1].value : this._arrHeight[2].value);
                            this.spnHeight.setValue(Common.Utils.Metric.fnRecalcFromMM(frame_props.get_H()));

                        } else {
                            this.cmbHeight.setValue(this._arrHeight[0].value);
                            this.spnHeight.setValue('');
                        }

                        value = frame_props.get_HSpace();
                        this.spnX.setValue((value!==undefined) ? Common.Utils.Metric.fnRecalcFromMM(value) : 0);

                        value = frame_props.get_VSpace();
                        this.spnY.setValue((value!==undefined) ? Common.Utils.Metric.fnRecalcFromMM(value) : 0);

                        value = frame_props.get_HAnchor();
                        for (var i = 0; i < this._arrHRelative.length; i++) {
                            if (value == this._arrHRelative[i].value) {
                                this.cmbHRelative.setValue(this._arrHRelative[i].value);
                                break;
                            }
                        }

                        value = frame_props.get_XAlign();
                        if (value!==undefined) {
                            for (var i=0; i<this._arrHAlign.length; i++) {
                                if (value == this._arrHAlign[i].value) {
                                    this.cmbHAlign.setValue(this._arrHAlign[i].value);
                                    break;
                                }
                            }
                        } else {
                            value = frame_props.get_X();
                            this.cmbHAlign.setValue(Common.Utils.Metric.fnRecalcFromMM((value!==undefined) ? value : 0) + ' ' + Common.Utils.Metric.getCurrentMetricName());
                        }

                        value = frame_props.get_VAnchor();
                        for (var i=0; i<this._arrVRelative.length; i++) {
                            if (value == this._arrVRelative[i].value) {
                                this.cmbVRelative.setValue(this._arrVRelative[i].value);
                                break;
                            }
                        }
                        this.chMove.setValue(value==Asc.c_oAscVAnchor.Text);

                        value = frame_props.get_YAlign();
                        if (value!==undefined) {
                            for (var i=0; i<this._arrVAlign.length; i++) {
                                if (value == this._arrVAlign[i].value) {
                                    this.cmbVAlign.setValue(this._arrVAlign[i].value);
                                    break;
                                }
                            }
                        } else {
                            value = frame_props.get_Y();
                            this.cmbVAlign.setValue(Common.Utils.Metric.fnRecalcFromMM((value!==undefined) ? value : 0) + ' ' + Common.Utils.Metric.getCurrentMetricName());
                        }

                        value = frame_props.get_Wrap();
                        if (value===false)
                            this.btnFrameInline.toggle(true, false);
                        else
                            this.btnFrameFlow.toggle(true, false);

                    } else {
                        this.spnRowHeight.setValue((frame_props.get_Lines() !== null) ? frame_props.get_Lines() : '');
                        this.numDistance.setValue((frame_props.get_HSpace() !== null) ? Common.Utils.Metric.fnRecalcFromMM(frame_props.get_HSpace()) : '');
                        value = frame_props.get_DropCap();
                        if (value==Asc.c_oAscDropCap.Drop)
                            this.btnInText.toggle(true, false);
                        else if (value==Asc.c_oAscDropCap.Margin)
                            this.btnInMargin.toggle(true, false);
                        else
                            this.btnNone.toggle(true, false);

                        value = frame_props.get_FontFamily();
                        if (value) {
                            var rec = this.cmbFonts.store.findWhere({name: value.get_Name()});
                            if (rec)
                                this.cmbFonts.setValue(rec.get('name'));
                            else
                                this.cmbFonts.setRawValue(value.get_Name());
                        }
                    }

                    this.Borders = new Asc.asc_CParagraphBorders(frame_props.get_Borders());

                    if (this.Borders) {
                        var brd = this.Borders.get_Left();
                        var val = (null !== brd && undefined !== brd && null !== brd.get_Space() && undefined !== brd.get_Space()) ? Common.Utils.Metric.fnRecalcFromMM(brd.get_Space()) : '';
                        this.spnMarginLeft.setValue(val);
                        brd = this.Borders.get_Top();
                        val = (null !== brd && undefined !== brd && null !== brd.get_Space() && undefined !== brd.get_Space()) ? Common.Utils.Metric.fnRecalcFromMM(brd.get_Space()) : '';
                        this.spnMarginTop.setValue(val);
                        brd = this.Borders.get_Right();
                        val = (null !== brd && undefined !== brd && null !== brd.get_Space() && undefined !== brd.get_Space()) ? Common.Utils.Metric.fnRecalcFromMM(brd.get_Space()) : '';
                        this.spnMarginRight.setValue(val);
                        brd = this.Borders.get_Bottom();
                        val = (null !== brd && undefined !== brd && null !== brd.get_Space() && undefined !== brd.get_Space()) ? Common.Utils.Metric.fnRecalcFromMM(brd.get_Space()) : '';
                        this.spnMarginBottom.setValue(val);
                    }

                    var shd = frame_props.get_Shade();
                    if (shd!==null && shd!==undefined && shd.get_Value()===Asc.c_oAscShdClear) {
                        var color = shd.get_Color();
                        if (color) {
                            if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                this.paragraphShade = {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value()};
                            } else {
                                this.paragraphShade = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                            }
                        } else
                            this.paragraphShade = 'transparent';
                    } else {
                        this.paragraphShade = 'transparent';
                    }
                    this.btnBackColor.setColor(this.paragraphShade);
                    Common.Utils.ThemeColor.selectPickerColorByEffect(this.paragraphShade, this.colorsBack);
                    this._UpdateBorders();
                }

                this._noApply = false;

                this._changedProps = new Asc.asc_CParagraphFrame();
                if (this.isFrame && frame_props && frame_props.get_W()!==undefined) {
                    this._changedProps.put_W(frame_props.get_W());
                }

                this.ChangedBorders = undefined;
            }
        },

        _DisableElem: function(btnId){
            var disabled = (btnId === Asc.c_oAscDropCap.None || btnId === c_oAscFrameWrap.None);

            _.each(this.btnsCategory, function(btn) {
                if (btn.options.contentTarget == 'id-adv-dropcap-borders' ||
                    btn.options.contentTarget == 'id-adv-dropcap-margins')
                    btn.setDisabled(disabled);
            });

            if (this.isFrame) {
                disabled = (btnId == c_oAscFrameWrap.None);
                this.cmbHAlign.setDisabled(disabled);
                this.cmbHRelative.setDisabled(disabled);
                this.spnX.setDisabled(disabled);
                this.cmbVAlign.setDisabled(disabled);
                this.cmbVRelative.setDisabled(disabled);
                this.spnY.setDisabled(disabled);
                this.chMove.setDisabled(disabled);
                this.cmbWidth.setDisabled(disabled);
                this.cmbHeight.setDisabled(disabled);
                this.spnWidth.setDisabled(disabled);
                this.spnHeight.setDisabled(disabled);
            } else {
                disabled = (btnId == Asc.c_oAscDropCap.None);
                this.spnRowHeight.setDisabled(disabled);
                this.numDistance.setDisabled(disabled);
                this.cmbFonts.setDisabled(disabled);
            }
        },

        _UpdateBorders: function (){
            var oldSize = this.BorderSize;
            var oldColor = this.btnBorderColor.color;

            this._UpdateBorder(this.Borders.get_Left(), 'l');
            this._UpdateBorder(this.Borders.get_Top(), 't');
            this._UpdateBorder(this.Borders.get_Right(), 'r');
            this._UpdateBorder(this.Borders.get_Bottom(), 'b');

            if (this.Borders.get_Between() !== null) {
                for (var i=0; i<this.tableStyler.rows-1; i++) {
                    this._UpdateCellBorder(this.Borders.get_Between(),  this.tableStyler.getCellBorder(i, -1));
                }
            }

            this.tableStyler.setVirtualBorderSize(oldSize.pxValue);
            this.tableStyler.setVirtualBorderColor((typeof(oldColor) == 'object') ? oldColor.color : oldColor);
            this.tableStyler.redrawTable();
        },

        _UpdateCellBorder: function(BorderParam,  cell){
            if (null !== BorderParam && undefined !== BorderParam){
                if (null !== BorderParam.get_Value() && null !== BorderParam.get_Size() && null !== BorderParam.get_Color() && 1 == BorderParam.get_Value()){
                    cell.setBordersSize(this._BorderPt2Px(BorderParam.get_Size() * 72 / 25.4));
                    cell.setBordersColor('rgb(' + BorderParam.get_Color().get_r() + ',' + BorderParam.get_Color().get_g() + ',' + BorderParam.get_Color().get_b() + ')');
                } else
                    cell.setBordersSize(0);
            }
            else {
                cell.setBordersSize(0);
            }
        },

        _UpdateBorder: function(BorderParam, borderName){
            if (null !== BorderParam && undefined !== BorderParam){
                if (null !== BorderParam.get_Value() && null !== BorderParam.get_Size() && null !== BorderParam.get_Color() && 1 == BorderParam.get_Value()){
                    this.tableStyler.setBordersSize(borderName, this._BorderPt2Px(BorderParam.get_Size() * 72 / 25.4));
                    this.tableStyler.setBordersColor(borderName, 'rgb(' + BorderParam.get_Color().get_r() + ',' + BorderParam.get_Color().get_g() + ',' + BorderParam.get_Color().get_b() + ')');
                } else
                    this.tableStyler.setBordersSize(borderName, 0);
            }
            else {
                this.tableStyler.setBordersSize(borderName, 0);
            }
        },

        _BorderPt2Px: function(value) {
            if (value==0) return 0;
            if (value <0.6) return 0.5;
            if (value <=1) return 1;
            if (value <=1.5) return 2;
            if (value <=2.25) return 3;
            if (value <=3) return 4;
            if (value <=4.5) return 6;
            return 8;
        },

        _ApplyBorderPreset: function(border) {
            this.ChangedBorders = null;

            this.Borders.put_Left(this._UpdateBorderStyle(this.Borders.get_Left(),    (border.indexOf('l') > -1)));
            this.Borders.put_Top(this._UpdateBorderStyle(this.Borders.get_Top(),    (border.indexOf('t') > -1)));
            this.Borders.put_Right(this._UpdateBorderStyle(this.Borders.get_Right(),    (border.indexOf('r') > -1)));
            this.Borders.put_Bottom(this._UpdateBorderStyle(this.Borders.get_Bottom(),    (border.indexOf('b') > -1)));
            this.Borders.put_Between(this._UpdateBorderStyle(this.Borders.get_Between(),    (border.indexOf('m') > -1)));

            this._UpdateBorders();
        },

        _UpdateBorderStyle: function(border, visible) {
            if (null == border)
                border = new Asc.asc_CTextBorder();

            if (visible && this.BorderSize.ptValue > 0){
                var size = parseFloat(this.BorderSize.ptValue);
                border.put_Value(1);
                border.put_Size(size * 25.4 / 72.0);
                var color;
                if (this.btnBorderColor.isAutoColor()) {
                    color = new Asc.asc_CColor();
                    color.put_auto(true);
                } else {
                    color = Common.Utils.ThemeColor.getRgbColor(this.btnBorderColor.color);
                }
                border.put_Color(color);
            }
            else {
                border.put_Color(new Asc.asc_CColor());
                border.put_Value(0);
            }
            return border;
        },

        _UpdateCellBordersStyle: function(ct, border, size, color, destination) {
            var updateBorders = destination;
            updateBorders.put_Between(this._UpdateBorderStyle(updateBorders.get_Between(), (size>0)));
            if (this.ChangedBorders) {
                this.ChangedBorders.put_Between(new Asc.asc_CTextBorder(updateBorders.get_Between()));
            }

        },

        _UpdateTableBordersStyle: function(ct, border, size, color, destination) {
            var updateBorders = destination;

            if (border.indexOf('l') > -1)  {
                updateBorders.put_Left(this._UpdateBorderStyle(updateBorders.get_Left(), (size>0)));
                if (this.ChangedBorders) {
                    this.ChangedBorders.put_Left(new Asc.asc_CTextBorder(updateBorders.get_Left()));
                }
            }
            if (border.indexOf('t') > -1) {
                updateBorders.put_Top(this._UpdateBorderStyle(updateBorders.get_Top(), (size>0)));
                if (this.ChangedBorders) {
                    this.ChangedBorders.put_Top(new Asc.asc_CTextBorder(updateBorders.get_Top()));
                }
            }
            if (border.indexOf('r') > -1) {
                updateBorders.put_Right(this._UpdateBorderStyle(updateBorders.get_Right(), (size>0)));
                if (this.ChangedBorders) {
                    this.ChangedBorders.put_Right(new Asc.asc_CTextBorder(updateBorders.get_Right()));
                }
            }
            if (border.indexOf('b') > -1) {
                updateBorders.put_Bottom(this._UpdateBorderStyle(updateBorders.get_Bottom(), (size>0)));
                if (this.ChangedBorders) {
                    this.ChangedBorders.put_Bottom(new Asc.asc_CTextBorder(updateBorders.get_Bottom()));
                }
            }
        },


        textTitle:      'Drop Cap - Advanced Settings',
        strBorders:             'Borders & Fill',
        textBorderWidth:        'Border Size',
        textBorderColor:        'Border Color',
        textBackColor:          'Background Color',
        textBorderDesc:         'Click on diagramm or use buttons to select borders',
        textPosition: 'Position',
        textAlign: 'Alignment',
        textTop:            'Top',
        textLeft:           'Left',
        textBottom:         'Bottom',
        textRight:          'Right',
        textCenter: 'Center',
        strMargins: 'Margins',
        strDropcap: 'Drop Cap',
        textNone: 'None',
        textInText: 'In text',
        textInMargin: 'In margin',
        textParameters: 'Parameters',
        textRowHeight: 'Height in rows',
        textDistance: 'Distance from text',
        textFont: 'Font',
        textInline: 'Inline frame',
        textFlow: 'Flow frame',
        textFrame: 'Frame',
        textWidth: 'Width',
        textHeight: 'Height',
        textAuto: 'Auto',
        textExact: 'Exactly',
        textAtLeast: 'At least',
        textMove: 'Move with text',
        textHorizontal: 'Horizontal',
        textVertical: 'Vertical',
        textRelative: 'Relative to',
        textColumn: 'Column',
        textMargin: 'Margin',
        textPage: 'Page',
        textParagraph: 'Paragraph',
        tipFontName: 'Font Name',
        textTitleFrame: 'Frame - Advanced Settings'
    }, DE.Views.DropcapSettingsAdvanced || {}));
});