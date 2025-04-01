import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { ICategoriesReference, IDataPointReference, IFontReference, ILabelsReference, ILegendReference } from "./interfaces";
import { TornadoObjectNames } from "../TornadoChartSettingsModel";

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const titleEditSubSelection = JSON.stringify(TitleEdit);

const createBaseFontReference = (objectName: string, colorName: string): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "fontFamily"
        },
        bold: {
            objectName: objectName,
            propertyName: "fontBold"
        },
        italic: {
            objectName: objectName,
            propertyName: "fontItalic"
        },
        underline: {
            objectName: objectName,
            propertyName: "fontUnderline"
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize"
        },
        color: {
            objectName: objectName,
            propertyName: colorName
        }
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(TornadoObjectNames.Legend, "labelColor"),
    cardUid: "Visual-legend-card",
    groupUid: "legendOptions-group",
    show: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "show"
    },
    showTitle: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "showTitle"
    },
    titleText: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "titleText"
    },
    position: {
        objectName: TornadoObjectNames.Legend,
        propertyName: "position"
    }
}

export const categoriesReferences: ICategoriesReference = {
    ...createBaseFontReference(TornadoObjectNames.Categories, "fill"),
    cardUid: "Visual-categories-card",
    groupUid: "categories-group",
    show: {
        objectName: TornadoObjectNames.Categories,
        propertyName: "show"
    },
    position: {
        objectName: TornadoObjectNames.Categories,
        propertyName: "position"
    }
}

export const dataPointReferences: IDataPointReference = {
    cardUid: "Visual-dataPoint-card",
    groupUid: "dataPoint-group",
    fill: {
        objectName: TornadoObjectNames.DataPoint,
        propertyName: "fill"
    }
}

export const labelsReference: ILabelsReference = {
    ...createBaseFontReference(TornadoObjectNames.Labels, "insideFill"),
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    show: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "show"
    },
    precision: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "labelPrecision"
    },
    displayUnits: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "labelDisplayUnits"
    },
    insideFill: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "insideFill"
    },
    outsideFill: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "outsideFill"
    }
}
