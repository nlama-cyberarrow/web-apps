/*
 * (c) Copyright Ascensio System SIA 2010-2023
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
 *  ImageSettingsAdvanced.js
 *
 *  Created on 4/16/14
 *
 */

define([
    'text!pdfeditor/main/app/template/ImageSettingsAdvanced.template',
    'common/main/lib/view/AdvancedSettingsWindow'
], function (contentTemplate) {
    'use strict';

    PDFE.Views.ImageSettingsAdvanced = Common.Views.AdvancedSettingsWindow.extend(_.extend({
        options: {
            alias: 'ImageSettingsAdvanced',
            contentWidth: 340,
            contentHeight: 257,
            sizeOriginal: {width: 0, height: 0},
            sizeMax: {width: 55.88, height: 55.88},
            storageName: 'pdfe-img-settings-adv-category'
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle,
                items: [
                    {panelId: 'id-adv-image-general',    panelCaption: this.textGeneral},
                    {panelId: 'id-adv-image-size',       panelCaption: this.textPlacement},
                    {panelId: 'id-adv-image-rotate',     panelCaption: this.textRotation},
                    {panelId: 'id-adv-image-alttext',    panelCaption: this.textAlt}
                ],
                contentTemplate: _.template(contentTemplate)({
                    scope: this
                })
            }, options);

            Common.Views.AdvancedSettingsWindow.prototype.initialize.call(this, this.options);
            this.spinners = [];

            this._nRatio = 1;
            this._isDefaultSize = false;
            this._originalProps = this.options.imageProps;
            this.slideSize = this.options.slideSize;
        },

        render: function() {
            Common.Views.AdvancedSettingsWindow.prototype.render.call(this);

            var me = this;

            // General
            this.inputImageName = new Common.UI.InputField({
                el          : $('#image-general-name'),
                allowBlank  : true,
                validateOnBlur: false,
                style       : 'width: 100%;'
            }).on('changed:after', function() {
                me.isImgNameChanged = true;
            });

            // Placement
            this.spnWidth = new Common.UI.MetricSpinner({
                el: $('#image-advanced-spin-width'),
                step: .1,
                width: 70,
                defaultUnit : "cm",
                value: '3 cm',
                maxValue: 55.88,
                minValue: 0
            });
            this.spnWidth.on('change', _.bind(function(field, newValue, oldValue, eOpts){
                if (this.btnRatio.pressed) {
                    var w = field.getNumberValue();
                    var h = w/this._nRatio;
                    if (h>this.sizeMax.height) {
                        h = this.sizeMax.height;
                        w = h * this._nRatio;
                        this.spnWidth.setValue(w, true);
                    }
                    this.spnHeight.setValue(h, true);
                }
                this._isDefaultSize = false;
            }, this));
            this.spinners.push(this.spnWidth);

            this.spnHeight = new Common.UI.MetricSpinner({
                el: $('#image-advanced-spin-height'),
                step: .1,
                width: 70,
                defaultUnit : "cm",
                value: '3 cm',
                maxValue: 55.88,
                minValue: 0
            });
            this.spnHeight.on('change', _.bind(function(field, newValue, oldValue, eOpts){
                var h = field.getNumberValue(), w = null;
                if (this.btnRatio.pressed) {
                    w = h * this._nRatio;
                    if (w>this.sizeMax.width) {
                        w = this.sizeMax.width;
                        h = w/this._nRatio;
                        this.spnHeight.setValue(h, true);
                    }
                    this.spnWidth.setValue(w, true);
                }
                this._isDefaultSize = false;
            }, this));
            this.spinners.push(this.spnHeight);

            this.btnOriginalSize = new Common.UI.Button({
                el: $('#image-advanced-button-original-size')
            });
            this.btnOriginalSize.on('click', _.bind(function(btn, e) {
                this.spnAngle.setValue(0);
                this.spnWidth.setValue(this.sizeOriginal.width, true);
                this.spnHeight.setValue(this.sizeOriginal.height, true);
                this._nRatio = this.sizeOriginal.width/this.sizeOriginal.height;
            }, this));

            this.btnRatio = new Common.UI.Button({
                parentEl: $('#image-advanced-button-ratio'),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-advanced-ratio',
                style: 'margin-bottom: 1px;',
                enableToggle: true,
                hint: this.textKeepRatio
            });
            this.btnRatio.on('click', _.bind(function(btn, e) {
                if (btn.pressed && this.spnHeight.getNumberValue()>0) {
                    this._nRatio = this.spnWidth.getNumberValue()/this.spnHeight.getNumberValue();
                }
            }, this));

            this.spnX = new Common.UI.MetricSpinner({
                el: $('#image-advanced-spin-x'),
                step: .1,
                width: 85,
                defaultUnit : "cm",
                defaultValue : 0,
                value: '0 cm',
                maxValue: 55.87,
                minValue: -55.87
            });
            this.spinners.push(this.spnX);

            this.spnY = new Common.UI.MetricSpinner({
                el: $('#image-advanced-spin-y'),
                step: .1,
                width: 85,
                defaultUnit : "cm",
                defaultValue : 0,
                value: '0 cm',
                maxValue: 55.87,
                minValue: -55.87
            });
            this.spinners.push(this.spnY);

            this.cmbFromX = new Common.UI.ComboBox({
                el: $('#image-advanced-combo-from-x'),
                cls: 'input-group-nr',
                style: "width: 125px;",
                menuStyle: 'min-width: 125px;',
                data: [
                    { value: 'left', displayValue: this.textTopLeftCorner },
                    { value: 'center', displayValue: this.textCenter }
                ],
                editable: false,
                takeFocusOnClose: true
            });

            this.cmbFromY = new Common.UI.ComboBox({
                el: $('#image-advanced-combo-from-y'),
                cls: 'input-group-nr',
                style: "width: 125px;",
                menuStyle: 'min-width: 125px;',
                data: [
                    { value: 'left', displayValue: this.textTopLeftCorner },
                    { value: 'center', displayValue: this.textCenter }
                ],
                editable: false,
                takeFocusOnClose: true
            });

            // Rotation
            this.spnAngle = new Common.UI.MetricSpinner({
                el: $('#image-advanced-spin-angle'),
                step: 1,
                width: 80,
                defaultUnit : "°",
                value: '0 °',
                maxValue: 3600,
                minValue: -3600
            });

            this.chFlipHor = new Common.UI.CheckBox({
                el: $('#image-advanced-checkbox-hor'),
                labelText: this.textHorizontally
            });

            this.chFlipVert = new Common.UI.CheckBox({
                el: $('#image-advanced-checkbox-vert'),
                labelText: this.textVertically
            });

            // Alt Text

            this.inputAltTitle = new Common.UI.InputField({
                el          : $('#image-advanced-alt-title'),
                allowBlank  : true,
                validateOnBlur: false,
                style       : 'width: 100%;'
            }).on('changed:after', function() {
                me.isAltTitleChanged = true;
            });

            this.textareaAltDescription = this.$window.find('textarea');
            this.textareaAltDescription.keydown(function (event) {
                if (event.keyCode == Common.UI.Keys.RETURN) {
                    event.stopPropagation();
                }
                me.isAltDescChanged = true;
            });

            this.afterRender();
        },

        getFocusedComponents: function() {
            return this.btnsCategory.concat([
                this.inputImageName, // 0 tab
                this.spnWidth, this.btnRatio, this.spnHeight, this.btnOriginalSize, this.spnX, this.cmbFromX, this.spnY, this.cmbFromY,// 1 tab
                this.spnAngle, this.chFlipHor, this.chFlipVert, // 2 tab
                this.inputAltTitle, this.textareaAltDescription  // 3 tab
            ]).concat(this.getFooterButtons());
        },

        onCategoryClick: function(btn, index) {
            Common.Views.AdvancedSettingsWindow.prototype.onCategoryClick.call(this, btn, index);

            var me = this;
            setTimeout(function(){
                switch (index) {
                    case 0:
                        me.inputImageName.focus();
                        break;
                    case 1:
                        me.spnWidth.focus();
                        break;
                    case 2:
                        me.spnAngle.focus();
                        break;
                    case 3:
                        me.inputAltTitle.focus();
                        break;
                }
            }, 10);
        },

        afterRender: function() {
            this.updateMetricUnit();
            this._setDefaults(this._originalProps);
            if (this.storageName) {
                var value = Common.localStorage.getItem(this.storageName);
                this.setActiveCategory((value!==null) ? parseInt(value) : 0);
            }
        },

        _setDefaults: function(props) {
            if (props ){
                var value = props.asc_getName();
                this.inputImageName.setValue(value ? value : '');

                this.spnWidth.setMaxValue(this.sizeMax.width);
                this.spnHeight.setMaxValue(this.sizeMax.height);
                value = props.get_Width();
                this.spnWidth.setValue((value!==undefined) ? Common.Utils.Metric.fnRecalcFromMM(value).toFixed(2) : '', true);
                value = props.get_Height();
                this.spnHeight.setValue((value!==undefined) ? Common.Utils.Metric.fnRecalcFromMM(value).toFixed(2) : '', true);

                this.btnOriginalSize.setDisabled(props.get_ImageUrl()===null || props.get_ImageUrl()===undefined);

                value = props.asc_getLockAspect();
                this.btnRatio.toggle(value);
                if (props.get_Height()>0)
                    this._nRatio = props.get_Width()/props.get_Height();

                this.cmbFromX.setValue('left');
                this.cmbFromY.setValue('left');

                if (props.get_Position()) {
                    var Position = {X: props.get_Position().get_X(), Y: props.get_Position().get_Y()};
                    this.spnX.setValue((Position.X !== null && Position.X !== undefined) ? Common.Utils.Metric.fnRecalcFromMM(Position.X) : '', true);
                    this.spnY.setValue((Position.Y !== null && Position.Y !== undefined) ? Common.Utils.Metric.fnRecalcFromMM(Position.Y) : '', true);
                } else {
                    this.spnX.setValue('', true);
                    this.spnY.setValue('', true);
                }

                value = props.asc_getRot();
                this.spnAngle.setValue((value==undefined || value===null) ? '' : Math.floor(value*180/3.14159265358979+0.5), true);
                this.chFlipHor.setValue(props.asc_getFlipH());
                this.chFlipVert.setValue(props.asc_getFlipV());

                value = props.asc_getTitle();
                this.inputAltTitle.setValue(value ? value : '');

                value = props.asc_getDescription();
                this.textareaAltDescription.val(value ? value : '');

                var pluginGuid = props.asc_getPluginGuid();
                this.btnsCategory[2].setVisible(pluginGuid === null || pluginGuid === undefined); // Rotation
            }
        },

        getSettings: function() {
            var properties = new Asc.asc_CImgProperty();
            if (this.isImgNameChanged)
                properties.asc_putName(this.inputImageName.getValue());
            if (this.spnHeight.getValue()!=='')
                properties.put_Height(Common.Utils.Metric.fnRecalcToMM(this.spnHeight.getNumberValue()));
            if (this.spnWidth.getValue()!=='')
                properties.put_Width(Common.Utils.Metric.fnRecalcToMM(this.spnWidth.getNumberValue()));
            properties.asc_putLockAspect(this.btnRatio.pressed);
            properties.put_ResetCrop(this._isDefaultSize);

            var Position = new Asc.CPosition();
            if (this.spnX.getValue() !== '') {
                var x = Common.Utils.Metric.fnRecalcToMM(this.spnX.getNumberValue());
                if (this.cmbFromX.getValue() === 'center') {
                    x = (this.slideSize.width/36000)/2 + x;
                }
                Position.put_X(x);
            }
            if (this.spnY.getValue() !== '') {
                var y = Common.Utils.Metric.fnRecalcToMM(this.spnY.getNumberValue());
                if (this.cmbFromY.getValue() === 'center') {
                    y = (this.slideSize.height/36000)/2 + y;
                }
                Position.put_Y(y);
            }
            properties.put_Position(Position);

            if (this.isAltTitleChanged)
                properties.asc_putTitle(this.inputAltTitle.getValue());

            if (this.isAltDescChanged)
                properties.asc_putDescription(this.textareaAltDescription.val());

            properties.asc_putRot(this.spnAngle.getNumberValue() * 3.14159265358979 / 180);
            properties.asc_putFlipH(this.chFlipHor.getValue()=='checked');
            properties.asc_putFlipV(this.chFlipVert.getValue()=='checked');

            return { imageProps: properties };
        },

        updateMetricUnit: function() {
            if (this.spinners) {
                for (var i=0; i<this.spinners.length; i++) {
                    var spinner = this.spinners[i];
                    spinner.setDefaultUnit(Common.Utils.Metric.getCurrentMetricName());
                    spinner.setStep(Common.Utils.Metric.getCurrentMetric()==Common.Utils.Metric.c_MetricUnits.pt ? 1 : 0.1);
                }
            }
            this.sizeMax = {
                width: Common.Utils.Metric.fnRecalcFromMM(this.options.sizeMax.width*10),
                height: Common.Utils.Metric.fnRecalcFromMM(this.options.sizeMax.height*10)
            };
            if (this.options.sizeOriginal)
                this.sizeOriginal = {
                    width: Common.Utils.Metric.fnRecalcFromMM(this.options.sizeOriginal.width),
                    height: Common.Utils.Metric.fnRecalcFromMM(this.options.sizeOriginal.height)
                };
        },

        textOriginalSize: 'Actual Size',
        textPosition:   'Position',
        textSize:       'Size',
        textWidth:      'Width',
        textHeight:     'Height',
        textTitle:      'Image - Advanced Settings',
        textKeepRatio: 'Constant Proportions',
        textPlacement:  'Placement',
        textAlt: 'Alternative Text',
        textAltTitle: 'Title',
        textAltDescription: 'Description',
        textAltTip: 'The alternative text-based representation of the visual object information, which will be read to the people with vision or cognitive impairments to help them better understand what information there is in the image, autoshape, chart or table.',
        textRotation: 'Rotation',
        textAngle: 'Angle',
        textFlipped: 'Flipped',
        textHorizontally: 'Horizontally',
        textVertically: 'Vertically',
        textHorizontal: 'Horizontal',
        textVertical: 'Vertical',
        textFrom: 'From',
        textTopLeftCorner: 'Top Left Corner',
        textCenter: 'Center',
        textGeneral: 'General',
        textImageName: 'Image name'

    }, PDFE.Views.ImageSettingsAdvanced || {}));
});