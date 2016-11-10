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

module powerbi.extensibility.visual {

    // d3
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    // powerbi npm-packages
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import DataViewObjects = powerbi.DataViewObjects;
    import DataViewObject = powerbi.DataViewObject;

    import IStringResourceProvider = jsCommon.IStringResourceProvider;
    import PixelConverter = jsCommon.PixelConverter;
    import IGenericAnimator = powerbi.visuals.IGenericAnimator;
    import IMargin = powerbi.visuals.IMargin;
    import VisualDataLabelsSettings = powerbi.visuals.VisualDataLabelsSettings;
    import IValueFormatter = powerbi.visuals.IValueFormatter;
    import LegendData = powerbi.visuals.LegendData;
    import SelectableDataPoint = powerbi.visuals.SelectableDataPoint;
    import TextProperties = powerbi.TextProperties;
    import IInteractivityService = powerbi.visuals.IInteractivityService;
    import IInteractiveBehavior = powerbi.visuals.IInteractiveBehavior;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import SVGUtil = powerbi.visuals.SVGUtil;
    import IViewport = powerbi.IViewport;

    import VisualDataRoleKind = powerbi.VisualDataRoleKind;
    import legendPosition = powerbi.visuals.legendPosition;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import dataLabelUtils = powerbi.visuals.dataLabelUtils;
    import DataView = powerbi.DataView;
    import DataViewCategorical = powerbi.DataViewCategorical;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import TextMeasurementService = powerbi.TextMeasurementService;
    import valueFormatter = powerbi.visuals.valueFormatter;
    import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewScopeIdentity = powerbi.DataViewScopeIdentity;
    import DataViewObjectWithId = powerbi.DataViewObjectWithId;
    import ColorHelper = powerbi.visuals.ColorHelper;
    import ILegend = powerbi.visuals.ILegend;
    //import VisualInitOptions = powerbi.VisualInitOptions;
    //import IVisualStyle = powerbi.IVisualStyle;
    import createInteractivityService = powerbi.visuals.createInteractivityService;
    import appendClearCatcher = powerbi.visuals.appendClearCatcher;
    import createLegend = powerbi.visuals.createLegend;
    import GetAnimationDuration = powerbi.visuals.AnimatorCommon.GetAnimationDuration;
    import LegendDataPoint = powerbi.visuals.LegendDataPoint;
    import LegendIcon = powerbi.visuals.LegendIcon;
    import LegendPosition = powerbi.visuals.LegendPosition;
    import legendProps = powerbi.visuals.legendProps;

    import IColorPalette = powerbi.extensibility.IColorPalette;

    import TooltipManager = powerbi.visuals.TooltipManager;
    import TooltipEvent = powerbi.visuals.TooltipEvent;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import TooltipBuilder = powerbi.visuals.TooltipBuilder;
    import Legend = powerbi.visuals.Legend;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
    import VisualObjectInstance = powerbi.VisualObjectInstance;

    export interface TornadoChartTextOptions {
        fontFamily?: string;
        fontSize?: number;
        sizeUnit?: string;
    }

    export interface TornadoChartConstructorOptions {
        svg?: Selection<any>;
        animator?: IGenericAnimator;
        margin?: IMargin;
        columnPadding?: number;
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
        tooltipData: TooltipDataItem[];
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

    export class TornadoChart implements IVisual {
        private static ClassName: string = "tornado-chart";

        private static Properties: any = TornadoChart.getProperties([]/*TornadoChart.capabilities*/);
        public static getProperties(capabilities: any/*VisualCapabilities*/): any {
            let result = {};
            for(let objectKey in capabilities.objects) {
                result[objectKey] = {};
                for(let propKey in capabilities.objects[objectKey].properties) {
                    result[objectKey][propKey] = <DataViewObjectPropertyIdentifier> {
                        objectName: objectKey,
                        propertyName: propKey
                    };
                }
            }

            return result;
        }

        private static Columns: ClassAndSelector = {
            "class": "columns",
            selector: ".columns"
        };

        private static Column: ClassAndSelector = {
            "class": "column",
            selector: ".column"
        };

        private static Axes: ClassAndSelector = {
            "class": "axes",
            selector: ".axes"
        };

        private static Axis: ClassAndSelector = {
            "class": "axis",
            selector: ".axis"
        };

        private static Labels: ClassAndSelector = {
            "class": "labels",
            selector: ".labels"
        };

        private static Label: ClassAndSelector = {
            "class": "label",
            selector: ".label"
        };

        private static LabelTitle: ClassAndSelector = {
            "class": "label-title",
            selector: ".label-title"
        };

        private static LabelText: ClassAndSelector = {
            "class": "label-text",
            selector: ".label-text"
        };

        private static Categories: ClassAndSelector = {
            "class": "categories",
            selector: ".categories"
        };

        private static Category: ClassAndSelector = {
            "class": "category",
            selector: ".category"
        };

        private static CategoryTitle: ClassAndSelector = {
            "class": "category-title",
            selector: ".category-title"
        };

        private static CategoryText: ClassAndSelector = {
            "class": "category-text",
            selector: ".category-text"
        };

        private static MaxSeries: number = 2;
        private static MaxPrecision: number = 17; // max number of decimals in float
        private static LabelPadding: number = 2.5;
        private static CategoryMinHeight: number = 25;
        private static DefaultFontSize: number = 9;
        private static DefaultLegendFontSize: number = 8;
        private static HighlightedShapeFactor: number = 0.5;
        private static CategoryLabelMargin: number = 10;

