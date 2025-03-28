import powerbi from "powerbi-visuals-api";

import ISelectionId = powerbi.visuals.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import SubSelectionShortcutsKey = powerbi.visuals.SubSelectionShortcutsKey;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { select as d3Select } from "d3-selection";
import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { TornadoObjectNames } from "../TornadoChartSettingsModel";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";
import { TornadoChartPoint } from "../interfaces";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

export class TornadoOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;

    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager) {
        this.localizationManager = localizationManager;
        this.htmlSubSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }

    public setFormatMode(isFormatMode: boolean): void {
        this.htmlSubSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.htmlSubSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case TornadoObjectNames.Legend:
                    return SubSelectionStylesService.GetLegendStyles();
                case TornadoObjectNames.Categories:
                    return SubSelectionStylesService.GetCategoriesStyles();
                case TornadoObjectNames.DataPoint:
                    return SubSelectionStylesService.GetDataPointStyles(subSelections, this.localizationManager);
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case TornadoObjectNames.Legend:
                    return SubSelectionShortcutsService.GetLegendShortcuts(this.localizationManager);
                case TornadoObjectNames.LegendTitle:
                    return SubSelectionShortcutsService.GetLegendTitleShortcuts(this.localizationManager);
                case TornadoObjectNames.Categories:
                    return SubSelectionShortcutsService.GetCategoriesShortcuts(this.localizationManager);
                case TornadoObjectNames.DataPoint:
                    return SubSelectionShortcutsService.GetDataPointShortcuts(subSelections, this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case TornadoObjectNames.DataPoint:
                const datum = d3Select<Element, TornadoChartPoint>(e).datum();
                return datum.parentIdentity;
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            default:
                return undefined;
        }
    }
}