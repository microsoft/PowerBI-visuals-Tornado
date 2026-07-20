import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { ICategoriesReference, IDataPointReference, IFontReference, ILabelsReference, ILegendReference, INegativeBarsReference, IBarAppearanceReference, ICenterLineReference, IChartAreaReference, ICategoryAxisReference } from "./interfaces";
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
        },
        show: {
            objectName: objectName,
            propertyName: "show"
        },
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(TornadoObjectNames.Legend, "labelColor"),
    cardUid: "Visual-legend-card",
    groupUid: "legendOptions-group",
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
    displayFormat: {
        objectName: TornadoObjectNames.Labels,
        propertyName: "displayFormat"
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

export const negativeBarsReferences: INegativeBarsReference = {
    cardUid: "Visual-negativeBars-card",
    groupUid: "negativeBars-group",
    show: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "show"
    },
    fill: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "fill"
    },
    transparency: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "transparency"
    },
    borderColor: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "borderColor"
    },
    borderWidth: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "borderWidth"
    },
    cornerRadius: {
        objectName: TornadoObjectNames.NegativeBars,
        propertyName: "cornerRadius"
    }
}

export const barAppearanceReferences: IBarAppearanceReference = {
    cardUid: "Visual-barAppearance-card",
    groupUid: "barAppearance-group",
    borderColor: {
        objectName: TornadoObjectNames.BarAppearance,
        propertyName: "borderColor"
    },
    borderWidth: {
        objectName: TornadoObjectNames.BarAppearance,
        propertyName: "borderWidth"
    },
    cornerRadius: {
        objectName: TornadoObjectNames.BarAppearance,
        propertyName: "cornerRadius"
    },
    barSpacing: {
        objectName: TornadoObjectNames.BarAppearance,
        propertyName: "barSpacing"
    }
}

export const centerLineReferences: ICenterLineReference = {
    cardUid: "Visual-centerLine-card",
    groupUid: "centerLine-group",
    show: {
        objectName: TornadoObjectNames.CenterLine,
        propertyName: "show"
    },
    color: {
        objectName: TornadoObjectNames.CenterLine,
        propertyName: "color"
    },
    width: {
        objectName: TornadoObjectNames.CenterLine,
        propertyName: "width"
    }
}

export const chartAreaReferences: IChartAreaReference = {
    cardUid: "Visual-chartArea-card",
    groupUid: "chartArea-group",
    show: {
        objectName: TornadoObjectNames.ChartArea,
        propertyName: "show"
    },
    backgroundColor: {
        objectName: TornadoObjectNames.ChartArea,
        propertyName: "backgroundColor"
    }
}

export const categoryAxisReferences: ICategoryAxisReference = {
    cardUid: "Visual-categoryAxis-card",
    groupUid: "categoryAxis-group",
    normalize: {
        objectName: TornadoObjectNames.CategoryAxis,
        propertyName: "normalize"
    },
    end: {
        objectName: TornadoObjectNames.CategoryAxis,
        propertyName: "end"
    }
}
