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
import { TornadoBehaviorOptions, TornadoChartPoint } from "./interfaces";
import { TornadoChartUtils } from "./tornadoChartUtils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

export class TornadoWebBehavior {
    private legend: Selection<any>;
    private columns: Selection<any>;
    private clearCatcher: Selection<any>;
    private dataPoints: TornadoChartPoint[];
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(selectionManager: ISelectionManager){
        this.selectionManager = selectionManager;

        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => {
            this.dataPoints.forEach(dataPoint => {
                ids.forEach(bookmarkSelection => {
                    if (bookmarkSelection.includes(dataPoint.identity)) {
                        dataPoint.selected = true;
                    }
                });
            });

            this.renderSelection();
        });
    }

    public bindEvents(options: TornadoBehaviorOptions) {
        this.columns = options.columns;
        this.clearCatcher = options.clearCatcher;
        this.dataPoints = options.dataPoints;
        this.legend = options.legend;
        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            options.tooltipArgs.tooltipService,
            options.tooltipArgs.tooltipElement);
        
        this.tooltipServiceWrapper.addTooltip(
            this.columns,
            (tooltipEvent: TornadoChartPoint) => {
                return tooltipEvent.tooltipData;
            },
            (tooltipEvent: TornadoChartPoint) => {
                return tooltipEvent.identity;}
        );

        this.columns.on("click", (event : PointerEvent, dataPoint: TornadoChartPoint) => {
            event && this.selectionManager.select(
                dataPoint.identity,
                event.ctrlKey || event.metaKey || event.shiftKey);
            event.stopPropagation();
            this.renderSelection();
        });

        this.columns.on("keydown", (event : KeyboardEvent, dataPoint: TornadoChartPoint) => {
            if(event?.code == "Enter" || event?.code == "Space")
            {
                this.selectionManager.select(
                    dataPoint.identity,
                    event.ctrlKey || event.metaKey || event.shiftKey);
            }
            event.stopPropagation();
            this.renderSelection();
        });

        //Handle contextmenu on columns
        this.columns.on("contextmenu", (event: PointerEvent, dataPoint: TornadoChartPoint) => {
            this.selectionManager.showContextMenu(dataPoint.identity,
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault(); 
            event.stopPropagation();
            this.renderSelection();
        });

        //Handle contextmenu on empty area
        this.clearCatcher.on("contextmenu", (event: PointerEvent) => {
            this.selectionManager.showContextMenu({},
            {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault(); 
            this.renderSelection();
        });

        this.clearCatcher.on("click", () => {
            this.selectionManager.clear();
            this.renderSelection();
        });

        this.legend.on("contextmenu", (event: PointerEvent) => {
            this.selectionManager.showContextMenu({},
            {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault(); 
            this.renderSelection();
        });

        this.legend.on("click", () => {
            this.selectionManager.clear();
            this.renderSelection();
        });
    }
    
    public hasSelection(): boolean {
        return this.selectionManager.hasSelection();
    }

    public renderSelection() {
        this.setSelectedToDataPoints(this.dataPoints);
        const hasSelection: boolean = this.selectionManager.hasSelection();
        this.changeOpacityAttribute("fill-opacity", hasSelection);
        this.changeOpacityAttribute("stroke-opacity", hasSelection);

        this.columns.attr("aria-selected", (dataPoint: TornadoChartPoint) => {
            return dataPoint.selected;
        });
    }

    private setSelectedToDataPoints(dataPoints: TornadoChartPoint[]): void {
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        dataPoints.forEach((dataPoint: TornadoChartPoint) => {
            dataPoint.selected = selectedIds.some((id: ISelectionId) => id.equals(dataPoint.identity));
        });
    }

    private changeOpacityAttribute(attributeName: string, hasSelection: boolean) {
        this.columns.style(attributeName, (d: TornadoChartPoint) => {
            return TornadoChartUtils.getOpacity(
                d.selected,
                d.highlight,
                hasSelection);
        });
    }
}
