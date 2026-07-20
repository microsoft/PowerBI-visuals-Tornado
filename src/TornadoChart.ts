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
import DataViewObjectPropertyIdentifier = powerbiVisualsApi.DataViewObjectPropertyIdentifier;
import DataViewValueColumn = powerbiVisualsApi.DataViewValueColumn;
import DataViewCategorical = powerbiVisualsApi.DataViewCategorical;
import DataViewValueColumns = powerbiVisualsApi.DataViewValueColumns;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import DataViewValueColumnGroup = powerbiVisualsApi.DataViewValueColumnGroup;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;
import VisualUpdateType = powerbiVisualsApi.VisualUpdateType;

import IColorPalette = powerbiVisualsApi.extensibility.IColorPalette;
import ISandboxExtendedColorPalette = powerbiVisualsApi.extensibility.ISandboxExtendedColorPalette;
import ILocalizationManager = powerbiVisualsApi.extensibility.ILocalizationManager;
import IVisualEventService = powerbi.extensibility.IVisualEventService;

import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;

import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import manipulation = SVGUtil.manipulation;
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;
import IMargin = SVGUtil.IMargin;
import translate = manipulation.translate;
import translateAndRotate = manipulation.translateAndRotate;

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";

import { legend as LegendModule, legendInterfaces, legendData, dataLabelUtils } from "powerbi-visuals-utils-chartutils";
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

import { ColorHelper } from "powerbi-visuals-utils-colorutils";
// powerbi.extensibility.utils.formattingModel
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import { HtmlSubSelectableClass, SubSelectableDirectEdit, SubSelectableDisplayNameAttribute, SubSelectableObjectNameAttribute, SubSelectableTypeAttribute } from "powerbi-visuals-utils-onobjectutils";

import {
    TornadoChartLabelFormatter,
    TornadoChartSeries,
    TornadoBehaviorOptions,
    TornadoChartDataView,
    TornadoChartPoint,
    LineData,
    LabelData,
    TextData,
    TooltipArgsWrapper
} from "./interfaces";
import { TornadoWebBehavior } from "./TornadoWebBehavior";
import * as tooltipBuilder from "./tooltipBuilder";
import { TornadoChartSettingsModel, DataLabelSettings, LegendCardSettings, BaseFontControlSettings, FontDefaultOptions, TornadoObjectNames, LabelDisplayMode} from "./TornadoChartSettingsModel";
import { TornadoOnObjectService } from "./onObject/TornadoOnObjectService";
import { titleEditSubSelection } from "./onObject/references";

export class TornadoChart implements IVisual {
    private static ClassName: string = "tornado-chart";
    private static Container: string = "tornadoContainer";
    private static Legend: ClassAndSelector = createClassAndSelector("legend");
    private static LegendItemSelector: ClassAndSelector = createClassAndSelector("legendItem");
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

    private static DefaultForegroundColor: string = "#333333";
    private static DefaultBackgroundColor: string = "#FFFFFF";

    public static ScrollBarWidth = 22;
    public static DefaultLabelsWidth = 3;

    public static Properties = {
        dataPoint: {
            fill: <DataViewObjectPropertyIdentifier>{ objectName: "dataPoint", propertyName: "fill" }
        }
    };

    private tooltipArgs: TooltipArgsWrapper;
    private events: IVisualEventService;

