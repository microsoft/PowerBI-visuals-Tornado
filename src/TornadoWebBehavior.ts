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

import {
    Selection as d3Selection 
} from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import { TooltipArgsWrapper, TornadoBehaviorOptions, TornadoChartPoint } from "./interfaces";
import { TornadoChartUtils } from "./tornadoChartUtils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

export class TornadoWebBehavior {
    private legendItems: Selection<LegendDataPoint>;
    private columns: Selection<TornadoChartPoint>;
    private clearCatcher: Selection<any>;
    private legendClearCatcher: Selection<any>;
    private dataPoints: TornadoChartPoint[];
    private legendDataPoints: LegendDataPoint[];
    private legendIcons: Selection<LegendDataPoint>;
    private gradients: Selection<TornadoChartPoint>;
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private colorHelper: ColorHelper;

    constructor(selectionManager: ISelectionManager, colorHelper: ColorHelper){
        this.selectionManager = selectionManager;
        this.colorHelper = colorHelper;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void{
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.dataPoints, selectionIds || selectedIds);
        this.setSelectedToDataPoints(this.legendDataPoints, selectionIds || selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: LegendDataPoint[] | TornadoChartPoint[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: LegendDataPoint| TornadoChartPoint) => {
            dataPoint.selected = false;
            ids.forEach((selectedId: ISelectionId) => {
                if (selectedId.includes(<ISelectionId>dataPoint.identity)) {
                    dataPoint.selected = true;
                }
            });
        });
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: TornadoChartPoint | LegendDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindClickEvent(elements: Selection<any>): void {
        elements.on("click", (event: PointerEvent, dataPoint: TornadoChartPoint | LegendDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            if (dataPoint){
                this.selectionManager.select(dataPoint.identity, isMultiSelection);
                event.stopPropagation();
            }
            else {
                this.selectionManager.clear();
            }
            this.onSelectCallback();
        })
    }

    private bindKeyboardEvent(elements: Selection<any>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: TornadoChartPoint | LegendDataPoint) => {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.identity, isMultiSelection);

            event.stopPropagation();
            this.onSelectCallback();
        });
    }

    public renderSelection(){
        const legendHasSelection: boolean = this.legendDataPoints.some((dataPoint: LegendDataPoint) => dataPoint.selected);
        const dataPointHasSelection: boolean = this.dataPoints.some((dataPoint: TornadoChartPoint) => dataPoint.selected);
        const dataPointHasHighlight: boolean = this.dataPoints.some((dataPoint: TornadoChartPoint) => dataPoint.highlight);

        this.legendIcons.style("fill-opacity", (legendDataPoint: LegendDataPoint) => {
            return TornadoChartUtils.getLegendFillOpacity(
                legendDataPoint.selected,
                legendHasSelection,
                this.colorHelper.isHighContrast
            );
        });

        this.legendIcons.style("fill", (legendDataPoint: LegendDataPoint) => {
            return TornadoChartUtils.getLegendFill(
                legendDataPoint.selected,
                legendHasSelection,
                legendDataPoint.color,
                this.colorHelper.isHighContrast
            );
        });

        this.columns.attr("aria-selected", (dataPoint: TornadoChartPoint) => {
            return dataPoint.selected
        });
        this.applySelectionStyleAttribute(this.columns, "fill-opacity", dataPointHasSelection);
        this.applySelectionStyleAttribute(this.columns, "stroke-opacity", dataPointHasSelection);
        this.applyGradientsForHighlight(dataPointHasSelection, dataPointHasHighlight);
    }

    private applyGradientsForHighlight(hasSelection: boolean, hasHighlight: boolean) {
        this.gradients.selectAll("stop").remove();
        // from left to right
        // bright color
        this.gradients.append("stop")
            .attr("offset", (p: TornadoChartPoint) => ((hasSelection && p.selected) || (!hasSelection && !hasHighlight) ? 100 : p.highlightedValue / p.value * 100) + "%")
            .attr("stop-color", (p: TornadoChartPoint) => this.colorHelper.isHighContrast ? this.colorHelper.getThemeColor() : p.color)
            .attr("stop-opacity", 1);

        // from right to left
        // less bright color
        // but % starts from left to right (so f.e 30% means end point will be at 30% starting from left, but coloring will start from right until reach end point)
        this.gradients.append("stop")
            .attr("offset", (p: TornadoChartPoint) => p.highlightedValue / p.value * 100 + "%")
            .attr("stop-color", (p: TornadoChartPoint) => this.colorHelper.isHighContrast ? this.colorHelper.getThemeColor() : p.color)
            .attr("stop-opacity", 0.4);
    }
 
    private applySelectionStyleAttribute(elements: Selection<TornadoChartPoint>, attributeName: string, hasSelection: boolean) {
        elements.style(attributeName, (dataPoint: TornadoChartPoint) => {
            return TornadoChartUtils.getOpacity(
                dataPoint.selected,
                dataPoint.highlight,
                hasSelection,
                this.colorHelper.isHighContrast);
        });
    }

    public bindEvents(options: TornadoBehaviorOptions) {
        this.columns = options.columns;
        this.legendItems = options.legend;
        this.dataPoints = options.columns.data();
        this.legendDataPoints = options.legend.data();
        this.clearCatcher = options.clearCatcher;
        this.legendClearCatcher = options.legendClearCatcher;
        this.legendIcons = options.legend.selectAll(".legendIcon");
        this.gradients = options.gradients;

        this.applyOnObjectFormatMode(options.isFormatMode, options.tooltipArgs);
    }

    private applyOnObjectFormatMode(isFormatMode: boolean, tooltipArgs: TooltipArgsWrapper){
        if (isFormatMode){
            // remove event listeners which are irrelevant for format mode.
            this.removeEventListeners();
            this.selectionManager.clear();
        } else {
            this.addEventListeners(tooltipArgs);
        }
    }

    private removeEventListeners(): void {
        this.columns.on("click", null);
        this.columns.on("contextmenu", null);
        this.columns.on("keydown", null);
        this.clearCatcher.on("click", null);
        this.clearCatcher.on("contextmenu", null);
        this.legendClearCatcher.on("click", null);
        this.legendClearCatcher.on("contextmenu", null);
        this.legendItems.on("click", null);
        this.legendItems.on("contextmenu", null);
    }

    private addEventListeners(tooltipArgs: TooltipArgsWrapper): void {
        this.applySelectionStateToData();

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            tooltipArgs.tooltipService,
            tooltipArgs.tooltipElement);
        
        this.tooltipServiceWrapper.addTooltip(
            this.columns,
            (tooltipEvent: TornadoChartPoint) => {
                return tooltipEvent.tooltipData;
            },
            (tooltipEvent: TornadoChartPoint) => {
                return tooltipEvent.identity;}
        );

        this.bindContextMenuEvent(this.columns);
        this.bindContextMenuEvent(this.legendItems);
        this.bindContextMenuEvent(this.clearCatcher);
        this.bindContextMenuEvent(this.legendClearCatcher);

        this.bindClickEvent(this.columns);
        this.bindClickEvent(this.legendItems);
        this.bindClickEvent(this.clearCatcher);
        this.bindClickEvent(this.legendClearCatcher);
        
        this.bindKeyboardEvent(this.columns);
    }
}
