/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbi from "powerbi-visuals-api";
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;

export let tornadoChartProperties = {
    dataPoint: {
        fill: <DataViewObjectPropertyIdentifier>{ objectName: "dataPoint", propertyName: "fill" }
    },
    categoryAxis: {
        end: <DataViewObjectPropertyIdentifier>{ objectName: "categoryAxis", propertyName: "end" }
    },
    categories: {
        show: <DataViewObjectPropertyIdentifier>{ objectName: "categories", propertyName: "show" },
        fill: <DataViewObjectPropertyIdentifier>{ objectName: "categories", propertyName: "fill" },
        fontSize: <DataViewObjectPropertyIdentifier>{ objectName: "categories", propertyName: "fontSize" },
        position: <DataViewObjectPropertyIdentifier>{ objectName: "categories", propertyName: "position" }
    },
    labels: {
        show: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "show" },
        labelPrecision: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "labelPrecision" },
        fontSize: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "fontSize" },
        labelDisplayUnits: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "labelDisplayUnits" },
        insideFill: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "insideFill" },
        outsideFill: <DataViewObjectPropertyIdentifier>{ objectName: "labels", propertyName: "outsideFill" }
    },
    legend: {
        show: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "show" },
        position: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "position" },
        showTitle: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "showTitle" },
        titleText: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "titleText" },
        labelColor: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "labelColor" },
        fontSize: <DataViewObjectPropertyIdentifier>{ objectName: "legend", propertyName: "fontSize" }
    },
    selectedPropertyIdentifier: <DataViewObjectPropertyIdentifier>{ objectName: "general", propertyName: "selected" },
    filterPropertyIdentifier: <DataViewObjectPropertyIdentifier>{ objectName: "general", propertyName: "filter" },
    formatString: <DataViewObjectPropertyIdentifier>{ objectName: "general", propertyName: "formatString" },
    hasSavedSelection: true,
};
