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

import DataView = powerbiVisualsApi.DataView;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewValueColumnGroup = powerbiVisualsApi.DataViewValueColumnGroup;

import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
import { TornadoChart as VisualClass } from "../src/TornadoChart";
import { TornadoChartSeries, TornadoChartDataView } from "../src/interfaces";
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import { TornadoChartSettingsModel } from "../src/TornadoChartSettingsModel";

export class TornadoChartBuilder extends VisualBuilderBase<VisualClass> {
    constructor(width: number, height: number) {
        super(width, height, "TornadoChart1452517688218");
    }

    protected build(options: VisualConstructorOptions): VisualClass {
        return new VisualClass(options);
    }

    public get instance(): VisualClass {
        return this.visual;
    }

    public get mainElement(): SVGElement {
        return this.element.querySelector("svg.tornado-chart")!;
    }
    
    public get scrollable(): NodeListOf<HTMLElement> {
        return this.element.querySelectorAll("svg.tornado-chart g");
    }
    public get scrollbar(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("g.y.brush");
    }
    
    public get scrollbarRect(): NodeListOf<HTMLElement> {
        return this.scrollbar[0].querySelectorAll("rect.selection");
    }
    
    public get categories(): NodeListOf<HTMLElement> {
        return this.scrollable[0].querySelectorAll("g.categories g.category");
    }
    
    public get categoryText(): NodeListOf<HTMLElement> {
        return this.categories[0].querySelectorAll("text.category-text");
    }
    
    public get axis(): NodeListOf<HTMLElement> {
        return this.scrollable[0].querySelectorAll("g.axes > line.axis");
    }
    
    public get columns(): NodeListOf<HTMLElement> {
        return this.scrollable[0].querySelectorAll("g.columns rect.column");
    }

    public get columnsDefs(): NodeListOf<HTMLElement> {
        return this.scrollable[0].querySelectorAll("g.columns defs");
    }
    
    public get labels(): NodeListOf<HTMLElement> {
        return this.scrollable[0].querySelectorAll("g.labels > g.label");
    }
    
    public get labelText(): NodeListOf<HTMLElement> {
        return this.labels[0].querySelectorAll("text.label-text");
    }

    public parseSeries(
        dataView: DataView,
        dataViewValueColumns: DataViewValueColumns,
        index: number,
        isGrouped: boolean,
        columnGroup: DataViewValueColumnGroup): TornadoChartSeries {

        return VisualClass.parseSeries(
            dataView,
            dataViewValueColumns,
            this.visualHost,
            index,
            isGrouped,
            columnGroup,
            this.visual.colors);
    }

    public converter(dataView: DataView, formattingSettings: TornadoChartSettingsModel): TornadoChartDataView {
        return VisualClass.converter(
            dataView,
            this.visualHost,
            this.visual.colors,
            this.visualHost.createLocalizationManager(),
            formattingSettings
        );
    }
}