        public static ScrollBarWidth = 22;

        private static DefaultTornadoChartSettings: TornadoChartSettings = {
            labelOutsideFillColor: dataLabelUtils.defaultLabelColor,
            labelSettings: {
                show: true,
                precision: null,
                fontSize: TornadoChart.DefaultFontSize,
                displayUnits: 0,
                labelColor: dataLabelUtils.defaultInsideLabelColor,
            },
            showCategories: true,
            showLegend: true,
            legendFontSize: TornadoChart.DefaultLegendFontSize,
            legendColor: LegendData.DefaultLegendLabelFillColor,
            categoriesFillColor: "#777"
        };

        public static converter(dataView: DataView, selectionIdBuilder: ISelectionIdBuilder, textOptions: TornadoChartTextOptions, colors: IColorPalette): TornadoChartDataView {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].source ||
                !dataView.categorical.values ||
                !dataView.categorical.values[0]) {
                return null;
            }

            let categorical: DataViewCategorical = dataView.categorical;
            let categories: DataViewCategoryColumn[] = categorical.categories || [];
            let values: DataViewValueColumns = categorical.values;

            let category: DataViewCategoricalColumn = categories[0];
            let formatStringProp: DataViewObjectPropertyIdentifier = TornadoChart.Properties.general.formatString;
            let maxValue: number = d3.max(<number[]>values[0].values);
            let settings: TornadoChartSettings = TornadoChart.parseSettings(dataView.metadata.objects, maxValue, colors);
            let hasDynamicSeries = !!values.source;
            let hasHighlights: boolean = !!(values.length > 0 && values[0].highlights);
            let labelHeight = TextMeasurementService.estimateSvgTextHeight({
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontSize: PixelConverter.fromPoint(settings.labelSettings.fontSize),
            });

            let series: TornadoChartSeries[] = [];
            let dataPoints: TornadoChartPoint[] = [];
            let highlightedDataPoints: TornadoChartPoint[] = [];

            let categorySourceFormatString: string = valueFormatter.getFormatString(category.source, formatStringProp);
            let categoriesLabels: TextData[] = category.values.map(value => {
                let formattedCategoryValue = valueFormatter.format(value, categorySourceFormatString);
                return TornadoChart.getTextData(formattedCategoryValue, textOptions, true);
            });

            let groupedValues: DataViewValueColumnGroup[] = values.grouped ? values.grouped() : null;

            let minValue: number = Math.min(d3.min(<number[]>values[0].values), 0);
            if (values.length === TornadoChart.MaxSeries) {
                minValue = d3.min([minValue, d3.min(<number[]>values[1].values)]);
                maxValue = d3.max([maxValue, d3.max(<number[]>values[1].values)]);
            }

            for (let seriesIndex = 0; seriesIndex < values.length; seriesIndex++) {
                let columnGroup: DataViewValueColumnGroup = groupedValues && groupedValues.length > seriesIndex
                    && groupedValues[seriesIndex].values ? groupedValues[seriesIndex] : null;

                let parsedSeries: TornadoChartSeries = TornadoChart.parseSeries(values, selectionIdBuilder, seriesIndex, hasDynamicSeries, columnGroup, colors);

                series.push(parsedSeries);

                let currentSeries = values[seriesIndex];
                let measureName = currentSeries.source.queryName;

                for (let i: number = 0; i < category.values.length; i++) {
                    let value = currentSeries.values[i] == null || isNaN(<number>currentSeries.values[i]) ? 0 : <number>currentSeries.values[i];

                    let identity: ISelectionId = selectionIdBuilder
                        .withCategory(category, i)
                        .withSeries(values, columnGroup)
                        .withMeasure(measureName)
                        .createSelectionId();

                    let formattedCategoryValue = categoriesLabels[i].text;
                    let tooltipInfo: TooltipDataItem[];
                    tooltipInfo = TooltipBuilder.createTooltipInfo(formatStringProp, categorical, formattedCategoryValue, value, null, null, seriesIndex, i, null);

                    // Limit maximum value with what the user choose
                    let currentMaxValue = parsedSeries.categoryAxisEnd
                        ? parsedSeries.categoryAxisEnd
                        : maxValue;

                    let formatString = dataView.categorical.values[seriesIndex].source.format;

                    dataPoints.push({
                        value: value,
                        minValue: minValue,
                        maxValue: currentMaxValue,
                        formatString: formatString,
                        color: parsedSeries.fill,
                        selected: false,
                        identity: identity,
                        tooltipData: tooltipInfo,
                        categoryIndex: i,
                    });

                    if (hasHighlights) {

                        let highlightIdentity: any = identity;/*SelectionId.createWithHighlight(identity);*/
                        let highlight: PrimitiveValue = <number>currentSeries.highlights[i];
                        let highlightedValue = highlight != null ? highlight : 0;
                        tooltipInfo = TooltipBuilder.createTooltipInfo(formatStringProp, categorical, formattedCategoryValue, value, null, null, seriesIndex, i, highlightedValue);

                        highlightedDataPoints.push({
                            value: highlightedValue,
                            minValue: minValue,
                            maxValue: currentMaxValue,
                            formatString: formatString,
                            color: parsedSeries.fill,
                            selected: false,
                            identity: highlightIdentity,
                            tooltipData: tooltipInfo,
                            categoryIndex: i,
                            highlight: true,
                        });
                    }
                }
            }

