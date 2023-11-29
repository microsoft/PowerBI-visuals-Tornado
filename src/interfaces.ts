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

import powerbiVisualsApi from "powerbi-visuals-api";
import {
    BaseType as d3BaseType,
    Selection as d3Selection 
} from "d3-selection";

type Selection<T> = d3Selection<d3BaseType, T, d3BaseType, any>;

import DataViewObject = powerbiVisualsApi.DataViewObject;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;

import { valueFormatter as vf} from "powerbi-visuals-utils-formattingutils";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import IValueFormatter = vf.IValueFormatter;

import {
    interactivitySelectionService as interactivityService,
    interactivityBaseService
} from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivityService.SelectableDataPoint;
import IInteractivityService = interactivityBaseService.IInteractivityService;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendData = legendInterfaces.LegendData;

import ITooltipService = powerbiVisualsApi.extensibility.ITooltipService;

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

export interface TornadoChartLabelFormatter {
    getLabelValueFormatter?: (formatString: string) => IValueFormatter;
}

export interface TornadoChartDataView {
    categories: TextData[];
    series: TornadoChartSeries[];
    legend: LegendData;
    dataPoints: TornadoChartPoint[];
    hasDynamicSeries: boolean;
    hasHighlights: boolean;
    labelHeight: number;
    maxLabelsWidth: number;
    legendObjectProperties: DataViewObject;
    categoriesObjectProperties: DataViewObject;
    labelFormatter: TornadoChartLabelFormatter;
}

export interface TornadoChartPoint extends SelectableDataPoint {
    uniqId: number;
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
    highlightedValue: number;
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

export interface TornadoBehaviorOptions extends interactivityBaseService.IBehaviorOptions<TornadoChartPoint> {
    columns: Selection<any>;
    clearCatcher: Selection<any>;
    interactivityService: IInteractivityService<TornadoChartPoint>;
    tooltipArgs: TooltipArgsWrapper;
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

export class TooltipArgsWrapper {
    tooltipElement?: HTMLElement;
    tooltipService?: ITooltipService;

    constructor(tooltipElement: HTMLElement, tooltipService: ITooltipService)
    {
        this.tooltipElement = tooltipElement;
        this.tooltipService = tooltipService;
    }
}

