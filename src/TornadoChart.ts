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

import "./../style/tornadoChart.less";

import {
    select as d3Select,
    Selection as d3Selection 
} from "d3-selection";

import { min, max } from "d3-array";

import powerbiVisualsApi from "powerbi-visuals-api";

type Selection<T> = d3Selection<any, T, any, any>;

import DataView = powerbiVisualsApi.DataView;
import IViewport = powerbiVisualsApi.IViewport;
import DataViewObject = powerbiVisualsApi.DataViewObject;
import DataViewObjects = powerbiVisualsApi.DataViewObjects;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import DataViewCategorical = powerbiVisualsApi.DataViewCategorical;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewObjectWithId = powerbiVisualsApi.DataViewObjectWithId;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbiVisualsApi.DataViewValueColumnGroup;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import IColorPalette = powerbiVisualsApi.extensibility.IColorPalette;
import ILocalizationManager = powerbiVisualsApi.extensibility.ILocalizationManager;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;

import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import { dataViewObject, dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import manipulation = SVGUtil.manipulation;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import IMargin = SVGUtil.IMargin;
import translate = manipulation.translate;
import translateAndRotate = manipulation.translateAndRotate;

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import { legend as LegendModule, legendInterfaces, legendData, legendPosition, dataLabelUtils, OpacityLegendBehavior } from "powerbi-visuals-utils-chartutils";
import ILegend = legendInterfaces.ILegend;
import MarkerShape = legendInterfaces.MarkerShape;
import LegendPosition = legendInterfaces.LegendPosition;
import LegendData = legendInterfaces.LegendData;
import createLegend = LegendModule.createLegend;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import LegendDataModule = legendData;

import { textMeasurementService , valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import IValueFormatter = valueFormatter.IValueFormatter;

import {
    interactivitySelectionService as interactivityService,
    interactivityBaseService
} from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import SelectableDataPoint = interactivityService.SelectableDataPoint;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import createInteractivitySelectionService = interactivityService.createInteractivitySelectionService;

type IInteractivityServiceSelectable = IInteractivityService<SelectableDataPoint>;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";
// powerbi.extensibility.utils.formattingModel
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import {
    TornadoChartLabelFormatter,
    TornadoChartSeries,
    TornadoBehaviorOptions,
    TornadoChartDataView,
    TornadoChartPoint,
    TornadoChartTextOptions,
    LineData,
    LabelData,
    TextData,
    TooltipArgsWrapper
} from "./interfaces";
import { TornadoChartScrolling } from "./TornadoChartScrolling";
import { tornadoChartProperties } from "./tornadoChartProperties";
import { TornadoWebBehavior } from "./TornadoWebBehavior";
import * as tooltipBuilder from "./tooltipBuilder";
import { TornadoChartUtils } from "./tornadoChartUtils";
import { TornadoChartSettingsModel, DataLabelSettings} from "./TornadoChartSettingsModel";

export class TornadoChart implements IVisual {
    private static ClassName: string = "tornado-chart";
    private static Columns: ClassAndSelector = createClassAndSelector("columns");
    private static Column: ClassAndSelector = createClassAndSelector("column");
    private static Axes: ClassAndSelector = createClassAndSelector("axes");
    private static Axis: ClassAndSelector = createClassAndSelector("axis");
    private static Labels: ClassAndSelector = createClassAndSelector("labels");
    private static Label: ClassAndSelector = createClassAndSelector("label");
    private static LabelTitle: ClassAndSelector = createClassAndSelector("label-title");
    private static LabelText: ClassAndSelector = createClassAndSelector("label-text");
    private static Categories: ClassAndSelector = createClassAndSelector("categories");
    private static Category: ClassAndSelector = createClassAndSelector("category");
    private static CategoryTitle: ClassAndSelector = createClassAndSelector("category-title");
    private static CategoryText: ClassAndSelector = createClassAndSelector("category-text");
    private static MaxSeries: number = 2;
    private static MaxPrecision: number = 17; // max number of decimals in float
    private static LabelPadding: number = 2.5;
    private static CategoryMinHeight: number = 25;
    private static HighlightedShapeFactor: number = 1;
    private static CategoryLabelMargin: number = 10;
    private static DefaultLabelSettingsDisplayUnits = 1;
    private static DefaultLabelSettingsLabelPrecision = null;
    private static MaxAngle: number = 180;
    private static MinAngle: number = 0;

    public static ScrollBarWidth = 22;
    public static DefaultLabelsWidth = 3;

    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: TornadoChartSettingsModel;
    private tooltipArgs: TooltipArgsWrapper;

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private static buildIdentitySelection(
        hostService: IVisualHost,
        category: DataViewCategoryColumn,
        i: number,
        values: DataViewValueColumns,
        columnGroup: DataViewValueColumnGroup,
        measureName: string
    ): ISelectionId {
        return hostService.createSelectionIdBuilder()
            .withCategory(category, i)
            .withSeries(values, columnGroup)
            .withMeasure(measureName)
            .createSelectionId();
    }

    public static converter( 
        dataView: DataView,
        hostService: IVisualHost,
        textOptions: TornadoChartTextOptions,
        colors: IColorPalette,
        localizationManager: ILocalizationManager,
        formattingSettings?: TornadoChartSettingsModel
    ): TornadoChartDataView {
        const categorical: DataViewCategorical = dataView.categorical;
        const categories: DataViewCategoryColumn[] = categorical.categories || [];
        const values: DataViewValueColumns = categorical.values;
        const category: DataViewCategoryColumn = categories[0];
        let maxValue: number = max(<number[]>values[0].values);
        let minValue: number = Math.min(min(<number[]>values[0].values), 0);
        if (values.length >= TornadoChart.MaxSeries) {
            minValue = min([minValue, min(<number[]>values[1].values)]);
            maxValue = max([maxValue, max(<number[]>values[1].values)]);
        }
        const labelFormatter = TornadoChart.prepareFormatter(dataView.metadata.objects, maxValue);
        const hasDynamicSeries: boolean = !!values.source;
        const hasHighlights: boolean = values.length > 0 && values.some(value => value.highlights && value.highlights.some(_ => _));
        const labelHeight: number = textMeasurementService.estimateSvgTextHeight({
            fontFamily: formattingSettings?.dataLabelsSettings.font.fontFamily.value,
            fontSize: PixelConverter.fromPoint(formattingSettings?.dataLabelsSettings.font.fontSize.value),
            fontWeight: formattingSettings?.dataLabelsSettings.font.bold.value ? "bold" : "normal",
            fontStyle: formattingSettings?.dataLabelsSettings.font.italic.value ? "italic" : "normal"
        });
        const series: TornadoChartSeries[] = [];
        const dataPoints: TornadoChartPoint[] = [];
        const highlightedDataPoints: TornadoChartPoint[] = [];
        const categorySourceFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(category.source)
        });
        const categoriesLabels: TextData[] = category.values.map(value => TornadoChart.getTextData(categorySourceFormatter.format(value), textOptions, true));
        const groupedValues: DataViewValueColumnGroup[] = values.grouped ? values.grouped() : null;

        for (let seriesIndex = 0; seriesIndex < Math.min(values.length, TornadoChart.MaxSeries); seriesIndex++) {
            const columnGroup: DataViewValueColumnGroup = groupedValues && groupedValues.length > seriesIndex
                && groupedValues[seriesIndex].values ? groupedValues[seriesIndex] : null;
            const parsedSeries: TornadoChartSeries = TornadoChart.parseSeries(dataView, values, hostService, seriesIndex, hasDynamicSeries, columnGroup, colors);
            const currentSeries: DataViewValueColumn = values[seriesIndex];
            const measureName: string = currentSeries.source.queryName;

            series.push(parsedSeries);

            for (let i: number = 0; i < category.values.length; i++) {
                const value: number = currentSeries.values[i] == null || isNaN(<number>currentSeries.values[i]) ? 0 : <number>currentSeries.values[i];
                const identity: ISelectionId = TornadoChart.buildIdentitySelection(hostService, category, i, values, columnGroup, measureName);
                const formattedCategoryValue: string = categoriesLabels[i].text;

                const buildTooltip = (highlightedValue) => tooltipBuilder.createTooltipInfo(
                        categorical,
                        formattedCategoryValue,
                        localizationManager,
                        value,
                        seriesIndex,
                        highlightedValue || null);

                // Limit maximum value with what the user choose
                const currentMaxValue = parsedSeries.categoryAxisEnd ? parsedSeries.categoryAxisEnd : maxValue;
                const formatString: string = dataView.categorical.values[seriesIndex].source.format;
                let highlight: number = null;
                const dataPointCommon = {
                    value,
                    minValue,
                    maxValue: currentMaxValue,
                    formatString,
                    color: parsedSeries.fill,
                    selected: false,
                    identity,
                    categoryIndex: i,
                };

                if (hasHighlights) {
                    highlight = <number>currentSeries.highlights[i];
                    const highlightedValue: number = highlight != null ? highlight : value;

                    highlightedDataPoints.push({
                        ...dataPointCommon,
                        value: highlightedValue,
                        tooltipData: buildTooltip(highlightedValue),
                        highlight: !!highlight,
                    });
                }

                dataPoints.push({
                    ...dataPointCommon,
                    tooltipData: buildTooltip(null),
                    highlight: hasHighlights && !!highlight,
                });
            }
        }

        return {
            categories: categoriesLabels,
            series: series,
            labelFormatter: labelFormatter,
            legend: TornadoChart.getLegendData(series, hasDynamicSeries),
            dataPoints: dataPoints,
            highlightedDataPoints: highlightedDataPoints,
            maxLabelsWidth: Math.max(...categoriesLabels.map(x => x.width)),
            hasDynamicSeries: hasDynamicSeries,
            hasHighlights: hasHighlights,
            labelHeight: labelHeight,
            legendObjectProperties: dataViewObjects.getObject(dataView.metadata.objects, "legend", {}),
            categoriesObjectProperties: dataViewObjects.getObject(dataView.metadata.objects, "categories", {}),
        };
    }

    public static parseSeries(
        dataView: DataView,
        dataViewValueColumns: DataViewValueColumns,
        hostService: IVisualHost,
        index: number,
        isGrouped: boolean,
        columnGroup: DataViewValueColumnGroup,
        colors: IColorPalette): TornadoChartSeries {

        if (!dataView) {
            return;
        }

        const dataViewValueColumn: DataViewValueColumn = dataViewValueColumns ? dataViewValueColumns[index] : null,
            source: DataViewMetadataColumn = dataViewValueColumn ? dataViewValueColumn.source : null,
            queryName: string = source ? source.queryName : null;

        const selectionId: ISelectionId = hostService.createSelectionIdBuilder()
            .withSeries(dataViewValueColumns, columnGroup)
            .withMeasure(queryName)
            .createSelectionId();

        let sourceGroupName: string = null;
        if (source.groupName !== undefined && source.groupName !== null) {
            sourceGroupName = "" + source.groupName;
        }

        let objects: DataViewObjects,
            categoryAxisObject: DataViewObject | DataViewObjectWithId[];

        const displayName: PrimitiveValue = source ? sourceGroupName
                ? sourceGroupName : source.displayName
                : null;

        if (isGrouped && columnGroup && columnGroup.objects) {
            categoryAxisObject = columnGroup.objects ? columnGroup.objects["categoryAxis"] : null;
            objects = columnGroup.objects;
        } else if (source && source.objects) {
            objects = source.objects;
            categoryAxisObject = objects ? objects["categoryAxis"] : null;
        } else if (dataView && dataView.metadata && dataView.metadata.objects) {
            objects = dataView.metadata.objects;
        }

        const fillColor: string = TornadoChart.getColor(
            tornadoChartProperties.dataPoint.fill,
            ["purple", "teal"][index],
            objects, colors);

        let categoryAxisEnd: number = categoryAxisObject ? categoryAxisObject["end"] : null;
        if(!categoryAxisEnd){
            if(objects?.categoryAxis?.end){
                categoryAxisEnd = objects.categoryAxis.end as number;
            }
        }

        return <TornadoChartSeries>{
            fill: fillColor,
            name: displayName,
            selectionId: selectionId,
            categoryAxisEnd: categoryAxisEnd,
        };
    }

    private static getColor(properties: any, defaultColor: string, objects: DataViewObjects, colors: IColorPalette, convertToHighContrastMode: boolean = true): string {
        const colorHelper: ColorHelper = new ColorHelper(colors, properties, defaultColor);

        if (colorHelper.isHighContrast && convertToHighContrastMode)
            return colorHelper.getColorForMeasure(objects, "", "foreground");

        return colorHelper.getColorForMeasure(objects, "");
    }

    private static getTextData(
        text: string,
        textOptions: TornadoChartTextOptions,
        measureWidth: boolean = false,
        measureHeight: boolean = false,
        overrideFontSize?: number): TextData {

        let width: number = 0,
            height: number = 0;

        text = text || "";

        const fontSize = overrideFontSize
            ? PixelConverter.fromPoint(overrideFontSize)
            : PixelConverter.fromPoint(textOptions.fontSize);

        const textProperties = {
            text: text,
            fontFamily: textOptions.fontFamily,
            fontSize: fontSize
        };

        if (measureWidth) {
            width = textMeasurementService.measureSvgTextWidth(textProperties);
        }

        if (measureHeight) {
            height = textMeasurementService.estimateSvgTextHeight(textProperties);
        }

        return {
            text: text,
            width: width,
            height: height,
            textProperties: textProperties
        };
    }

    public colors: IColorPalette;
    public colorHelper: ColorHelper;
    public textOptions: TornadoChartTextOptions = {};

    private columnPadding: number = 5;
    private leftLabelMargin: number = 4;
    private InnerTextHeightDelta: number = 2;

    private margin: IMargin = {
        top: 10,
        right: 5,
        bottom: 10,
        left: 10
    };

    private root: Selection<any>;
    private main: Selection<any>;
    private columns: Selection<any>;
    private axes: Selection<any>;
    private labels: Selection<any>;
    private categories: Selection<any>;
    private clearCatcher: Selection<any>;
    private selectionManager: ISelectionManager;

    private legend: ILegend;
    private behavior: IInteractiveBehavior;
    private interactivityService: IInteractivityServiceSelectable;
    private hostService: IVisualHost;
    private localizationManager: ILocalizationManager;
    private scrolling: TornadoChartScrolling;

    private viewport: IViewport;
    private dataView: TornadoChartDataView;
    private heightColumn: number = 0;

    private get allLabelsWidth(): number {
        const labelsWidth: number = this.formattingSettings.categoryCardSettings.show.value
            ? Math.min(this.dataView.maxLabelsWidth, this.scrolling.scrollViewport.width / 2)
            : TornadoChart.DefaultLabelsWidth;
        return labelsWidth + TornadoChart.CategoryLabelMargin;
    }

    private get allColumnsWidth(): number {
        return this.scrolling.scrollViewport.width - this.allLabelsWidth;
    }

    private get columnWidth(): number {
        return this.dataView.series.length === TornadoChart.MaxSeries
            ? this.allColumnsWidth / 2
            : this.allColumnsWidth;
    }

    constructor(options: VisualConstructorOptions) {
        this.hostService = options.host;
        this.localizationManager = this.hostService.createLocalizationManager();
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);
        this.selectionManager = options.host.createSelectionManager();

        this.tooltipArgs = new TooltipArgsWrapper(options.element, options.host.tooltipService);

        this.interactivityService = createInteractivitySelectionService(this.hostService);

        const interactiveBehavior: IInteractiveBehavior = this.colorHelper.isHighContrast ? <IInteractiveBehavior>(new OpacityLegendBehavior()) : null;
        this.legend = createLegend(options.element, false, this.interactivityService, true, null, interactiveBehavior);

        const root: Selection<any> = this.root = d3Select(options.element)
            .append("svg")
            .classed(TornadoChart.ClassName, true);

        const fontSize: string = root.style("font-size");

        this.textOptions.fontSize = Number(fontSize.slice(0, fontSize.length - 2));
        this.textOptions.fontFamily = root.style("font-family");

        this.scrolling = new TornadoChartScrolling(
            () => root,
            () => this.viewport,
            () => this.margin,
            () => this.dataView.categories.length * TornadoChart.CategoryMinHeight,
            true);

        const main: Selection<any> = this.main = root.append("g");
        this.clearCatcher = appendClearCatcher(main);
        this.columns = main
            .append("g")
            .classed(TornadoChart.Columns.className, true);

        this.axes = main
            .append("g")
            .classed(TornadoChart.Axes.className, true);

        this.labels = main
            .append("g")
            .classed(TornadoChart.Labels.className, true);

        this.categories = main
            .append("g")
            .classed(TornadoChart.Categories.className, true);

        this.behavior = new TornadoWebBehavior();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
    }

    public update(options: VisualUpdateOptions): void {
        if (!options ||
            !options.dataViews ||
            !options.dataViews[0] ||
            !options.dataViews[0].categorical ||
            !options.dataViews[0].categorical.categories ||
            !options.dataViews[0].categorical.categories[0] ||
            !options.dataViews[0].categorical.categories[0].source ||
            !options.dataViews[0].categorical.values ||
            !options.dataViews[0].categorical.values[0] ||
            !options.dataViews[0].categorical.values[0].values ||
            !options.dataViews[0].categorical.values[0].values.length) {
            this.clearData();
            return;
        }

        this.viewport = {
            height: Math.max(0, options.viewport.height - this.margin.top - this.margin.bottom),
            width: Math.max(0, options.viewport.width - this.margin.left - this.margin.right)
        };

        const dataView: DataView = this.validateDataView(options.dataViews[0]);
        if(dataView){
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(TornadoChartSettingsModel, dataView);
            this.formattingSettings.setLocalizedOptions(this.localizationManager);
        }

        this.dataView = TornadoChart.converter(dataView, this.hostService, this.textOptions, this.colors, this.localizationManager, this.formattingSettings);
        if (!this.dataView || this.scrolling.scrollViewport.height < TornadoChart.CategoryMinHeight) {
            this.clearData();
            return;
        }

        //Populate slices for DataColors and CategoryAxisCard 
        this.formattingSettings.populateDataColorSlice(this.dataView.series);
        this.formattingSettings.populateCategoryAxisSlice(this.dataView.series);
        
        this.render();
    }

    public handleContextMenu(event : PointerEvent) {
        const dataPointSelect : any = d3Select(<any>(event.target)).datum();
        this.selectionManager.showContextMenu(
            (dataPointSelect) 
            ? dataPointSelect.identity
            : {},
            {
                x: event.clientX,
                y: event.clientY
            }
        );
        event.preventDefault();
    }

    private validateDataView(dataView: DataView): DataView {
        if (!dataView || !dataView.categorical || !dataView.categorical.values) {
            return null;
        }
        return dataView;
    }

    private updateElements(): void {
        let translateX: number = 0;
        const position: string = dataViewObject.getValue(this.dataView.categoriesObjectProperties, "position", legendPosition.left);
        if (position === "Left") {
            translateX = this.allLabelsWidth;
        }
        const elementsTranslate: string = translate(translateX, 0);

        this.root
            .attr("height", this.viewport.height + this.margin.top + this.margin.bottom)
            .attr("width", this.viewport.width + this.margin.left + this.margin.right);

        this.columns
            .attr("transform", elementsTranslate);

        this.labels
            .attr("transform", elementsTranslate);

        this.axes
            .attr("transform", elementsTranslate);
    }

    private static prepareFormatter(objects: DataViewObjects, value: number): TornadoChartLabelFormatter {
        const precision: number = TornadoChart.getPrecision(objects);

        const displayUnits: number = dataViewObjects.getValue<number>(
            objects,
            tornadoChartProperties.labels.labelDisplayUnits,
            TornadoChart.DefaultLabelSettingsDisplayUnits);

        const getLabelValueFormatter = (formatString: string) => valueFormatter.create({
            format: formatString,
            precision: precision,
            value: (displayUnits === 0) && (value != null) ? value : displayUnits,
        });

        return {
            getLabelValueFormatter: getLabelValueFormatter
        };
    }

    private static getPrecision(objects: DataViewObjects): number {
        const precision: number = dataViewObjects.getValue<number>(
            objects,
            tornadoChartProperties.labels.labelPrecision,
            TornadoChart.DefaultLabelSettingsLabelPrecision);

        return Math.min(Math.max(0, precision), TornadoChart.MaxPrecision);
    }

    private static getLegendData(series: TornadoChartSeries[], hasDynamicSeries: boolean): LegendData {
        let legendDataPoints: LegendDataPoint[] = [];
        if (hasDynamicSeries)
            legendDataPoints = series.map((series: TornadoChartSeries) => {
                return <LegendDataPoint>{
                    label: series.name,
                    color: series.fill,
                    icon: MarkerShape.circle,
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
        this.legend.reset();
        this.legend.drawLegend({ dataPoints: [] }, this.viewport);
        this.scrolling.clearData();
    }

    public onClearSelection(): void {
        if (this.interactivityService) {
            this.interactivityService.clearSelection();
        }
    }

    private renderWithScrolling(tornadoChartDataView: TornadoChartDataView, scrollStart: number, scrollEnd: number): void {
        if (!this.dataView || !this.formattingSettings) {
            return;
        }
        const categoriesLength: number = tornadoChartDataView.categories.length;
        const startIndex: number = scrollStart * categoriesLength;
        let endIndex: number = scrollEnd * categoriesLength;

        let startIndexRound: number = Math.floor(startIndex);
        const endIndexRound: number = Math.floor(endIndex);

        const maxValues: number = Math.floor(this.scrolling.scrollViewport.height / TornadoChart.CategoryMinHeight);

        if (scrollEnd - scrollStart < 1 && maxValues < endIndexRound - startIndexRound) {
            if (startIndex - startIndexRound > endIndex - endIndexRound) {
                startIndexRound++;
            }
            else {
                endIndex--;
            }
        }

        if (!this.dataView.hasHighlights) {
            this.interactivityService.applySelectionStateToData(tornadoChartDataView.dataPoints);
            this.interactivityService.applySelectionStateToData(tornadoChartDataView.highlightedDataPoints);
        }

        // Filter data according to the visible visual area
        tornadoChartDataView.categories = tornadoChartDataView.categories.slice(startIndexRound, endIndexRound);
        tornadoChartDataView.dataPoints = tornadoChartDataView.dataPoints.filter((d: TornadoChartPoint) => d.categoryIndex >= startIndexRound && d.categoryIndex < endIndexRound);
        tornadoChartDataView.highlightedDataPoints = tornadoChartDataView.highlightedDataPoints.filter((d: TornadoChartPoint) => d.categoryIndex >= startIndexRound && d.categoryIndex < endIndexRound);

        this.dataView = tornadoChartDataView;

        this.computeHeightColumn();
        this.renderMiddleSection();
        this.renderAxes();
        this.renderCategories();
    }

    private updateViewport(): void {
        const legendMargins: IViewport = this.legend.getMargins(),
            legendPosition: LegendPosition = LegendPosition[this.formattingSettings.legendCardSettings.positionDropdown.value.value];

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
        const length: number = this.dataView.categories.length;
        this.heightColumn = (this.scrolling.scrollViewport.height - ((length - 1) * this.columnPadding)) / length;
    }

    private renderMiddleSection(): void {
        const tornadoChartDataView: TornadoChartDataView = this.dataView;
        this.calculateDataPoints(tornadoChartDataView.dataPoints);
        this.calculateDataPoints(tornadoChartDataView.highlightedDataPoints);
        const dataPointsWithHighlights: TornadoChartPoint[] = this.dataView.hasHighlights ? tornadoChartDataView.highlightedDataPoints : tornadoChartDataView.dataPoints;
        this.renderColumns(dataPointsWithHighlights);
        this.renderLabels(this.dataView.hasHighlights ? tornadoChartDataView.highlightedDataPoints : tornadoChartDataView.dataPoints, this.formattingSettings.dataLabelsSettings);
    }

    /**
     * Calculate the width, dx value and label info for every data point
     */
    private calculateDataPoints(dataPoints: TornadoChartPoint[]): void {
        const categoriesLength: number = this.dataView.categories.length;
        const labelFormatter: TornadoChartLabelFormatter = this.dataView.labelFormatter;
        const heightColumn: number = Math.max(this.heightColumn, 0);
        const py: number = heightColumn / 2;
        const pyHighlighted: number = heightColumn * TornadoChart.HighlightedShapeFactor / 2;
        const maxSeries: boolean = this.dataView.series.length === TornadoChart.MaxSeries;

        for (let i: number = 0; i < dataPoints.length; i++) {
            const dataPoint: TornadoChartPoint = dataPoints[i];

            const shiftToMiddle: boolean = i < categoriesLength && maxSeries;
            const shiftToRight: boolean = i > categoriesLength - 1;
            const widthOfColumn: number = this.getColumnWidth(dataPoint.value, dataPoint.minValue, dataPoint.maxValue, this.columnWidth);
            let dx: number = (this.columnWidth - widthOfColumn) * Number(shiftToMiddle) + this.columnWidth * Number(shiftToRight)/* - scrollBarWidth*/;
            dx = Math.max(dx, 0);

            const highlighted: boolean = this.dataView.hasHighlights && dataPoint.highlight;
            const highlightOffset: number = highlighted ? heightColumn * (1 - TornadoChart.HighlightedShapeFactor) / 2 : 0;
            const dy: number = (heightColumn + this.columnPadding) * (i % categoriesLength) + highlightOffset;

            const label: LabelData = this.getLabelData(
                dataPoint.value,
                dx,
                widthOfColumn,
                shiftToMiddle,
                dataPoint.formatString,
                labelFormatter);

            dataPoint.dx = dx;
            dataPoint.dy = dy;
            dataPoint.px = widthOfColumn / 2;
            dataPoint.py = highlighted ? pyHighlighted : py;
            dataPoint.angle = shiftToMiddle ? TornadoChart.MaxAngle : TornadoChart.MinAngle;
            dataPoint.width = widthOfColumn;
            dataPoint.height = highlighted ? heightColumn * TornadoChart.HighlightedShapeFactor : heightColumn;
            dataPoint.label = label;
        }
    }

    private renderColumns(columnsData: TornadoChartPoint[]): void {
        const hasSelection: boolean = this.interactivityService && this.interactivityService.hasSelection();

        const columnsSelection: Selection<any> = this.columns
            .selectAll(TornadoChart.Column.selectorName)
            .data(columnsData);

        const columnsSelectionMerged = columnsSelection
            .enter()
            .append("svg:rect")
            .merge(columnsSelection);

        columnsSelectionMerged.classed(TornadoChart.Column.className, true);

        columnsSelectionMerged
            .style("fill", (p: TornadoChartPoint) => this.colorHelper.isHighContrast ? this.colorHelper.getThemeColor() : p.color)
            .style("stroke", (p: TornadoChartPoint) => p.color)
            .style("fill-opacity", (p: TornadoChartPoint) => TornadoChartUtils.getOpacity(
                p.selected,
                p.highlight,
                hasSelection,
                this.dataView.hasHighlights))
            .style("stroke-opacity", (p: TornadoChartPoint) => TornadoChartUtils.getOpacity(
                p.selected,
                p.highlight,
                hasSelection,
                this.dataView.hasHighlights))
            .attr("transform", (p: TornadoChartPoint) => translateAndRotate(p.dx, p.dy, p.px, p.py, p.angle))
            .attr("height", (p: TornadoChartPoint) => p.height)
            .attr("width", (p: TornadoChartPoint) => p.width);

        columnsSelection
            .exit()
            .remove();

        const interactivityService = this.interactivityService;

        if (interactivityService) {
            interactivityService.applySelectionStateToData(columnsData);

            const behaviorOptions: TornadoBehaviorOptions = {
                columns: columnsSelectionMerged,
                clearCatcher: this.clearCatcher,
                interactivityService: this.interactivityService,
                behavior: this.behavior,
                dataPoints: columnsData,
                tooltipArgs: this.tooltipArgs
            };
            interactivityService.bind(behaviorOptions);
        }
    }

    private getColumnWidth(value: number, minValue: number, maxValue: number, width: number): number {
        if (minValue === maxValue) {
            return width;
        }
        const columnWidth = width * (value - minValue) / (maxValue - minValue);

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
        labelFormatter: TornadoChartLabelFormatter): LabelData {

        const fontSize: number = this.formattingSettings.dataLabelsSettings.font.fontSize.value;

        let dx: number,
            color: string = this.formattingSettings.dataLabelsSettings.insideFill.value.value;

        const maxOutsideLabelWidth: number = isColumnPositionLeft
            ? dxColumn - this.leftLabelMargin
            : this.allColumnsWidth - (dxColumn + columnWidth + this.leftLabelMargin);
        const maxLabelWidth: number = Math.max(maxOutsideLabelWidth, columnWidth - this.leftLabelMargin);

        const textProperties: TextProperties = {
            fontFamily: dataLabelUtils.StandardFontFamily,
            fontSize: PixelConverter.fromPoint(fontSize),
            text: labelFormatter.getLabelValueFormatter(formatStringProp).format(value)
        };
        const valueAfterValueFormatter: string = textMeasurementService.getTailoredTextOrDefault(textProperties, maxLabelWidth);
        const textDataAfterValueFormatter: TextData = TornadoChart.getTextData(valueAfterValueFormatter, this.textOptions, true, false, fontSize);

        if (columnWidth > textDataAfterValueFormatter.width + TornadoChart.LabelPadding) {
            dx = dxColumn + columnWidth / 2 - textDataAfterValueFormatter.width / 2;
        } else {
            if (isColumnPositionLeft) {
                dx = dxColumn - this.leftLabelMargin - textDataAfterValueFormatter.width;
            } else {
                dx = dxColumn + columnWidth + this.leftLabelMargin;
            }
            color = this.formattingSettings.dataLabelsSettings.outsideFill.value.value;
        }

        return {
            dx: dx,
            source: value,
            value: valueAfterValueFormatter,
            color: color
        };
    }

    private renderAxes(): void {
        const axesElements: Selection<any> = this.main
                .select(TornadoChart.Axes.selectorName)
                .selectAll(TornadoChart.Axis.selectorName);

        if (this.dataView.series.length !== TornadoChart.MaxSeries) {
            axesElements.remove();
            return;
        }

        const linesData: LineData[] = this.generateAxesData();
        const axesSelection: Selection<any> = axesElements.data(linesData);

        const axesSelectionMerged = axesSelection
            .enter()
            .append("svg:line")
            .merge(axesSelection);

        axesSelectionMerged
            .classed(TornadoChart.Axis.className, true)
            .style("stroke", this.colorHelper.getHighContrastColor());

        axesSelectionMerged
            .attr("x1", (data: LineData) => data.x1)
            .attr("y1", (data: LineData) => data.y1)
            .attr("x2", (data: LineData) => data.x2)
            .attr("y2", (data: LineData) => data.y2);

        axesSelection
            .exit()
            .remove();
    }

    private generateAxesData(): LineData[] {
        const x: number = this.allColumnsWidth / 2,
            y1: number = 0,
            y2: number = this.scrolling.scrollViewport.height;

        return [{
            x1: x,
            y1: y1,
            x2: x,
            y2: y2
        }];
    }

    private renderLabels(dataPoints: TornadoChartPoint[], labelsSettings: DataLabelSettings): void {
        const labelSelection: Selection<TornadoChartPoint> = this.main
                .select(TornadoChart.Labels.selectorName)
                .selectAll(TornadoChart.Label.selectorName)
                .data(dataPoints.filter((p: TornadoChartPoint) => p.label.dx >= 0));
        const formattingSettings: TornadoChartSettingsModel = this.formattingSettings;

        // Check if labels can be displayed
        if (!labelsSettings.show.value || this.dataView.labelHeight >= this.heightColumn) {
            this.labels.selectAll("*").remove();
            return;
        }

        const fontSizeInPx: string = PixelConverter.fromPoint(labelsSettings.font.fontSize.value);
        const labelYOffset: number = this.heightColumn / 2 + this.dataView.labelHeight / 2 - this.InnerTextHeightDelta;
        const categoriesLength: number = this.dataView.categories.length;

        const labelFontFamily : string = formattingSettings.dataLabelsSettings.font.fontFamily.value;

        const labelFontIsBold : boolean = formattingSettings.dataLabelsSettings.font.bold.value,
            labelFontIsItalic : boolean = formattingSettings.dataLabelsSettings.font.italic.value,
            labelFontIsUnderlined : boolean = formattingSettings.dataLabelsSettings.font.underline.value;

        const labelSelectionMerged: Selection<TornadoChartPoint> = labelSelection
            .enter()
            .append("g")
            .merge(labelSelection);

        labelSelectionMerged
            .append("svg:title")
            .classed(TornadoChart.LabelTitle.className, true);

        labelSelectionMerged
            .append("svg:text")
            .attr("dy", dataLabelUtils.DefaultDy)
            .classed(TornadoChart.LabelText.className, true);

        labelSelectionMerged
            .attr("pointer-events", "none")
            .classed(TornadoChart.Label.className, true);

        labelSelectionMerged
            .select(TornadoChart.LabelTitle.selectorName)
            .text((p: TornadoChartPoint) => p.label.source);

        labelSelectionMerged
            .attr("transform", (p: TornadoChartPoint, index: number) => {
                const dy: number = (this.heightColumn + this.columnPadding) * (index % categoriesLength);
                return translate(p.label.dx, dy + labelYOffset);
            });

        labelSelectionMerged
            .select(TornadoChart.LabelText.selectorName)
            .attr("fill", (p: TornadoChartPoint) => p.label.color)
            .attr("font-size", fontSizeInPx)
            .attr("font-family", labelFontFamily)
            .attr("font-weight", labelFontIsBold ? "bold" : "normal")
            .attr("font-style", labelFontIsItalic ? "italic" : "normal")
            .attr("text-decoration", labelFontIsUnderlined? "underline" : "normal")
            .text((p: TornadoChartPoint) => p.label.value);

        labelSelection
            .exit()
            .remove();
    }

    private renderCategories(): void {
        const formattingSettings: TornadoChartSettingsModel = this.formattingSettings,
            color: string = formattingSettings.categoryCardSettings.fill.value.value,
            fontSizeInPx: string = PixelConverter.fromPoint( formattingSettings.categoryCardSettings.font.fontSize.value),
            position: string = dataViewObject.getValue(this.dataView.categoriesObjectProperties, "position", legendPosition.left),
            categoryElements: Selection<any> = this.main
                .select(TornadoChart.Categories.selectorName)
                .selectAll(TornadoChart.Category.selectorName);
        
        const categoryFontFamily : string = formattingSettings.categoryCardSettings.font.fontFamily.value;

        const categoryFontIsBold : boolean = formattingSettings.categoryCardSettings.font.bold.value,
            categoryFontIsItalic : boolean = formattingSettings.categoryCardSettings.font.italic.value,
            categoryFontIsUnderlined : boolean = formattingSettings.categoryCardSettings.font.underline.value;

        if (!formattingSettings.categoryCardSettings.show.value) {
            categoryElements.remove();
            return;
        }
        const categoriesSelection: Selection<any> = categoryElements.data(this.dataView.categories);

        const categoriesSelectionMerged: Selection<any> = categoriesSelection
            .enter()
            .append("g")
            .merge(categoriesSelection);

        categoriesSelectionMerged
            .append("svg:title")
            .classed(TornadoChart.CategoryTitle.className, true);

        categoriesSelectionMerged
            .append("svg:text")
            .classed(TornadoChart.CategoryText.className, true);

        let xShift: number = 0;

        if (position === "Right") {
            const width: number = this.viewport.width + this.margin.left + this.margin.right;
            xShift = width - this.allLabelsWidth;
        }

        categoriesSelectionMerged
            .attr("transform", (text: string, index: number) => {
                let shift: number = (this.heightColumn + this.columnPadding) * index + this.heightColumn / 2;
                const textData: TextData = TornadoChart.getTextData(text, this.textOptions, false, true);

                shift = shift + textData.height / 2 - this.InnerTextHeightDelta;

                return translate(xShift, shift);
            })
            .classed(TornadoChart.Category.className, true);

        categoriesSelectionMerged
            .select(TornadoChart.CategoryTitle.selectorName)
            .text((text: TextData) => text.text);

        categoriesSelectionMerged
            .select(TornadoChart.CategoryText.selectorName)
            .attr("fill", color)
            .attr("font-size", fontSizeInPx)
            .attr("font-family", categoryFontFamily)
            .attr("font-weight", categoryFontIsBold ? "bold" : "normal")
            .attr("font-style", categoryFontIsItalic ? "italic" : "normal")
            .attr("text-decoration", categoryFontIsUnderlined? "underline" : "normal")
            .text((data: TextData) => formattingSettings.categoryCardSettings.show.value
                ? textMeasurementService.getTailoredTextOrDefault(
                    TornadoChart.getTextData(data.text, this.textOptions).textProperties, this.allLabelsWidth)
                : "");

        categoriesSelection
            .exit()
            .remove();
    }

    private renderLegend(): void {
        const formattingSettings: TornadoChartSettingsModel = this.formattingSettings;
        if (formattingSettings.legendCardSettings.show.value) {

            const legend: LegendData = this.dataView.legend;
            if (!legend) {
                return;
            }
            const legendData: LegendData = {
                title: legend.title,
                dataPoints: legend.dataPoints,
                fontSize: formattingSettings.legendCardSettings.font.fontSize.value,
                fontFamily: formattingSettings.legendCardSettings.font.fontFamily.value,
                labelColor: formattingSettings.legendCardSettings.labelColor.value.value
            };

            if (this.dataView.legendObjectProperties) {
                LegendDataModule.update(legendData, this.dataView.legendObjectProperties);

                const position = this.formattingSettings.legendCardSettings.positionDropdown.value.value;

                if (position) {
                    this.legend.changeOrientation(LegendPosition[position]);
                }
            }

            this.legend.drawLegend(legendData, { ...this.viewport });
            LegendModule.positionChartArea(this.root, this.legend);

            if (legendData.dataPoints.length > 0 && formattingSettings.legendCardSettings.show.value) {
                this.updateViewport();
            }
        }
        else {
            this.legend.reset();
            this.legend.drawLegend({ dataPoints: [] }, this.viewport);
        }

    }

    public destroy(): void {
        this.root = null;
    }
}