            return {
                categories: categoriesLabels,
                series: series,
                settings: settings,
                legend: TornadoChart.getLegendData(series, hasDynamicSeries),
                dataPoints: dataPoints,
                highlightedDataPoints: highlightedDataPoints,
                maxLabelsWidth: _.max(categoriesLabels.map(x => x.width)),
                hasDynamicSeries: hasDynamicSeries,
                hasHighlights: hasHighlights,
                labelHeight: labelHeight,
                legendObjectProperties: DataViewObjects.getObject(dataView.metadata.objects, "legend", {}),
            };
        }

        public static parseSeries(
            dataViewValueColumns: DataViewValueColumns,
            selectionIdBuilder: ISelectionIdBuilder,
            index: number,
            isGrouped: boolean,
            columnGroup: DataViewValueColumnGroup,
            colors: IColorPalette): TornadoChartSeries {

            let dataViewValueColumn: DataViewValueColumn = dataViewValueColumns ? dataViewValueColumns[index] : null,
                source: DataViewMetadataColumn = dataViewValueColumn ? dataViewValueColumn.source : null,
                identity: DataViewScopeIdentity = columnGroup ? columnGroup.identity : null,
                queryName: string = source ? source.queryName : null;

            /*
            let selectionId: ISelectionId = identity
                ? SelectionId.createWithId(identity)
                : selectionIdBuilder
                    .withSeries(dataViewValueColumns, columnGroup)
                    .withMeasure(queryName)
                    .createSelectionId();
                    */
            let selectionId: ISelectionId = selectionIdBuilder
                    .withSeries(dataViewValueColumns, columnGroup)
                    .withMeasure(queryName)
                    .createSelectionId();

            let objects: DataViewObjects,
                categoryAxisObject: DataViewObject | DataViewObjectWithId[],
                displayName = source ? source.groupName
                    ? source.groupName : source.displayName
                    : null;

            if (isGrouped && columnGroup) {
                categoryAxisObject = columnGroup.objects ? columnGroup.objects['categoryAxis'] : null;
                objects = columnGroup.objects;
            }
            else if (source) {
                objects = source.objects;
                categoryAxisObject = objects ? objects['categoryAxis'] : null;
            }

            let color: string = TornadoChart.getColor(
                TornadoChart.Properties.dataPoint.fill,
                ["purple", "teal"][index],
                objects, colors);

            let categoryAxisEnd: number = categoryAxisObject ? categoryAxisObject['end'] : null;

            return <TornadoChartSeries>{
                fill: color,
                name: displayName,
                selectionId: selectionId,
                categoryAxisEnd: categoryAxisEnd,
            };
        }

        private static getColor(properties: any, defaultColor: string, objects: DataViewObjects, colors: IColorPalette): string {
            let colorHelper: ColorHelper = new ColorHelper(colors, properties, defaultColor);
            return colorHelper.getColorForMeasure(objects, "");
        }

        private static getTextData(
            text: string,
            textOptions: TornadoChartTextOptions,
            measureWidth: boolean = false,
            measureHeight: boolean = false,
            overrideFontSize?: number): TextData {

            let width: number = 0,
                height: number = 0,
                fontSize: string,
                textProperties: TextProperties;

            text = text || "";

            fontSize = overrideFontSize
                ? PixelConverter.fromPoint(overrideFontSize)
                : `${textOptions.fontSize}${textOptions.sizeUnit}`;

            textProperties = {
                text: text,
                fontFamily: textOptions.fontFamily,
                fontSize: fontSize
            };

            if (measureWidth) {
                width = TextMeasurementService.measureSvgTextWidth(textProperties);
            }

            if (measureHeight) {
                height = TextMeasurementService.estimateSvgTextHeight(textProperties);
            }

            return {
                text: text,
                width: width,
                height: height,
                textProperties: textProperties
            };
        }

        public colors: IColorPalette;
        public textOptions: TornadoChartTextOptions = {};

        private columnPadding: number = 5;
        private leftLabelMargin: number = 4;
        private durationAnimations: number;
        private InnerTextHeightDelta: number = 2;

        private margin: IMargin = {
            top: 10,
            right: 5,
            bottom: 10,
            left: 10
        };

        private root: Selection<any>;
        private svg: Selection<any>;
        private main: Selection<any>;
        private columns: Selection<any>;
        private axes: Selection<any>;
        private labels: Selection<any>;
        private categories: Selection<any>;
        private clearCatcher: Selection<any>;

        private legend: ILegend;
        private behavior: IInteractiveBehavior;
        private interactivityService: IInteractivityService;
        private animator: IGenericAnimator;
        private hostService: IVisualHost;
        private scrolling: TornadoChartScrolling;

        private viewport: IViewport;
        private dataView: TornadoChartDataView;
        private heightColumn: number = 0;
        private selectionIdBuilder: ISelectionIdBuilder;

        private get allLabelsWidth(): number {
            return (this.dataView.settings.showCategories
                ? Math.min(this.dataView.maxLabelsWidth, this.scrolling.scrollViewport.width/2)
                : 3) + TornadoChart.CategoryLabelMargin;
        }

        private get allColumnsWidth(): number {
            return this.scrolling.scrollViewport.width - this.allLabelsWidth;
        }

        private get columnWidth(): number {
            return this.dataView.series.length === TornadoChart.MaxSeries
                ? this.allColumnsWidth/2
                : this.allColumnsWidth;
        }
        /*
        constructor(tornadoChartConstructorOptions?: TornadoChartConstructorOptions) {
            if (tornadoChartConstructorOptions) {
                this.svg = tornadoChartConstructorOptions.svg || this.svg;
                this.margin = tornadoChartConstructorOptions.margin || this.margin;
                this.columnPadding = tornadoChartConstructorOptions.columnPadding || this.columnPadding;
                this.animator = tornadoChartConstructorOptions.animator;
            }
        }
        */

