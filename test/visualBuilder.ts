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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // TornadoChart1452517688218
    import VisualPlugin = powerbi.visuals.plugins.TornadoChart1452517688218;
    import VisualClass = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChart;
    import TornadoChartSeries = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChartSeries;
    import TornadoChartDataView = powerbi.extensibility.visual.TornadoChart1452517688218.TornadoChartDataView;

    export class TornadoChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number) {
            super(width, height, VisualPlugin.name);
        }

        protected build(options: VisualConstructorOptions): VisualClass {
            return new VisualClass(options);
        }

        public get mainElement(): JQuery {
            return this.element.children("svg.tornado-chart");
        }

        public get scrollable(): JQuery {
            return this.element
                .children("svg.tornado-chart")
                .children("g");
        }

        public get scrollbar(): JQuery {
            return this.mainElement.children("g.y.brush");
        }

        public get scrollbarRect(): JQuery {
            return this.scrollbar.children("rect.extent");
        }

        public get categories(): JQuery {
            return this.scrollable
                .children("g.categories")
                .children("g.category");
        }

        public get categoryText(): JQuery {
            return this.categories.children("text.category-text");
        }

        public get axis(): JQuery {
            return this.scrollable
                .children("g.axes")
                .children("line.axis");
        }

        public get columns(): JQuery {
            return this.scrollable
                .children("g.columns")
                .children("rect.column");
        }

        public get labels(): JQuery {
            return this.scrollable
                .children("g.labels")
                .children("g.label");
        }

        public get labelText(): JQuery {
            return this.labels.children("text.label-text");
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

        public converter(dataView: DataView): TornadoChartDataView {
            return VisualClass.converter(
                dataView,
                this.visualHost,
                this.visual.textOptions,
                this.visual.colors);
        }
    }
}