    private formattingSettingsService: FormattingSettingsService;
    public formattingSettings: TornadoChartSettingsModel;
    public visualOnObjectFormatting: TornadoOnObjectService;

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
        colors: IColorPalette,
        localizationManager: ILocalizationManager,
        formattingSettings?: TornadoChartSettingsModel
    ): TornadoChartDataView {
        const categorical: DataViewCategorical = dataView.categorical;
        const categories: DataViewCategoryColumn[] = categorical.categories || [];
        const values: DataViewValueColumns = categorical.values;
        const category: DataViewCategoryColumn = categories[0];
        
        // Calculate per-series min/max for normalization
        const seriesMinMax: { min: number; max: number }[] = [];
        for (let s = 0; s < Math.min(values.length, TornadoChart.MaxSeries); s++) {
            const seriesValues = <number[]>values[s].values;
            seriesMinMax.push({
                min: Math.min(min(seriesValues) ?? 0, 0),
                max: Math.max(max(seriesValues) ?? 0, 0)
            });
        }
        
        let maxValue: number = max(<number[]>values[0].values) ?? 0;
        let minValue: number = Math.min(min(<number[]>values[0].values) ?? 0, 0);
        if (values.length >= TornadoChart.MaxSeries) {
            minValue = min([minValue, min(<number[]>values[1].values) ?? 0]) ?? 0;
            maxValue = max([maxValue, max(<number[]>values[1].values) ?? 0]) ?? 0;
        }
        const labelFormatter = TornadoChart.prepareFormatter(maxValue, formattingSettings.dataLabels);
        const hasDynamicSeries: boolean = !!values.source;
        const hasHighlights: boolean = values.length > 0 && values.some(value => value.highlights && value.highlights.some(_ => _));
        const labelHeight: number = textMeasurementService.estimateSvgTextHeight({
            fontFamily: dataLabelUtils.StandardFontFamily,
            fontSize: PixelConverter.fromPoint(formattingSettings?.dataLabels.labelsValuesGroup.font.fontSize.value)
        });
        const series: TornadoChartSeries[] = [];
        const dataPoints: TornadoChartPoint[] = [];
        const categorySourceFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(category.source)
        });
        const categoriesLabels: TextData[] = category.values.map(value => TornadoChart.getTextData(categorySourceFormatter.format(value), formattingSettings.category.font, true, false));
        const groupedValues: DataViewValueColumnGroup[] = values.grouped ? values.grouped() : null;
        let uniqId = 0;

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

                // Limit maximum value using categoryAxisEnd if set
                const currentMaxValue = parsedSeries.categoryAxisEnd ? parsedSeries.categoryAxisEnd : maxValue;
                
                // Per-series min/max for normalization
                const seriesMin = seriesMinMax[seriesIndex]?.min ?? 0;
                const seriesMax = seriesMinMax[seriesIndex]?.max ?? currentMaxValue;
                
                const formatString: string = dataView.categorical.values[seriesIndex].source.format;
                
                // Use the series color; override with negative bar color if value is negative and setting is defined
                let dataPointColor = parsedSeries.fill;
                if (value < 0 && formattingSettings?.negativeBars?.show?.value && formattingSettings?.negativeBars?.fill?.value?.value) {
                    dataPointColor = formattingSettings.negativeBars.fill.value.value;
                }
                
                const dataPointCommon = {
                    uniqId: uniqId,
                    value,
                    minValue: minValue,
                    maxValue: currentMaxValue,
                    seriesMin: seriesMin,
                    seriesMax: seriesMax,
                    formatString,
                    color: dataPointColor,
                    selected: false,
                    identity,
                    categoryIndex: i,
                };
                
                let highlight: number = NaN;
                let highlightedValue: number = 0;
                if (hasHighlights) {
                    highlight = <number>currentSeries.highlights[i];
                    highlightedValue = (isNaN(highlight) || highlight === null || highlight === undefined) ?  0 : highlight;
                }

                dataPoints.push({
                    ...dataPointCommon,
                    highlightedValue: highlightedValue,
                    tooltipData: buildTooltip(hasHighlights ? highlightedValue : null),
                    highlight: hasHighlights && !!highlight,
                    parentIdentity: parsedSeries.selectionId
                });
                uniqId += 1;
            }
        }

        return {
            categories: categoriesLabels,
            series: series,
            labelFormatter: labelFormatter,
            legend: TornadoChart.getLegendData(series, hasDynamicSeries),
            dataPoints: dataPoints,
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
            
        const displayName: PrimitiveValue = source?.groupName != null 
            ? String(source.groupName) 
            : source?.displayName ?? null;
        const columnObjects = columnGroup?.objects || {};
        const metadataObjects = dataView?.metadata?.objects || {};
        const sourceObjects = source?.objects || {};

        const mergedObjects: DataViewObjects = {
            ...metadataObjects,
            ...sourceObjects,
            ...columnObjects,
            dataPoint: columnObjects["dataPoint"] || sourceObjects["dataPoint"] || metadataObjects["dataPoint"],
            categoryAxis: columnObjects["categoryAxis"] || sourceObjects["categoryAxis"] || metadataObjects["categoryAxis"]
        };

        const fillColor = TornadoChart.getColor(
            TornadoChart.Properties.dataPoint.fill,
            ["purple", "teal"][index],
            mergedObjects,
            colors
        );

        let categoryAxisEnd: number = null;
        const categoryAxisObject = mergedObjects.categoryAxis;

        if (categoryAxisObject && !Array.isArray(categoryAxisObject)) {
            const axis = categoryAxisObject as DataViewObject;
            if (typeof axis.end === "number") {
                categoryAxisEnd = axis.end;
            }
        }

        return {
            fill: fillColor,
            name: displayName,
            selectionId: selectionId,
            categoryAxisEnd: categoryAxisEnd
        } as TornadoChartSeries;
    }

    private static getColor(properties: any, defaultColor: string, objects: DataViewObjects, colors: IColorPalette, convertToHighContrastMode: boolean = true): string {
        const colorHelper: ColorHelper = new ColorHelper(colors, properties, defaultColor);

        if (colorHelper.isHighContrast && convertToHighContrastMode)
            return colorHelper.getColorForMeasure(objects, "", "foreground");

        return colorHelper.getColorForMeasure(objects, "");
    }

    private static getTextData(
        text: string,
        formattingOptions: BaseFontControlSettings,
        measureWidth: boolean = false,
        measureHeight: boolean = false,
        useDefaultTextProperties: boolean = false): TextData {

        let width: number = 0,
            height: number = 0;

        text = text || "";

        const fontSize: string = useDefaultTextProperties 
            ? PixelConverter.fromPoint(FontDefaultOptions.DefaultFontSizePt)
            : PixelConverter.fromPoint(formattingOptions.fontSize.value);

        const fontFamily: string = useDefaultTextProperties 
            ? FontDefaultOptions.DefaultFontFamily
            : formattingOptions.fontFamily.value;

        const textProperties = {
            text: text,
            fontFamily: fontFamily,
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

    private get themeForegroundColor(): string {
        const extendedPalette = this.colors as ISandboxExtendedColorPalette;
        return extendedPalette?.foreground?.value || TornadoChart.DefaultForegroundColor;
    }

    private get themeBackgroundColor(): string {
        const extendedPalette = this.colors as ISandboxExtendedColorPalette;
        return extendedPalette?.background?.value || TornadoChart.DefaultBackgroundColor;
    }

    private columnPadding: number = 5;
    private leftLabelMargin: number = 4;
    private InnerTextHeightDelta: number = 2;

    private margin: IMargin = {
        top: 10,
        right: 5,
        bottom: 10,
        left: 10
    };

    private element: Selection<any>;
    private root: Selection<any>;
    private rootContainer: HTMLElement;
    private main: Selection<any>;
    private chartAreaBackground: Selection<any>;
    private columns: Selection<any>;
    private columnsSelection: Selection<any>;
    private axes: Selection<any>;
    private labels: Selection<any>;
    private categories: Selection<any>;
    private legendSelection: Selection<any>;
    private legendItems: Selection<any>;
    private gradients: Selection<any>;

    private legend: ILegend;
    private behavior: TornadoWebBehavior;
    private hostService: IVisualHost;
    private localizationManager: ILocalizationManager;
    private isScrollVisible: boolean = false;

    private viewport: IViewport;
    private dataView: TornadoChartDataView;
    private heightColumn: number = 0;

    private get viewportWidth(): number {
        return this.viewport.width - (TornadoChart.getScrollBarWidth(this.rootContainer) * +this.isScrollVisible);
    }

    private get allLabelsWidth(): number {
        const labelsWidth: number = this.formattingSettings.category.show.value
            ? Math.min(this.dataView.maxLabelsWidth, this.viewportWidth / 3)
            : TornadoChart.DefaultLabelsWidth;
        return labelsWidth + TornadoChart.CategoryLabelMargin;
    }

    private get allColumnsWidth(): number {
        return this.viewportWidth - this.allLabelsWidth;
    }

    private static getScrollBarWidth(element: HTMLElement): number{
        return element.offsetWidth - element.clientWidth;
    }

    private get columnWidth(): number {
        return this.dataView.series.length === TornadoChart.MaxSeries
            ? (this.allColumnsWidth - this.centerLineOffset * 2) / 2
            : this.allColumnsWidth;
    }

    private get centerLineOffset(): number {
        const showCenterLine = this.formattingSettings?.centerLine?.show?.value ?? true;
        const lineWidth = this.formattingSettings?.centerLine?.width?.value ?? 1;
        
        if (this.dataView?.series?.length === TornadoChart.MaxSeries && showCenterLine) {
            return lineWidth / 2;
        }
        return 0;
    }

    constructor(options: VisualConstructorOptions) {
        this.hostService = options.host;
        this.events = options.host.eventService;
        this.localizationManager = this.hostService.createLocalizationManager();
        this.colors = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colors);

        this.tooltipArgs = new TooltipArgsWrapper(options.element, options.host.tooltipService);

        this.legend = createLegend(options.element, false);

        const selectionManager = options.host.createSelectionManager();
        this.behavior = new TornadoWebBehavior(selectionManager, this.colorHelper);

        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.visualOnObjectFormatting = new TornadoOnObjectService(options.element, options.host, this.localizationManager);

        this.element = d3Select(options.element);
        this.rootContainer = document.createElement("div");
        this.rootContainer.classList.add(TornadoChart.Container);
        options.element.append(this.rootContainer);

        const root: Selection<any> = this.root = d3Select(this.rootContainer)
            .append("svg")
            .classed(TornadoChart.ClassName, true);

        const main: Selection<any> = this.main = root.append("g");

        // Chart area background (rendered first so it's behind other elements)
        this.chartAreaBackground = main
            .append("rect")
            .classed("chartAreaBackground", true);

        this.columns = main
            .append("g")
            .classed(TornadoChart.Columns.className, true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");

        this.axes = main
            .append("g")
            .classed(TornadoChart.Axes.className, true);

        this.labels = main
            .append("g")
            .classed(TornadoChart.Labels.className, true);

        this.categories = main
            .append("g")
            .classed(TornadoChart.Categories.className, true);
        
        this.legendSelection = this.element
            .select(TornadoChart.Legend.selectorName);
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
        this.events.renderingStarted(options);

        this.viewport = {
            height: Math.max(0, options.viewport.height - this.margin.top - this.margin.bottom),
            width: Math.max(0, options.viewport.width - this.margin.left - this.margin.right)
        };

        const dataView: DataView = this.validateDataView(options.dataViews[0]);
        if(dataView){
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(TornadoChartSettingsModel, dataView);
            this.formattingSettings.setLocalizedOptions(this.localizationManager);
        }

        this.dataView = TornadoChart.converter(dataView, this.hostService, this.colors, this.localizationManager, this.formattingSettings);
        if (!this.dataView || this.viewport.height < TornadoChart.CategoryMinHeight) {
            this.clearData();
            this.events.renderingFinished(options);
            return;
        }

        //Populate slices for DataColors and CategoryAxisCard 
        this.formattingSettings.populateDataColorSlice(this.dataView.series);
        this.formattingSettings.populateCategoryAxisSlice(this.dataView.series);
        this.formattingSettings.setVisibilityOfLegendCardSettings(this.dataView.legend);
        
        this.render(options.formatMode);
        this.applyOnObjectFormatting(options.formatMode, options.type, options.subSelections);
        this.events.renderingFinished(options);
    }

    private validateDataView(dataView: DataView): DataView {
        if (!dataView || !dataView.categorical || !dataView.categorical.values) {
            return null;
        }
        return dataView;
    }

    private updateElements(isFormatMode: boolean): void {
        let translateX: number = 0;
        const position: string = this.formattingSettings.category.positionDropdown.value.value.toString();
        if (position === "Left") {
            translateX = this.allLabelsWidth;
        }
        const elementsTranslate: string = translate(translateX, 0);
        const rootHeight = TornadoChart.calculateRootHeight(this.dataView.dataPoints);

        this.root
            .attr("height", rootHeight)
            .attr("width", this.viewport.width + this.margin.left + this.margin.right);

        // Update plot area background
        const showBg = this.formattingSettings?.chartArea?.show?.value ?? false;
        const bgColor = showBg ? this.formattingSettings?.chartArea?.backgroundColor?.value?.value : null;
        const effectiveBgColor = this.colorHelper.isHighContrast 
            ? (bgColor ? this.colorHelper.getHighContrastColor("background", bgColor) : "none")
            : (bgColor || "none");
        const isChartAreaSubSelectable = isFormatMode && showBg;
        this.chartAreaBackground
            .attr("transform", elementsTranslate)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.allColumnsWidth)
            .attr("height", rootHeight)
            .style("fill", effectiveBgColor)
            .style("pointer-events", isChartAreaSubSelectable ? "all" : "none");

        this.applyOnObjectStylesToChartArea(isChartAreaSubSelectable);

        this.columns
            .attr("transform", elementsTranslate);

        this.labels
            .attr("transform", elementsTranslate);

        this.axes
            .attr("transform", elementsTranslate);
    }

    private applyOnObjectStylesToChartArea(isSubSelectable: boolean): void {
        this.chartAreaBackground
            .classed(HtmlSubSelectableClass, isSubSelectable)
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.ChartArea)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_ChartArea"))
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape);
    }

    private static calculateRootHeight(dataPoints: TornadoChartPoint[]): number{
        const length: number = dataPoints.length;
        return dataPoints[length - 1].dy + dataPoints[length - 1].height;
    }

    private static prepareFormatter(value: number, labelsSettings: DataLabelSettings): TornadoChartLabelFormatter {
        const precision: number = TornadoChart.getPrecision(labelsSettings);

        const displayUnits: number = +labelsSettings.labelsValuesGroup.labelDisplayUnits.value;
        const getLabelValueFormatter = (formatString: string) => valueFormatter.create({
            format: formatString,
            precision: precision,
            value: (displayUnits === 0) && (value != null) ? value : displayUnits,
        });

        return {
            getLabelValueFormatter: getLabelValueFormatter
        };
    }

    private static getPrecision(labelsSettings: DataLabelSettings): number {
        const precision: number = labelsSettings.labelsValuesGroup.labelPrecision.value;
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

    private render(isFormatMode: boolean): void {
        this.renderLegend(isFormatMode);
        this.renderWithScrolling(isFormatMode);
        this.bindBehaviorToVisual(isFormatMode);
    }

    private applyOnObjectFormatting(isFormatMode: boolean, updateType: VisualUpdateType, subSelections?: CustomVisualSubSelection[]): void{
        this.visualOnObjectFormatting.setFormatMode(isFormatMode);

        const shouldUpdateSubSelection = updateType & (powerbi.VisualUpdateType.Data
            | powerbi.VisualUpdateType.Resize
            | powerbi.VisualUpdateType.FormattingSubSelectionChange);

        if (isFormatMode && shouldUpdateSubSelection) {
            this.visualOnObjectFormatting.updateOutlinesFromSubSelections(subSelections, true);
        }
    }

    private bindBehaviorToVisual(isFormatMode: boolean): void {
        const negativeBarsTransparency = this.formattingSettings?.negativeBars?.transparency?.value ?? 0;
        const behaviorOptions: TornadoBehaviorOptions = {
            columns: this.columnsSelection,
            clearCatcher: this.root,
            tooltipArgs: this.tooltipArgs,
            legend: this.legendItems,
            legendClearCatcher: this.legendSelection,
            gradients: this.gradients,
            isFormatMode,
            negativeBarsTransparency,
        };
        this.behavior.bindEvents(behaviorOptions);
        this.behavior.renderSelection();
    }

    private clearData(): void {
        this.resetChartAreaBackground();
        this.columns.selectAll("*").remove();
        this.axes.selectAll("*").remove();
        this.labels.selectAll("*").remove();
        this.categories.selectAll("*").remove();
        this.legend.reset();
        this.legend.drawLegend({ dataPoints: [] }, this.viewport);
    }

    private resetChartAreaBackground(): void {
        this.chartAreaBackground
            .attr("width", 0)
            .attr("height", 0)
            .style("fill", "none")
            .style("pointer-events", "none")
            .classed(HtmlSubSelectableClass, false);
    }

    private renderWithScrolling(isFormatMode: boolean): void {
        if (!this.dataView || !this.formattingSettings) {
            return;
        }

        this.computeHeightColumn();
        this.renderMiddleSection(isFormatMode);
        this.renderAxes(isFormatMode);
        this.renderCategories(isFormatMode);
    }

    private updateViewport(): void {
        const legendMargins: IViewport = this.legend.getMargins(),
            legendPosition: LegendPosition = LegendPosition[this.formattingSettings.legend.options.position.value.value];

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

        const numberOfDisplayedRows: number = Math.floor(this.viewport.height / TornadoChart.CategoryMinHeight) > length
            ? length
            : Math.floor(this.viewport.height / TornadoChart.CategoryMinHeight);

        const barSpacing = this.formattingSettings?.barAppearance?.barSpacing?.value ?? 0;

        if (numberOfDisplayedRows > 0) {
            if (barSpacing > 0) {
                // Percentage-based spacing
                const spacingPercent = barSpacing / 100;
                const divisor = numberOfDisplayedRows + (numberOfDisplayedRows - 1) * spacingPercent;
                this.heightColumn = this.viewport.height / divisor;
                this.columnPadding = this.heightColumn * spacingPercent;
            } else {
                // Legacy fixed 5px spacing (default - preserves old behavior)
                this.heightColumn = (this.viewport.height - (numberOfDisplayedRows - 1) * 5) / numberOfDisplayedRows;
                this.columnPadding = 5;
            }
        } else {
            this.heightColumn = 0;
            this.columnPadding = 5;
        }

        this.isScrollVisible = numberOfDisplayedRows < length;
        this.rootContainer.style.overflowY = this.isScrollVisible ? "scroll" : "hidden";
    }

    private renderMiddleSection(isFormatMode: boolean): void {
        const tornadoChartDataView: TornadoChartDataView = this.dataView;
        this.calculateDataPoints(tornadoChartDataView.dataPoints);
        this.updateElements(isFormatMode);
        this.renderColumns(tornadoChartDataView.dataPoints, isFormatMode);
        this.renderLabels(tornadoChartDataView.dataPoints, this.formattingSettings.dataLabels, isFormatMode);
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
        const isNormalized = this.formattingSettings?.categoryAxis?.normalize?.value ?? false;
        const centerOffset = this.centerLineOffset;

        for (let i: number = 0; i < dataPoints.length; i++) {
            const dataPoint: TornadoChartPoint = dataPoints[i];

            const shiftToMiddle: boolean = i < categoriesLength && maxSeries;
            const shiftToRight: boolean = i > categoriesLength - 1;
            const minForWidth = isNormalized ? dataPoint.seriesMin : dataPoint.minValue;
            const maxForWidth = isNormalized ? dataPoint.seriesMax : dataPoint.maxValue;
            const widthOfColumn: number = this.getColumnWidth(dataPoint.value, minForWidth, maxForWidth, this.columnWidth);
            let dx: number = (this.columnWidth - widthOfColumn) * Number(shiftToMiddle) + (this.columnWidth + centerOffset * 2) * Number(shiftToRight)/* - scrollBarWidth*/;
            dx = Math.max(dx, 0);

            const highlighted: boolean = this.dataView.hasHighlights && dataPoint.highlight;
            const highlightOffset: number = highlighted ? heightColumn * (1 - TornadoChart.HighlightedShapeFactor) / 2 : 0;
            const dy: number = (heightColumn + this.columnPadding) * (i % categoriesLength) + highlightOffset;

            const percentage = this.columnWidth > 0 ? (widthOfColumn / this.columnWidth) * 100 : 0;

            const label: LabelData = this.getLabelData(
                dataPoint.value,
                dx,
                widthOfColumn,
                shiftToMiddle,
                dataPoint.formatString,
                labelFormatter,
                percentage);

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

    private renderColumns(columnsData: TornadoChartPoint[], isFormatMode: boolean): void {  
        // Hide negative bars when the negative bars toggle is turned off
        const showNegativeBars = this.formattingSettings?.negativeBars?.show?.value ?? true;
        const filteredColumnsData = showNegativeBars
            ? columnsData
            : columnsData.filter(p => p.value >= 0);

        const columnsSelection: Selection<any> = this.columns
            .selectAll(TornadoChart.Column.selectorName)
            .data(filteredColumnsData, (p: unknown) => (p as TornadoChartPoint).uniqId);

        // defs should only contain required gradients,
        // otherwise gradients are duplicated
        this.columns.select("defs").remove();

        this.gradients = this.columns.append("defs")
            .selectAll("linearGradient")
            .data(filteredColumnsData, (p: unknown) => (p as TornadoChartPoint).uniqId)
            .enter()
            .append("linearGradient")
            .attr("id", (p: TornadoChartPoint) => "gradient-" + p.uniqId) // Use the index of the column as the id
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        const columnsSelectionMerged = columnsSelection
            .enter()
            .append("svg:path")
            .merge(columnsSelection);

        columnsSelectionMerged.classed(TornadoChart.Column.className, true);

        columnsSelectionMerged
            .style("stroke", (p: TornadoChartPoint) => {
                let strokeColor: string;
                if (p.value < 0 && this.formattingSettings?.negativeBars?.borderColor?.value?.value) {
                    strokeColor = this.formattingSettings.negativeBars.borderColor.value.value;
                } else {
                    const borderColor = this.formattingSettings?.barAppearance?.borderColor?.value?.value;
                    strokeColor = borderColor || p.color;
                }
                return this.colorHelper.isHighContrast 
                    ? this.colorHelper.getHighContrastColor("foreground", strokeColor) 
                    : strokeColor;
            })
            .style("stroke-width", (p: TornadoChartPoint) => {
                if (this.colorHelper.isHighContrast) return 2;
                if (p.value < 0 && this.formattingSettings?.negativeBars?.borderWidth?.value != null) {
                    return this.formattingSettings.negativeBars.borderWidth.value;
                }
                return this.formattingSettings?.barAppearance?.borderWidth?.value || 0;
            })
            .style("fill-opacity", (p: TornadoChartPoint) => {
                if (p.value < 0) {
                    const transparency = this.formattingSettings?.negativeBars?.transparency?.value || 0;
                    return 1 - (transparency / 100);
                }
                return 1;
            })
            .style("fill", (p: TornadoChartPoint) => "url(#gradient-" + p.uniqId + ")")
            .attr("transform", (p: TornadoChartPoint) => translateAndRotate(p.dx, p.dy, p.px, p.py, p.angle))
            .attr("d", (p: TornadoChartPoint) => {
                let borderWidth = this.formattingSettings?.barAppearance?.borderWidth?.value || 0;
                if (p.value < 0 && this.formattingSettings?.negativeBars?.borderWidth?.value != null) {
                    borderWidth = this.formattingSettings.negativeBars.borderWidth.value;
                }
                if (this.colorHelper.isHighContrast) borderWidth = 2;
                const inset = borderWidth / 2;
                
                const w = Math.max(0, p.width - borderWidth);
                const h = Math.max(0, p.height - borderWidth);
                
                let cornerRadius = this.formattingSettings?.barAppearance?.cornerRadius?.value || 0;
                if (p.value < 0 && this.formattingSettings?.negativeBars?.cornerRadius?.value != null) {
                    cornerRadius = this.formattingSettings.negativeBars.cornerRadius.value;
                }
                const r = Math.max(0, Math.min(cornerRadius, w / 2, h / 2));
                
                if (r === 0) {
                    // Simple rectangle path (identical visual to old <rect>)
                    return `M ${inset},${inset} L ${inset + w},${inset} L ${inset + w},${inset + h} L ${inset},${inset + h} Z`;
                }
                
                // Rounded corners on the right side only
                return `M ${inset},${inset} L ${inset + w - r},${inset} Q ${inset + w},${inset} ${inset + w},${inset + r} L ${inset + w},${inset + h - r} Q ${inset + w},${inset + h} ${inset + w - r},${inset + h} L ${inset},${inset + h} Z`;
            })
            .attr("tabindex", 0)
            .attr("role", "option")
            .attr("aria-label", (d: TornadoChartPoint) => { 
                return `${d.tooltipData?.[0]?.displayName} = ${d.tooltipData?.[0]?.value}`;
            });

        columnsSelection
            .exit()
            .remove();

        this.columnsSelection = columnsSelectionMerged;

        this.applyOnObjectStylesToColumns(columnsSelectionMerged, isFormatMode);
    }

    private applyOnObjectStylesToColumns(pathSelection: any, isFormatMode: boolean): void {
        const getSeriesName = (dataPoint: TornadoChartPoint) => {
            const legendTooltip = dataPoint.tooltipData.find(x => x.displayName === "Legend");
            const displayName = this.localizationManager.getDisplayName("Visual_Group");
            return legendTooltip?.value ? `"${legendTooltip.value}" ${displayName}` : displayName;
        };

        pathSelection
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.DataPoint)
            .attr(SubSelectableDisplayNameAttribute, getSeriesName)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape)
            .classed(HtmlSubSelectableClass, isFormatMode);
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
        labelFormatter: TornadoChartLabelFormatter,
        percentage: number): LabelData {

        const fontSize: number = this.formattingSettings.dataLabels.labelsValuesGroup.font.fontSize.value;
        const displayMode: string = this.formattingSettings.dataLabels.labelsOptionsGroup.displayFormat?.value?.value?.toString() ?? LabelDisplayMode.Value;
        const precision: number = TornadoChart.getPrecision(this.formattingSettings.dataLabels);

        let dx: number,
            color: string = this.formattingSettings.dataLabels.labelsValuesGroup.insideFill.value.value || this.themeBackgroundColor;

        const maxOutsideLabelWidth: number = isColumnPositionLeft
            ? dxColumn - this.leftLabelMargin
            : this.allColumnsWidth - (dxColumn + columnWidth + this.leftLabelMargin);
        const maxLabelWidth: number = Math.max(maxOutsideLabelWidth, columnWidth - this.leftLabelMargin);

        // Format the value based on the selected display mode
        const formattedValue = labelFormatter.getLabelValueFormatter!(formatStringProp).format(value);
        const formattedPercentage = percentage.toFixed(precision) + "%";

        let labelText: string;
        switch (displayMode) {
            case LabelDisplayMode.Percentage:
                labelText = formattedPercentage;
                break;
            case LabelDisplayMode.ValueAndPercentage:
                labelText = `${formattedValue} (${formattedPercentage})`;
                break;
            case LabelDisplayMode.Value:
            default:
                labelText = formattedValue;
                break;
        }

        const textProperties: TextProperties = {
            fontFamily: this.formattingSettings.dataLabels.labelsValuesGroup.font.fontFamily.value,
            fontSize: PixelConverter.fromPoint(fontSize),
            text: labelText
        };
        const valueAfterValueFormatter: string = textMeasurementService.getTailoredTextOrDefault(textProperties, maxLabelWidth);
        const textDataAfterValueFormatter: TextData = TornadoChart.getTextData(valueAfterValueFormatter, this.formattingSettings.dataLabels.labelsValuesGroup.font, true, false);
        const negativeFill = this.formattingSettings.dataLabels.labelsValuesGroup.negativeFill?.value?.value;

        if (columnWidth > textDataAfterValueFormatter.width + TornadoChart.LabelPadding) {
            dx = dxColumn + columnWidth / 2 - textDataAfterValueFormatter.width / 2;
            if (value < 0 && negativeFill) {
                color = negativeFill;
            }
        } else {
            if (isColumnPositionLeft) {
                dx = dxColumn - this.leftLabelMargin - textDataAfterValueFormatter.width;
            } else {
                dx = dxColumn + columnWidth + this.leftLabelMargin;
            }
            if (value < 0 && negativeFill) {
                color = negativeFill;
            } else {
                color = this.formattingSettings.dataLabels.labelsValuesGroup.outsideFill.value.value || this.themeForegroundColor;
            }
        }

        return {
            dx: dx,
            source: value,
            value: valueAfterValueFormatter,
            color: color
        };
    }

    private renderAxes(isFormatMode: boolean): void {
        const axesElements: Selection<any> = this.main
                .select(TornadoChart.Axes.selectorName)
                .selectAll(TornadoChart.Axis.selectorName);

        const showCenterLine = this.formattingSettings?.centerLine?.show?.value ?? true;

        if (this.dataView.series.length !== TornadoChart.MaxSeries || !showCenterLine) {
            axesElements.remove();
            return;
        }

        const linesData: LineData[] = this.generateAxesData();
        const axesSelection: Selection<any> = axesElements.data(linesData);

        const axesSelectionMerged = axesSelection
            .enter()
            .append("svg:line")
            .merge(axesSelection);

        const lineColor = this.formattingSettings?.centerLine?.color?.value?.value;
        const lineWidth = this.formattingSettings?.centerLine?.width?.value ?? 1;

        // If no color is set, use high contrast color or the theme foreground color
        const effectiveLineColor = this.colorHelper.isHighContrast 
            ? this.colorHelper.getHighContrastColor()
            : (lineColor || this.themeForegroundColor);

        if (!effectiveLineColor) {
            axesElements.remove();
            return;
        }

        axesSelectionMerged
            .classed(TornadoChart.Axis.className, true)
            .classed(HtmlSubSelectableClass, isFormatMode && showCenterLine)
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.CenterLine)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_CenterLine"))
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape)
            .style("stroke", effectiveLineColor)
            .style("stroke-width", lineWidth);

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
            y2: number = TornadoChart.calculateRootHeight(this.dataView.dataPoints);

        return [{
            x1: x,
            y1: y1,
            x2: x,
            y2: y2
        }];
    }

    private renderLabels(dataPoints: TornadoChartPoint[], labelsSettings: DataLabelSettings, isFormatMode: boolean): void {
        const labelSelection: Selection<TornadoChartPoint> = this.main
                .select(TornadoChart.Labels.selectorName)
                .selectAll(TornadoChart.Label.selectorName)
                .data(dataPoints.filter((p: TornadoChartPoint) => p.label!.dx >= 0));
        const formattingSettings: TornadoChartSettingsModel = this.formattingSettings;

        // Check if labels can be displayed
        if (!labelsSettings.show.value || this.dataView.labelHeight >= this.heightColumn) {
            this.labels.selectAll("*").remove();
            return;
        }

        const fontSizeInPx: string = PixelConverter.fromPoint(labelsSettings.labelsValuesGroup.font.fontSize.value);
        const labelYOffset: number = this.heightColumn / 2 + this.dataView.labelHeight / 2 - this.InnerTextHeightDelta;
        const categoriesLength: number = this.dataView.categories.length;

        // When negative bars are hidden their columns aren't rendered, so suppress
        // the matching labels (kept in the join to preserve per-row alignment).
        const showNegativeBars: boolean = this.formattingSettings?.negativeBars?.show?.value ?? true;
        const isLabelHidden = (p: TornadoChartPoint): boolean => !showNegativeBars && p.value < 0;

        const labelFontFamily : string = formattingSettings.dataLabels.labelsValuesGroup.font.fontFamily.value;

        const labelFontIsBold : boolean = formattingSettings.dataLabels.labelsValuesGroup.font.bold.value,
            labelFontIsItalic : boolean = formattingSettings.dataLabels.labelsValuesGroup.font.italic.value,
            labelFontIsUnderlined : boolean = formattingSettings.dataLabels.labelsValuesGroup.font.underline.value;

        const labelEnter: Selection<TornadoChartPoint> = labelSelection
            .enter()
            .append("g")
            .classed(TornadoChart.Label.className, true);

        labelEnter
            .append("svg:title")
            .classed(TornadoChart.LabelTitle.className, true);

        labelEnter
            .append("svg:text")
            .attr("dy", dataLabelUtils.DefaultDy)
            .classed(TornadoChart.LabelText.className, true);

        const labelSelectionMerged: Selection<TornadoChartPoint> = labelEnter.merge(labelSelection);

        labelSelectionMerged
            .select(TornadoChart.LabelTitle.selectorName)
            .text((p: TornadoChartPoint) => isLabelHidden(p) ? "" : p.label!.source);

        labelSelectionMerged
            .attr("transform", (p: TornadoChartPoint, index: number) => {
                const dy: number = (this.heightColumn + this.columnPadding) * (index % categoriesLength);
                return translate(p.label.dx, dy + labelYOffset);
            });

        labelSelectionMerged
            .select(TornadoChart.LabelText.selectorName)
            .attr("fill", (p: TornadoChartPoint) => this.colorHelper.isHighContrast ? this.colorHelper.getHighContrastColor("foreground", p.color) : p.label!.color)
            .attr("font-size", fontSizeInPx)
            .attr("font-family", labelFontFamily)
            .attr("font-weight", labelFontIsBold ? "bold" : "normal")
            .attr("font-style", labelFontIsItalic ? "italic" : "normal")
            .attr("text-decoration", labelFontIsUnderlined? "underline" : "normal")
            .text((p: TornadoChartPoint) => isLabelHidden(p) ? "" : p.label!.value)
            .attr("role", "presentation");

        labelSelection
            .exit()
            .remove();

        this.applyOnObjectStylesToLabels(labelSelectionMerged, isFormatMode);
    }

    private applyOnObjectStylesToLabels(labelSelection: Selection<TornadoChartPoint>, isFormatMode: boolean): void {
        labelSelection
            .classed(HtmlSubSelectableClass, isFormatMode)
            .attr("pointer-events", isFormatMode ? "auto" : "none")
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.Labels)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Labels"));
    }

    private renderCategories(isFormatMode: boolean): void {
        const formattingSettings: TornadoChartSettingsModel = this.formattingSettings,
            color: string = formattingSettings.category.fill.value.value || this.themeForegroundColor,
            fontSizeInPx: string = PixelConverter.fromPoint( formattingSettings.category.font.fontSize.value),
            position: string = this.formattingSettings.category.positionDropdown.value.value.toString(),

            categoryElements: Selection<any> = this.main
                .select(TornadoChart.Categories.selectorName)
                .selectAll(TornadoChart.Category.selectorName);
        
        const categoryFontFamily : string = formattingSettings.category.font.fontFamily.value;

        const categoryFontIsBold : boolean = formattingSettings.category.font.bold.value,
            categoryFontIsItalic : boolean = formattingSettings.category.font.italic.value,
            categoryFontIsUnderlined : boolean = formattingSettings.category.font.underline.value;

        if (!formattingSettings.category.show.value) {
            categoryElements.remove();
            return;
        }
        const categoriesSelection: Selection<any> = categoryElements.data(this.dataView.categories);

        const categoriesEnter: Selection<any> = categoriesSelection
            .enter()
            .append("g");

        categoriesEnter
            .append("svg:title")
            .classed(TornadoChart.CategoryTitle.className, true);

        categoriesEnter
            .append("svg:text")
            .classed(TornadoChart.CategoryText.className, true);

        const categoriesSelectionMerged: Selection<any> = categoriesEnter.merge(categoriesSelection);

        let xShift: number = 0;

        if (position === "Right") {
            xShift = this.viewportWidth - this.allLabelsWidth + TornadoChart.CategoryLabelMargin;
        }

        categoriesSelectionMerged
            .attr("transform", (text: string, index: number) => {
                let shift: number = (this.heightColumn + this.columnPadding) * index + this.heightColumn / 2;
                const textData: TextData = TornadoChart.getTextData(text, this.formattingSettings.category.font, false, true, true);

                shift = shift + textData.height / 2 - this.InnerTextHeightDelta;

                return translate(xShift, shift);
            })
            .classed(TornadoChart.Category.className, true);

        categoriesSelectionMerged
            .select(TornadoChart.CategoryTitle.selectorName)
            .text((text: TextData) => text.text);

        categoriesSelectionMerged
            .select(TornadoChart.CategoryText.selectorName)
            .attr("fill", this.colorHelper.isHighContrast ? this.colorHelper.getHighContrastColor("foreground", color) : color)
            .attr("font-size", fontSizeInPx)
            .attr("font-family", categoryFontFamily)
            .attr("font-weight", categoryFontIsBold ? "bold" : "normal")
            .attr("font-style", categoryFontIsItalic ? "italic" : "normal")
            .attr("text-decoration", categoryFontIsUnderlined? "underline" : "normal")
            .attr("dy", "0.25em")
            .text((data: TextData) => formattingSettings.category.show.value
                ? textMeasurementService.getTailoredTextOrDefault(
                    TornadoChart.getTextData(data.text, this.formattingSettings.category.font, false, true).textProperties, this.allLabelsWidth)
                : "");

        categoriesSelection
            .exit()
            .remove();

        this.applyOnObjectStylesToCategories(categoriesSelectionMerged, isFormatMode);
    }

    private applyOnObjectStylesToCategories(selection: Selection<any>, isFormatMode: boolean): void {
        selection
            .classed(HtmlSubSelectableClass, isFormatMode)
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.Categories)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Categories"));
    }

    private renderLegend(isFormatMode: boolean): void {
        const legendSettings: LegendCardSettings = this.formattingSettings.legend;
        if (legendSettings.show.value) {

            const legend: LegendData = this.dataView.legend;
            if (!legend) {
                return;
            }

            const legendLabelsColor: string = legendSettings.text.labelColor.value.value || this.themeForegroundColor;
            const legendData: LegendData = {
                title: legendSettings.title.showTitle.value ? (legendSettings.title.titleText.value || legendSettings.title.defaultTitleText) : "",
                dataPoints: legend.dataPoints,
                fontSize: legendSettings.text.font.fontSize.value,
                fontFamily: legendSettings.text.font.fontFamily.value,
                labelColor: this.colorHelper.isHighContrast ? this.colorHelper.getHighContrastColor("foreground", legendLabelsColor) : legendLabelsColor
            };

            if (this.dataView.legendObjectProperties) {
                LegendDataModule.update(legendData, this.dataView.legendObjectProperties);

                const position = legendSettings.options.position.value.value;

                if (position) {
                    this.legend.changeOrientation(LegendPosition[position]);
                }
            }

            this.legend.drawLegend(legendData, { ...this.viewport });

            // Apply position class to legend for CSS styling
            const position = legendSettings.options.position.value.value;
            this.legendSelection
                .classed("legend-position-bottom", position === LegendPosition[LegendPosition.Bottom])
                .classed("legend-position-bottomCenter", position === LegendPosition[LegendPosition.BottomCenter]);

            if (legendData.dataPoints.length > 0 && legendSettings.show.value) {
                this.updateViewport();
            }
        }
        else {
            this.legend.reset();
            this.legend.drawLegend({ dataPoints: [] }, this.viewport);
            this.legendSelection
                .classed("legend-position-bottom", false)
                .classed("legend-position-bottomCenter", false);
        }

        this.legendItems = this.legendSelection.selectAll(TornadoChart.LegendItemSelector.selectorName);

        this.legendSelection.selectAll("text")
            .style("font-weight",  () => legendSettings.text.font.bold.value ? "bold" : "normal")
            .style("font-style",  () => legendSettings.text.font.italic.value ? "italic" : "normal")
            .style("text-decoration", () => legendSettings.text.font.underline.value ? "underline" : "none");

        this.applyOnObjectStylesToLegend(isFormatMode);

        TornadoChart.SetPositionsDependingOnLegend(this.rootContainer, legendSettings, this.legend);
    }

    private applyOnObjectStylesToLegend(isFormatMode: boolean): void {
        const legendSettings: LegendCardSettings = this.formattingSettings.legend;

        this.legendSelection.select("#legendGroup")
            .classed(HtmlSubSelectableClass, isFormatMode && legendSettings.show.value)
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.Legend)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Legend"));

        this.legendSelection.select(".legendTitle")
            .classed(HtmlSubSelectableClass, isFormatMode && legendSettings.show.value && legendSettings.title.showTitle.value)
            .attr(SubSelectableObjectNameAttribute, TornadoObjectNames.LegendTitle)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Title"))
            .attr(SubSelectableDirectEdit, titleEditSubSelection);
    }

    public static SetPositionsDependingOnLegend(chartArea: HTMLElement, legendSettings: LegendCardSettings, legend: ILegend): void{
        const legendMargin: IViewport = legend.getMargins();

        if (!legendSettings.topLevelSlice.value){
            chartArea.style.inset = `0px 0px 20px 0px`;
            return;
        }

        switch (legendSettings.options.position.value.value){
            case LegendPosition[LegendPosition.Top]:
            case LegendPosition[LegendPosition.TopCenter]: {
                chartArea.style.inset = `${legendMargin.height}px 0px 20px 0px`;
                break;
            }
            case LegendPosition[LegendPosition.Bottom]:
            case LegendPosition[LegendPosition.BottomCenter]: {
                chartArea.style.inset = `0px 0px ${legendMargin.height + 20}px 0px`;
                break;
            }
            case LegendPosition[LegendPosition.Right]:
            case LegendPosition[LegendPosition.RightCenter]: {
                chartArea.style.inset = `0px 0px 20px 0px`;
                break;
            }
            case LegendPosition[LegendPosition.Left]:
            case LegendPosition[LegendPosition.LeftCenter]: {
                chartArea.style.inset = `0px 0px 20px ${legendMargin.width}px`;
                break;
            }
        }
    }

    public destroy(): void {
        this.root = null;
    }
}