        constructor(options: VisualConstructorOptions) {
            let fontSize: string;
            this.hostService = options.host;
            let element: JQuery = $(options.element);
            //this.colors = style.colorPalette.dataColors;

            this.interactivityService = createInteractivityService(this.hostService);
            this.selectionIdBuilder = this.hostService.createSelectionIdBuilder();

            let root: Selection<any>;
            if (this.svg) {
                this.root = root = this.svg;
            } else {
                this.root = root = d3.select(element.get(0))
                    .append("svg");
            }

            root
                .classed(TornadoChart.ClassName, true)
                .style('position', 'absolute');

            fontSize = root.style("font-size");

            this.textOptions.sizeUnit = fontSize.slice(fontSize.length - 2);
            this.textOptions.fontSize = Number(fontSize.slice(0, fontSize.length - 2));
            this.textOptions.fontFamily = root.style("font-family");

            this.scrolling = new TornadoChartScrolling(
                () => root,
                () => this.viewport,
                () => this.margin,
                () => this.dataView.categories.length * TornadoChart.CategoryMinHeight,
                true);

            let main: Selection<any> = this.main = root.append("g");
            this.clearCatcher = appendClearCatcher(main);
            this.columns = main
                .append("g")
                .classed(TornadoChart.Columns.class, true);

            this.axes = main
                .append("g")
                .classed(TornadoChart.Axes.class, true);

            this.labels = main
                .append("g")
                .classed(TornadoChart.Labels.class, true);

            this.categories = main
                .append("g")
                .classed(TornadoChart.Categories.class, true);

            this.behavior = new TornadoWebBehavior();
            this.legend = createLegend(element, false, this.interactivityService, true);
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions ||
                !visualUpdateOptions.dataViews ||
                !visualUpdateOptions.dataViews[0]) {
                return;
            }

            this.viewport = {
                height: Math.max(0, visualUpdateOptions.viewport.height - this.margin.top - this.margin.bottom),
                width: Math.max(0, visualUpdateOptions.viewport.width - this.margin.left - this.margin.right)
            };

            /*
            if (this.animator) {
                this.durationAnimations = GetAnimationDuration(this.animator, visualUpdateOptions.suppressAnimations);
            } else {
                this.durationAnimations = visualUpdateOptions.suppressAnimations ? 0 : 250;
            }
            */
            this.durationAnimations = 250;

            this.dataView = TornadoChart.converter(this.validateDataView(visualUpdateOptions.dataViews[0]), this.selectionIdBuilder, this.textOptions, this.colors);
            if (!this.dataView || this.scrolling.scrollViewport.height < TornadoChart.CategoryMinHeight) {
                this.clearData();
                return;
            }

            if (this.dataView && this.interactivityService) {
                this.interactivityService.applySelectionStateToData(this.dataView.dataPoints);
                this.interactivityService.applySelectionStateToData(this.dataView.highlightedDataPoints);
            }

