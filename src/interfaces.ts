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
import Selection = d3.Selection;

import DataViewObject = powerbi.DataViewObject;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import ISelectionId = powerbi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

import { valueFormatter as vf, textMeasurementService as tms } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = vf.IValueFormatter;
import TextProperties = tms.TextProperties;

import { interactivityService } from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivityService.SelectableDataPoint;
import IInteractivityService = interactivityService.IInteractivityService;

import { legendInterfaces, dataLabelInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendData = legendInterfaces.LegendData;
import VisualDataLabelsSettings = dataLabelInterfaces.VisualDataLabelsSettings;

export interface TornadoChartTextOptions {
    fontFamily?: string;
    fontSize?: number;
}

export interface TornadoChartSeries {
    fill: string;
    name: string;
    selectionId: ISelectionId;
    categoryAxisEnd: number;
}

export interface TornadoChartSettings {
    labelOutsideFillColor: string;
    categoriesFillColor: string;
    labelSettings: VisualDataLabelsSettings;
    showLegend?: boolean;
    showCategories?: boolean;
    categoriesFontSize?: number;
    categoriesPosition?: any;
    legendFontSize?: number;
    legendColor?: string;
    getLabelValueFormatter?: (formatString: string) => IValueFormatter;
}

export interface TornadoChartDataView {
    categories: TextData[];
    series: TornadoChartSeries[];
    settings: TornadoChartSettings;
    legend: LegendData;
    dataPoints: TornadoChartPoint[];
    highlightedDataPoints?: TornadoChartPoint[];
    hasDynamicSeries: boolean;
    hasHighlights: boolean;
    labelHeight: number;
    maxLabelsWidth: number;
    legendObjectProperties: DataViewObject;
    categoriesObjectProperties: DataViewObject;
}

export interface TornadoChartPoint extends SelectableDataPoint {
    dx?: number;
    dy?: number;
    px?: number;
    py?: number;
    angle?: number;
    width?: number;
    height?: number;
    label?: LabelData;
    color: string;
    tooltipData: VisualTooltipDataItem[];
    categoryIndex: number;
    highlight?: boolean;
    value: number;
    minValue: number;
    maxValue: number;
    formatString: string;
}

export interface LabelData {
    dx: number;
    value: number | string;
    source: number | string;
    color: string;
}

export interface LineData {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface TextData {
    text: string;
    height: number;
    width: number;
    textProperties: TextProperties;
}

export interface TornadoBehaviorOptions {
    columns: Selection<any>;
    clearCatcher: Selection<any>;
    interactivityService: IInteractivityService;
}

export interface TooltipCategoryDataItem {
    value?: any;
    metadata: DataViewMetadataColumn[];
}

export interface TooltipSeriesDataItem {
    value?: any;
    highlightedValue?: any;
    metadata: DataViewValueColumn;
}

