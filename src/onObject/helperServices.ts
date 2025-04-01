import powerbi from "powerbi-visuals-api";

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import TextSubSelectionStyles = powerbi.visuals.TextSubSelectionStyles;
import NumericTextSubSelectionStyles = powerbi.visuals.NumericTextSubSelectionStyles;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { categoriesReferences, dataPointReferences, labelsReference, legendReferences } from "./references";
import { IFontReference } from "./interfaces";

export class SubSelectionStylesService {
    private static GetSubselectionStylesForText(objectReference: IFontReference): TextSubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...objectReference.fontFamily
                },
                label: objectReference.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...objectReference.bold
                },
                label: objectReference.bold.propertyName
            },
            italic: {
                reference: {
                    ...objectReference.italic
                },
                label: objectReference.italic.propertyName
            },
            underline: {
                reference: {
                    ...objectReference.underline
                },
                label: objectReference.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...objectReference.fontSize
                },
                label: objectReference.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...objectReference.color
                },
                label: objectReference.color.propertyName
            }
        };
    }

    public static GetLegendStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(legendReferences);
    }

    public static GetCategoriesStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(categoriesReferences);
    }

    public static GetDataPointStyles(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...dataPointReferences.fill,
                    selector
                },
                label: localizationManager.getDisplayName("Visual_Fill")
            },
        };
    }

    public static GetLabelsStyles(): SubSelectionStyles {
        const textStyles: NumericTextSubSelectionStyles = {
            ...this.GetSubselectionStylesForText(labelsReference),
            type: SubSelectionStylesType.NumericText,
            displayUnits: {
                reference: {
                    ...labelsReference.displayUnits
                },
                label: labelsReference.displayUnits.propertyName
            },
            precision: {
                reference: {
                    ...labelsReference.precision
                },
                label: labelsReference.precision.propertyName
            },
            background: {
                reference: {
                    ...labelsReference.outsideFill
                },
                label: labelsReference.outsideFill.propertyName
            }
        };

        return textStyles;
    }
}

export class SubSelectionShortcutsService {
    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...legendReferences.position,
                label: localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddTitle")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.bold,
                    legendReferences.fontFamily,
                    legendReferences.fontSize,
                    legendReferences.italic,
                    legendReferences.underline,
                    legendReferences.color,
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLegend")
            }
        ];
    }

    public static GetLegendTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: "legendTitle-group" },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }

    public static GetCategoriesShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...categoriesReferences.position,
                label: localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Toggle,
                ...categoriesReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    categoriesReferences.bold,
                    categoriesReferences.fontFamily,
                    categoriesReferences.fontSize,
                    categoriesReferences.italic,
                    categoriesReferences.underline,
                    categoriesReferences.color,
                    categoriesReferences.position,
                    categoriesReferences.show
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: categoriesReferences.cardUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatCategories")
            }
        ];
    }

    public static GetDataPointShortcuts(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...dataPointReferences.fill,
                    selector
                }],
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: dataPointReferences.cardUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatDataColors")
            }
        ];
    }

    public static GetLabelsShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Toggle,
                ...labelsReference.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    labelsReference.bold,
                    labelsReference.fontFamily,
                    labelsReference.fontSize,
                    labelsReference.italic,
                    labelsReference.underline,
                    labelsReference.color,
                    labelsReference.outsideFill,
                    labelsReference.show
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: labelsReference.cardUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLabels")
            }
        ];
    }
}