            this.render();
        }

        private validateDataView(dataView: DataView): DataView {
            if(!dataView || !dataView.categorical || !dataView.categorical.values) {
                return null;
            }
            return dataView;
        }

        private updateElements(): void {
            let elementsTranslate: string = SVGUtil.translate(this.allLabelsWidth, 0);

            this.root.attr({
                "height": this.viewport.height + this.margin.top + this.margin.bottom,
                "width": this.viewport.width + this.margin.left + this.margin.right
            });

            this.columns
                .attr("transform", elementsTranslate);

            this.labels
                .attr("transform", elementsTranslate);

            this.axes
                .attr("transform", elementsTranslate);
        }

        private static parseSettings(objects: DataViewObjects, value: number, colors: IColorPalette): TornadoChartSettings {
            let precision: number = TornadoChart.getPrecision(objects);

            let displayUnits: number = DataViewObjects.getValue<number>(
                objects,
                TornadoChart.Properties.labels.labelDisplayUnits,
                TornadoChart.DefaultTornadoChartSettings.labelSettings.displayUnits);

            let labelSettings = TornadoChart.DefaultTornadoChartSettings.labelSettings;

            let getLabelValueFormatter = (formatString: string) => valueFormatter.create({
                format: formatString,
                precision: precision,
                value: (displayUnits === 0) && (value != null) ? value : displayUnits,
            });

            return {
                labelOutsideFillColor: TornadoChart.getColor(
                    TornadoChart.Properties.labels.outsideFill,
                    TornadoChart.DefaultTornadoChartSettings.labelOutsideFillColor,
                    objects,
                    colors),

                labelSettings: {
                    show: DataViewObjects.getValue<boolean>(objects, TornadoChart.Properties.labels.show, labelSettings.show),
                    precision: precision,
                    fontSize: DataViewObjects.getValue<number>(objects, TornadoChart.Properties.labels.fontSize, labelSettings.fontSize),
                    displayUnits: displayUnits,
                    labelColor: TornadoChart.getColor(TornadoChart.Properties.labels.insideFill, labelSettings.labelColor, objects, colors),
                },
                showCategories: DataViewObjects.getValue<boolean>(objects, TornadoChart.Properties.categories.show, TornadoChart.DefaultTornadoChartSettings.showCategories),
                showLegend: DataViewObjects.getValue<boolean>(objects, TornadoChart.Properties.legend.show, TornadoChart.DefaultTornadoChartSettings.showLegend),
                legendFontSize: DataViewObjects.getValue<number>(objects, TornadoChart.Properties.legend.fontSize, TornadoChart.DefaultTornadoChartSettings.legendFontSize),
                legendColor: TornadoChart.getColor(TornadoChart.Properties.legend.labelColor, TornadoChart.DefaultTornadoChartSettings.legendColor, objects, colors),
                categoriesFillColor: TornadoChart.getColor(TornadoChart.Properties.categories.fill, TornadoChart.DefaultTornadoChartSettings.categoriesFillColor, objects, colors),
                getLabelValueFormatter: getLabelValueFormatter
            };
        }

        private static getPrecision(objects: DataViewObjects): number {
            let precision: number = DataViewObjects.getValue<number>(
                objects,
                TornadoChart.Properties.labels.labelPrecision,
                TornadoChart.DefaultTornadoChartSettings.labelSettings.precision);

            return Math.min(Math.max(0, precision), TornadoChart.MaxPrecision);
        }

        private static getLegendData(series: TornadoChartSeries[], hasDynamicSeries: boolean): LegendData {
            let legendDataPoints: LegendDataPoint[] = [];

            if (hasDynamicSeries)
                legendDataPoints = series.map((series: TornadoChartSeries) => {
                    return <LegendDataPoint>{
                        label: series.name,
                        color: series.fill,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: series.selectionId
                    };
                });

            return {
                dataPoints: legendDataPoints
            };
        }

        private render(): void {
            this.updateElements();
            this.renderLegend();
            this.scrolling.renderY(this.dataView, this.renderWithScrolling.bind(this));
        }

        private clearData(): void {
            this.columns.selectAll("*").remove();
            this.axes.selectAll("*").remove();
            this.labels.selectAll("*").remove();
            this.categories.selectAll("*").remove();
            this.legend.drawLegend({ dataPoints: [] }, this.viewport);
            this.scrolling.clearData();
        }

        public onClearSelection(): void {
            if (this.interactivityService)
                this.interactivityService.clearSelection();
        }

        private renderWithScrolling(tornadoChartDataView: TornadoChartDataView, scrollStart: number, scrollEnd: number): void {
            if (!this.dataView || !this.dataView.settings) {
                return;
            }
            let categoriesLength = tornadoChartDataView.categories.length;
            let startIndex: number = scrollStart * categoriesLength;
            let endIndex: number = scrollEnd * categoriesLength;

            let startIndexRound: number = Math.floor(startIndex);
            let endIndexRound: number = Math.floor(endIndex);

            let maxValues: number = Math.floor(this.scrolling.scrollViewport.height / TornadoChart.CategoryMinHeight);

            if (scrollEnd - scrollStart < 1 && maxValues < endIndexRound - startIndexRound) {
                if (startIndex - startIndexRound > endIndex - endIndexRound) {
                    startIndexRound++;
                }
                else {
                    endIndex--;
                }
            }

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(tornadoChartDataView.dataPoints);
                this.interactivityService.applySelectionStateToData(tornadoChartDataView.highlightedDataPoints);
            }

            // Filter data according to the visible visual area
            tornadoChartDataView.categories = tornadoChartDataView.categories.slice(startIndexRound, endIndexRound);
            tornadoChartDataView.dataPoints = _.filter(tornadoChartDataView.dataPoints, (d: TornadoChartPoint) => d.categoryIndex >= startIndexRound && d.categoryIndex < endIndexRound);
            tornadoChartDataView.highlightedDataPoints = _.filter(tornadoChartDataView.highlightedDataPoints, (d: TornadoChartPoint) => d.categoryIndex >= startIndexRound && d.categoryIndex < endIndexRound);

            this.dataView = tornadoChartDataView;
            this.computeHeightColumn();
            this.renderMiddleSection();
            this.renderAxes();
            this.renderCategories();
        }

        private updateViewport(): void {
            let legendMargins: IViewport = this.legend.getMargins(),
                legendPosition: LegendPosition;

            legendPosition = LegendPosition[<string>this.dataView.legendObjectProperties[legendProps.position]];

            switch (legendPosition) {
                case LegendPosition.Top:
                case LegendPosition.TopCenter:
                case LegendPosition.Bottom:
                case LegendPosition.BottomCenter: {
                    this.viewport.height -= legendMargins.height;

                    break;
                }
                case LegendPosition.Left:
                case LegendPosition.LeftCenter:
                case LegendPosition.Right:
                case LegendPosition.RightCenter: {
                    this.viewport.width -= legendMargins.width;

                    break;
                }
            }
        }

        private computeHeightColumn(): void {
            let length: number = this.dataView.categories.length;
            this.heightColumn = (this.scrolling.scrollViewport.height - ((length - 1) * this.columnPadding)) / length;
        }

        private renderMiddleSection(): void {
            let tornadoChartDataView: TornadoChartDataView = this.dataView;
            this.calculateDataPoints(tornadoChartDataView.dataPoints);
            this.calculateDataPoints(tornadoChartDataView.highlightedDataPoints);
            let dataPointsWithHighlights: TornadoChartPoint[] = tornadoChartDataView.dataPoints.concat(tornadoChartDataView.highlightedDataPoints);
            this.renderColumns(dataPointsWithHighlights, tornadoChartDataView.series.length === 2);
            this.renderLabels(this.dataView.hasHighlights ? tornadoChartDataView.highlightedDataPoints : tornadoChartDataView.dataPoints, tornadoChartDataView.settings.labelSettings);
        }

        /**
         * Calculate the width, dx value and label info for every data point
         */
        private calculateDataPoints(dataPoints: TornadoChartPoint[]): void {
            let categoriesLength: number = this.dataView.categories.length;
            let settings: TornadoChartSettings = this.dataView.settings;
            let heightColumn = Math.max(this.heightColumn, 0);
            let py = heightColumn / 2;
            let pyHighlighted = heightColumn * TornadoChart.HighlightedShapeFactor / 2;
            let maxSeries: boolean = this.dataView.series.length === TornadoChart.MaxSeries;

            for (let i: number = 0; i < dataPoints.length; i++) {
                let dataPoint = dataPoints[i];

                let shiftToMiddle = i < categoriesLength && maxSeries;
                let shiftToRight: boolean = i > categoriesLength - 1;
                let widthOfColumn: number = this.getColumnWidth(dataPoint.value, dataPoint.minValue, dataPoint.maxValue, this.columnWidth);
                let dx: number = (this.columnWidth - widthOfColumn) * Number(shiftToMiddle) + this.columnWidth * Number(shiftToRight)/* - scrollBarWidth*/;
                dx = Math.max(dx, 0);

                let highlighted: boolean = this.dataView.hasHighlights && dataPoint.highlight;
                let highlightOffset: number = highlighted ? heightColumn * (1 - TornadoChart.HighlightedShapeFactor) / 2 : 0;
                let dy: number = (heightColumn + this.columnPadding) * (i % categoriesLength) + highlightOffset;

                let label: LabelData = this.getLabelData(
                    dataPoint.value,
                    dx,
                    widthOfColumn,
                    shiftToMiddle,
                    dataPoint.formatString,
                    settings);

                dataPoint.dx = dx;
                dataPoint.dy = dy;
                dataPoint.px = widthOfColumn / 2;
                dataPoint.py = highlighted ? pyHighlighted : py;
                dataPoint.angle = shiftToMiddle ? 180 : 0;
                dataPoint.width = widthOfColumn;
                dataPoint.height = highlighted ? heightColumn * TornadoChart.HighlightedShapeFactor : heightColumn;
                dataPoint.label = label;
            }
        }

        private renderColumns(columnsData: TornadoChartPoint[], selectSecondSeries: boolean = false): void {
            let hasSelection: boolean = this.interactivityService && this.interactivityService.hasSelection();

            let columnsSelection: UpdateSelection<any> = this.columns
                .selectAll(TornadoChart.Column.selector)
                .data(columnsData);

            columnsSelection
                .enter()
                .append("svg:rect")
                .classed(TornadoChart.Column.class, true);

            columnsSelection
                .style("fill", (p: TornadoChartPoint) => p.color)
                .style("fill-opacity", (p: TornadoChartPoint) => tornadoChartUtils.getFillOpacity(
                    p.selected,
                    p.highlight,
                    hasSelection,
                    this.dataView.hasHighlights))
                .attr("transform", (p: TornadoChartPoint) => SVGUtil.translateAndRotate(p.dx, p.dy, p.px, p.py, p.angle))
                .attr("height", (p: TornadoChartPoint) => p.height)
                .attr("width", (p: TornadoChartPoint) => p.width);

            columnsSelection
                .exit()
                .remove();

            let interactivityService = this.interactivityService;

            if (interactivityService) {
                interactivityService.applySelectionStateToData(columnsData);
                let behaviorOptions: TornadoBehaviorOptions = {
                    columns: columnsSelection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                };
                interactivityService.bind(columnsData, this.behavior, behaviorOptions);
            }

            this.renderTooltip(columnsSelection);
        }

        private renderTooltip(selection: UpdateSelection<any>): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
                return (<TornadoChartPoint>tooltipEvent.data).tooltipData;
            });
        }

        private getColumnWidth(value: number, minValue: number, maxValue: number, width: number): number {
            if (minValue === maxValue) {
                return width;
            }
            let columnWidth = width * (value - minValue) / (maxValue - minValue);

            // In case the user specifies a custom category axis end we limit the
            // column width to the maximum available width
            return Math.max(0, Math.min(width, columnWidth));
        }

        private getLabelData(
            value: number,
            dxColumn: number,
            columnWidth: number,
            isColumnPositionLeft: boolean,
            formatStringProp: string,
            settings?: TornadoChartSettings): LabelData {

            let dx: number,
                tornadoChartSettings: TornadoChartSettings = settings ? settings : this.dataView.settings,
                labelSettings: VisualDataLabelsSettings = tornadoChartSettings.labelSettings,
                fontSize: number = labelSettings.fontSize,
                color: string = labelSettings.labelColor;

            let maxOutsideLabelWidth = isColumnPositionLeft
                ? dxColumn - this.leftLabelMargin
                : this.allColumnsWidth - (dxColumn + columnWidth + this.leftLabelMargin);
            let maxLabelWidth = Math.max(maxOutsideLabelWidth, columnWidth - this.leftLabelMargin);

            let textProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontSize: PixelConverter.fromPoint(fontSize),
                text: tornadoChartSettings.getLabelValueFormatter(formatStringProp).format(value)
            };
            let valueAfterValueFormatter: string = TextMeasurementService.getTailoredTextOrDefault(textProperties, maxLabelWidth);
            let textDataAfterValueFormatter: TextData = TornadoChart.getTextData(valueAfterValueFormatter, this.textOptions, true, false, fontSize);

            if (columnWidth > textDataAfterValueFormatter.width + TornadoChart.LabelPadding) {
                dx = dxColumn + columnWidth / 2 - textDataAfterValueFormatter.width / 2;
            } else {
                if (isColumnPositionLeft) {
                    dx = dxColumn - this.leftLabelMargin - textDataAfterValueFormatter.width;
                } else {
                    dx = dxColumn + columnWidth + this.leftLabelMargin;
                }
                color = tornadoChartSettings.labelOutsideFillColor;
            }

            return {
                dx: dx,
                source: value,
                value: valueAfterValueFormatter,
                color: color
            };
        }

        private renderAxes(): void {
            let linesData: LineData[],
                axesSelection: UpdateSelection<any>,
                axesElements: Selection<any> = this.main
                    .select(TornadoChart.Axes.selector)
                    .selectAll(TornadoChart.Axis.selector);

            if (this.dataView.series.length !== TornadoChart.MaxSeries) {
                axesElements.remove();
                return;
            }

            linesData = this.generateAxesData();

            axesSelection = axesElements.data(linesData);

            axesSelection
                .enter()
                .append("svg:line")
                .classed(TornadoChart.Axis.class, true);

            axesSelection
                .attr("x1", (data: LineData) => data.x1)
                .attr("y1", (data: LineData) => data.y1)
                .attr("x2", (data: LineData) => data.x2)
                .attr("y2", (data: LineData) => data.y2);

            axesSelection
                .exit()
                .remove();
        }

        private generateAxesData(): LineData[] {
            let x: number,
                y1: number,
                y2: number;

            x = this.allColumnsWidth / 2;
            y1 = 0;
            y2 = this.scrolling.scrollViewport.height;

            return [{
                x1: x,
                y1: y1,
                x2: x,
                y2: y2
            }];
        }

        private renderLabels(dataPoints: TornadoChartPoint[], labelsSettings: VisualDataLabelsSettings): void {
            let labelEnterSelection: Selection<any>,
                labelSelection: UpdateSelection<any> = this.main
                    .select(TornadoChart.Labels.selector)
                    .selectAll(TornadoChart.Label.selector)
                    .data(_.filter(dataPoints, (p: TornadoChartPoint) => p.label.dx >= 0));

            // Check if labels can be displayed
            if (!labelsSettings.show || this.dataView.labelHeight >= this.heightColumn) {
                this.labels.selectAll("*").remove();
                return;
            }

            let fontSizeInPx: string = PixelConverter.fromPoint(labelsSettings.fontSize);
            let labelYOffset: number = this.heightColumn / 2 + this.dataView.labelHeight / 2 - this.InnerTextHeightDelta;
            let categoriesLength: number = this.dataView.categories.length;

            labelEnterSelection = labelSelection
                .enter()
                .append("g");

            labelEnterSelection
                .append("svg:title")
                .classed(TornadoChart.LabelTitle.class, true);

            labelEnterSelection
                .append("svg:text")
                .attr("dy", dataLabelUtils.DefaultDy)
                .classed(TornadoChart.LabelText.class, true);

            labelSelection
                .attr("pointer-events", "none")
                .classed(TornadoChart.Label.class, true);

            labelSelection
                .select(TornadoChart.LabelTitle.selector)
                .text((p: TornadoChartPoint) => p.label.source);

            labelSelection
                .attr("transform", (p: TornadoChartPoint, index: number) => {
                    let dy = (this.heightColumn + this.columnPadding) * (index % categoriesLength);
                    return SVGUtil.translate(p.label.dx, dy + labelYOffset);
                });

            labelSelection
                .select(TornadoChart.LabelText.selector)
                .attr("fill", (p: TornadoChartPoint) => p.label.color)
                .attr("font-size", (p: TornadoChartPoint) => fontSizeInPx)
                .text((p: TornadoChartPoint) => p.label.value);

            labelSelection
                .exit()
                .remove();
        }

        private renderCategories(): void {
            let settings: TornadoChartSettings = this.dataView.settings,
                color: string = settings.categoriesFillColor,
                categoriesEnterSelection: Selection<any>,
                categoriesSelection: UpdateSelection<any>,
                categoryElements: Selection<any> = this.main
                    .select(TornadoChart.Categories.selector)
                    .selectAll(TornadoChart.Category.selector);

            if (!settings.showCategories) {
                categoryElements.remove();
                return;
            }

            categoriesSelection = categoryElements.data(this.dataView.categories);

            categoriesEnterSelection = categoriesSelection
                .enter()
                .append("g");

            categoriesEnterSelection
                .append("svg:title")
                .classed(TornadoChart.CategoryTitle.class, true);

            categoriesEnterSelection
                .append("svg:text")
                .classed(TornadoChart.CategoryText.class, true);

            categoriesSelection
                .attr("transform", (text: string, index: number) => {
                    let shift: number = (this.heightColumn + this.columnPadding) * index + this.heightColumn / 2,
                        textData: TextData = TornadoChart.getTextData(text, this.textOptions, false, true);

                    shift = shift + textData.height / 2 - this.InnerTextHeightDelta;

                    return SVGUtil.translate(0, shift);
                })
                .classed(TornadoChart.Category.class, true);

            categoriesSelection
                .select(TornadoChart.CategoryTitle.selector)
                .text((text: TextData) => text.text);

            categoriesSelection
                .select(TornadoChart.CategoryText.selector)
                .attr("fill", color)
                .text((data: TextData) => this.dataView.settings.showCategories
                    ? TextMeasurementService.getTailoredTextOrDefault(
                        TornadoChart.getTextData(data.text, this.textOptions).textProperties, this.allLabelsWidth)
                    : "");

            categoriesSelection
                .exit()
                .remove();
        }

        private renderLegend(): void {
            let legend = this.dataView.legend;
            if (!legend) {
                return;
            }
            let settings: TornadoChartSettings = this.dataView.settings;

            let legendData: LegendData = {
                title: legend.title,
                dataPoints: legend.dataPoints,
                fontSize: settings.legendFontSize,
                labelColor: settings.legendColor,
            };

            if (this.dataView.legendObjectProperties) {
                let position: string;

                LegendData.update(legendData, this.dataView.legendObjectProperties);

                position = <string>this.dataView.legendObjectProperties[legendProps.position];

                if (position) {
                    this.legend.changeOrientation(LegendPosition[position]);
                }
            }

            // Draw the legend on a viewport with the original height and width
            let viewport: IViewport = {
                height: this.viewport.height + this.margin.top + this.margin.bottom,
                width: this.viewport.width + this.margin.left + this.margin.right,
            };
            this.legend.drawLegend(legendData, viewport);
            Legend.positionChartArea(this.root, this.legend);

            if (legendData.dataPoints.length > 0 && settings.showLegend)
                this.updateViewport();
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let settings: TornadoChartSettings;

            if (!this.dataView ||
                !this.dataView.settings) {
                return [];
            }

            settings = this.dataView.settings;

            switch (options.objectName) {
                case "dataPoint": {
                    this.enumerateDataPoint();

                    break;
                }
                case "categoryAxis": {
                    this.enumerateCategoryAxis();

                    break;
                }
                case "labels": {
                    this.enumerateLabels(settings);

                    break;
                }
                case "legend": {
                    if (!this.dataView.hasDynamicSeries) {
                        return;
                    }

                    this.enumerateLegend(settings);

                    break;
                }
                case "categories": {
                    this.enumerateCategories(settings);

                    break;
                }
                default:
                    return [];
            }
        }

        private enumerateDataPoint(): VisualObjectInstance[] {
            if (!this.dataView ||
                !this.dataView.series) {
                return;
            }

            let series: TornadoChartSeries[] = this.dataView.series;
            let instances: VisualObjectInstance[] = [];

            for (let i: number = 0, length: number = series.length; i < length; i++) {
                instances.push({
                    objectName: "dataPoint",
                    displayName: series[i].name,
                    selector: ColorHelper.normalizeSelector((<powerbi.visuals.ISelectionId>series[i].selectionId).getSelector(), false),
                    properties: {
                        fill: { solid: { color: series[i].fill } }
                    }
                });
            }

            return instances;
        }

        private enumerateCategoryAxis(): VisualObjectInstance[] {
            if (!this.dataView || !this.dataView.series)
                return;

            let series: TornadoChartSeries[] = this.dataView.series;
            let instances: VisualObjectInstance[] = [];

            for (let i: number = 0, length: number = series.length; i < length; i++) {
                instances.push({
                    objectName: "categoryAxis",
                    displayName: series[i].name,
                    selector: series[i].selectionId ? (<powerbi.visuals.ISelectionId>series[i].selectionId).getSelector() : null,
                    properties: {
                        end: series[i].categoryAxisEnd,
                    }
                });
            }

            return instances;
        }

        private enumerateLabels(settings: TornadoChartSettings): VisualObjectInstance[] {
            let labelSettings = settings.labelSettings,
                labels: VisualObjectInstance[] = [{
                    objectName: "labels",
                    displayName: "Labels",
                    selector: null,
                    properties: {
                        show: labelSettings.show,
                        fontSize: labelSettings.fontSize,
                        labelPrecision: labelSettings.precision,
                        labelDisplayUnits: labelSettings.displayUnits,
                        insideFill: labelSettings.labelColor,
                        outsideFill: settings.labelOutsideFillColor
                    }
                }];

            return labels;
        }

        private enumerateCategories(settings: TornadoChartSettings): VisualObjectInstance[] {

            let categories: VisualObjectInstance[] = [{
                objectName: "categories",
                displayName: "Categories",
                selector: null,
                properties: {
                    show: settings.showCategories,
                    fill: settings.categoriesFillColor
                }
            }];

            return categories;
        }

        private enumerateLegend(settings: TornadoChartSettings): VisualObjectInstance[] {

            let showTitle: boolean = true,
                titleText: string = "",
                legend: VisualObjectInstance[],
                position: string;

            showTitle = DataViewObject.getValue<boolean>(
                this.dataView.legendObjectProperties,
                legendProps.showTitle,
                showTitle);

            titleText = DataViewObject.getValue<string>(
                this.dataView.legendObjectProperties,
                legendProps.titleText,
                titleText);

            position = DataViewObject.getValue<string>(
                this.dataView.legendObjectProperties,
                legendProps.position,
                legendPosition.top);

            legend = [{
                objectName: "legend",
                displayName: "Legend",
                selector: null,
                properties: {
                    show: settings.showLegend,
                    position: position,
                    showTitle: showTitle,
                    titleText: titleText,
                    fontSize: settings.legendFontSize,
                    labelColor: settings.legendColor,
                }
            }];

            return legend;
        }

        public destroy(): void {
            this.root = null;
        }
    }

    export module tornadoChartUtils {
        export let DimmedOpacity: number = 0.4;
        export let DefaultOpacity: number = 1.0;

        export function getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
            if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
                return DimmedOpacity;
            return DefaultOpacity;
        }
    }
}
